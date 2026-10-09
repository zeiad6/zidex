// Registers the platform bot's Telegram webhook against the LIVE worker host.
//
// The secret MUST be derived exactly like worker/bots.ts webhookSecret():
//   HMAC-SHA256(BOTS_KEY, `tg:<botId>`), base64, [A-Za-z0-9] only, first 48 chars.
// The old reseed script signed `hook:<id>` (42 chars) and pointed the webhook at
// zeidex.zeidex.workers.dev — a host wrangler.toml no longer serves (workers_dev = false).
// Both made every Telegram update get dropped: the bot went silent.
//
// KV record itself is pushed by deploy-primary.sh (wrangler kv:key put), not here.
import { BOT_ID, BOT_TOKEN, BOTS_KEY, webhookSecret } from './bot-secrets.mjs'

// Default to the primary host: wrangler.toml has workers_dev = false, so
// zeidex.zeidex.workers.dev is NOT served — pointing the webhook there would
// silently kill the bot again. Use ORIGIN only for an explicit override.
const HOST = process.env.ORIGIN || 'https://zeidexsoft.com'

const secret = await webhookSecret(BOTS_KEY, BOT_ID)
const url = `${HOST}/tg/${BOT_ID}`

const tg = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  console.log(method, data.ok ? '✅' : `❌ ${data.description}`)
  return data
}

// One update at a time: each update rewrites the whole KV record, so parallel
// deliveries would overwrite each other (mirrors worker/bots.ts provisioning).
// channel_post feeds the storage channel (files the owner posts there are indexed for /send).
await tg('setWebhook', {
  url,
  secret_token: secret,
  max_connections: 1,
  allowed_updates: ['message', 'callback_query', 'pre_checkout_query', 'channel_post'],
  drop_pending_updates: true,
})

// The customer's entry points in Telegram's "/" menu.
await tg('setMyCommands', {
  commands: [
    { command: 'start', description: 'القائمة الرئيسية' },
    { command: 'search', description: 'ابحث في المنتجات' },
    { command: 'catalog', description: 'كل المنتجات' },
    { command: 'trial', description: 'تجربة كاملة 7 أيام' },
    { command: 'apps', description: 'تطبيقات أندرويد وويندوز' },
    { command: 'donate', description: 'دعم وتبرع' },
    { command: 'help', description: 'المساعدة' },
  ],
})

console.log(`webhook → ${url}`)
console.log('secret    → derived with tg: prefix, 48 chars (matches worker/bots.ts)')
