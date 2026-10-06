// Runnable check for the Pro licensing commands inside worker/bots.ts.
//   node scripts/test-bot-licensing.mjs
//
// The bot is the operator's console for licenses: it is the only place a plaintext key is ever
// displayed, and it writes the same records the activation API reads. So these tests check both
// directions — that /licnew really mints a working license, and that the owner commands really
// mutate the record the activation path consults.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'
import { createPrivateKey, createPublicKey } from 'node:crypto'

const dir = mkdtempSync(join(tmpdir(), 'botlic-'))
await esbuild.build({ entryPoints: ['worker/bots.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: join(dir, 'b.mjs'), logLevel: 'silent' })
const b = await import(join(dir, 'b.mjs'))
rmSync(dir, { recursive: true, force: true })

const store = new Map()
const pkcs8Der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.alloc(32, 9)])
const signingPubRaw = Buffer.from(createPublicKey(createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' })).export({ format: 'jwk' }).x, 'base64url')

const env = {
  DOWNLOADS: { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v), delete: async (k) => void store.delete(k) },
  BOTS_KEY: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))),
  BOTS_ADMIN_TOKEN: 'bots-admin-token-xyz',
  LICENSE_SIGNING_KEY: pkcs8Der.toString('base64url'),
  LICENSE_KID: 'bot-test',
}
const TOKEN = '123456789:' + 'A'.repeat(35)
const calls = []
globalThis.fetch = async (url, init) => {
  const method = String(url).split('/').pop()
  calls.push({ method, body: init?.body ? JSON.parse(init.body) : {} })
  if (method === 'getMe') return Response.json({ ok: true, result: { id: 123456789, username: 'shop_bot', first_name: 'Zeidex' } })
  return Response.json({ ok: true, result: {} })
}
const admin = (method, path, body, auth = env.BOTS_ADMIN_TOKEN) =>
  b.botsAdmin(new Request(`https://zeidexsoft.com${path}`, { method, headers: { authorization: `Bearer ${auth}` }, body: body ? JSON.stringify(body) : undefined }), env, new URL(`https://zeidexsoft.com${path}`))
const made = await (await admin('POST', '/admin/bots', { token: TOKEN, owner_id: 42 })).json()
const cfg = JSON.parse(store.get(`tb:${made.bot_id}`))
const secret = cfg.secret

