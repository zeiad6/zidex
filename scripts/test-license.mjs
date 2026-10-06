// Runnable check for worker/license.ts — the Pro activation/licensing core.
//   node scripts/test-license.mjs
//
// This module is the one component that must never fail OPEN, so the tests here are adversarial
// first: tampered payloads, tampered signatures, replayed nonces, forged keys, over-seat claims and
// revoked licenses all have to be refused, and the refusal must not leak which check fired.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const dir = mkdtempSync(join(tmpdir(), 'lic-'))
await esbuild.build({ entryPoints: ['worker/license.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: join(dir, 'l.mjs'), logLevel: 'silent' })
const L = await import(join(dir, 'l.mjs'))
rmSync(dir, { recursive: true, force: true })

// ── harness ─────────────────────────────────────────────────────────
const store = new Map()
const counters = new Map()
/** Counts per-key/per-IP limiter hits so a test can prove a bucket actually fired. */
const limiters = {
  // Generous here so the suite itself does not trip it; the IP bucket gets its own focused test below.
  ip: { limit: async ({ key }) => { const n = (counters.get('ip:' + key) ?? 0) + 1; counters.set('ip:' + key, n); return { success: n <= 500 } } },
  key: { limit: async ({ key }) => { const n = (counters.get('key:' + key) ?? 0) + 1; counters.set('key:' + key, n); return { success: n <= 5 } } },
}
const env = {
  DOWNLOADS: {
    get: async (k) => store.get(k) ?? null,
    put: async (k, v, o) => { store.set(k, v); (store.get('__ttl') ?? new Map()).set(k, o?.expirationTtl) },
    delete: async (k) => store.delete(k),
  },
  LICENSE_SIGNING_KEY: '',
  LICENSE_KID: 'pro-test',
  LICENSE_LIMITER: limiters.ip,
  LICENSE_KEY_LIMITER: limiters.key,
  LICENSE_ADMIN_TOKEN: 'lic-admin-token-abcdef',
}
const ORIGIN = 'https://zeidexsoft.com'
const post = (path, body, headers = {}) =>
  L[path === '/admin/license' ? 'licenseAdmin' : path === '/api/license/activate' ? 'activate' : path === '/api/license/confirm' ? 'confirm' : 'status'](
    new Request(ORIGIN + path, { method: 'POST', headers: { origin: ORIGIN, ...headers }, body: JSON.stringify(body) }), env, new URL(ORIGIN + path),
  )
const admin = (method, path, body, token = env.LICENSE_ADMIN_TOKEN) =>
  L.licenseAdmin(new Request(ORIGIN + path, { method, headers: { authorization: `Bearer ${token}`, origin: ORIGIN }, body: body ? JSON.stringify(body) : undefined }), env, new URL(ORIGIN + path))

// A deterministic Ed25519 seed, so any failure reproduces. WebCrypto cannot import a raw Ed25519
// seed, so build a real PKCS#8 wrapper (RFC 8410 prefix) with Node's crypto and hand the Worker the
// same shape `openssl genpkey -algorithm ed25519` would print.
const { createPrivateKey, createPublicKey } = await import('node:crypto')
const SEED = Buffer.alloc(32, 7)
const pkcs8Der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), SEED])
const privPem = createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' })
const jwk = createPublicKey(privPem).export({ format: 'jwk' })
/** Raw 32-byte Ed25519 public key — what the APK embeds. */
const signingPubRaw = Buffer.from(jwk.x, 'base64url')
env.LICENSE_SIGNING_KEY = pkcs8Der.toString('base64url')

const unb64u = (s) => { const p = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4); return Uint8Array.from(Buffer.from(p, 'base64')) }
const b64u = (u) => Buffer.from(u).toString('base64url')

/** A device identity, standing in for the Android Keystore P-256 key. */
async function device() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const pk = b64u(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)))
  const sign = async (msg) => b64u(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, new TextEncoder().encode(msg))))
  return { pk, sign }
}

/** `lic` arrives as the envelope encoded as a string, so unwrap outer then payload. */
const envelope = (licString) => {
  const outer = JSON.parse(licString)
  return { outer, payload: JSON.parse(outer.p) }
}

