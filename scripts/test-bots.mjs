// Runnable check for Cloudflare-hosted customer bots (worker/bots.ts).
//   node scripts/test-bots.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
// The real fetch, kept before the stub below replaces the global one. The bot
// name check has to reach the live Telegram API, and a stubbed fetch would
// happily answer getMe with whatever the stub says — which is exactly how a
// wrong username would pass its own test.
const realFetch = globalThis.fetch
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

// The owner seeds an FAQ whose text carries the mess a real customer would type: harakat,
// a ta marbuta, a superscript/hamza alef, and Arabic-Indic digits.
await deliver({ message: { chat: { id: 7, type: 'private' }, from: { id: 7 }, text: '/faq طريقةُ الدَّفع | راسل ٱلـمبيع عبر AlyPay، ١٢٣ نجمة في حسابى' } })

// Customer search: /search and /catalog read the shop, and the whole path must stay
// read-only. The KV spy stays installed across every search below to prove it.
calls.length = 0
const searchWrites = []
const basePut = env.DOWNLOADS.put
env.DOWNLOADS.put = async (k, v) => { searchWrites.push(k); return basePut(k, v) }
const lastSend = () => calls.filter((c) => c.method === 'sendMessage').at(-1)
const keys = (c) => (c.body.reply_markup?.inline_keyboard ?? []).map((r) => r.map((b) => b.callback_data))

// One token is enough: "course" hits the seeded "Course / Video course".
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search course' } })
assert.ok(lastSend().body.text.includes('نتائج'), '/search must answer')
assert.ok(lastSend().body.text.includes('course'), 'the query is echoed')
assert.ok(lastSend().body.reply_markup.inline_keyboard[0][0].text.includes('Course'), 'the title is on the button')
assert.deepEqual(keys(lastSend())[0], [`t:buy:${item.id}`], 'the row must be the buy button for the item')
assert.ok(keys(lastSend()).at(-1).includes('t:contact'), 'the main menu row must be trailing')

// Punctuation-only differences are folded away, so a sloppy query still hits.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search ٪COURSE٪' } })
assert.deepEqual(keys(lastSend())[0], [`t:buy:${item.id}`], 'punctuation must not block a match')

// Token matching, not whole-string: "zzz course" is not a substring of anything in the shop,
// but the token "course" is. This is the case that makes "بوت متجر" find "بوت المتجر الذكي".
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search zzz course' } })
assert.ok(lastSend().body.text.includes('نتائج'), 'any one matching token must be enough')
assert.deepEqual(keys(lastSend())[0], [`t:buy:${item.id}`], 'a matching token must reach the item')

// Plain words are a query too, and still only a read.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: 'course' } })
assert.deepEqual(keys(lastSend())[0], [`t:buy:${item.id}`], 'a plain message must search')

// The owner reaches /search as well: it is routed before the owner branch.
await deliver({ message: { chat: { id: 7, type: 'private' }, from: { id: 7 }, text: '/search course' } })
assert.deepEqual(keys(lastSend())[0], [`t:buy:${item.id}`], 'the owner must reach /search')

// /catalog reuses the t:items shape, plus the menu.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/catalog' } })
assert.equal(lastSend().body.text, '🛍 <b>المنتجات</b>')
assert.deepEqual(keys(lastSend())[0], [`t:buy:${item.id}`])

// A miss says so instead of showing an empty keyboard.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search zzzznothinghere' } })
assert.ok(lastSend().body.text.includes('لم أجد شيئاً'))
// Markup in a query is folded away by norm(), so nothing can be echoed as HTML.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search <script>' } })
assert.ok(!lastSend().body.text.includes('<script>'), 'a query must never be echoed as markup')
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: 'zzzznothinghere' } })
assert.ok(lastSend().body.text.includes('لم أجد شيئاً'), 'a plain miss must say so')

// An empty query is a usage hint, and so is a punctuation-only one.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search' } })
assert.ok(lastSend().body.text.includes('/search مثال'), 'an empty /search must show the hint')
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search ٪٪' } })
assert.ok(lastSend().body.text.includes('/search مثال'), 'a punctuation-only query is an empty query')

// /help lists the three entry points.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/help' } })
for (const c of ['/start', '/search', '/catalog']) assert.ok(lastSend().body.text.includes(c), `/help must list ${c}`)