const lastText = () => calls.filter((c) => c.method === 'sendMessage').at(-1).body.text
const deliver = async (text) => {
  const upd = { update_id: Date.now(), message: { from: { id: 42, first_name: 'Z' }, chat: { id: 42, type: 'private' }, text, date: 0 } }
  const res = await b.botWebhook(new Request(`https://zeidexsoft.com/tg/${made.bot_id}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(upd) }), env, String(made.bot_id))
  assert.equal(res.status, 200)
}

let passed = 0
const ok = (n) => { passed++; console.log('  ✓', n) }

console.log('\n# /licnew mints a usable license')
await deliver('/licnew 2 365 1')
{
  const text = lastText()
  assert.match(text, /[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){3}-[0-9A-HJKMNP-TV-Z]{2}/, `expected a key in: ${text}`)
  assert.ok(!/Last-hash|只会/.test(text), 'no template debris in the reply')
  ok('the reply shows a formatted Pro key')
  // The plaintext must be nowhere in the store.
  const key = text.match(/[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){3}-[0-9A-HJKMNP-TV-Z]{2}/)[0]
  assert.ok(![...store.entries()].some(([, v]) => v.includes(key)), 'the plaintext key must not be persisted')
  ok('the key is shown once and stored only hashed')
  // The id it prints must resolve through the pointer the activation API needs.
  const id = text.match(/المعرّف: <code>([0-9a-f]{10})<\/code>/)[1]
  const kh = store.get(`licid:${id}`)
  assert.equal(typeof kh, 'string')
  ok('the printed id resolves to a stored license')
  const rec = JSON.parse(store.get(`lic:${kh}`))
  assert.equal(rec.seats, 2, 'seats from the positional argument must be honoured')
  ok('seats from /licnew are what the record holds')
}

// ── malformed input must not mint or crash ──────────────────────────
console.log('\n# input handling')
await deliver('/licnew zero 365 1')
assert.match(lastText(), /الاستخدام/)
ok('non-numeric seats is a usage error, not a license')
const idsBefore = [...store.keys()].filter((k) => k.startsWith('licid:')).length
await deliver('/licnew 1 365 1 customer-ali note-here')
{
  // The note is recorded on the license, not echoed in the chat reply (the reply stays a clean key).
  const noted = [...store.entries()].find(([, v]) => v.includes('customer-ali'))
  assert.ok(noted, 'a note argument must reach the stored record')
  const rec = JSON.parse(noted[1])
  assert.equal(rec.note, 'customer-ali note-here')
  assert.equal([...store.keys()].filter((k) => k.startsWith('licid:')).length, idsBefore + 1)
  ok('an optional note is persisted on the license')
}
await deliver('/lExtend')
assert.match(lastText(), /الاستخدام/)
ok('a missing id is a usage error')
await deliver('/lRevoke notanid')
assert.match(lastText(), /الاستخدام/)
ok('a malformed id is refused before any KV read')
await deliver('/lRelease deadbeefca 11223344')
assert.match(lastText(), /لا يوجد ترخيص/)
ok('a well-formed but unknown id reports cleanly')
// The usage line must name the command the owner types, not the internal action.
await deliver('/lExtend zz')
assert.match(lastText(), /\/lExtend/, 'usage must name the real command')
ok('the usage line names the command the operator actually types')

// ── the owner's license commands mutate the activation record ───────
console.log('\n# owner commands mutate the real record')
{
  const id = [...store.keys()].filter((k) => k.startsWith('licid:'))[0].slice(6)
  // Fill every seat so `release` has something to release.
  const kh = store.get(`licid:${id}`)
  const rec = JSON.parse(store.get(`lic:${kh}`))
  rec.dev = [{ pk: 'x', fp: '11223344', at: 1, seen: 0, strong: 1 }, { pk: 'y', fp: 'aabbccdd', at: 2, seen: 0, strong: 0 }]
  store.set(`lic:${kh}`, JSON.stringify(rec))

  await deliver(`/lRelease ${id}`)
  const listing = lastText()
  assert.match(listing, /11223344/)
  assert.match(listing, /aabbccdd/)
  assert.ok(listing.includes('🔒'), 'a hardware-backed device should be marked')
  ok('listing shows every bound device with its backing')

  await deliver(`/lRelease ${id} 11223344`)
  assert.match(lastText(), /حُرّر مقعد/)
  const after = JSON.parse(store.get(`lic:${kh}`))
  assert.equal(after.dev.length, 1)
  assert.equal(after.dev[0].fp, 'aabbccdd')
  ok('releasing a seat removes exactly that device')

  await deliver(`/lRevoke ${id}`)
  assert.match(lastText(), /أُبطِل/)
  assert.ok(JSON.parse(store.get(`lic:${kh}`)).revoked > 0, 'revocation must be persisted')
  ok('/lRevoke persists revocation where activation reads it')

  await deliver(`/lExtend ${id} 30`)
  const rec2 = JSON.parse(store.get(`lic:${kh}`))
  assert.ok(rec2.exp > rec.exp, 'extend must push the expiry out')
  ok('/lExtend extends from the current expiry, not from today')
}

// ── non-owners must never reach the license commands ─────────────────
console.log('\n# access control')
{
  const licensesBefore = [...store.keys()].filter((k) => k.startsWith('licid:')).length
  const upd = { update_id: 1, message: { from: { id: 999, first_name: 'Stranger' }, chat: { id: 999, type: 'private' }, text: '/licnew 1 365 1', date: 0 } }
  await b.botWebhook(new Request(`https://zeidexsoft.com/tg/${made.bot_id}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(upd) }), env, String(made.bot_id))
  const licensesAfter = [...store.keys()].filter((k) => k.startsWith('licid:')).length
  assert.equal(licensesAfter, licensesBefore, 'a non-owner must not be able to mint licenses')
  ok('a non-owner cannot mint a license — owner() is the only entry point')
  // And the same for the mutating commands, which read and write license records directly.
  const rec0 = JSON.parse(store.get(`lic:${[...store.entries()].find(([k]) => k.startsWith('licid:'))[1]}`))
  store.set(`lic:${rec0.kh}`, JSON.stringify({ ...rec0, revoked: 0 }))
  const upd2 = { update_id: 2, message: { from: { id: 999, first_name: 'Stranger' }, chat: { id: 999, type: 'private' }, text: `/lRevoke ${rec0.id}`, date: 0 } }
  await b.botWebhook(new Request(`https://zeidexsoft.com/tg/${made.bot_id}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(upd2) }), env, String(made.bot_id))
  assert.equal(JSON.parse(store.get(`lic:${rec0.kh}`)).revoked, 0, 'a non-owner must not be able to revoke')
  ok('a non-owner cannot revoke a license either')
}

console.log(`\n✅ ${passed} bot licensing checks passed\n`)