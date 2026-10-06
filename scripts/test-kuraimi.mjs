// Runnable check for the Kuraimi + LikeCard money path (worker/kuraimi.ts).
//   node scripts/test-kuraimi.mjs
// Bundles the worker module with esbuild and drives it with an in-memory KV and a fake
// fetch, so no bank or supplier is contacted.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const dir = mkdtempSync(join(tmpdir(), 'kuraimi-'))
await esbuild.build({ entryPoints: ['worker/kuraimi.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: join(dir, 'k.mjs'), logLevel: 'silent' })
const k = await import(join(dir, 'k.mjs'))
rmSync(dir, { recursive: true, force: true })

const kv = () => {
  const m = new Map()
  return { get: async (key) => m.get(key) ?? null, put: async (key, v) => void m.set(key, v), m }
}
const catalog = { products: [{ sku: 'pubg-660', title: 'PUBG 660 UC', usd: 10 }] }
const ORIGIN = 'https://zeidexsoft.com'
const env = (over = {}) => ({
  DOWNLOADS: kv(),
  ASSETS: { fetch: async () => new Response(JSON.stringify(catalog)) },
  KURAIMI_BASE_URL: 'https://bank.test', KURAIMI_USERNAME: 'u', KURAIMI_PASSWORD: 'p',
  KURAIMI_WEBHOOK_USER: 'hook', KURAIMI_WEBHOOK_PASS: 'secret', KURAIMI_YER_PER_USD: '530',
  LIKECARD_DEVICE_ID: 'd', LIKECARD_EMAIL: 'V@x.com', LIKECARD_PASSWORD: 'pw', LIKECARD_SECURITY_CODE: 's',
  LIKECARD_PHONE: '966500000000', LIKECARD_HASH_KEY: 'key', SUPPLIER_PRODUCTS: 'pubg-660=1405',
  ...over,
})
const pay = (e, body, ip = '198.51.100.1') => k.kuraimiPay(new Request(`${ORIGIN}/api/pay/kuraimi`, {
  method: 'POST', headers: { origin: ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(body),
}), e)
const order = { sku: 'pubg-660', mobile: '771234567', pin: '1234', idempotency_key: 'a'.repeat(32) }

const calls = []
globalThis.fetch = async (url, init) => {
  calls.push(String(url))
  if (String(url).includes('SendPayment')) {
    const sent = JSON.parse(init.body)
    assert.equal(sent.AMOUNT, 5300); assert.equal(sent.CRCY, 'YER'); assert.equal(sent.PINPASS, btoa('1234'))
    return new Response(JSON.stringify(globalThis.bankReply ?? { Code: 1, ResultSet: { PH_REF_NO: 'PH1' } }))
  }
  if (String(url).includes('create_order')) {
    assert.equal(init.body.get('referenceId').startsWith('ZX'), true)
    return new Response(JSON.stringify({ response: 1, serials: [{ serialCode: 'PUBG-XYZ' }] }))
  }
  return new Response('{}')
}

// 1. Off until configured: never reaches the bank.
assert.equal((await pay(env({ KURAIMI_BASE_URL: '' }), order)).status, 503)
assert.equal(calls.length, 0)

// 2. Paid → code bought with referenceId = REFNO, and a retry does not charge again.
const e = env()
const first = await (await pay(e, order)).json()
assert.equal(first.status, 'paid'); assert.equal(first.code, 'PUBG-XYZ'); assert.equal(first.yer, 5300)
const bankCalls = calls.filter((c) => c.includes('SendPayment')).length
const again = await (await pay(e, order)).json()
assert.equal(again.refno, first.refno)
assert.equal(calls.filter((c) => c.includes('SendPayment')).length, bankCalls, 'retry must not hit the bank')

// 3. check-user: wrong credentials 403; pending mobile Code 1; unknown mobile Code 2.
const hook = (auth, MobileNo) => k.kuraimiCheckUser(new Request(`${ORIGIN}/x`, {
  method: 'POST', headers: { authorization: auth }, body: JSON.stringify({ MobileNo, CustomerZone: 'YE0012003' }),
}), e)
assert.equal((await hook(`Basic ${btoa('hook:nope')}`, '771234567')).status, 403)
assert.equal((await (await hook(`Basic ${btoa('hook:secret')}`, '771234567')).json()).Code, '1')
assert.equal((await (await hook(`Basic ${btoa('hook:secret')}`, '12345')).json()).Code, '2')

// 4. Bank refusal → 402, nothing bought.
globalThis.bankReply = { Code: 0, MessageDesc: 'Insufficient balance' }
const refused = await pay(env(), { ...order, idempotency_key: 'b'.repeat(32) })
assert.equal(refused.status, 402)

// 4b. Three refusals for one mobile lock it, whatever the idempotency key.
const lockEnv = env()
// Each attempt from a different IP: the per-mobile lock must hold across IPs.
for (const [i, c] of ['c', 'd', 'e'].entries()) await pay(lockEnv, { ...order, idempotency_key: c.repeat(32) }, `203.0.113.${i}`)
assert.equal((await pay(lockEnv, { ...order, idempotency_key: 'f'.repeat(32) }, '203.0.113.9')).status, 423)

// 4c. A bank timeout is "unknown" (202), never "failed", and a retry does not re-charge.
globalThis.bankReply = undefined
const realFetch = globalThis.fetch
let bankHits = 0
globalThis.fetch = async (url, init) => {
  if (String(url).includes('SendPayment')) { bankHits++; return new Response('<html>gateway timeout</html>') }
  return realFetch(url, init)
}
const tEnv = env()
const timeout = await pay(tEnv, { ...order, idempotency_key: 'g'.repeat(32) })
assert.equal(timeout.status, 202); assert.equal((await timeout.json()).status, 'unknown')
await pay(tEnv, { ...order, idempotency_key: 'g'.repeat(32) })
assert.equal(bankHits, 1, 'a retry after an unknown result must not call the bank again')
globalThis.fetch = realFetch

// 5. Bad input never reaches the bank.
assert.equal((await pay(env(), { ...order, pin: '12' })).status, 400)
assert.equal(k.yerAmount(10.01, 530), 5306)
console.log('kuraimi: all checks passed')