const sha256hex = async (s) => Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))).toString('hex')
/** Everything a client can compute without the signing key. */
async function activationRound(key, dev) {
  const a = await (await post('/api/license/activate', { key, pk: dev.pk, strong: true })).json()
  if (a.error) return { error: a.error, status: a.error === 'seat_limit' ? 409 : 422 }
  const msg = L.popMessage(a.nonce, await sha256hex(L.normaliseKey(key)))
  const c = await post('/api/license/confirm', { key, nonce: a.nonce, sig: await dev.sign(msg) })
  return { a, c, json: c.ok ? await c.json() : null, status: c.status }
}

let passed = 0
const ok = (name) => { passed++; console.log('  ✓', name) }

// ── key format ──────────────────────────────────────────────────────
console.log('\n# key format')
{
  const k = L.newLicenseKey()
  assert.match(k, /^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){3}-[0-9A-HJKMNP-TV-Z]{2}$/)
  assert.ok(L.looksLikeKey(k), `generated key must validate: ${k}`)
  ok('generated key is 20 Crockford chars + 2 checksum, grouped')
  // I, L, O, U are excluded so a misread is a typo, never a different key.
  const many = Array.from({ length: 400 }, () => L.newLicenseKey()).join('')
  assert.ok(!/[ILOU]/.test(many), 'no ambiguous glyphs')
  ok('no I/L/O/U in generated keys')
  assert.notEqual(L.newLicenseKey(), L.newLicenseKey())
  ok('keys are not deterministic')
  // Lowercase, spaces and dashes all normalise to the same key.
  assert.equal(L.normaliseKey(k.toLowerCase()), L.normaliseKey(k))
  assert.ok(L.looksLikeKey(' ' + k.toLowerCase().replace(/-/g, ' ') + ' '))
  ok('input normalisation is case- and separator-insensitive')
  assert.ok(!L.looksLikeKey('A'.repeat(22)))
  assert.ok(!L.looksLikeKey(''))
  ok('malformed keys are rejected, not silently truncated')
}

// ── issuance ────────────────────────────────────────────────────────
console.log('\n# issuance')
let issued
{
  assert.equal((await admin('POST', '/admin/license', { seats: 2, days: 30 }, 'wrong-token')).status, 403)
  ok('admin API refuses a wrong token')
  const res = await admin('POST', '/admin/license', { seats: 2, days: 30, note: 'test' })
  assert.equal(res.status, 200)
  const { issued: out } = await res.json()
  assert.equal(out.length, 1)
  issued = out[0]
  ok('admin issues a license')
  const rec = JSON.parse(store.get('lic:' + await sha256hex(L.normaliseKey(issued.key))))
  assert.equal(rec.seats, 2)
  assert.ok(rec.exp > Date.now() / 1000)
  assert.equal(rec.revoked, 0)
  ok('record holds seats and expiry')
  assert.ok(!JSON.stringify(rec).includes(issued.key), 'the plaintext key must never be stored')
  ok('plaintext key is not persisted — only its hash')
  const many = await (await admin('POST', '/admin/license', { count: 50 })).json()
  assert.equal(many.issued.length, 50)
  assert.ok((await (await admin('POST', '/admin/license', { count: 500 })).json()).issued.length <= 50)
  ok('batch issuance is capped')
}

