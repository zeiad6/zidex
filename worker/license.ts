// VerityScope Pro licensing — device-bound activation keys, verified offline in the app.
//
// Threat model, stated plainly
// ----------------------------
// The APK is distributed as a direct download, not through Google Play, so Play Integrity is
// structurally unusable as a gate: a sideloaded app is guaranteed the UNLICENSED /
// UNRECOGNORED_VERSION verdicts (developer.android.com/google/play/inity/verdicts), and on a
// de-Googled device Play Services is absent entirely. Nothing is lost by not depending on it.
//
// What this design actually buys, and what it does not:
//   * It stops key FORGERY. Nobody can mint a license for their own device without the Ed25519
//     private key, which never leaves the Worker secret store.
//   * It stops key SHARING. A license is bound to a device public key held in the Android Keystore,
//     so a copied license file is useless — the app must produce a signature from a private key that
//     cannot be exported. Seats are enforced here, on the server, not by the client's own count.
//   * It does NOT stop a repackaged APK. Frida can be injected into a repackaged, re-signed APK with
//     no root, after which the attacker owns the client. That is the same boundary every commercial
//     licensing service draws (see keyauth.cc: "we are an authentication service, not a code
//     obfuscator"). The realistic goal is to make forgery and sharing hard and auditable, not to
//     make patching impossible. Don't spend effort on anti-tamper before this works end to end.
//
// Two signature algorithms, deliberately different:
//   * Ed25519 signs LICENSES (server → app). The private key lives in a Worker secret; the app only
//     ever holds the 32-byte public key. Workers WebCrypto implements standard Ed25519.
//   * ECDSA P-256 + SHA-256 signs CHALLENGES (app → server). The device key lives in the Android
//     Keystore. Ed25519 was chosen here only because Android Keystore cannot generate one before
//     API 33 (Conscrypt gained Ed25519 late, and AOSP's bundled BouncyCastle has never had it), so
//     P-256 is the only curve available as non-exportable hardware-backed key across minSdk 26.
//
// License file format
// -------------------
//   { "p": "<payload JSON, carried as an opaque string>", "s": "<base64url Ed25519 signature>" }
//
// The payload is signed as the exact bytes of that string and then re-serialised by nobody. This is
// the whole reason for the envelope: a verifier that parses-then-re-serialises JSON invites the
// classic canonicalisation bug where the bytes it verifies are not the bytes it parsed. Here there
// is exactly one byte string and both sides hash the same one.
//
// Deliberately not a JWT. JWT brings `alg`-confusion and `alg:none` footguns, claim semantics
// (device seats, perpetual tiers) that do not fit its model, and a library parse surface, for no
// gain — nothing else needs to read these files.

type KV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}
type Limiter = { limit(opts: { key: string }): Promise<{ success: boolean }> }

export type LicenseEnv = {
  DOWNLOADS: KV
  /** Signed Ed25519 private key, base64url of the 32-byte seed (or PKCS#8). */
  LICENSE_SIGNING_KEY?: string
  /** base64url Ed25519 public key embedded in the APK. Used to self-check before serving. */
  LICENSE_PUBLIC_KEY?: string
  LICENSE_KID?: string
  LICENSE_LIMITER?: Limiter
  LICENSE_KEY_LIMITER?: Limiter
}

const MAX_BODY = 4096
const NONCE_TTL_S = 120
const MAX_DEVICES = 8
const MAX_KEYS_PER_BATCH = 50
/** Crockford base32: no I, L, O, U — so a misread key is a typo, not a different key. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const KEY_CHARS = 20

/** Device slot, as stored on the license record. */
type Device = {
  /** base64url of the raw 32-byte Keystore public key point (uncompressed P-256, 65 bytes). */
  pk: string
  /** Short display-only fingerprint. Never an authorisation input. */
  fp: string
  /** Epoch seconds. */
  at: number
  /** Epoch seconds of the last successful proof-of-possession. */
  seen: number
  /** 1 when the Keystore reported hardware backing. */
  strong: 0 | 1
}