// Arabic normalisation. Owners type shop data with full spelling — harakat, superscript
// alef, ta marbuta, Arabic-Indic digits — and customers type the sloppy version, so these
// four pairs must all collapse onto the same key and reach the same FAQ row.
const faqRow = async (query) => {
  await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: `/search ${query}` } })
  return keys(lastSend()).flat()
}
// The FAQ was seeded as "طريقةُ الدَّفبع" (harakat + a fatha'd dal); "دفع" has none.
assert.ok((await faqRow('دفع')).includes('t:faq:0'), 'harakat must not block a match')
// The question is "طريقةُ" (ta marbuta); the customer types "طريقه" with a plain ha.
// Asymmetric on purpose: folding both sides the same way would match even without the rule.
assert.ok((await faqRow('طريقه')).includes('t:faq:0'), 'ta marbuta must not block a match')
assert.ok((await faqRow('المبيع')).includes('t:faq:0'), 'superscript alef and tatweel must not block a match')
// The answer ends "في حسابى" with an alef maqsura; the customer types "حسابي" with a ya.
assert.ok((await faqRow('حسابي')).includes('t:faq:0'), 'alef maqsura must not block a match')
// The answer says "١٢٣" in Arabic-Indic digits; the customer types "123".
assert.ok((await faqRow('123')).includes('t:faq:0'), 'Arabic-Indic digits must fold to Latin')
assert.ok((await faqRow('١٢٣')).includes('t:faq:0'), 'and match the other way round')
// Latin case folding inside Arabic text.
assert.ok((await faqRow('alypay')).includes('t:faq:0'), 'Latin text must fold to lower case')

assert.deepEqual(searchWrites, [], 'search, catalog and help must never write to KV')
env.DOWNLOADS.put = basePut

// Regression: none of that opened a hole in the owner commands.
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/add Free | 1' } })
assert.equal(JSON.parse(store.get('tb:123456789')).items.length, 1, 'a customer still cannot run /add')

// ── A throttled message must cost zero KV reads ──────────────────────────
// The limiter used to run after load(), so a spamming customer burned one read
// per message out of the 100,000/day free-tier budget before being throttled at
// all. It now runs first. On the free tier BOT_LIMITER is undefined, so this
// installs a limiter that always refuses: that is exactly the state a rate-limited
// customer is in, and it must not reach KV.
{
  const reads = []
  const realGet = env.DOWNLOADS.get
  env.DOWNLOADS.get = async (k) => { reads.push(k); return realGet(k) }
  const limiterSeen = []
  env.BOT_LIMITER = { limit: async (o) => { limiterSeen.push(o.key); return { success: false } } }
  calls.length = 0

  await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search course' } })
  assert.deepEqual(reads, [], 'a throttled update must not read KV at all')
  assert.equal(calls.filter((c) => c.method === 'sendMessage').length, 0, 'and must send nothing')

  // The owner of this bot at this point in the file is 7 (it is re-provisioned
  // to 8 further down). A cold isolate cannot tell that without a read, so the
  b.configCache.clear()
  b.ownerCache.clear()
  // owner's first message pays exactly one read to fill the cache — and is
  // answered, because the limiter is consulted after that read, not before.
  reads.length = 0
  calls.length = 0
  await deliver({ message: { chat: { id: 7, type: 'private' }, from: { id: 7 }, text: '/search course' } })
  assert.ok(calls.some((c) => c.method === 'sendMessage'), 'the owner is answered on their first, cold-cache message')
  assert.ok(reads.includes('tb:123456789'), 'and that first message pays the one read that fills the cache')

  // Warm isolate: the owner is exempt from a limiter that refuses everything.
  reads.length = 0
  calls.length = 0
  limiterSeen.length = 0
  await deliver({ message: { chat: { id: 7, type: 'private' }, from: { id: 7 }, text: '/search course' } })
  assert.ok(calls.some((c) => c.method === 'sendMessage'),
    'the owner must be exempt from the limiter even though it refuses everything else')
  assert.equal(reads.length, 0, 'and the owner reaches the bot record without a KV read due to configCache')
  assert.equal(limiterSeen.length, 0, 'the owner is never offered to the limiter at all')

  // The stale-cache case. A re-provision moves the bot to owner 42 while the
  // cache still says 7. Without an expiry the warm path would never re-read and
  // 42 would be throttled as a customer for the isolate's whole lifetime. The
  // TTL bounds that, so here the cache is forced stale and the new owner's
  // first message is allowed through by the read the expiry makes necessary.
  await admin('POST', '/admin/bots', { token: TOKEN, owner_id: 42 })
  b.__expireOwnerCache()
  reads.length = 0
  calls.length = 0
  limiterSeen.length = 0
  await deliver({ message: { chat: { id: 42, type: 'private' }, from: { id: 42 }, text: '/search course' } })
  assert.ok(calls.some((c) => c.method === 'sendMessage'),
    'a new owner must not be locked out by a stale cache — the TTL forces the re-read')
  assert.ok(reads.includes('tb:123456789'), 'and that re-read is what corrects the cache')

  // Payments are exempt from the limiter even for a customer. Telegram has
  // already taken the Stars at this point, and refusing the pre-checkout query
  // leaves the buyer stuck at the payment sheet with no way forward — so a
  // throttled customer must still be answered when money is involved.
  reads.length = 0
  calls.length = 0
  limiterSeen.length = 0
  await deliver({ pre_checkout_query: { id: 'q-p', from: { id: 50 }, currency: 'XTR', total_amount: 1, invoice_payload: `t123456789:${item.id}` } })
  assert.equal(limiterSeen.length, 0, 'a payment must never be offered to the limiter')
  assert.ok(calls.some((c) => c.method === 'answerPreCheckoutQuery'),
    'and must be answered, or the buyer is left stuck at the payment sheet')

  // The cost of that design, stated so it is a decision and not an accident:
  // a sender the cache has never seen as an owner pays one limiter call.
  // Proving the opposite direction is what matters — a customer must never
  // gain an exemption.
  calls.length = 0
  await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50 }, text: '/search course' } })
  assert.equal(calls.filter((c) => c.method === 'sendMessage').length, 0, 'a customer is still throttled')

  env.DOWNLOADS.get = realGet
  delete env.BOT_LIMITER
}