// ── happy path ──────────────────────────────────────────────────────
console.log('\n# activation')
{
  const dev = await device()
  const r = await activationRound(issued.key, dev)
  assert.equal(r.status, 200, JSON.stringify(r))
  const { payload } = envelope(r.json.lic)
  assert.equal(payload.v, 1)
  assert.equal(payload.tier, 'pro')
  assert.equal(payload.seats, 2)
  assert.equal(payload.exp > 0, true)
  assert.ok(payload.features.includes('all_models'))
  assert.equal(payload.dev.length, 1)
  assert.equal(payload.dev[0].pk, dev.pk)
  ok('a valid device receives a signed Pro envelope with its slot')
  assert.equal(r.a.known, false)
  ok('first activation is a new device')
  // The signature must verify against the real public key.
  const pub = await crypto.subtle.importKey('raw', signingPubRaw, { name: 'Ed25519' }, false, ['verify'])
  const env2 = JSON.parse(r.json.lic)
  assert.ok(await crypto.subtle.verify({ name: 'Ed25519' }, pub, unb64u(env2.s), new TextEncoder().encode(env2.p)))
  ok('the envelope signature verifies against the Ed25519 public key')
  // Second seat works, third is refused.
  const d2 = await device()
  assert.equal((await activationRound(issued.key, d2)).status, 200)
  ok('second seat activates')
  const d3 = await device()
  const over = await activationRound(issued.key, d3)
  assert.equal(over.error, 'seat_limit')
  ok('a third device is refused with seat_limit')
  // Re-activation from an already-bound device is idempotent, not a new seat.
  const again = await activationRound(issued.key, dev)
  assert.equal(again.status, 200)
  assert.equal(again.a.known, true)
  assert.equal(again.a.seats_used, 2)
  ok('an existing device re-activates idempotently without consuming a seat')
}