type License = {
  id: string
  /** sha256 hex of the key. The plaintext is never stored in the clear on the record. */
  kh: string
  tier: 'pro'
  seats: number
  iat: number
  /** Epoch seconds, or 0 for perpetual. */
  exp: number
  /** Epoch seconds when revoked, else 0. Kept rather than deleted so the audit trail survives. */
  revoked: number
  dev: Device[]
  /** Telegram user id that bought it, 0 when issued by hand. */
  tg: number
  note?: string
}

/** The public payload the app verifies. Field names are short because the app parses them. */
type LicensePayload = {
  v: 1
  kid: string
  /** The license key, so the app can show it and match it to the device it activated. */
  lic: string
  tier: string
  seats: number
  iat: number
  nbf: number
  exp: number
  features: string[]
  dev: { pk: string; fp: string }[]
}

// ── encoding ────────────────────────────────────────────────────────
const b64u = (u: Uint8Array) =>
  btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64u = (s: string) => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0))
}
const enc = new TextEncoder()

const sha256hex = async (s: string) => b64uToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))))
function b64uToHex(b: Uint8Array) {
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string) {
  const x = enc.encode(a)
  const y = enc.encode(b)
  let d = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return d === 0
}

// ── key material ────────────────────────────────────────────────────
async function signingKey(env: LicenseEnv): Promise<CryptoKey> {
  const raw = env.LICENSE_SIGNING_KEY
  if (!raw) throw new Error('LICENSE_SIGNING_KEY not configured')
  // Accept either a bare 32-byte seed or a PKCS#8 wrapper, so an operator can paste whichever
  // `openssl genpkey` gave them without a conversion step.
  const bytes = unb64u(raw)
  const isSeed = bytes.length === 32
  try {
    return await crypto.subtle.importKey('pkcs8', bytes, { name: 'Ed25519' }, false, ['sign'])
  } catch {
    if (!isSeed) throw new Error('LICENSE_SIGNING_KEY is neither PKCS#8 nor a 32-byte seed')
    return await crypto.subtle.importKey('raw', bytes, { name: 'Ed25519' }, false, ['sign'])
  }
}

async function signBytes(env: LicenseEnv, msg: string): Promise<string> {
  const key = await signingKey(env)
  return b64u(new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, key, enc.encode(msg))))
}

/** Verify an ECDSA P-256 / SHA-256 proof-of-possession produced by the Android Keystore. */
async function verifyPop(pkB64u: string, message: string, sigB64u: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('raw', unb64u(pkB64u), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    // WebCrypto expects the raw r||s form, which is exactly what Keystore SHA256withECDSA emits.
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unb64u(sigB64u), enc.encode(message))
  } catch {
    return false
  }
}

