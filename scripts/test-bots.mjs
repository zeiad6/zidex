// Runnable check for Cloudflare-hosted customer bots (worker/bots.ts).
//   node scripts/test-bots.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const dir = mkdtempSync(join(tmpdir(), 'bots-'))
await esbuild.build({ entryPoints: ['worker/bots.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: join(dir, 'b.mjs'), logLevel: 'silent' })
const b = await import(join(dir, 'b.mjs'))
rmSync(dir, { recursive: true, force: true })

const store = new Map()
const env = {
  DOWNLOADS: { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v), delete: async (k) => void store.delete(k) },
  BOTS_KEY: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))),
  BOTS_ADMIN_TOKEN: 'admin-secret-1234567890',
}
const TOKEN = '123456789:' + 'A'.repeat(35)
const calls = []
globalThis.fetch = async (url, init) => {
  const method = String(url).split('/').pop()
  const body = init?.body ? JSON.parse(init.body) : {}
  calls.push({ method, body })
  if (method === 'getMe') return Response.json({ ok: true, result: { id: 123456789, username: 'shop_bot', first_name: 'Shop' } })
  return Response.json({ ok: true, result: {} })
}
const admin = (method, path, body, auth = env.BOTS_ADMIN_TOKEN) =>
  b.botsAdmin(new Request(`https://zeidexsoft.com${path}`, { method, headers: { authorization: `Bearer ${auth}` }, body: body ? JSON.stringify(body) : undefined }), env, new URL(`https://zeidexsoft.com${path}`))

// Admin API: wrong key refused; provisioning stores an encrypted token and sets a secret webhook.
assert.equal((await admin('POST', '/admin/bots', { token: TOKEN, owner_id: 7 }, 'nope')).status, 403)
const made = await (await admin('POST', '/admin/bots', { token: TOKEN, owner_id: 7 })).json()
assert.equal(made.bot_id, 123456789)
const cfg = JSON.parse(store.get('tb:123456789'))
assert.ok(!store.get('tb:123456789').includes(TOKEN), 'token must be stored encrypted')
assert.equal(await b.open(env, cfg.token), TOKEN)
const hook = calls.find((c) => c.method === 'setWebhook').body
assert.equal(hook.url, 'https://zeidexsoft.com/tg/123456789'); assert.equal(hook.secret_token, cfg.secret)

assert.equal(cfg.secret, await b.webhookSecret(env, 123456789))
const deliver = (update, secret = cfg.secret) =>
  b.botWebhook(new Request('https://zeidexsoft.com/tg/123456789', { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, '123456789')

// Forged webhook (wrong secret): nothing happens.
calls.length = 0
await deliver({ message: { chat: { id: 7, type: 'private' }, from: { id: 7 }, text: '/add Hack | 1' } }, 'wrong')
assert.equal(calls.length, 0)

// Owner adds a product; a customer starts the bot and buys it.
await deliver({ message: { chat: { id: 7, type: 'private' }, from: { id: 7 }, text: '/add Course | 150 | Video course' } })
const item = JSON.parse(store.get('tb:123456789')).items[0]
assert.equal(item.stars, 150)
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50, first_name: 'Ali' }, text: '/start' } })
assert.deepEqual(JSON.parse(store.get('tb:123456789')).users, [50])

// A customer cannot run owner commands.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/add Free | 1' } })
assert.equal(JSON.parse(store.get('tb:123456789')).items.length, 1)

// Pre-checkout: right price approved, tampered price refused.
calls.length = 0
await deliver({ pre_checkout_query: { id: 'q1', from: { id: 50 }, currency: 'XTR', total_amount: 150, invoice_payload: `t123456789:${item.id}` } })
await deliver({ pre_checkout_query: { id: 'q2', from: { id: 50 }, currency: 'XTR', total_amount: 1, invoice_payload: `t123456789:${item.id}` } })
const answers = calls.filter((c) => c.method === 'answerPreCheckoutQuery').map((c) => c.body.ok)
assert.deepEqual(answers, [true, false])

// Paid order survives even when KV writes fail (quota exhausted): both are told first.
calls.length = 0
const realPut = env.DOWNLOADS.put
env.DOWNLOADS.put = async () => { throw new Error('KV write limit') }
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50, first_name: 'Ali' }, successful_payment: { total_amount: 150, currency: 'XTR' } } })
env.DOWNLOADS.put = realPut
assert.equal(calls.filter((c) => c.method === 'sendMessage').length, 2)

// Contact uses force_reply (no KV write); a reply to the prompt reaches the owner.
calls.length = 0
const writes = []
const putSpy = env.DOWNLOADS.put
env.DOWNLOADS.put = async (k, v) => { writes.push(k); return putSpy(k, v) }
await deliver({ callback_query: { id: 'c1', from: { id: 50 }, data: 't:contact', message: { chat: { id: 50, type: 'private' } } } })
assert.equal(writes.length, 0, 'a contact tap must not write to KV')
const prompt = calls.find((c) => c.method === 'sendMessage').body.text
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50, first_name: 'Ali' }, text: 'hello', reply_to_message: { from: { id: 123456789 }, text: prompt } } })
assert.ok(calls.some((c) => c.method === 'sendMessage' && c.body.chat_id === 7 && c.body.text.includes('hello')))
env.DOWNLOADS.put = putSpy

// Re-provisioning keeps the shop's products.
await admin('POST', '/admin/bots', { token: TOKEN, owner_id: 8 })
assert.equal(JSON.parse(store.get('tb:123456789')).items.length, 1)
assert.equal(JSON.parse(store.get('tb:123456789')).owner, 8)

// Deprovision removes the record and the webhook.
await admin('DELETE', '/admin/bots/123456789')
assert.equal(store.get('tb:123456789'), undefined)
console.log('hosted bots: all checks passed')