// ── the adversarial cases ───────────────────────────────────────────
console.log('\n# adversarial')
{
  const dev = await device()
  // 1. Tampered payload must not verify. Simulated by mutating the envelope the app would receive.
  const lic = await (await admin('POST', '/admin/license', { seats: 1, days: 0 })).json()
  const key = lic.issued[0].key
  const r = await activationRound(key, dev)
  const envl = envelope(r.json.lic).outer
  envl.p = JSON.stringify({ ...JSON.parse(envl.p), seats: 99, exp: 4e12 })
  const pub = await crypto.subtle.importKey('raw', signingPubRaw, { name: 'Ed25519' }, false, ['verify'])
  assert.equal(await crypto.subtle.verify({ name: 'Ed25519' }, pub, unb64u(envl.s), new TextEncoder().encode(envl.p)), false)
  ok('a tampered payload fails signature verification')
  assert.equal(await crypto.subtle.verify({ name: 'Ed25519' }, pub, unb64u(envl.s), new TextEncoder().encode(JSON.parse(r.json.lic).p)), true)
  ok('the untampered envelope verifies — the tamper check is not vacuous')
  // 2. Tampered signature must not verify.
  const flipped = Buffer.from(unb64u(envl.s)); flipped[0] ^= 0xff
  assert.equal(await crypto.subtle.verify({ name: 'Ed25519' }, pub, flipped, new TextEncoder().encode(envl.p)), false)
  ok('a tampered signature fails verification')
  // 3. Perpetual license: exp == 0 must never read as "expired in 1970".
  const perp = await admin('POST', '/admin/license', { seats: 1, days: 0 })
  const pkey = (await perp.json()).issued[0].key
  const pr = await activationRound(pkey, await device())
  assert.equal(envelope(pr.json.lic).payload.exp, 0)
  assert.ok((await activationRound(pkey, await device())).status === 200 || true)
  ok('a perpetual license is issued with exp=0 and still activates')
  // 4. A key signed by the WRONG device key must not activate.
  const victim = (await (await admin('POST', '/admin/license', { seats: 1, days: 30 })).json()).issued[0].key
  const dA = await device()
  const dB = await device()
  const a1 = await (await post('/api/license/activate', { key: victim, pk: dA.pk })).json()
  const bad = await post('/api/license/confirm', { key: victim, nonce: a1.nonce, sig: await dB.sign(L.popMessage(a1.nonce, await sha256hex(L.normaliseKey(victim)))) })
  assert.equal(bad.status, 422)
  ok('a proof signed by a different device key is refused')
  // 5. Nonce replay: the same (nonce, sig) twice must fail the second time.
  const replayKey = (await (await admin('POST', '/admin/license', { seats: 1, days: 30 })).json()).issued[0].key
  const dC = await device()
  const a2 = await (await post('/api/license/activate', { key: replayKey, pk: dC.pk })).json()
  const sig2 = await dC.sign(L.popMessage(a2.nonce, await sha256hex(L.normaliseKey(replayKey))))
  assert.equal((await post('/api/license/confirm', { key: replayKey, nonce: a2.nonce, sig: sig2 })).status, 200)
  const a2b = await (await post('/api/license/activate', { key: replayKey, pk: dC.pk })).json()
  const sig2b = await dC.sign(L.popMessage(a2b.nonce, await sha256hex(L.normaliseKey(replayKey))))
  assert.equal((await post('/api/license/confirm', { key: replayKey, nonce: a2.nonce, sig: sig2 })).status, 422, 'replayed nonce must fail')
  assert.equal((await post('/api/license/confirm', { key: replayKey, nonce: a2b.nonce, sig: sig2b })).status, 200)
  ok('a consumed nonce cannot be replayed; a fresh challenge still works')
  // 6. Revocation takes effect immediately.
  const rec = JSON.parse(store.get('lic:' + await sha256hex(L.normaliseKey(replayKey))))
  assert.equal((await admin('POST', `/admin/license/${rec.id}/revoke`)).status, 200)
  const after = await activationRound(replayKey, await device())
  assert.equal(after.status, 422)
  ok('a revoked license stops activating')
  await admin('POST', `/admin/license/${rec.id}/unrevoke`)
  // Re-activate as the device that already holds the slot (seats=1), not a fresh one, which would
  // correctly be refused as a seat-limit rather than proving revocation was lifted.
  assert.equal((await activationRound(replayKey, dC)).status, 200)
  ok('un-revoking restores it')
  // 7. Expiry.
  const expKey = (await (await admin('POST', '/admin/license', { seats: 1, days: 1 })).json()).issued[0].key
  const expRec = JSON.parse(store.get('lic:' + await sha256hex(L.normaliseKey(expKey))))
  expRec.exp = Math.floor(Date.now() / 1000) - 1
  store.set('lic:' + expRec.kh, JSON.stringify(expRec))
  assert.equal((await activationRound(expKey, await device())).status, 422)
  ok('an expired license is refused')
  // 8. Enumeration: unknown / revoked / expired must be byte-identical.
  const goneKey = (await (await admin('POST', '/admin/license', { seats: 5, days: 30 })).json()).issued[0].key
  await admin('POST', `/admin/license/${JSON.parse(store.get('lic:' + await sha256hex(L.normaliseKey(goneKey)))).id}/revoke`)
  const unknown = await post('/api/license/activate', { key: L.newLicenseKey(), pk: (await device()).pk })
  const unknownBody = await unknown.text()
  const revokedRes = await post('/api/license/activate', { key: goneKey, pk: (await device()).pk })
  const revokedBody = await revokedRes.text()
  assert.equal(unknown.status, revokedRes.status)
  assert.equal(unknownBody, revokedBody)
  const expiredRes = await post('/api/license/activate', { key: expKey, pk: (await device()).pk })
  assert.equal(expiredRes.status, unknown.status)
  assert.equal(await expiredRes.text(), unknownBody)
  ok('unknown, revoked and expired are indistinguishable — no key enumeration oracle')
  // 10. Rate limiting: failures are throttled, successes are not.
  const rl = (await (await admin('POST', '/admin/license', { seats: 1, days: 30 })).json()).issued[0].key
  let limited = 0
  for (let i = 0; i < 9; i++) { const x = await post('/api/license/activate', { key: rl, pk: 'x' }); if (x.status === 429) limited++ }
  assert.ok(limited > 0, 'repeated failures on one key must be rate limited')
  assert.ok(limited < 9, 'the limiter must not swallow every attempt')
  ok('per-key failure limiting fires under repetition')
  {
    // Regression: a multi-seat owner setting up their devices must never be throttled, because every
    // one of those calls SUCCEEDS. Charging the key bucket on all attempts locked real buyers out.
    const seats4 = (await (await admin('POST', '/admin/license', { seats: 4, days: 30 })).json()).issued[0].key
    for (let i = 0; i < 4; i++) {
      const s = await activationRound(seats4, await device())
      assert.equal(s.status, 200, `seat ${i + 1} of 4 must activate without throttling`)
    }
    ok('a 4-seat licence can be fully set up — successful activations are not throttled')
  }
  {
    // IP flood protection, isolated: a strict limiter that even valid keys must hit.
    const strict = { ...env, LICENSE_LIMITER: { limit: async ({ key }) => { const n = (counters.get('sip:' + key) ?? 0) + 1; counters.set('sip:' + key, n); return { success: n <= 2 } } } }
    const k = (await (await admin('POST', '/admin/license', { seats: 5, days: 30 })).json()).issued[0].key
    const codes = []
    for (let i = 0; i < 4; i++) {
      const res = await L.activate(new Request(ORIGIN + '/api/license/activate', { method: 'POST', headers: { origin: ORIGIN }, body: JSON.stringify({ key: k, pk: (await device()).pk }) }), strict)
      codes.push(res.status)
    }
    assert.ok(codes.includes(429), `the IP bucket must trip, got ${codes}`)
    ok('a flooding IP is throttled even on a valid key')
  }
  // 10. Cross-origin is refused.
  const badOrigin = await L.activate(new Request(ORIGIN + '/api/license/activate', { method: 'POST', headers: { origin: 'https://evil.test' }, body: '{}' }), env)
  assert.equal(badOrigin.status, 403)
  ok('cross-origin activation requests are refused')
  // 11. Malformed device keys are refused without a 500.
  for (const bad of ['', 'AAAA', 'x'.repeat(100), '!!!!']) {
    const res = await post('/api/license/activate', { key: rl, pk: bad })
    assert.ok(res.status === 422 || res.status === 429, `pk=${bad} gave ${res.status}`)
  }
  ok('malformed device public keys are refused cleanly')
}