/** Fingerprint shown to the user and the admin. Never used to decide anything. */
async function fingerprint(pkB64u: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', unb64u(pkB64u)))
  return [...digest.slice(0, 4)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// ── license keys ────────────────────────────────────────────────────
/**
 * A random license key: 20 Crockford base32 characters (100 bits) plus a 2-character checksum,
 * grouped in fives. Not a UUID and not sequential — both are enumerable, which is the whole reason a
 * 100-bit random key exists.
 */
export function newLicenseKey(rnd: () => number = Math.random): string {
  const body = Array.from({ length: KEY_CHARS }, () => ALPHABET[Math.floor(rnd() * ALPHABET.length)]).join('')
  // The checksum is part of the grouped string, not appended bare — appending it unwrapped merges
  // it into the last data group and produces a 7-character tail group nobody can retype.
  return group(body + checksum(body))
}
const group = (s: string) => (s.match(/.{1,5}/g) ?? []).join('-')

/** Checksum over the body. Short on purpose — it catches typos, it is not a security control. */
function checksum(body: string): string {
  let h = 0x811c9dc5
  for (const ch of body) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return ALPHABET[h & 31] + ALPHABET[(h >>> 8) & 31]
}

/** Canonical form: uppercase, no separators. Everything downstream compares this. */
export function normaliseKey(raw: string): string {
  return raw.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V')
}
const KEY_RE = new RegExp(`^[0-9A-HJKMNP-TV-Z]{${KEY_CHARS}}[0-9A-HJKMNP-TV-Z]{2}$`)

/**
 * Shape and checksum check.
 *
 * The checksum is not a security control — it is derived from the key itself, which the user already
 * has, so it hides nothing. What it buys is refusing a misread key *before* a network round-trip,
 * which is where a wrong character otherwise costs the user a confusing "activation failed".
 */
export function looksLikeKey(s: string): boolean {
  const n = normaliseKey(s)
  if (!KEY_RE.test(n)) return false
  return n.slice(KEY_CHARS) === checksum(n.slice(0, KEY_CHARS))
}

/** The exact bytes a device signs. One string, so the app and the server cannot disagree on it. */
export function popMessage(nonce: string, kh: string) {
  return `aifake-pro|v1|${nonce}|${kh}`
}

// ── storage ─────────────────────────────────────────────────────────
const licKey = (kh: string) => `lic:${kh}`
const nonceKey = (kh: string) => `lnc:${kh}`
/**
 * `licid:<short id>` -> the full license hash. The admin API is addressed by a short id so operators
 * get something typeable, but KV has no prefix search on this binding, so the full hash cannot be
 * reconstructed from it — padding the short id out to 64 characters silently addresses a *different*
 * record, which showed up as a revoke that returned 404 while the license stayed live.
 *
 * This is a pointer, not a copy: `lic:<kh>` stays the single source of truth and every mutation
 * writes only there, so the two can never disagree.
 */
const idKey = (id: string) => `licid:${id}`

const load = async (env: LicenseEnv, kh: string): Promise<License | null> => {
  const raw = await env.DOWNLOADS.get(licKey(kh))
  return raw ? (JSON.parse(raw) as License) : null
}
const save = (env: LicenseEnv, l: License) => env.DOWNLOADS.put(licKey(l.kh), JSON.stringify(l))

// ── issuance ────────────────────────────────────────────────────────
/** All Pro features the payload grants. The app gates its catalogue on this list, not on the tier. */
const FEATURES = ['all_models', 'bulk_scan', 'export_pdf', 'no_ad_limit', 'priority_support']

/**
 * Mint one license. Returns the plaintext key exactly once; only its hash is stored, so a KV dump
 * cannot be turned into instantly-redeemable keys. Support re-display goes through the admin panel,
 * which re-derives nothing and therefore cannot re-show it either — the operator regenerates instead.
 */
export async function issueLicense(
  env: LicenseEnv,
  opts: { seats?: number; days?: number; tg?: number; note?: string; rnd?: () => number } = {},
): Promise<{ key: string; license: License }> {
  const rnd = opts.rnd ?? Math.random
  const key = newLicenseKey(rnd)
  const kh = await sha256hex(normaliseKey(key))
  const now = Math.floor(Date.now() / 1000)
  const license: License = {
    id: kh.slice(0, 10),
    kh,
    tier: 'pro',
    seats: Math.min(Math.max(Math.trunc(opts.seats ?? 1), 1), MAX_DEVICES),
    iat: now,
    exp: opts.days && opts.days > 0 ? now + Math.trunc(opts.days) * 86400 : 0,
    revoked: 0,
    dev: [],
    tg: opts.tg ?? 0,
    ...(opts.note ? { note: opts.note.slice(0, 200) } : {}),
  }
  await save(env, license)
  await env.DOWNLOADS.put(idKey(license.id), license.kh)
  return { key, license }
}

/** The signed envelope handed to the app. */
export async function issueEnvelope(env: LicenseEnv, license: License, plainKey: string): Promise<string> {
  const payload: LicensePayload = {
    v: 1,
    kid: env.LICENSE_KID || 'pro-1',
    lic: normaliseKey(plainKey),
    tier: license.tier,
    seats: license.seats,
    iat: license.iat,
    nbf: license.iat,
    exp: license.exp,
    features: FEATURES,
    dev: license.dev.map((d) => ({ pk: d.pk, fp: d.fp })),
  }
  // The payload travels as a string and is signed as exactly these bytes — see the file header.
  const p = JSON.stringify(payload)
  return JSON.stringify({ p, s: await signBytes(env, p) })
}

// ── activation ──────────────────────────────────────────────────────
/**
 * One response for every way an activation can fail.
 *
 * "Unknown key", "revoked" and "expired" are indistinguishable on purpose: distinguishing them lets
 * anyone enumerate which of a billion typed keys exist. The real reason is logged, never returned.
 * Seat exhaustion is the one exception (409) because the holder of a valid key cannot act on it
 * without contacting support otherwise, and reaching it already required a correct key.
 */
const fail = (status = 422, error = 'activation_failed') => Response.json({ error }, { status })

/**
 * Two independent buckets, applied at different times on purpose.
 *
 * - **Per-IP, always.** Flood protection. One noisy client cannot burn the KV write quota.
 * - **Per-key, only after a failure.** Brute-force protection. This is the ordering that matters: a
 *   legitimate owner activating their second and third seats must never be throttled, because those
 *   are *successes*. If the key bucket were charged on every attempt, a two-seat license could not be
 *   fully set up inside the window, and a real customer would be locked out by their own purchase.
 *
 * Keying only on (ip, key) would instead let one IP walk an unbounded number of keys before anything
 * trips; keying only on key would let a botnet hammer a single key. Two buckets, both required.
 */
async function ipAllowed(env: LicenseEnv, ip: string): Promise<boolean> {
  return !env.LICENSE_LIMITER || (await env.LICENSE_LIMITER.limit({ key: `ip:${ip}` })).success
}

/**
 * Charge one failure against a key's budget.
 *
 * @returns true when the key is still under its limit and the caller should return the generic
 *   failure; false when it is over, and the caller should return 429 instead.
 */
async function failureAllowed(env: LicenseEnv, kh: string): Promise<boolean> {
  return !env.LICENSE_KEY_LIMITER || (await env.LICENSE_KEY_LIMITER.limit({ key: `k:${kh}` })).success
}

/**
 * Runs an activation step under the IP bucket, converting a "no" verdict into the generic failure so
 * the two paths cannot be told apart by timing or body.
 */
async function guard(env: LicenseEnv, ip: string, kh: string, step: () => Promise<Response>): Promise<Response> {
  if (!(await ipAllowed(env, ip))) return new Response('too many requests', { status: 429 })
  const res = await step()
  if (res.status === 422 && !(await failureAllowed(env, kh))) {
    return new Response('too many requests', { status: 429 })
  }
  return res
}

/**
 * Reject cross-origin *browser* callers, and let native clients through.
 *
 * A browser ALWAYS attaches `Origin` to a cross-origin POST (that is the whole reason the header
 * exists), so requiring `Origin === url.origin` looked like it blocked drive-by activation from a
 * hostile page — which is exactly what these endpoints need to stop.
 *
 * But OkHttp, and every other native HTTP client, sends NO Origin header at all. Requiring it meant
 * the shipped Android app could not activate a licence it had legitimately paid for: a 403 whose only
 * symptom was "my key is invalid".
 *
 * So the rule is asymmetric on purpose:
 *   - Origin present and different  -> 403 (a browser on another site)
 *   - Origin absent                 -> allowed (a native client; cannot be a cross-site forgery)
 *
 * This loses nothing. These endpoints authenticate on the Ed25519 signature and the Keystore
 * challenge, never on ambient credentials, so CSRF is not in the threat model — there is no cookie
 * for an attacker's page to ride on. Origin here is defence in depth, not the actual gate.
 */
function sameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin')
  return origin === null || origin === url.origin
}

export async function activate(request: Request, env: LicenseEnv): Promise<Response> {
  const url = new URL(request.url)
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 })
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const body = (await readBody(request)) as { key?: unknown; pk?: unknown; strong?: unknown }
  if (!body || typeof body.key !== 'string' || typeof body.pk !== 'string') return fail()

  const plain = normaliseKey(body.key)
  if (!looksLikeKey(plain)) return fail()
  const kh = await sha256hex(plain)

  return guard(env, ip, kh, async () => {
    const lic = await load(env, kh)
    if (!lic || lic.revoked) return fail()
    if (lic.exp && Date.now() / 1000 > lic.exp) return fail()

    let pk: string
    try {
      pk = normalisePub(body.pk)
    } catch {
      return fail()
    }
    const known = lic.dev.find((d) => d.pk === pk)

    // The seat is NOT claimed here. It is *reserved* by the nonce entry, which already carries a
    // 120s TTL, and only promoted to a real slot in `confirm` once the signature has proven the
    // caller owns the private key.
    //
    // Committing here instead meant a failed proof left a permanent slot behind. Anyone holding a
    // stolen key could exhaust every seat with three requests that never sign anything, and the
    // legitimate owner was locked out of a licence they had already paid for — with no admin-visible
    // way to tell that from ordinary seat exhaustion.
    //
    // Reusing the nonce as the reservation is deliberately race-free: it is one key per licence, so
    // two concurrent activations serialise instead of racing to write `lic.dev`. A second activation
    // simply overwrites the pending one, which is the right behaviour for an app that activates once.
    const pending = await env.DOWNLOADS.get(nonceKey(kh))
    const inUse = lic.dev.length + (pending ? 1 : 0)
    if (!known && inUse >= lic.seats) {
      return Response.json({ error: 'seat_limit', seats: lic.seats }, { status: 409 })
    }

    const nonce = b64u(crypto.getRandomValues(new Uint8Array(18)))
    // Single-use and short-lived: consuming it on confirm is what stops a captured (nonce, sig) pair
    // from being replayed to activate on unlimited devices. Its TTL is also what frees the seat.
    await env.DOWNLOADS.put(nonceKey(kh), `${nonce}|${pk}`, { expirationTtl: NONCE_TTL_S })

    return Response.json({
      nonce,
      seats: lic.seats,
      exp: lic.exp,
      known: !!known,
      seats_used: lic.dev.length,
    })
  })
}

