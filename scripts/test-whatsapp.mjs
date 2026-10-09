// Runnable check for the WhatsApp front desk (worker/whatsapp.ts).
//   node scripts/test-whatsapp.mjs
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const dir = mkdtempSync(join(tmpdir(), 'wa-'))
await esbuild.build({ entryPoints: ['worker/whatsapp.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: join(dir, 'w.mjs'), logLevel: 'silent' })
const { waWebhook } = await import(join(dir, 'w.mjs'))
rmSync(dir, { recursive: true, force: true })

const files = { '/store/catalog.json': 'public/store/catalog.json', '/store/apps.json': 'public/store/apps.json' }
const env = {
  ASSETS: { fetch: async (req) => new Response(readFileSync(files[new URL(req.url).pathname], 'utf8')) },
  WA_VERIFY_TOKEN: 'verify-me',
  WA_APP_SECRET: 'app-secret',
  WA_TOKEN: 'graph-token',
  WA_PHONE_ID: '1234567890',
}
const catalog = JSON.parse(readFileSync('public/store/catalog.json', 'utf8'))

const sent = []
globalThis.fetch = async (url, init) => {
  sent.push({ url: String(url), auth: init.headers.authorization, body: JSON.parse(init.body) })
  return Response.json({ messages: [{ id: 'wamid.x' }] })
}

const get = (q) => waWebhook(new Request(`https://zeidexsoft.com/api/wa?${q}`), env)
const sign = (raw, secret = env.WA_APP_SECRET) => 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex')
const post = (payload, signature) => {
  const raw = JSON.stringify(payload)
  return waWebhook(new Request('https://zeidexsoft.com/api/wa', { method: 'POST', headers: { 'x-hub-signature-256': signature ?? sign(raw) }, body: raw }), env)
}
const message = (m) => ({ entry: [{ changes: [{ value: { messages: [{ from: '967771111111', ...m }] } }] }] })

// Unconfigured: refuse rather than half-work.
assert.equal((await waWebhook(new Request('https://zeidexsoft.com/api/wa'), { ASSETS: env.ASSETS })).status, 503)

// Meta's one-time verification.
const ok = await get('hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=4242')
assert.equal(ok.status, 200)
assert.equal(await ok.text(), '4242')
assert.equal((await get('hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=4242')).status, 403)

// Forged or missing signatures are refused before anything is read or sent.
assert.equal((await post(message({ type: 'text', text: { body: 'hi' } }), sign('other body'))).status, 401)
assert.equal((await post(message({ type: 'text', text: { body: 'hi' } }), sign('x', 'wrong-secret'))).status, 401)
assert.equal((await post(message({ type: 'text', text: { body: 'hi' } }), '')).status, 401)
assert.equal(sent.length, 0, 'nothing is sent for an unsigned request')

// Any text gets the menu: three reply buttons, titles within WhatsApp's 20 characters.
assert.equal((await post(message({ type: 'text', text: { body: 'مرحبا' } }))).status, 200)
const first = sent.at(-1)
assert.equal(first.url, 'https://graph.facebook.com/v23.0/1234567890/messages')
assert.equal(first.auth, 'Bearer graph-token')
assert.equal(first.body.to, '967771111111')
const buttons = first.body.interactive.action.buttons
assert.equal(buttons.length, 3)
for (const b of buttons) assert.ok([...b.reply.title].length <= 20, `button title too long: ${b.reply.title}`)

// Buttons answer from the real catalogue and apps — never a list of their own.
await post(message({ type: 'interactive', interactive: { button_reply: { id: 'shop' } } }))
assert.ok(sent.at(-1).body.text.body.includes(catalog.products[0].title), 'shop lists catalogue products')
assert.ok(sent.at(-1).body.text.body.includes(`https://t.me/${catalog.bot}`), 'buying points at the Telegram bot')
await post(message({ type: 'interactive', interactive: { button_reply: { id: 'free' } } }))
assert.ok(sent.at(-1).body.text.body.includes('?start=trial'), 'free offers the store-bot trial')

// A malformed but signed batch is acknowledged, not retried forever.
const raw = '{"entry": [oops'
const res = await waWebhook(new Request('https://zeidexsoft.com/api/wa', { method: 'POST', headers: { 'x-hub-signature-256': sign(raw) }, body: raw }), env)
assert.equal(res.status, 200)

console.log('whatsapp: all checks passed')