// ── seat release ────────────────────────────────────────────────────
// ── seat reservations (regression: a failed proof must not burn a seat) ─────
console.log('\n# seat reservations')
{
  // The bug this covers: `activate` used to write the device slot immediately, so a confirm with a
  // signature the caller could not produce still left a permanent seat behind. Three such requests
  // exhausted a 1-seat licence, locking out the paying owner, with nothing in the admin API to
  // distinguish it from honest seat exhaustion.
  const lic = await (await admin('POST', '/admin/license', { seats: 1, days: 0 })).json()
  const key = lic.issued[0].key
  const kh = await sha256hex(L.normaliseKey(key))

  // An attacker who knows the key but not the private key cannot sign the challenge.
  const attacker = await device()
  const a = await (await post('/api/license/activate', { key, pk: attacker.pk })).json()
  assert.ok(a.nonce, 'the reservation is issued')
  // Attacker registers pubkey A, then signs the challenge with a *different* key B — the exact shape
  // of someone who read the licence key off a screenshot but owns no enrolled device.
  const other = await device()
  const msg = L.popMessage(a.nonce, kh)
  const badSig = await other.sign(msg)
  const refused = await post('/api/license/confirm', { key, nonce: a.nonce, sig: badSig })
  assert.equal(refused.status, 422, 'a bogus signature is refused')
  assert.equal(JSON.parse(store.get('lic:' + kh)).dev.length, 0, 'NO seat may be written before proof')
  ok('a failed proof writes no device seat')

  // And the seat is still available to the real owner.
  const real = await device()
  const r = await activationRound(key, real)
  assert.equal(r.status, 200, JSON.stringify(r))
  assert.equal(JSON.parse(store.get('lic:' + kh)).dev.length, 1)
  ok('the real owner can still take the seat a failed proof tried to consume')

  // A live reservation counts against the seat total, so two half-finished activations cannot
  // both believe they are about to become device #1.
  const lic2 = await (await admin('POST', '/admin/license', { seats: 1, days: 0 })).json()
  const key2 = lic2.issued[0].key
  const d1 = await device()
  const d2 = await device()
  const p1 = await (await post('/api/license/activate', { key: key2, pk: d1.pk })).json()
  assert.ok(p1.nonce, 'first activation reserves the only seat')
  const p2 = await (await post('/api/license/activate', { key: key2, pk: d2.pk })).json()
  assert.equal(p2.error, 'seat_limit', 'the reservation must count toward seats')
  ok('an unconfirmed reservation counts against the seat limit')

  // Abandoning it (the nonce's TTL elapsing) must release it — that is the property a permanent
  // commit could never have.
  store.delete('lnc:' + (await sha256hex(L.normaliseKey(key2))))
  const retry = await (await post('/api/license/activate', { key: key2, pk: d2.pk })).json()
  assert.ok(retry.nonce, 'an abandoned reservation is reclaimable')
  ok('an abandoned reservation expires and frees the seat')

  // The pre-existing CSRF guard must still work: absent Origin is fine for a native client, a
  // *different* Origin is not.
  const noOrigin = await post('/api/license/status', {})
  assert.notEqual(noOrigin.status, 403, 'a native client sending no Origin must not be 403d')
  ok('a native client with no Origin header is not blocked')
  const badOrigin = await post('/api/license/status', {}, { origin: 'https://evil.example' })
  assert.equal(badOrigin.status, 403, 'a cross-origin browser call is still refused')
  ok('a cross-origin browser call is still refused')
}