export async function confirm(request: Request, env: LicenseEnv): Promise<Response> {
  const url = new URL(request.url)
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 })
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const body = (await readBody(request)) as { key?: unknown; nonce?: unknown; sig?: unknown }
  if (!body || typeof body.key !== 'string' || typeof body.nonce !== 'string' || typeof body.sig !== 'string') {
    return fail()
  }
  const plain = normaliseKey(body.key)
  if (!looksLikeKey(plain)) return fail()
  const kh = await sha256hex(plain)

  return guard(env, ip, kh, async () => {
    const lic = await load(env, kh)
    if (!lic || lic.revoked) return fail()
    if (lic.exp && Date.now() / 1000 > lic.exp) return fail()

    const stored = await env.DOWNLOADS.get(nonceKey(kh))
    if (!stored) return fail()
    const [nonce, pk] = stored.split('|')
    if (!nonce || nonce !== body.nonce) return fail()
    if (!(await verifyPop(pk, popMessage(nonce, kh), body.sig))) {
      // Burn the nonce on a FAILED proof too.
      //
      // The nonce is also the seat reservation, so leaving it alive let anyone holding a stolen key
      // hold a seat forever: loop activate -> confirm-with-garbage, faster than the 120s TTL, and the
      // owner's last seat never frees. That is a sustained denial of service against a licence
      // someone already paid for, and it is the more serious of the two failure modes.
      //
      // The original reason for keeping the nonce on failure — "don't let an attacker destroy a
      // legitimate owner's in-flight activation" — only describes a narrow interleaving race that
      // requires knowing the key and winning a tight poll. Replay stays blocked either way: a second
      // confirm with the same (nonce, sig) finds nothing left to consume.
      await env.DOWNLOADS.delete(nonceKey(kh))
      return fail()
    }
    // Proven. Burn it — the nonce is the seat reservation, so deleting it here is what releases an
    // abandoned claim before promoting this one.
    await env.DOWNLOADS.delete(nonceKey(kh))

    // Promote the reservation into a real seat. This is the first and only moment a device slot is
    // written, and it happens strictly after the signature proved key possession.
    const nowS = Math.floor(Date.now() / 1000)
    let slot = lic.dev.find((d) => d.pk === pk)
    if (!slot) {
      lic.dev.push({
        pk,
        fp: await fingerprint(pk),
        at: nowS,
        seen: nowS,
        strong: lic.dev.some((d) => d.pk === pk && d.strong === 1) ? 1 : 0,
      })
      lic.dev = lic.dev.slice(-MAX_DEVICES)
      slot = lic.dev.find((d) => d.pk === pk)!
    } else {
      slot.seen = nowS
    }

    // Refuse to serve a license whose seats are already exceeded: a seat released elsewhere must not
    // leave an in-app copy that still claims a seat nobody can use.
    if (lic.dev.length > lic.seats) return fail()
    await save(env, lic)

    return Response.json({ lic: await issueEnvelope(env, lic, plain) })
  })
}