// Re-provisioning keeps the shop's products.
await admin('POST', '/admin/bots', { token: TOKEN, owner_id: 8 })
assert.equal(JSON.parse(store.get('tb:123456789')).items.length, 1)
assert.equal(JSON.parse(store.get('tb:123456789')).owner, 8)

// Deprovision removes the record and the webhook.
await admin('DELETE', '/admin/bots/123456789')
assert.equal(store.get('tb:123456789'), undefined)

// ── The bot name the storefront will actually send buyers to ──────────────
// On 2026-10-06 the catalogue advertised @ZeidexBot, which does not exist:
// Telegram served it the same "Contact @name" page it gives any free handle,
// so every buy button on the site and in the Mini App was a dead deep link.
// No exception, no failing build — just silently lost sales.
//
// A wrong username is invisible to every other test, so it gets its own.
{
  const cat = JSON.parse(readFileSync(new URL('../public/store/catalog.json', import.meta.url), 'utf8'))

  assert.ok(cat.bot, 'the catalogue must name a bot')
  assert.ok(/^[a-z][a-z0-9_]{4,31}$/.test(cat.bot), `bot must be a Telegram username, got "${cat.bot}"`)

  // A cosmetic warning, not a gate. BotFather appends _bot to every bot it
  // creates, so a name that still ends in one is the default rather than a
  // chosen brand — which matters to how the shop reads, but the deep link
  // works either way. Rename with /setusername in @BotFather; see
  // docs/BOT-NAME.md.
  if (cat.bot.endsWith('_bot')) {
    console.log(`  note: @${cat.bot} still carries BotFather's default _bot suffix — consider /setusername in @BotFather (see docs/BOT-NAME.md)`)
  }

  // Every product must carry a reusable Stars invoice link. These are
  // `t.me/$<code>` deep links, which Telegram resolves by invoice code and not
  // by username — so they keep working across a rename, and they cannot be
  // checked against `cat.bot`. What they can be checked for is presence and
  // shape, because a blank or malformed one silently breaks checkout.
  for (const p of cat.products) {
    assert.ok(p.invoice, `${p.sku}: missing its Stars invoice`)
    assert.match(p.invoice, /^https:\/\/t\.me\/\$[A-Za-z0-9_-]{16,64}$/,
      `${p.sku}: invoice must be a t.me/$<code> deep link, got "${p.invoice}"`)
  }

  // Authoritative check, when a token is available: getMe is the bot's own
  // answer to "what is my username", so a comparison against the catalogue is
  // exact. Scraping t.me is deliberately not used here — Telegram rate-limits
  // it, serves two different pages depending on the User-Agent, and answers a
  // dead handle with a 200, which is the trap that let this break silently.
  //
  // The token is read from the environment only, never from a committed file.
  const token = process.env.BOT_TOKEN
  if (!token) {
    console.log('  bot name live check skipped (no BOT_TOKEN in the environment)')
  } else {
    let me = null
    try {
      const res = await realFetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) })
      me = await res.json()
    } catch (e) {
      console.log(`  bot name live check skipped (${e.name}) — offline`)
    }
    if (me) {
      assert.equal(me.ok, true, `getMe failed: ${me.description ?? 'unknown error'}`)
      assert.equal(me.result.username, cat.bot,
        `the catalogue advertises @${cat.bot} but the bot is @${me.result.username} — every buy link points at a handle that does not exist. Rename in @BotFather, then re-run with BOT_USERNAME. See docs/BOT-NAME.md.`)
      console.log(`  bot name verified against getMe: @${me.result.username} (${me.result.first_name})`)
    }
  }
}

console.log('hosted bots: all checks passed')