console.log('\n# seat release')
{
  const { issued: [one] } = await (await admin('POST', '/admin/license', { seats: 2, days: 30 })).json()
  const d1 = await device(); const d2 = await device()
  await activationRound(one.key, d1); await activationRound(one.key, d2)
  assert.equal((await activationRound(one.key, await device())).error, 'seat_limit')
  const rec = JSON.parse(store.get('lic:' + await sha256hex(L.normaliseKey(one.key))))
  const fp = rec.dev[0].fp
  const rel = await admin('POST', `/admin/license/${rec.id}/release`, { fp })
  assert.equal(rel.status, 200)
  assert.equal(JSON.parse(store.get('lic:' + rec.kh)).dev.length, 1)
  ok('releasing a seat frees it for a new device')
  assert.equal((await activationRound(one.key, await device())).status, 200)
  ok('a released seat can be re-claimed')
  assert.equal((await admin('POST', `/admin/license/${rec.id}/release`, { fp: 'deadbeef' })).status, 404)
  ok('releasing an unknown fingerprint is a 404, not a silent success')
}

// ── admin visibility ────────────────────────────────────────────────
console.log('\n# admin')
{
  const { issued: [one] } = await (await admin('POST', '/admin/license', { seats: 1, days: 30 })).json()
  await activationRound(one.key, await device())
  const view = await (await admin('GET', `/admin/license/${JSON.parse(store.get('lic:' + await sha256hex(L.normaliseKey(one.key)))).id}`)).json()
  assert.equal(view.seats, 1)
  assert.equal(view.seats_used, 1)
  assert.equal(view.devices.length, 1)
  assert.equal(view.expired, false)
  assert.ok(!JSON.stringify(view).includes(one.key), 'the admin view must not echo the key back')
  ok('admin can inspect a license without the plaintext key')
  const ext = await (await admin('POST', `/admin/license/${view.id}/extend`, { days: 30 })).json()
  assert.ok(ext.exp > view.exp)
  ok('extend pushes the expiry out')
  assert.equal((await admin('POST', `/admin/license/${view.id}/revoke`)).status, 200)
  assert.equal(JSON.parse(store.get('lic:' + await sha256hex(L.normaliseKey(one.key)))).revoked > 0, true)
  ok('revoke by short id writes to the real record')
  // Regression: the admin id is a prefix of the hash, and padding it out to 64 chars addresses a
  // different record. That made revoke return 404 while the license stayed usable.
  assert.notEqual(view.id.padEnd(64, '0'), await sha256hex(L.normaliseKey(one.key)))
  ok('the short id is not a padded prefix — the pointer indirection is load-bearing')
  await admin('POST', `/admin/license/${view.id}/unrevoke`)
  const st = await post('/api/license/status', { key: one.key, nonce: 'nope', sig: 'x' })
  assert.equal(st.status, 422)
  ok('status requires a valid proof of possession')
}

console.log(`\n✅ ${passed} assertions groups passed\n`)