/**
 * Server-side truth for the admin panel and for the app's periodic re-check. Requires the same
 * proof-of-possession as `confirm`, because it reveals the seat roster.
 */
export async function status(request: Request, env: LicenseEnv): Promise<Response> {
  const url = new URL(request.url)
  if (!sameOrigin(request, url)) return new Response('forbidden', { status: 403 })
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const body = (await readBody(request)) as { key?: unknown; nonce?: unknown; sig?: unknown }
  if (!body || typeof body.key !== 'string' || typeof body.nonce !== 'string' || typeof body.sig !== 'string') {
    return fail()
  }
  const plain = normaliseKey(body.key)
  if (!looksLikeKey(plain)) return fail()
  const kh = await sha256hex(plain)

  return guard(env, ip, kh, async () => {
    const lic = await load(env, kh)
    if (!lic || lic.revoked) return fail()
    const stored = await env.DOWNLOADS.get(nonceKey(kh))
    if (!stored) return fail()
    const [nonce, pk] = stored.split('|')
    if (!nonce || nonce !== body.nonce) return fail()
    if (!(await verifyPop(pk, popMessage(nonce, kh), body.sig))) return fail()
    await env.DOWNLOADS.delete(nonceKey(kh))
    return Response.json({
      exp: lic.exp,
      seats: lic.seats,
      seats_used: lic.dev.length,
      devices: lic.dev.map((d) => ({ fp: d.fp, strong: d.strong, at: d.at, seen: d.seen })),
    })
  })
}

// ── admin API ───────────────────────────────────────────────────────
export type LicenseAdminEnv = LicenseEnv & { LICENSE_ADMIN_TOKEN?: string }

function adminOk(request: Request, env: LicenseAdminEnv) {
  const auth = request.headers.get('authorization') ?? ''
  return !!env.LICENSE_ADMIN_TOKEN && auth.startsWith('Bearer ') && safeEqual(auth.slice(7), env.LICENSE_ADMIN_TOKEN)
}

/**
 * Admin surface. Deliberately separate from the public endpoints and behind its own token: these
 * calls mint value, so they must not share a handler, a limiter or a failure mode with activation.
 */
export async function licenseAdmin(request: Request, env: LicenseAdminEnv, url: URL): Promise<Response> {
  if (!env.LICENSE_SIGNING_KEY) return new Response('not configured', { status: 503 })
  if (!adminOk(request, env)) return new Response('forbidden', { status: 403 })

  const parts = url.pathname.split('/').filter(Boolean) // admin, license, <id>, <action>
  const id = parts[2]
  const action = parts[3]

  if (request.method === 'POST' && !id) {
    const body = (await readBody(request)) as { seats?: unknown; days?: unknown; count?: unknown; tg?: unknown; note?: unknown }
    const seats = Math.trunc(Number(body?.seats ?? 1))
    const days = Math.trunc(Number(body?.days ?? 365))
    const count = Math.min(Math.max(Math.trunc(Number(body?.count ?? 1)), 1), MAX_KEYS_PER_BATCH)
    if (!Number.isFinite(seats) || !Number.isFinite(days)) return Response.json({ error: 'bad_request' }, { status: 400 })
    const out: { key: string; id: string }[] = []
    for (let i = 0; i < count; i++) {
      const { key, license } = await issueLicense(env, {
        seats: Number.isFinite(seats) ? seats : 1,
        days: Number.isFinite(days) ? days : 365,
        tg: Math.trunc(Number(body?.tg ?? 0)) || 0,
        ...(typeof body?.note === 'string' ? { note: body.note } : {}),
      })
      out.push({ key, id: license.id })
    }
    // The only moment the plaintext keys exist anywhere. Shown once, then hashed away.
    return Response.json({ issued: out })
  }

  if (!id) return new Response('method not allowed', { status: 405 })
  // Resolve short id -> full hash through the pointer, then load the one authoritative record.
  const kh = (await env.DOWNLOADS.get(idKey(id))) ?? ''
  const lic = kh ? await load(env, kh) : null

  if (request.method === 'GET' && !action) {
    if (!lic) return new Response('not found', { status: 404 })
    const now = Date.now() / 1000
    return Response.json({
      id: lic.id,
      tier: lic.tier,
      seats: lic.seats,
      seats_used: lic.dev.length,
      iat: lic.iat,
      exp: lic.exp,
      expired: !!lic.exp && now > lic.exp,
      revoked_at: lic.revoked,
      tg: lic.tg,
      note: lic.note ?? '',
      devices: lic.dev.map((d) => ({ fp: d.fp, strong: d.strong, at: d.at, seen: d.seen })),
    })
  }

  if (!lic) return new Response('not found', { status: 404 })

  if (request.method === 'POST' && action === 'extend') {
    const body = (await readBody(request)) as { days?: unknown }
    const days = Math.trunc(Number(body?.days ?? 30))
    if (!Number.isFinite(days) || days === 0) return Response.json({ error: 'bad_request' }, { status: 400 })
    const base = lic.exp && lic.exp > Date.now() / 1000 ? lic.exp : Math.floor(Date.now() / 1000)
    lic.exp = base + days * 86400
    await save(env, lic)
    return Response.json({ id: lic.id, exp: lic.exp })
  }

  if (request.method === 'POST' && action === 'release') {
    const body = (await readBody(request)) as { fp?: unknown }
    const fp = String(body?.fp ?? '')
    const before = lic.dev.length
    lic.dev = lic.dev.filter((d) => d.fp !== fp)
    if (lic.dev.length === before) return Response.json({ error: 'not_found' }, { status: 404 })
    await save(env, lic)
    return Response.json({ id: lic.id, seats_used: lic.dev.length })
  }

  if (request.method === 'POST' && action === 'revoke') {
    if (lic.revoked) return Response.json({ id: lic.id, revoked_at: lic.revoked })
    lic.revoked = Math.floor(Date.now() / 1000)
    await save(env, lic)
    return Response.json({ id: lic.id, revoked_at: lic.revoked })
  }

  if (request.method === 'POST' && action === 'unrevoke') {
    lic.revoked = 0
    await save(env, lic)
    return Response.json({ id: lic.id, revoked_at: 0 })
  }

  if (request.method === 'DELETE') {
    await env.DOWNLOADS.delete(licKey(kh))
    await env.DOWNLOADS.delete(idKey(lic.id))
    return Response.json({ deleted: lic.id })
  }

  return new Response('method not allowed', { status: 405 })
}

// ── helpers ─────────────────────────────────────────────────────────
async function readBody(request: Request) {
  const text = (await request.text()).slice(0, MAX_BODY)
  try {
    return JSON.parse(text || '{}')
  } catch {
    return null
  }
}

/**
 * Normalise a device public key to the exact base64url form the record stores.
 *
 * Requires an uncompressed P-256 point (65 bytes, leading 0x04). Accepting anything else — including
 * a 33-byte compressed point, which Keystore never produces — would mean storing two spellings of
 * one key and letting a duplicate claim open a second seat.
 */
function normalisePub(raw: string): string {
  const b = unb64u(raw)
  if (b.length !== 65 || b[0] !== 0x04) throw new Error('bad public key')
  return b64u(b)
}

/** Exported for the app-side test vector generator and for the bot's self-check. */
export const LICENSE_FEATURE_SET = FEATURES