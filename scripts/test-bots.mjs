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
await deliver({ message: { chat: { id: 50, type: 'private' }, from: { id: 50, first_name: 'Ali' }, message_id: 77, successful_payment: { total_amount: 150, currency: 'XTR' } } })
env.DOWNLOADS.put = realPut
assert.equal(calls.filter((c) => c.method === 'sendMessage').length, 2)
// A paid order ends on a celebration: 🎉 lands on the buyer's own payment message.
assert.ok(calls.some((c) => c.method === 'setMessageReaction' && c.body.chat_id === 50 && c.body.message_id === 77 && c.body.reaction?.[0]?.emoji === '🎉'), 'a successful payment gets a 🎉 reaction on the buyer\'s message')

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

// The shop record is untouchable from here: search, catalog and help must never write it.
// (The panel's support feed is the one exception in the codebase — it is paid-only,
// throttled, and lives in its own feed:<id> key, so it can never bend this rule.)
assert.deepEqual(searchWrites.filter((k) => k.startsWith('tb:')), [], 'search, catalog and help must never write the shop record')
// A plain customer message on a paid record may write the throttled feed — and nothing else.
const feedWrites = searchWrites.filter((k) => !k.startsWith('tb:'))
for (const k of feedWrites) assert.ok(k.startsWith('feed:'), `unexpected write outside the feed: ${k}`)
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

// ── Plans: one 7-day trial for every self-serve path; the free month is retired ──
{
  b.configCache.clear()
  b.ownerCache.clear()
  const FREE_ID = 555000111
  const FREE_TOKEN = `${FREE_ID}:` + 'F'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: FREE_ID, username: 'free_shop_bot', first_name: 'Free' } })
    return Response.json({ ok: true, result: {} })
  }
  try {
    assert.deepEqual(await (await admin('GET', '/admin/bots')).json(), { plans: ['trial', 'paid'] }, 'the capability probe /trial reads first')
    assert.equal((await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9, plan: 'free' })).status, 400, 'the free month is retired — nothing provisions one anymore')
    const made = await (await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9, plan: 'trial' })).json()
    assert.equal(made.plan, 'trial')
    const rec = () => JSON.parse(store.get(`tb:${FREE_ID}`))
    const secret = rec().secret
    const say = (from, text) =>
      b.botWebhook(
        new Request(`https://zeidexsoft.com/tg/${FREE_ID}`, {
          method: 'POST',
          headers: { 'x-telegram-bot-api-secret-token': secret },
          body: JSON.stringify({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } }),
        }),
        env,
        String(FREE_ID),
      )
    const lastText = () => [...sent].reverse().find((c) => c.method === 'sendMessage')?.body.text ?? ''

    // The one self-serve plan runs the full store: no cap, no signature.
    for (let i = 0; i < 31; i++) await say(9, `/add P${i} | 10`)
    assert.equal(rec().items.length, 31, 'the trial caps nothing — the full 50-product store')
    await say(70, '/start')
    assert.ok(!lastText().includes('مدعوم من ZeidexSoft'), 'trials are unsigned')
    assert.ok(!lastText().includes('zeidexsoft.com'), 'trials are not linked to the platform site')

    // Seven days, set once: re-provisioning cannot move the end date.
    const ends = Date.parse(rec().expires)
    assert.ok(Math.abs(ends - Date.now() - 7 * 864e5) < 60e3, 'trial = 7 days')
    await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9, plan: 'trial' })
    assert.equal(Date.parse(rec().expires), ends, 're-provisioning never extends the trial')

    // A customer's shop never answers with the platform's apps or its bank accounts.
    sent.length = 0
    await say(70, '/donate')
    await say(70, '/apps')
    assert.equal(sent.filter((c) => c.method === 'sendMessage').length, 0, 'platform commands are silent on a hosted shop')
    await say(70, '/help')
    assert.ok(!lastText().includes('/donate') && !lastText().includes('/apps'), '/help lists only the shop commands')

    // Re-provisioning without a plan keeps it; an explicit plan changes it.
    await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9 })
    assert.equal(rec().plan, 'trial')
    assert.equal(rec().items.length, 31, 're-provisioning keeps the shop')
    await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9, plan: 'paid' })
    assert.equal(rec().plan, 'paid')
    assert.equal((await (await admin('GET', `/admin/bots/${FREE_ID}`)).json()).plan, 'paid')
  } finally {
    globalThis.fetch = saved
  }
}

// ── Legacy free-month records: nothing writes them anymore; the wild's are honoured ──
{
  b.configCache.clear()
  b.ownerCache.clear()
  const FREE_ID = 555000444
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: FREE_ID, username: 'legacy_free_bot', first_name: 'Legacy' } })
    return Response.json({ ok: true, result: {} })
  }
  try {
    // No API provisions a free month anymore — the only way one exists is that it was
    // written before the retirement, so the test writes it exactly that way.
    await admin('POST', '/admin/bots', { token: `${FREE_ID}:` + 'V'.repeat(35), owner_id: 9, plan: 'trial' })
    store.set(`tb:${FREE_ID}`, JSON.stringify({ ...JSON.parse(store.get(`tb:${FREE_ID}`)), plan: 'free', items: [], expires: new Date(Date.now() + 864e5).toISOString() }))
    b.configCache.clear()
    b.ownerCache.clear()
    const rec = () => JSON.parse(store.get(`tb:${FREE_ID}`))
    const secret = rec().secret
    const say = (from, text) =>
      b.botWebhook(
        new Request(`https://zeidexsoft.com/tg/${FREE_ID}`, {
          method: 'POST',
          headers: { 'x-telegram-bot-api-secret-token': secret },
          body: JSON.stringify({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } }),
        }),
        env,
        String(FREE_ID),
      )
    const lastText = () => [...sent].reverse().find((c) => c.method === 'sendMessage')?.body.text ?? ''

    // The retired plan's promises still hold for the records already out there.
    await say(70, '/start')
    assert.ok(lastText().includes('مدعوم من ZeidexSoft'), 'legacy free records keep their footer')
    for (let i = 0; i < 31; i++) await say(9, `/add L${i} | 10`)
    assert.equal(rec().items.length, 30, 'legacy free records stay capped at 30')
    assert.ok(lastText().includes('الحد 30'), 'the 31st /add explains the legacy cap')
  } finally {
    globalThis.fetch = saved
  }
}


// ── Hosted shops: no licence powers, a provable site link, grounded smart answers ──
{
  b.configCache.clear()
  b.ownerCache.clear()
  const ID = 555000222
  const TOK = `${ID}:` + 'G'.repeat(35)
  const sent = []
  const sitePages = new Map()
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const u = String(url)
    if (u.startsWith('https://api.telegram.org/')) {
      const method = u.split('/').pop()
      const body = init?.body ? JSON.parse(init.body) : {}
      sent.push({ method, body })
      if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'paid_shop_bot', first_name: 'Paid' } })
      return Response.json({ ok: true, result: {} })
    }
    return sitePages.has(u) ? new Response(sitePages.get(u)) : new Response('nope', { status: 404 })
  }
  const aiCalls = []
  env.AI = {
    run: async (model, input) => {
      aiCalls.push({ model, input })
      if (env.__aiFails) throw new Error('AI down')
      return { response: 'نعم، <b>الشحن</b> مجاني.' }
    },
  }
  try {
    await admin('POST', '/admin/bots', { token: TOK, owner_id: 11, plan: 'paid' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const say = (from, text) =>
      b.botWebhook(
        new Request(`https://zeidexsoft.com/tg/${ID}`, {
          method: 'POST',
          headers: { 'x-telegram-bot-api-secret-token': secret },
          body: JSON.stringify({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } }),
        }),
        env,
        String(ID),
      )
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)

    // Licence commands belong to the platform bot: a hosted shop's owner gets nothing.
    sent.length = 0
    for (const cmd of ['/licnew 1 30 1', '/lRevoke a1b2c3d4e5', '/licextend a1b2c3d4e5 30', '/lRelease a1b2c3d4e5'])
      await say(11, cmd)
    assert.equal(texts().length, 0, 'licence commands are silent on a hosted shop')
    assert.ok(![...store.keys()].some((k) => k.startsWith('lic')), 'no licence record is touched')
    await say(11, '/admin')
    assert.ok(!texts().at(-1).includes('/licnew') && texts().at(-1).includes('/site'), 'the panel offers /site, not /licnew')

    // /site: only real https domains — the verify fetch can never be aimed inward.
    for (const bad of ['http://shop.example.com', 'https://127.0.0.1', 'https://localhost', 'https://u:p@shop.example.com', 'https://shop.example.com:8443', 'https://[::1]', 'nonsense'])
      assert.equal(b.parseSite(bad), null, `refused: ${bad}`)
    assert.equal(b.parseSite('https://shop.example.com/ar').hostname, 'shop.example.com')

    await say(11, '/site https://shop.example.com')
    assert.deepEqual(rec().site, { url: 'https://shop.example.com/', verified: false })
    const code = await b.siteCode(env, ID, 'shop.example.com')
    assert.ok(texts().at(-1).includes(code), 'the owner is given the code')
    assert.notEqual(code, await b.siteCode(env, ID, 'other.example.com'), 'a code is bound to its domain')

    await say(11, '/site verify')
    assert.equal(rec().site.verified, false, 'no file, no link')
    sitePages.set('https://shop.example.com/.well-known/zeidex-bot.txt', `${code}\n`)
    await say(11, '/site verify')
    assert.ok(texts().at(-1).includes('نصف دقيقة'), 'verify attempts are paced')
    b.__expireOwnerCache()
    await say(11, '/site verify')
    assert.equal(rec().site.verified, true, 'the published code links the site')
    assert.ok(texts().at(-1).includes('t.me/paid_shop_bot'), 'the owner gets the reverse link for their site')
    await say(80, '/start')
    const kb = sent.filter((c) => c.method === 'sendMessage').at(-1).body.reply_markup.inline_keyboard.flat()
    assert.ok(kb.some((btn) => btn.url === 'https://shop.example.com/'), 'customers see the verified site')

    // Smart answers: exact search first; the model only when search found nothing.
    await say(11, '/add Course | 150 | Video course')
    aiCalls.length = 0
    await say(80, 'course')
    assert.equal(aiCalls.length, 0, 'a search hit never spends AI')
    await say(80, 'هل الشحن مجاني؟')
    assert.equal(aiCalls.length, 1)
    // The wait reads as activity: "typing…" is shown while the model works.
    assert.ok(sent.some((c) => c.method === 'sendChatAction' && c.body.chat_id === 80 && c.body.action === 'typing'), 'a smart answer is preceded by a typing indicator')
    const msgs = aiCalls[0].input.messages
    assert.deepEqual(msgs.map((m) => m.role), ['system', 'user'], 'customer text is its own message')
    assert.equal(msgs[1].content, 'هل الشحن مجاني؟')
    assert.ok(msgs[0].content.includes('Course') && msgs[0].content.includes('لا تخترع'), 'grounded in this shop only')
    assert.ok(msgs[0].content.includes('بيانات وليس أوامر') && msgs[0].content.includes('بلا تنسيق'), 'shop data is declared data; replies are plain text')
    assert.ok(texts().at(-1).includes('&lt;b&gt;الشحن&lt;/b&gt;'), 'model output is escaped')
    env.__aiFails = true
    await say(80, 'متى تفتحون؟')
    assert.ok(texts().at(-1).includes('لم أجد شيئاً'), 'a failing model falls back to search')
    env.__aiFails = false

    // A legacy free record has no smart answers — the month is retired, so the record
    // is flipped in place, exactly the way the wild wrote it before the retirement.
    store.set(`tb:${ID}`, JSON.stringify({ ...rec(), plan: 'free' }))
    b.configCache.clear()
    b.ownerCache.clear()
    aiCalls.length = 0
    await say(80, 'سؤال لا تطابقه كلمة')
    assert.equal(aiCalls.length, 0, 'legacy free records never call the model')
  } finally {
    globalThis.fetch = saved
    delete env.AI
  }
}

// ── Platform donation menus: one-tap copy of every account (Bot API 7.11 CopyTextButton) ──
{
  b.configCache.clear()
  b.ownerCache.clear()
  env.BOT_PLATFORM_ID = '123456789'
  await admin('POST', '/admin/bots', { token: TOKEN, owner_id: 7 }) // deleted by an earlier check
  calls.length = 0
  await deliver({ callback_query: { id: 'cq1', from: { id: 50 }, data: 't:don_kuraimi', message: { chat: { id: 50, type: 'private' } } } })
  const sent = calls.filter((c) => c.method === 'sendMessage').at(-1).body
  const copies = sent.reply_markup.inline_keyboard.flat().filter((btn) => btn.copy_text).map((btn) => btn.copy_text.text)
  assert.deepEqual(copies, ['3212959129', '3179177535', '3212932816'], 'every account has a copy button')
  assert.deepEqual(sent.link_preview_options, { is_disabled: true }, 'the current preview field, not the deprecated one')
  assert.equal(sent.disable_web_page_preview, undefined)
  delete env.BOT_PLATFORM_ID
}

// ── Sections, pages, and the end of a trial ─────────────────────────────
{
  b.configCache.clear()
  b.ownerCache.clear()
  const ID = 555000333
  const TOK = `${ID}:` + 'H'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'sec_shop_bot', first_name: 'Sec' } })
    return Response.json({ ok: true, result: {} })
  }
  try {
    await admin('POST', '/admin/bots', { token: TOK, owner_id: 12, plan: 'trial' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(ID))
    const say = (from, text) => post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } })
    const tap = (from, data) => post({ callback_query: { id: 'q', from: { id: from }, data, message: { chat: { id: from, type: 'private' } } } })
    const last = () => sent.filter((c) => c.method === 'sendMessage').at(-1).body

    // Sections: created on the fly by /add, browsed one at a time by customers.
    await say(12, '/add Chess | 50 | Board game | الألعاب')
    await say(12, '/add Notes | 30 | Notes app | التطبيقات')
    await say(12, '/add Sudoku | 20 | Puzzle | الألعاب')
    assert.deepEqual(rec().sections.map((x) => x.name), ['الألعاب', 'التطبيقات'])
    await tap(80, 't:items')
    const secs = last().reply_markup.inline_keyboard.flat().map((x) => x.text)
    assert.ok(secs.includes('🗂 الألعاب (2)') && secs.includes('🗂 التطبيقات (1)'), 'sections list with counts')
    const games = rec().sections.find((x) => x.name === 'الألعاب').id
    await tap(80, `t:sec:${games}`)
    const inGames = last().reply_markup.inline_keyboard.flat().filter((x) => x.callback_data?.startsWith('t:buy:')).map((x) => x.text)
    assert.deepEqual(inGames, ['⭐️ 50 — Chess', '⭐️ 20 — Sudoku'], 'a section shows only its products')

    // Pages: owner-written, shown in the menu, escaped like everything else.
    await say(12, '/page add من نحن | متجر <b>صغير</b>')
    await say(80, '/start')
    const menuTexts = last().reply_markup.inline_keyboard.flat().map((x) => x.text)
    assert.ok(menuTexts.includes('📄 من نحن'), 'pages appear in the menu')
    await tap(80, 't:page:0')
    assert.ok(last().text.includes('متجر &lt;b&gt;صغير&lt;/b&gt;'), 'page text is escaped')

    // The trial ends: customers see a closed sign, payments are refused, the owner keeps access.
    const lapsedRec = { ...rec(), expires: new Date(Date.now() - 1000).toISOString() }
    store.set(`tb:${ID}`, JSON.stringify(lapsedRec))
    b.configCache.clear()
    b.ownerCache.clear()
    await say(81, '/start')
    assert.ok(last().text.includes('متوقف مؤقتاً'), 'customers get the closed sign')
    sent.length = 0
    const item = rec().items[0]
    await post({ pre_checkout_query: { id: 'pc', from: { id: 81 }, currency: 'XTR', total_amount: item.stars, invoice_payload: `t${ID}:${item.id}` } })
    assert.equal(sent.find((c) => c.method === 'answerPreCheckoutQuery').body.ok, false, 'no sales after the trial')
    await say(12, '/start')
    assert.ok(last().text.includes('انتهت فترة التجربة'), 'the owner is told why, with the upgrade path')

    // /clear sweeps the chat in 100-id batches after a confirmation tap.
    store.set(`tb:${ID}`, JSON.stringify({ ...rec(), expires: new Date(Date.now() + 864e5).toISOString() }))
    b.configCache.clear()
    sent.length = 0
    await post({ callback_query: { id: 'c', from: { id: 90 }, data: 't:clear', message: { message_id: 250, chat: { id: 90, type: 'private' } } } })
    const sweeps = sent.filter((c) => c.method === 'deleteMessages').map((c) => c.body.message_ids)
    assert.ok(sweeps.length && sweeps.every((ids) => ids.length <= 100), 'batches of at most 100')
    assert.deepEqual(sweeps.flat().sort((x, y) => x - y), Array.from({ length: 250 }, (_, i) => i + 1), 'every id down to 1, never 0')
  } finally {
    globalThis.fetch = saved
  }
}
// ── The admin's "take anything, free" console ─────────────────────────
// The store owner can pull any product off their own shelf without paying a single
// Star: a licence product mints a real license, a normal product is confirmed free.
// The whole feature hangs on one guard (isOwner), so these tests prove BOTH sides —
// that the owner gets the free-take buttons everywhere, and that a customer who
// forges the same callback data gets nothing but silence.
{
  b.configCache.clear()
  b.ownerCache.clear()
  const ID = 424242424
  const TOK = `${ID}:` + 'F'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'free_take_bot', first_name: 'Free' } })
    return Response.json({ ok: true, result: {} })
  }
  // A valid Ed25519 seed so a licence claim on the platform bot really mints.
  const pkcs8Der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.alloc(32, 7)])
  const prevSigning = env.LICENSE_SIGNING_KEY
  const prevKid = env.LICENSE_KID
  env.LICENSE_SIGNING_KEY = pkcs8Der.toString('base64url')
  env.LICENSE_KID = 'freetake-test'
  try {
    const OWNER = 7
    await admin('POST', '/admin/bots', { token: TOK, owner_id: OWNER, plan: 'paid' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(ID))
    const say = (from, text) => post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } })
    const tap = (from, data) => post({ callback_query: { id: 'q', from: { id: from }, data, message: { chat: { id: from, type: 'private' } } } })
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)
    const lastKb = () => sent.filter((c) => c.method === 'sendMessage').at(-1).body.reply_markup.inline_keyboard.flat()

    // Seed two products: a normal bot and a Pro-license product (matched by its title).
    await say(OWNER, '/add Smart Store Bot | 1750 | digital store bot')
    await say(OWNER, '/add Pro License | 3500 | lifetime pro license')
    const storeItem = rec().items[0]

    // The /start menu hands the owner the free-take and free-bot buttons.
    await say(OWNER, '/start')
    assert.ok(lastKb().some((b) => b.callback_data === 't:adm_take_any'), 'the owner start menu offers free take')
    assert.ok(lastKb().some((b) => b.callback_data === 't:adm_freebot'), 'the owner start menu offers a free bot')

    // A customer's /start menu has none of them — the buttons are owner-only.
    await say(50, '/start')
    assert.ok(!lastKb().some((b) => b.callback_data === 't:adm_take_any'), 'a customer never sees the free-take button')

    // Tapping a product as the owner offers free take; as a customer it opens a real invoice.
    sent.length = 0
    await tap(OWNER, `t:buy:${storeItem.id}`)
    assert.ok(lastKb().some((b) => b.callback_data === `t:adm_claim:${storeItem.id}`), 'the owner buy screen offers the free claim')
    assert.ok(!sent.some((c) => c.method === 'sendInvoice'), 'the owner is never sent an invoice')
    await tap(50, `t:buy:${storeItem.id}`)
    assert.ok(sent.some((c) => c.method === 'sendInvoice'), 'a customer tapping buy gets a Stars invoice')

    // The free-take console lists every product at ⭐️ 0 and the free-bot / free-licence doors.
    sent.length = 0
    await tap(OWNER, 't:adm_take_any')
    const takeRows = lastKb().filter((b) => b.callback_data?.startsWith('t:adm_claim:'))
    assert.equal(takeRows.length, 2, 'every product is offered for free take')
    assert.ok(takeRows.every((b) => b.text.includes('⭐️ 0')), 'each offer is priced at zero')
    assert.ok(lastKb().some((b) => b.callback_data === 't:adm_freebot'), 'the console offers a free bot too')

    // Claiming a normal product: confirmed free, no invoice, nothing charged.
    sent.length = 0
    await tap(OWNER, `t:adm_claim:${storeItem.id}`)
    assert.ok(texts().at(-1).includes('⭐️ 0'), 'the claim is confirmed at zero cost')
    assert.ok(texts().at(-1).includes('بدون أي دفع'), 'and explicitly without payment')
    assert.ok(!sent.some((c) => c.method === 'sendInvoice'), 'claiming sends no invoice')

    // A customer who forges the same claim callback gets nothing — the isOwner guard holds.
    sent.length = 0
    await tap(50, `t:adm_claim:${storeItem.id}`)
    await tap(50, 't:adm_take_any')
    assert.equal(texts().length, 0, 'a forged free-take callback is silently refused')
  } finally {
    globalThis.fetch = saved
    env.LICENSE_SIGNING_KEY = prevSigning
    env.LICENSE_KID = prevKid
  }
}
// ── Auto-delivery: /deliver sets it, payment hands it over, absent falls back ──
// The store's whole promise is "pay and you get it". This proves the owner can arm a
// product three ways (a code, a forwarded file, or clear it) and that a buyer who pays
// for an armed product receives the content in the same update — and, when nothing is
// armed, gets the honest "the owner will contact you" instead of silence.
{
  b.configCache.clear()
  b.ownerCache.clear()
  const ID = 515151515
  const TOK = `${ID}:` + 'D'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'deliver_bot', first_name: 'D' } })
    return Response.json({ ok: true, result: {} })
  }
  try {
    const OWNER = 7
    await admin('POST', '/admin/bots', { token: TOK, owner_id: OWNER, plan: 'paid' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(ID))
    const say = (from, text, extra = {}) =>
      post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text, ...extra } })
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)
    const lastText = () => texts().at(-1)

    // Arm product #1 with a secret code via /deliver <n> <code>.
    await say(OWNER, '/add Course | 200 | video course')
    await say(OWNER, '/deliver 1 SECRET-LINK-abc123')
    assert.equal(rec().items[0].deliver.text, 'SECRET-LINK-abc123', '/deliver <n> <code> stores the secret text')

    // A forwarded file (reply) arms the same product's file delivery by file_id.
    sent.length = 0
    await say(OWNER, '/deliver 1', {
      reply_to_message: { document: { file_id: 'AgADBAADfileid', file_name: 'course.zip' } },
    })
    assert.deepEqual(rec().items[0].deliver.file, { id: 'AgADBAADfileid', type: 'document' }, 'replying to a file stores its file_id')
    assert.ok(lastText().includes('الملف'), 'the owner is told the file will be auto-sent')

    // The largest photo is chosen when several sizes arrive.
    sent.length = 0
    await say(OWNER, '/deliver 1', {
      reply_to_message: { photo: [{ file_id: 'small' }, { file_id: 'largest' }] },
    })
    assert.deepEqual(rec().items[0].deliver.file, { id: 'largest', type: 'photo' }, 'the largest photo size is kept')

    // A bad product number returns usage, changes nothing.
    sent.length = 0
    const before = JSON.stringify(rec().items[0].deliver)
    await say(OWNER, '/deliver 99 oops')
    assert.ok(lastText().includes('الاستخدام'), 'a non-existent product number shows usage')
    assert.equal(JSON.stringify(rec().items[0].deliver), before, 'nothing is written for a bad number')

    // A buyer pays for the armed product: they get the file AND the text, same update.
    const armed = rec().items[0]
    sent.length = 0
    await post({
      message: {
        chat: { id: 60, type: 'private' },
        from: { id: 60, first_name: 'Buyer' },
        message_id: 901,
        successful_payment: { total_amount: armed.stars, currency: 'XTR', invoice_payload: `t${ID}:${armed.id}` },
      },
    })
    const deliveredPhoto = sent.find((c) => c.method === 'sendPhoto')
    assert.ok(deliveredPhoto, 'the armed file is auto-sent to the buyer')
    assert.equal(deliveredPhoto.body.photo, 'largest', 'the stored file_id is delivered')
    assert.ok(texts().some((t) => t.includes('تسليم تلقائي فوري')), 'the buyer is told delivery was automatic')
    // The owner is notified of the paid order, by product name.
    const ownerNote = texts().find((t) => t.includes('طلب مدفوع') && t.includes('Course'))
    assert.ok(ownerNote, 'the owner is notified of the paid order with the product name')
    // The buyer's own payment message gets 🎉 — a paid order ends on a celebration.
    assert.ok(sent.some((c) => c.method === 'setMessageReaction' && c.body.chat_id === 60 && c.body.reaction?.[0]?.emoji === '🎉'), 'the buyer\'s payment message gets a 🎉 reaction')

    // Clear delivery with /deliver <n> -: the next buyer falls back to manual delivery.
    sent.length = 0
    await say(OWNER, '/deliver 1 -')
    assert.equal(rec().items[0].deliver, undefined, '/deliver <n> - clears auto-delivery')
    assert.ok(lastText().includes('أُلغي التسليم'), 'the owner is told delivery was cleared')

    // Pay again: no file this time, only the honest "owner will contact you" line.
    const nowManual = rec().items[0]
    sent.length = 0
    await post({
      message: {
        chat: { id: 61, type: 'private' },
        from: { id: 61, first_name: 'Buyer2' },
        successful_payment: { total_amount: nowManual.stars, currency: 'XTR', invoice_payload: `t${ID}:${nowManual.id}` },
      },
    })
    assert.ok(!sent.some((c) => c.method === 'sendPhoto'), 'no file is sent when delivery is cleared')
    assert.ok(texts().some((t) => t.includes('سيتواصل معك المالك')), 'the buyer is told the owner will follow up')

    // ── التسليم برابط قناة: t.me/c/<id>/<msg> يُنسخ لكل مشترٍ ──────────
    // تطبيق بـ524MB لا يُرفع عبر البوت (حدّ 50MB): المصدر يبقى القناة ويتنسّخ.
    sent.length = 0
    await say(OWNER, '/deliver 1 https://t.me/c/4308164857/7')
    assert.deepEqual(rec().items[0].deliver?.copyFrom, { chat: -1004308164857, message: 7 }, 'the channel link is stored as the delivery source')
    const probe = sent.find((c) => c.method === 'copyMessage')
    assert.ok(probe, 'the owner gets a probe copy to confirm the file is right')
    assert.deepEqual(probe.body, { chat_id: OWNER, from_chat_id: -1004308164857, message_id: 7 })

    // رابط بصيغة أخرى (ناقص/خاطئ) لا يُقبل كمصدر
    sent.length = 0
    await say(OWNER, '/deliver 1 https://t.me/c/notanumber/3')
    assert.equal(rec().items[0].deliver?.copyFrom.message, 7, 'a malformed link never overwrites the source')

    // The buyer pays: the file arrives COPIED from the channel, no upload involved.
    const channelled = rec().items[0]
    sent.length = 0
    await post({
      message: {
        chat: { id: 63, type: 'private' },
        from: { id: 63, first_name: 'ChannelBuyer' },
        message_id: 902,
        successful_payment: { total_amount: channelled.stars, currency: 'XTR', invoice_payload: `t${ID}:${channelled.id}` },
      },
    })
    const copied = sent.find((c) => c.method === 'copyMessage')
    assert.ok(copied, 'the buyer receives the file copied from the channel')
    assert.equal(copied.body.chat_id, 63, 'the copy lands in the buyer’s chat')
    assert.equal(copied.body.from_chat_id, -1004308164857)
    assert.equal(copied.body.message_id, 7)
    assert.ok(texts().some((t) => t.includes('تم الاستلام تلقائياً')), 'the buyer is told delivery was automatic')
    const ownerNote2 = texts().find((t) => t.includes('طلب مدفوع'))
    assert.ok(ownerNote2, 'the owner is still notified of the paid order')

    // A donation still thanks the buyer and never touches product delivery.
    sent.length = 0
    await post({
      message: {
        chat: { id: 62, type: 'private' },
        from: { id: 62, first_name: 'Fan' },
        successful_payment: { total_amount: 50, currency: 'XTR', invoice_payload: `t${ID}:don:50` },
      },
    })
    assert.ok(texts().some((t) => t.includes('شكراً لتبرعك')), 'a donation is thanked, not delivered')
    assert.ok(!sent.some((c) => c.method === 'sendPhoto' || c.method === 'sendDocument'), 'a donation sends no product')
  } finally {
    globalThis.fetch = saved
  }
}



// ── On the platform bot, a free-take of a licence product really mints ──
// The hosted-bot check above proves the confirmation text; this one proves the
// licence is real: claiming a license-titled product on the platform bot writes
// the same records the activation API reads — perpetual, 2 seats, key shown once.
{
  b.configCache.clear()
  b.ownerCache.clear()
  const ID = 123456789
  const TOK = `${ID}:` + 'A'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'platform_bot', first_name: 'Platform' } })
    return Response.json({ ok: true, result: {} })
  }
  const pkcs8Der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.alloc(32, 7)])
  const prevSigning = env.LICENSE_SIGNING_KEY
  const prevKid = env.LICENSE_KID
  const prevPlatform = env.BOT_PLATFORM_ID
  env.LICENSE_SIGNING_KEY = pkcs8Der.toString('base64url')
  env.LICENSE_KID = 'freetake-platform-test'
  env.BOT_PLATFORM_ID = String(ID)
  try {
    const OWNER = 7
    await admin('POST', '/admin/bots', { token: TOK, owner_id: OWNER, plan: 'paid' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(ID))
    const say = (from, text) => post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } })
    const tap = (from, data) => post({ callback_query: { id: 'q', from: { id: from }, data, message: { chat: { id: from, type: 'private' } } } })
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)
    const licCount = () => [...store.keys()].filter((k) => k.startsWith('licid:')).length

    // Seed a license-titled product.
    await say(OWNER, '/add Pro License | 3500 | lifetime pro license')
    const plic = rec().items[0]

    // Claiming it via the take-any console mints a real, perpetual, 2-seat license.
    const before = licCount()
    sent.length = 0
    await tap(OWNER, `t:adm_claim:${plic.id}`)
    const claimText = texts().at(-1)
    assert.match(claimText, /[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){3}-[0-9A-HJKMNP-TV-Z]{2}/, 'a formatted license key is delivered')
    assert.ok(claimText.includes('مجاناً'), 'the license claim is stated free')
    const id = claimText.match(/رقم الترخيص: <code>([0-9a-f]{10})<\/code>/)[1]
    const kh = store.get(`licid:${id}`)
    assert.equal(typeof kh, 'string', 'the minted license id resolves to a stored record')
    const rec2 = JSON.parse(store.get(`lic:${kh}`))
    assert.equal(rec2.seats, 2, 'the free admin license carries 2 seats')
    assert.equal(rec2.exp, 0, 'the free admin license is perpetual')
    assert.equal(licCount(), before + 1, 'exactly one new license was minted')

    // The standalone free-licence door mints another one, no product needed.
    sent.length = 0
    await tap(OWNER, 't:adm_free_lic')
    assert.match(texts().at(-1), /[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){3}-[0-9A-HJKMNP-TV-Z]{2}/, 'the free-licence door delivers a key')
    assert.ok(!sent.some((c) => c.method === 'sendInvoice'), 'and charges nothing')
  } finally {
    globalThis.fetch = saved
    env.LICENSE_SIGNING_KEY = prevSigning
    env.LICENSE_KID = prevKid
    delete env.BOT_PLATFORM_ID
  }
}




// ── The product card: rich items get a detail card before the invoice ──────
// A catalogue product carries features + a USD price; tapping it used to fire a bare
// Stars invoice with none of that context. Now such an item shows a product card with a
// dedicated "buy now" button (t:pay), and only that button sends the invoice. Simple
// owner-added items (no features) keep the original one-tap buy, so nothing regresses.
{
  // The card renderer is pure and exported, so it is checked directly first.
  const card = b.productCard({ id: 1, title: 'Smart <Store>', stars: 1750, desc: 'a store', features: ['one', 'two'], usd: 24.5, after: ['step one', 'step two'] })
  assert.ok(card.includes('Smart &lt;Store&gt;'), 'the title is HTML-escaped')
  assert.ok(card.includes('▫️ one') && card.includes('▫️ two'), 'features are listed')
  assert.ok(card.includes('1750') && card.includes('$24.5'), 'both Stars and USD price are shown')
  assert.ok(card.includes('ما بعد الشراء') && card.includes('1️⃣ step one') && card.includes('2️⃣ step two'), 'the card lists the post-purchase steps')

  b.configCache.clear()
  b.ownerCache.clear()
  const ID = 565656565
  const TOK = `${ID}:` + 'G'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'card_bot', first_name: 'Card' } })
    return Response.json({ ok: true, result: {} })
  }
  try {
    const OWNER = 7
    await admin('POST', '/admin/bots', { token: TOK, owner_id: OWNER, plan: 'paid' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(ID))
    const say = (from, text) => post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } })
    const tap = (from, data) => post({ callback_query: { id: 'q', from: { id: from }, data, message: { chat: { id: from, type: 'private' } } } })
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)
    const lastKb = () => sent.filter((c) => c.method === 'sendMessage').at(-1).body.reply_markup.inline_keyboard.flat()

    // A rich item (features + usd) — this is what generate-payload.mjs now writes.
    await say(OWNER, '/add Rich Bot | 1750 | a digital store')
    const rich = rec().items[0]
    // A simple item (title/desc/stars only) — the classic owner-added product.
    await say(OWNER, '/add Simple Bot | 900 | plain product')
    const simple = rec().items[1]
    // Give the rich item its catalog detail the way the platform payload would.
    const withFeatures = { ...rec(), items: [{ ...rec().items[0], features: ['حتى 50 منتجاً', 'تسليم تلقائي'], usd: 24.5 }, rec().items[1]] }
    store.set(`tb:${ID}`, JSON.stringify(withFeatures))
    b.configCache.clear()

    // A customer tapping the RICH item sees a card + a buy button, NOT an invoice yet.
    sent.length = 0
    await tap(60, `t:buy:${rich.id}`)
    assert.ok(!sent.some((c) => c.method === 'sendInvoice'), 'the rich item does not fire the invoice directly')
    assert.ok(texts().at(-1).includes('المميزات') && texts().at(-1).includes('▫️ حتى 50 منتجاً'), 'the card shows the features')
    assert.ok(texts().at(-1).includes('$24.5'), 'the card shows the USD price')
    assert.ok(lastKb().some((btn) => btn.callback_data === `t:pay:${rich.id}`), 'the card offers a dedicated buy button')

    // Tapping that buy button (t:pay) sends the real invoice at the right price/payload.
    sent.length = 0
    await tap(60, `t:pay:${rich.id}`)
    const inv = sent.find((c) => c.method === 'sendInvoice')
    assert.ok(inv, 'the buy button sends the Stars invoice')
    assert.equal(inv.body.prices[0].amount, 1750, 'the invoice charges the item price')
    assert.equal(inv.body.payload, `t${ID}:${rich.id}`, 'the invoice payload still points at the item')

    // A customer tapping the SIMPLE item keeps the original one-tap invoice (no regression).
    sent.length = 0
    await tap(60, `t:buy:${simple.id}`)
    assert.ok(sent.some((c) => c.method === 'sendInvoice'), 'a simple item is still one-tap buy')

    // The owner tapping the rich item still gets the free-take screen, never a card-for-payment.
    sent.length = 0
    await tap(OWNER, `t:buy:${rich.id}`)
    assert.ok(lastKb().some((btn) => btn.callback_data === `t:adm_claim:${rich.id}`), 'the owner still gets the free claim on a rich item')
    assert.ok(!sent.some((c) => c.method === 'sendInvoice'), 'and no invoice is sent to the owner')

    // A paid item with post-purchase "after" steps but no auto-delivery: the buyer is shown the
    // steps immediately after checkout, instead of a bare "the owner will contact you".
    const withAfter = { ...rec(), items: [{ ...rec().items[0], features: undefined, usd: undefined, after: ['تجيب توكن بوتك', 'نرسله هنا', 'نشغّله فوراً'] }, rec().items[1]] }
    store.set(`tb:${ID}`, JSON.stringify(withAfter))
    b.configCache.clear()
    sent.length = 0
    await post({ message: { chat: { id: 60, type: 'private' }, from: { id: 60, first_name: 'Buyer' }, successful_payment: { invoice_payload: `t${ID}:${rich.id}`, total_amount: 1750, currency: 'XTR' } } })
    const paid = texts().find((t) => t.includes('تم الدفع'))
    assert.ok(paid, 'the buyer is told the payment succeeded')
    assert.ok(paid.includes('1️⃣ تجيب توكن بوتك') && paid.includes('2️⃣ نرسله هنا'), 'the post-purchase steps are shown after checkout')
    assert.ok(paid.includes('سيتواصل معك المالك'), 'and the owner-contact note is still there when there is no auto-delivery')
  } finally {
    globalThis.fetch = saved
  }
}

// ── The private storage channel and the admin's /send ──────────────────────
// A closed channel the owner runs with the bot as an admin: every file posted
// there is indexed (cfg.files) and re-sendable by file_id on the owner's
// command. The owner can also hand the bot a file directly in private chat.
// Everything below runs against a fresh bot so the record starts clean.
{
  const ID = 676767676
  const TOK = `${ID}:` + 'F'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'files_bot', first_name: 'Files' } })
    // A send to chat 99 fails: the stub's stand-in for a user who never started the bot.
    if (method === 'sendDocument' && body.chat_id === 99) return Response.json({ ok: false, description: 'bad request: chat not found' })
    return Response.json({ ok: true, result: {} })
  }
  try {
    const OWNER = 7
    await admin('POST', '/admin/bots', { token: TOK, owner_id: OWNER, plan: 'paid' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(ID))
    // Every owner message gets a message_id, so reaction assertions can pin the exact
    // command message a 👍 lands on.
    let mid = 0
    const say = (from, text, reply) => post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, message_id: ++mid, ...(reply ? { reply_to_message: reply } : {}), text } })
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)
    const CH = -1002002002
    const CHANNEL = { id: CH, type: 'channel', title: 'Zeidex Files' }

    // Provisioning asks for channel_post too — the storage channel is dead
    // without it, and the webhook simply never hears a file being posted.
    assert.deepEqual(sent.find((c) => c.method === 'setWebhook').body.allowed_updates,
      ['message', 'callback_query', 'pre_checkout_query', 'channel_post'],
      'the webhook must subscribe to channel_post for the storage channel')

    // The very first channel post captures the channel — the owner never types an id.
    await post({ channel_post: { chat: CHANNEL, message_id: 11, document: { file_id: 'DOCAAA', file_name: 'bot.zip' }, caption: 'بوت المتجر الذكي' } })
    assert.equal(rec().filesChannel.id, CH, 'the first channel post captures the storage channel')
    assert.equal(rec().filesChannel.title, 'Zeidex Files')
    assert.equal(rec().files.length, 1, 'the posted document is indexed')
    assert.equal(rec().files[0].title, 'بوت المتجر الذكي', 'the caption names the file')
    assert.equal(rec().files[0].file_id, 'DOCAAA')
    assert.ok(texts().some((t) => t.includes('خُزّن الملف رقم')), 'the owner is told the number to /send')

    // A second file: no caption, so the file name names it. Numbers keep growing.
    await post({ channel_post: { chat: CHANNEL, message_id: 12, document: { file_id: 'DOCBBB', file_name: 'app.apk' } } })
    assert.equal(rec().files.length, 2)
    assert.equal(rec().files[1].title, 'app.apk', 'the file name is the fallback title')

    // A channel the bot is admin in but is NOT the storage channel: never mixed in.
    await post({ channel_post: { chat: { id: -1009999999, type: 'channel', title: 'Other' }, message_id: 13, document: { file_id: 'DOCXXX', file_name: 'other.zip' } } })
    assert.equal(rec().files.length, 2, 'a second channel must not feed this bot\'s storage')

    // A plain text post in the storage channel: nothing to index, no error.
    await post({ channel_post: { chat: CHANNEL, message_id: 14, text: 'ملاحظة فقط' } })
    assert.equal(rec().files.length, 2, 'a text post is not a file')

    // The owner can also hand the bot a file directly in private chat — same index,
    // and the largest photo of a set is the one kept.
    sent.length = 0
    await post({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER }, photo: [{ file_id: 'SMALL' }, { file_id: 'PHOTOBIG' }], caption: 'لقطة' } })
    assert.equal(rec().files.length, 3, 'an owner\'s direct file joins the index')
    assert.equal(rec().files[2].type, 'photo')
    assert.equal(rec().files[2].file_id, 'PHOTOBIG', 'the largest photo is the stored one')

    // /files lists the storage with the channel it belongs to.
    sent.length = 0
    await say(OWNER, '/files')
    const list = texts().at(-1)
    assert.ok(list.includes('3/200') && list.includes('Zeidex Files'), '/files shows the count and the channel')
    assert.ok(list.includes('1. بوت المتجر الذكي') && list.includes('2. app.apk'), '/files numbers every stored file')

    // The admin hands a stored file to a person: /send <uid> <file#>.
    sent.length = 0
    await say(OWNER, '/send 50 1')
    const fwd = sent.find((c) => c.method === 'sendDocument')
    assert.ok(fwd, '/send re-sends the file')
    assert.equal(fwd.body.chat_id, 50, 'to the person the admin named')
    assert.equal(fwd.body.document, 'DOCAAA', 'by its stored file_id')
    assert.ok(texts().some((t) => t.includes('أُرسل «بوت المتجر الذكي» إلى <code>50</code>')), 'the admin gets a confirmation')
    assert.ok(sent.some((c) => c.method === 'setMessageReaction' && c.body.chat_id === OWNER && c.body.reaction?.[0]?.emoji === '👍'), 'a successful /send reacts 👍 on the owner\'s command')

    // A failed send (the stub answers ok:false for sendDocument) is reported, not swallowed.
    sent.length = 0
    await say(OWNER, '/send 99 1')
    assert.ok(!texts().some((t) => t.includes('✅ أُرسل')), 'a failed send is not confirmed')
    assert.ok(texts().some((t) => t.includes('تعذّر الإرسال إلى')), 'the admin sees the failure')

    // Replying to any file with /send <uid> sends that file, indexed or not.
    sent.length = 0
    await say(OWNER, '/send 50', { chat: { id: OWNER, type: 'private' }, from: { id: OWNER }, video: { file_id: 'VIDNEW' }, caption: 'فيديو مشترك' })
    assert.equal(sent.find((c) => c.method === 'sendVideo').body.chat_id, 50, 'a replied-to file wins over the index')
    assert.equal(rec().files.length, 3, 'and sending it does not add it to the index')

    // /send without a usable target is usage, not an error.
    sent.length = 0
    await say(OWNER, '/send')
    assert.ok(texts().at(-1).includes('/send رقم_الشخص رقم_الملف'), 'a bare /send is answered with usage')

    // /filedel removes an index entry; the numbering closes the gap.
    await say(OWNER, '/filedel 2')
    assert.equal(rec().files.length, 2)
    assert.equal(rec().files[1].title, 'لقطة', 'the numbering closes the gap')
    await say(OWNER, '/filedel 9')
    assert.ok(texts().at(-1).includes('الاستخدام'), 'an out-of-range delete is usage, not a crash')

    // A customer never reaches any of it: storage commands are owner-only.
    sent.length = 0
    await say(50, '/send 50 1')
    await say(50, '/files')
    assert.equal(sent.length, 0, 'storage commands are owner-only')
  } finally {
    globalThis.fetch = saved
  }
}

// ── Trials: the full store for 7 days, provisioned on the second host ────
// The second host is the G53208084@gmail.com account's workers.dev deployment
// (TRIAL_ORIGIN): a trial bot's webhook is registered there, never on the primary.
{
  b.configCache.clear()
  b.ownerCache.clear()
  const PLAT = 999111222
  const TRIAL = 999111333
  const platToken = `${PLAT}:` + 'C'.repeat(35)
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    const id = Number(String(url).match(/\/bot(\d+):/)?.[1] ?? 0)
    if (method === 'getMe') return Response.json({ ok: true, result: { id: id || PLAT, username: `bot_${id || PLAT}`, first_name: 'Bot' } })
    return Response.json({ ok: true, result: {} })
  }
  const prevPlatform = env.BOT_PLATFORM_ID
  const prevOrigin = env.TRIAL_ORIGIN
  env.BOT_PLATFORM_ID = String(PLAT)
  env.TRIAL_ORIGIN = 'https://zeidex-bots.g53208084.workers.dev'
  try {
    const OWNER = 700777 // fresh: the self-serve cap counts bots per owner id
    await admin('POST', '/admin/bots', { token: platToken, owner_id: OWNER, plan: 'paid' })
    const secret = JSON.parse(store.get(`tb:${PLAT}`)).secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${PLAT}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(PLAT))
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)

    // /trial without a token shows the way in, not a wall.
    sent.length = 0
    await post({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'X' }, text: '/trial' } })
    assert.ok(texts().at(-1).includes('/trial التوكن'), 'bare /trial explains the token step')

    // The retired flow's surfaces all land on the same single onboarding.
    sent.length = 0
    await post({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'X' }, text: '/freebot' } })
    assert.ok(texts().at(-1).includes('تجربة مجانية كاملة'), '/freebot is an alias for the trial onboarding')
    await post({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'X' }, text: '/start trial' } })
    assert.ok(texts().at(-1).includes('تجربة مجانية كاملة'), 'the web store trial card (?start=trial) lands on the onboarding')

    // The owner's /trial <token> provisions the trial on the second host.
    sent.length = 0
    await post({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'X' }, text: `/trial ${TRIAL}:` + 'D'.repeat(35) } })
    const tcfg = JSON.parse(store.get(`tb:${TRIAL}`))
    assert.equal(tcfg.plan, 'trial', 'the provisioned bot is on the trial plan')
    assert.equal(tcfg.owner, OWNER)
    const left = (Date.parse(tcfg.expires) - Date.now()) / 864e5
    assert.ok(left > 6.99 && left <= 7, 'the trial window is 7 days, once')
    const hook = sent.find((c) => c.method === 'setWebhook')
    assert.equal(hook.body.url, `${env.TRIAL_ORIGIN}/tg/${TRIAL}`, 'the trial webhook is registered on the second host')
    assert.ok(texts().at(-1).includes('تجربتك الكاملة جاهزة'), 'the owner sees the trial is live')

    // A stale trial record re-registers on the second host, never the primary.
    const rawT = JSON.parse(store.get(`tb:${TRIAL}`))
    delete rawT.hook
    store.set(`tb:${TRIAL}`, JSON.stringify(rawT))
    b.configCache.clear()
    sent.length = 0
    await b.botWebhook(
      new Request(`https://zeidexsoft.com/tg/${TRIAL}`, {
        method: 'POST',
        headers: { 'x-telegram-bot-api-secret-token': rawT.secret },
        body: JSON.stringify({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'X' }, text: '/start' } }),
      }),
      env,
      String(TRIAL),
    )
    const tsync = sent.find((c) => c.method === 'setWebhook')
    assert.equal(tsync.body.url, `${env.TRIAL_ORIGIN}/tg/${TRIAL}`, 'a healed trial stays on the second host')
  } finally {
    globalThis.fetch = saved
    env.BOT_PLATFORM_ID = prevPlatform
    if (prevOrigin === undefined) delete env.TRIAL_ORIGIN
    else env.TRIAL_ORIGIN = prevOrigin
  }
}

// ── The interactive panel: tap a view, answer the step, done ──────────────
{
  b.configCache.clear()
  b.ownerCache.clear()
  const ID = 777000111
  const sent = []
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const method = String(url).split('/').pop()
    const body = init?.body ? JSON.parse(init.body) : {}
    sent.push({ method, body })
    if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'panel_bot', first_name: 'Panel' } })
    return Response.json({ ok: true, result: {} })
  }
  try {
    const OWNER = 7
    await admin('POST', '/admin/bots', { token: `${ID}:` + 'H'.repeat(35), owner_id: OWNER, plan: 'paid' })
    const rec = () => JSON.parse(store.get(`tb:${ID}`))
    const secret = rec().secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(ID))
    const say = (from, text) => post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'X' }, text } })
    const tap = (from, data) => post({ callback_query: { id: 'q', from: { id: from }, data, message: { chat: { id: from, type: 'private' } } } })
    const texts = () => sent.filter((c) => c.method === 'sendMessage').map((c) => c.body.text)

    // /panel is the owner's root view; a customer never sees it.
    sent.length = 0
    await say(OWNER, '/panel')
    assert.ok(texts().at(-1).includes('لوحة التحكم التفاعلية'), 'the panel root opens on /panel')
    sent.length = 0
    await say(50, '/panel')
    assert.equal(sent.length, 0, '/panel is owner-only')

    // A stale panel button pressed by anyone but the owner gets silence, not powers.
    sent.length = 0
    await tap(50, 'h:items')
    assert.equal(texts().length, 0, 'panel callbacks are owner-only')

    // The add-item step: the owner's next plain message answers it.
    sent.length = 0
    await tap(OWNER, 'h:additem')
    assert.equal(rec().pending.op, 'item', 'the panel waits for the product line')
    await say(OWNER, 'لوحة منتج | 30 | وصف اللوحة')
    const cfg1 = rec()
    assert.ok(!cfg1.pending, 'one answer consumes the step')
    assert.equal(cfg1.items.at(-1).title, 'لوحة منتج')
    assert.equal(cfg1.items.at(-1).stars, 30)

    // A malformed answer keeps the step open instead of silently eating it.
    await tap(OWNER, 'h:additem')
    await say(OWNER, 'بدون أسعار')
    assert.equal(rec().pending.op, 'item', 'a malformed answer keeps the step open')
    assert.ok(texts().at(-1).includes('الاسم | السعر'), 'and repeats the format')
    await say(OWNER, '/cancel')
    assert.ok(!rec().pending, '/cancel closes the open step')

    // An expired step never eats a later message.
    const raw = rec()
    raw.pending = { op: 'item', at: Date.now() - 11 * 60_000 }
    store.set(`tb:${ID}`, JSON.stringify(raw))
    b.configCache.clear()
    await say(OWNER, 'رسالة متأخرة | 5 | لا شيء')
    assert.ok(!rec().pending, 'an expired step is dropped')
    assert.equal(rec().items.length, 1, 'a late message is not an answer')

    // The FAQ step answers the same way.
    await tap(OWNER, 'h:addfaq')
    assert.equal(rec().pending.op, 'faq')
    await say(OWNER, 'كيف الدفع؟ | بنجوم تيليجرام')
    assert.ok(!rec().pending, 'the faq step closes on its answer')
    assert.equal(rec().faqs.at(-1).q, 'كيف الدفع؟')

    // The deliver step is aimed at its product: answer, then clear with '-'.
    const it = rec().items[0]
    await tap(OWNER, `h:itdlv:${it.id}`)
    assert.equal(rec().pending.op, 'deliver', 'the deliver step names its op')
    assert.equal(rec().pending.target, it.id, 'and its product')
    await say(OWNER, 'CODE-123')
    assert.equal(rec().items[0].deliver.text, 'CODE-123', 'the answer becomes the auto-delivery')
    await tap(OWNER, `h:itdlv:${it.id}`)
    await say(OWNER, '-')
    assert.ok(!rec().items[0].deliver, "a '-' clears the auto-delivery")

    // Pause and resume are one toggle.
    await tap(OWNER, 'h:pause')
    assert.equal(rec().paused, true, 'a tap pauses the bot')
    await tap(OWNER, 'h:pause')
    assert.equal(rec().paused, false, 'a second tap resumes it')

    // Deleting a product from the list view keeps the rest.
    await tap(OWNER, 'h:additem')
    await say(OWNER, 'مؤقت | 10 | سيُحذف')
    const gone = rec().items.at(-1)
    await tap(OWNER, `h:itdel:${gone.id}`)
    assert.ok(!rec().items.some((i) => i.id === gone.id), 'the item is gone')
    assert.equal(rec().items.length, 1, 'and only that one')

    // A bot provisioned before channel_post joined allowed_updates never hears channel
    // posts — its first update after the bump re-registers its webhook once.
    const heal = () => {
      const raw = rec()
      delete raw.hook // an old record: made before the revision existed
      store.set(`tb:${ID}`, JSON.stringify(raw))
      b.configCache.clear()
    }
    heal()
    sent.length = 0
    await say(50, '/start') // even a customer's message heals it
    const sync = sent.filter((c) => c.method === 'setWebhook').pop()
    assert.ok(sync, 'a stale record re-registers its webhook')
    assert.deepEqual(
      sync.body.allowed_updates,
      ['message', 'callback_query', 'pre_checkout_query', 'channel_post'],
      'with channel_post delivered at last',
    )
    assert.equal(sync.body.drop_pending_updates, false, 'a live bot keeps its pending updates')
    assert.equal(sync.body.url, `https://zeidexsoft.com/tg/${ID}`, 'on the same primary host')
    assert.equal(rec().hook, 2, 'and stamps its record so it never repeats')
    sent.length = 0
    await say(50, '/start')
    assert.ok(!sent.some((c) => c.method === 'setWebhook'), 'a healed record does not re-register again')
  } finally {
    globalThis.fetch = saved
  }
}

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
  // A product the bot cannot sell yet is marked `soon` and must carry NO invoice: three such
  // products once shipped with made-up links shaped exactly like real ones, so the shape
  // check below passed while every tap on "buy" failed.
  for (const p of cat.products.filter((x) => x.soon)) assert.equal(p.invoice, undefined, `${p.sku}: a soon product cannot be sold`)
  for (const p of cat.products.filter((x) => !x.soon)) {
    assert.ok(p.invoice, `${p.sku}: missing its Stars invoice`)
    assert.match(p.invoice, /^https:\/\/t\.me\/\$[A-Za-z0-9_-]{16,64}$/,
      `${p.sku}: invoice must be a t.me/$<code> deep link, got "${p.invoice}"`)
  }

  // An invoice is minted WITH a payload `t<botId>:<itemId>`; the payment handler
  // delivers whatever item that id names. A later re-ordering of the catalogue
  // shifts item ids, and every minted link silently starts buying the wrong
  // product — the shape check above still passes, so this is the only guard.
  // `invoice_item` records the id the link was minted against and must match
  // the current payload exactly.
  const payload = JSON.parse(readFileSync(new URL('../payload.json', import.meta.url), 'utf8'))
  const itemsById = new Map(payload.items.map((i) => [i.sku, i.id]))
  for (const p of cat.products.filter((x) => x.invoice_item !== undefined)) {
    assert.equal(itemsById.get(p.sku), p.invoice_item,
      `${p.sku}: invoice was minted for item ${p.invoice_item} but the payload now numbers it ${itemsById.get(p.sku)} — re-mint with scripts/mint-invoices.mjs`)
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

// ── The three "coming soon" products, made real: the CRM, the automation engine, WhatsApp ──
{
  b.configCache.clear()
  b.ownerCache.clear()
  const OWNER = 77
  const ID = 555000777
  const ID2 = 555000444
  const OTHER = 555000555
  const TOK = `${ID}:` + 'H'.repeat(35)
  const TOK2 = `${ID2}:` + 'J'.repeat(35)
  const events = [] // automation events the owner's platform received
  const graph = [] // WhatsApp Graph API calls
  const sent = [] // Telegram calls
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const u = String(url)
    if (u === 'https://n8n.example/hook') {
      events.push({ sig: init?.headers?.['x-zeidex-signature'], body: JSON.parse(init.body) })
      return Response.json({ ok: true })
    }
    if (u.startsWith('https://graph.facebook.com/')) {
      graph.push({ path: u, auth: init?.headers?.authorization, body: init?.body ? JSON.parse(init.body) : null })
      return Response.json(init?.method === 'POST' ? { messages: [{ id: 'wamid.1' }] } : { display_phone_number: '+967 77 000 000', quality_rating: 'GREEN' })
    }
    if (u.startsWith('https://api.telegram.org/')) {
      const method = u.split('/').pop()
      const body = init?.body ? JSON.parse(init.body) : {}
      sent.push({ method, body })
      if (method === 'getMe') {
        const tok = u.slice('https://api.telegram.org/bot'.length, u.lastIndexOf('/'))
        const id = Number(tok.split(':')[0])
        return Response.json({ ok: true, result: { id, username: `bot_${id}`, first_name: 'B' } })
      }
      return Response.json({ ok: true, result: {} })
    }
    return Response.json({ ok: true, result: {} })
  }
  try {
    // Two bots for one owner — the CRM's raw material; a third for someone else.
    await admin('POST', '/admin/bots', { token: TOK, owner_id: OWNER })
    await admin('POST', '/admin/bots', { token: TOK2, owner_id: OWNER })
    await admin('POST', '/admin/bots', { token: `${OTHER}:` + 'K'.repeat(35), owner_id: 88 })
    const secret = JSON.parse(store.get(`tb:${ID}`)).secret
    const say = (from, text) =>
      b.botWebhook(
        new Request(`https://zeidexsoft.com/tg/${ID}`, {
          method: 'POST',
          headers: { 'x-telegram-bot-api-secret-token': secret },
          body: JSON.stringify({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'N' }, text } }),
        }),
        env,
        String(ID),
      )
    const ownerSays = (text) => say(OWNER, text)
    const lastOwnerText = () => [...sent].reverse().find((c) => c.method === 'sendMessage' && c.body.chat_id === OWNER)?.body.text ?? ''

    await ownerSays('/add Perfume | 100 | nice smell')

    // CRM: /mybots from any of the owner's bots lists them all.
    await ownerSays('/mybots')
    assert.ok(lastOwnerText().includes(`bot_${ID}`) && lastOwnerText().includes(`bot_${ID2}`), '/mybots lists every bot of the owner')
    assert.ok(!lastOwnerText().includes(`bot_${OTHER}`), "and nobody else's")

    // CRM: remote pause/resume of the OTHER bot from this bot's chat.
    await ownerSays(`/pause ${ID2}`)
    assert.equal(JSON.parse(store.get(`tb:${ID2}`)).paused, true, 'the CRM pauses another bot remotely')
    await ownerSays(`/resume ${ID2}`)
    assert.equal(JSON.parse(store.get(`tb:${ID2}`)).paused, false, 'and resumes it')

    // CRM: another owner's bot is untouchable.
    await ownerSays(`/pause ${OTHER}`)
    assert.ok(lastOwnerText().includes('لا يوجد بوت بهذا الرقم'), "one owner cannot touch another's bot")
    assert.equal(JSON.parse(store.get(`tb:${OTHER}`)).paused, false)

    // CRM: the backup exports the record without any secret.
    await ownerSays(`/backup ${ID2}`)
    assert.ok(lastOwnerText().includes(`bot_${ID2}`) && !lastOwnerText().includes(TOK2), 'backup exports the record without the token')

    // CRM: the rehook re-registers the other bot's webhook at the current revision.
    await ownerSays(`/rehook ${ID2}`)
    const rh = sent.find((c) => c.method === 'setWebhook' && c.body.url === `https://zeidexsoft.com/tg/${ID2}`)
    assert.ok(rh, 'rehook re-registers the target bot webhook')
    assert.ok(lastOwnerText().includes('أعيد ربط'), 'rehook confirms to the owner')

    // The automation engine: linking, then the live events.
    await ownerSays('/wf https://n8n.example/hook')
    assert.ok(lastOwnerText().includes(`/api/wf/${ID}`), 'the /wf setup answer shows the inbound endpoint')
    const tok = await b.workflowToken(env, ID)
    await say(900, 'course')
    assert.equal(events.at(-1)?.body.type, 'message', 'a customer message fires a message event')
    assert.equal(events.at(-1)?.body.text, 'course')
    assert.equal(events.at(-1)?.body.bot.id, ID)
    assert.equal(events.at(-1)?.sig, tok, 'events are signed with the derived token')
    await say(901, '/start')
    assert.equal(events.at(-1)?.body.type, 'customer_new', 'a first /start fires customer_new')

    // The engine's inbound path: wrong token refused, right token speaks through the bot.
    assert.equal((await b.wfInbound(new Request(`https://zeidexsoft.com/api/wf/${ID}`, { method: 'POST', headers: { authorization: 'Bearer nope' }, body: JSON.stringify({ text: 'hi' }) }), env, String(ID))).status, 403)
    assert.equal((await b.wfInbound(new Request(`https://zeidexsoft.com/api/wf/${ID}`, { method: 'POST', headers: { authorization: `Bearer ${tok}` }, body: JSON.stringify({ text: '<b>bold</b>' }) }), env, String(ID))).status, 200)
    assert.ok(sent.some((c) => c.method === 'sendMessage' && c.body.chat_id === OWNER && c.body.text.includes('&lt;b&gt;bold&lt;/b&gt;')), 'a workflow speaks to the owner, with its HTML escaped')

    // Off stops the stream.
    await ownerSays('/wf off')
    events.length = 0
    await say(900, 'course')
    assert.equal(events.length, 0, '/wf off stops the stream')

    // WhatsApp: linking seals both secrets.
    const waToken = 'EAAG-wa-permanent-token'
    const appSecret = 'wa-app-secret-1234567890'
    await ownerSays(`/wa 1098765432 ${waToken} ${appSecret}`)
    assert.ok(lastOwnerText().includes('Verify token'), 'the /wa setup answer shows the Meta config')
    assert.ok(!store.get(`tb:${ID}`).includes(waToken), 'the WhatsApp token is stored sealed')
    assert.ok(!store.get(`tb:${ID}`).includes(appSecret), 'the app secret is stored sealed')

    // Meta verifies the webhook with the derived hub token; a wrong one is refused.
    const hub = await b.waVerifyToken(env, ID)
    assert.equal(await (await b.waBotWebhook(new Request(`https://zeidexsoft.com/api/wa/${ID}?hub.mode=subscribe&hub.verify_token=${hub}&hub.challenge=abc123`), env, String(ID))).text(), 'abc123', 'hub verification echoes the challenge')
    assert.equal((await b.waBotWebhook(new Request(`https://zeidexsoft.com/api/wa/${ID}?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=x`), env, String(ID))).status, 403)

    // A signed WhatsApp message: a shop question is auto-answered from the catalog, the rest lands in the owner's chat.
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const waMsg = async (from, text) => {
      const payload = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ from, type: 'text', text: { body: text } }] } }] }] })
      const sig = 'sha256=' + Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload))), (x) => x.toString(16).padStart(2, '0')).join('')
      return b.waBotWebhook(new Request(`https://zeidexsoft.com/api/wa/${ID}`, { method: 'POST', headers: { 'x-hub-signature-256': sig }, body: payload }), env, String(ID))
    }
    assert.equal((await waMsg('967771234567', 'ما هي الأسعار عندكم؟')).status, 200)
    assert.ok(graph.some((g) => g.body?.to === '967771234567' && /Perfume/.test(g.body.text?.body ?? '')), 'a shop question is auto-answered from the catalog over WhatsApp')
    await waMsg('967772345678', 'أحتاج مساعدة في الطلب')
    assert.ok(sent.some((c) => c.method === 'sendMessage' && c.body.chat_id === OWNER && c.body.text.includes('أحتاج مساعدة') && c.body.text.includes('/ware')), 'the rest lands in the owner chat with the /ware hint')
    assert.equal(JSON.parse(store.get(`tb:${ID}`)).wa.lastFrom, '967772345678', 'lastFrom remembers who is waiting')

    // /ware replies through the Graph API; a forged signature is refused; /wa off unlinks.
    await ownerSays('/ware أهلاً بك!')
    assert.ok(graph.some((g) => g.body?.to === '967772345678' && (g.body.text?.body ?? '').includes('أهلاً')), '/ware replies over WhatsApp')
    assert.equal((await b.waBotWebhook(new Request(`https://zeidexsoft.com/api/wa/${ID}`, { method: 'POST', headers: { 'x-hub-signature-256': 'sha256=deadbeef' }, body: '{}' }), env, String(ID))).status, 401)
    await ownerSays('/wa off')
    assert.equal(JSON.parse(store.get(`tb:${ID}`)).wa, undefined, '/wa off unlinks the number')

    // All three are paid capabilities: a legacy free record is refused with the gate
    // text, the same policy as the smart answers — and the full trial keeps every power.
    const FREE_ID = 555000666
    await admin('POST', '/admin/bots', { token: `${FREE_ID}:` + 'L'.repeat(35), owner_id: OWNER, plan: 'trial' })
    // The month is retired — flip an existing record to legacy free, the way the wild did.
    store.set(`tb:${FREE_ID}`, JSON.stringify({ ...JSON.parse(store.get(`tb:${FREE_ID}`)), plan: 'free' }))
    b.configCache.clear()
    b.ownerCache.clear()
    const freeSecret = JSON.parse(store.get(`tb:${FREE_ID}`)).secret
    const freeSay = (text) =>
      b.botWebhook(
        new Request(`https://zeidexsoft.com/tg/${FREE_ID}`, {
          method: 'POST',
          headers: { 'x-telegram-bot-api-secret-token': freeSecret },
          body: JSON.stringify({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'N' }, text } }),
        }),
        env,
        String(FREE_ID),
      )
    for (const c of ['/mybots', '/wf https://n8n.example/hook', `/pause ${ID2}`, '/wa 1098765432 t s']) {
      await freeSay(c)
      assert.ok(lastOwnerText().includes('💎'), `a free shop is refused on ${c.split(' ')[0]}`)
    }
    assert.equal(JSON.parse(store.get(`tb:${FREE_ID}`)).workflow, undefined, 'a free shop cannot link the automation engine')
    assert.equal(JSON.parse(store.get(`tb:${FREE_ID}`)).wa, undefined, 'a free shop cannot link WhatsApp')
    store.set(`tb:${FREE_ID}`, JSON.stringify({ ...JSON.parse(store.get(`tb:${FREE_ID}`)), plan: 'trial' }))
    b.configCache.clear()
    b.ownerCache.clear()
    await freeSay('/wf https://n8n.example/hook')
    assert.equal(JSON.parse(store.get(`tb:${FREE_ID}`)).workflow, 'https://n8n.example/hook', 'the full trial keeps every power')
  } finally {
    globalThis.fetch = saved
  }
}

// ── The WhatsApp product's native setup: Meta credentials pasted on the platform bot ──
// A buyer of the whatsapp-bot-pro item may own no hosted bot, so their Meta Cloud
// number rides the platform record itself as a guest link: their WhatsApp lands in
// their own chat, and their replies go out as their own /ware. Nothing in this path
// may ever walk them into a BotFather/Telegram-token flow.
{
  b.configCache.clear()
  b.ownerCache.clear()
  const PLAT = 555111000
  const BUYER = 812345678
  const OWNER = 777
  const prevPlatform = env.BOT_PLATFORM_ID
  env.BOT_PLATFORM_ID = String(PLAT)
  const graph = [] // WhatsApp Graph API calls
  const sent = [] // Telegram calls
  const saved = globalThis.fetch
  const badPair = '1098000001'
  globalThis.fetch = async (url, init) => {
    const u = String(url)
    if (u.startsWith('https://graph.facebook.com/')) {
      graph.push({ path: u, auth: init?.headers?.authorization, body: init?.body ? JSON.parse(init.body) : null })
      // The link-check GET: Meta rejects exactly one phone-id/token pair, so the refusal path is covered too.
      if (u.includes(`/${badPair}?`) || (u.includes(`/${badPair}/`) && init?.method !== 'POST'))
        return Response.json({ error: { type: 'OAuthException' } }, { status: 401 })
      return Response.json(init?.method === 'POST' ? { messages: [{ id: 'wamid.g1' }] } : { display_phone_number: '+967 77 111 000', quality_rating: 'GREEN' })
    }
    if (u.startsWith('https://api.telegram.org/')) {
      const method = u.split('/').pop()
      const body = init?.body ? JSON.parse(init.body) : {}
      sent.push({ method, body })
      if (method === 'getMe') {
        const tok = u.slice('https://api.telegram.org/bot'.length, u.lastIndexOf('/'))
        const id = Number(tok.split(':')[0])
        return Response.json({ ok: true, result: { id, username: `bot_${id}`, first_name: 'B' } })
      }
      return Response.json({ ok: true, result: {} })
    }
    return Response.json({ ok: true, result: {} })
  }
  try {
    await admin('POST', '/admin/bots', { token: `${PLAT}:` + 'W'.repeat(35), owner_id: OWNER, plan: 'paid' })
    // The platform record carries the catalog's WhatsApp product: demo:'whatsapp' is its
    // marker sentinel — never a URL, so no link button is ever rendered from it.
    const plat = JSON.parse(store.get(`tb:${PLAT}`))
    plat.items = [{ id: 12, title: 'بوت واتساب للأعمال والربط المزدوج', stars: 5500, desc: 'واتساب للأعمال', features: [], section: 2, demo: 'whatsapp', sku: 'whatsapp-bot-pro', after: ['أرسل /wa هنا مباشرة'] }]
    store.set(`tb:${PLAT}`, JSON.stringify(plat))
    b.configCache.clear()
    const secret = JSON.parse(store.get(`tb:${PLAT}`)).secret
    const post = (update) =>
      b.botWebhook(new Request(`https://zeidexsoft.com/tg/${PLAT}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify(update) }), env, String(PLAT))
    const say = (from, text) => post({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'W' }, text } })
    const buyerTexts = () => sent.filter((c) => c.method === 'sendMessage' && c.body.chat_id === BUYER).map((c) => c.body.text)

    // A bare /wa is the native Meta setup — the exact paste format, and no BotFather anywhere.
    sent.length = 0
    await say(BUYER, '/wa')
    const intro = buyerTexts().at(-1)
    assert.ok(intro.includes('Meta for Developers'), 'a bare /wa shows the native Meta setup')
    assert.ok(intro.includes('/wa رقم_الهاتف_الدائمي التوكن_الدائمي سر_التطبيق'), 'the exact paste format is shown')
    assert.ok(!intro.includes('BotFather'), 'no BotFather in the WhatsApp buyer path')

    // The store's free-try deep link (t.me/<bot>?start=demo_whatsapp) opens the product card.
    sent.length = 0
    await say(BUYER, '/start demo_whatsapp')
    const card = sent.filter((c) => c.method === 'sendMessage' && c.body.chat_id === BUYER).at(-1)
    const rows = card.body.reply_markup.inline_keyboard.flat()
    assert.ok(rows.some((x) => x.callback_data === 't:wa_trial'), 'the WhatsApp product deep-link offers its own trial button')
    assert.ok(!rows.some((x) => x.url && String(x.url).includes('whatsapp')), 'the demo sentinel never becomes a URL button')
    assert.ok(!rows.some((x) => x.callback_data === 't:trial'), 'a WhatsApp buyer is not walked into the Telegram-token trial flow')

    // The storefront's buy deep link (t.me/<bot>?start=buy_<sku>) lands on the product's own
    // checkout card — the same card the 🛍 buttons open, with the item's buy button on it.
    // The SKU match is by the item's own sku field: the Arabic titles can never normalise
    // into a Latin SKU, so the fallbacks cannot save an item without one.
    sent.length = 0
    await say(BUYER, '/start buy_whatsapp-bot-pro')
    const buyLink = sent.filter((c) => c.method === 'sendMessage' && c.body.chat_id === BUYER).at(-1)
    assert.ok(buyLink.body.reply_markup.inline_keyboard.flat().some((x) => x.callback_data === 't:pay:12'),
      'the buy_<sku> deep link lands on the item\'s own checkout card')

    // The trial button on the card and the t:wa_trial callback both open the same native setup.
    await post({ callback_query: { id: 'wq1', from: { id: BUYER }, data: 't:wa_trial', message: { chat: { id: BUYER, type: 'private' } } } })
    assert.ok(buyerTexts().at(-1).includes('Meta for Developers'), 't:wa_trial opens the native setup too')

    // A pair Meta rejects is refused, and nothing is stored.
    sent.length = 0
    await say(BUYER, `/wa ${badPair} EAAG-bad-permanent-token-123456 bad-app-secret-123456`)
    assert.ok(buyerTexts().at(-1).includes('رفضت Meta'), 'a pair Meta rejects is refused')
    assert.equal(JSON.parse(store.get(`tb:${PLAT}`)).waGuests, undefined, 'no guest link is stored on rejection')

    // A valid pair links the buyer's number as a guest: sealed, 7-day trial, Meta config shown.
    sent.length = 0
    const waToken = 'EAAG-wa-guest-permanent-token'
    const appSecret = 'guest-app-secret-1234567890'
    await say(BUYER, `/wa 1098765432 ${waToken} ${appSecret}`)
    const linked = buyerTexts().at(-1)
    assert.ok(linked.includes('رُبط واتساب للأعمال'), 'the link is confirmed')
    assert.ok(linked.includes(`/api/wa/${PLAT}`) && linked.includes('Verify token'), 'the Meta webhook config is shown')
    assert.ok(!linked.includes('BotFather'), 'no BotFather in the link confirmation')
    const g = JSON.parse(store.get(`tb:${PLAT}`)).waGuests[0]
    assert.equal(g.uid, BUYER, 'the guest link belongs to the buyer')
    assert.ok(!store.get(`tb:${PLAT}`).includes(waToken) && !store.get(`tb:${PLAT}`).includes(appSecret), 'both guest secrets are stored sealed')
    const left = (Date.parse(g.exp) - Date.now()) / 864e5
    assert.ok(left > 6.99 && left <= 7, 'an unpaid link is a 7-day trial')

    // Meta verifies the webhook with the derived hub token — a guest-only record works too.
    const hub = await b.waVerifyToken(env, String(PLAT))
    assert.equal(await (await b.waBotWebhook(new Request(`https://zeidexsoft.com/api/wa/${PLAT}?hub.mode=subscribe&hub.verify_token=${hub}&hub.challenge=wa42`), env, String(PLAT))).text(), 'wa42', 'hub verification echoes the challenge for a guest link')
    assert.equal((await b.waBotWebhook(new Request(`https://zeidexsoft.com/api/wa/${PLAT}?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=x`), env, String(PLAT))).status, 403, 'a wrong hub token is refused')

    // A signed batch on the buyer's number: everything lands in the buyer's own chat, never the owner's.
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const waMsg = async (from, text) => {
      const payload = JSON.stringify({ entry: [{ id: '1098765432', changes: [{ value: { messages: [{ from, type: 'text', text: { body: text } }] } }] }] })
      const sig = 'sha256=' + Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload))), (x) => x.toString(16).padStart(2, '0')).join('')
      return b.waBotWebhook(new Request(`https://zeidexsoft.com/api/wa/${PLAT}`, { method: 'POST', headers: { 'x-hub-signature-256': sig }, body: payload }), env, String(PLAT))
    }
    sent.length = 0
    assert.equal((await waMsg('967773111222', 'عندي استفسار عن الشحن')).status, 200)
    assert.ok(buyerTexts().some((t) => t.includes('عندي استفسار') && t.includes('/ware')), 'a guest message lands in the buyer chat with the /ware hint')
    assert.ok(!sent.some((c) => c.method === 'sendMessage' && c.body.chat_id === OWNER), 'and never in the platform owner chat')
    assert.equal(JSON.parse(store.get(`tb:${PLAT}`)).waGuests[0].lastFrom, '967773111222', 'lastFrom remembers who is waiting for the buyer')

    // /ware replies and /wasend sends through the buyer's own link, with the sealed token reopened.
    graph.length = 0
    await say(BUYER, '/ware أهلاً وسهلاً')
    assert.ok(graph.some((x) => x.body?.to === '967773111222' && (x.body.text?.body ?? '').includes('أهلاً')), '/ware replies through the buyer guest link')
    await say(BUYER, '/wasend 967775554444 إعلان تجريبي')
    assert.ok(graph.some((x) => x.body?.to === '967775554444' && (x.body.text?.body ?? '').includes('إعلان')), '/wasend sends to any number through the guest link')
    // Paying for the product: the receipt hands back the native setup, and the link stops expiring.
    sent.length = 0
    await post({ message: { chat: { id: BUYER, type: 'private' }, from: { id: BUYER }, successful_payment: { total_amount: 5500, currency: 'XTR', invoice_payload: `t${PLAT}:12` } } })
    const paid = buyerTexts().at(-1)
    assert.ok(paid.includes('تم الدفع بنجاح') && paid.includes('Meta for Developers') && paid.includes('/wa رقم_الهاتف_الدائمي'), 'a paid buyer gets the native WhatsApp setup steps')
    assert.ok(!paid.includes('سيتواصل معك المالك'), 'not the generic contact-the-owner text')
    assert.ok(!paid.includes('BotFather'), 'no BotFather after the purchase either')
    const recPaid = JSON.parse(store.get(`tb:${PLAT}`))
    assert.ok(recPaid.waPaid.includes(BUYER), 'the payment is remembered')
    assert.equal(recPaid.waGuests[0].exp, undefined, 'a paid link never expires')

    // An expired trial: the batch is a silent 200 (Meta must not retry), /ware is refused.
    const raw = JSON.parse(store.get(`tb:${PLAT}`))
    raw.waGuests[0].exp = new Date(Date.now() - 864e5).toISOString()
    store.set(`tb:${PLAT}`, JSON.stringify(raw))
    b.configCache.clear()
    sent.length = 0
    assert.equal((await waMsg('967773111222', 'لاحقاً')).status, 200, 'an expired guest batch is still a 200')
    assert.equal(buyerTexts().length, 0, 'and relays nothing')
    await say(BUYER, '/ware رد')
    assert.ok(buyerTexts().at(-1).includes('انتهت تجربة الواتساب'), 'an expired trial cannot /ware')

    // /wa off unlinks the guest link.
    await say(BUYER, '/wa off')
    assert.equal(JSON.parse(store.get(`tb:${PLAT}`)).waGuests.length, 0, '/wa off unlinks the guest')

    // The shipped surfaces agree: catalog and payload both keep the WhatsApp product on /wa.
    const cat = JSON.parse(readFileSync('public/store/catalog.json', 'utf8'))
    const prod = cat.products.find((x) => x.sku === 'whatsapp-bot-pro')
    assert.equal(prod.demo, 'whatsapp', "the catalog's WhatsApp product carries the demo marker")
    assert.ok(prod.after.some((s) => s.includes('/wa ')), 'its post-purchase steps stay on /wa')
    const pl = JSON.parse(readFileSync('payload.json', 'utf8'))
    const pi = pl.items.find((x) => x.demo === 'whatsapp')
    assert.ok(pi && pi.after.some((s) => s.includes('/wa ')), 'payload.json agrees on the /wa steps')
    // The storefront's buy_<sku> deep link can only land when the payload carries the SKU:
    // the catalog's titles are Arabic and norm() never folds an Arabic title into a Latin
    // SKU, so itemBySku()'s fallbacks cannot save a payload without one — every storefront
    // buy tap would land on the bare welcome instead of the product it asked for.
    for (const p of cat.products) assert.ok(pl.items.some((i) => i.sku === p.sku),
      `${p.sku}: payload.json must carry the catalog's sku so the storefront's buy deep link lands`)
  } finally {
    globalThis.fetch = saved
    if (prevPlatform === undefined) delete env.BOT_PLATFORM_ID
    else env.BOT_PLATFORM_ID = prevPlatform
  }
}

// ── The browser dashboard (/web): a signed link only the owner's own chat holds ──
// The code rides the URL fragment, the dashboard presents it as a Bearer token, and
// botsDash() re-derives the same MAC before granting any power. The state read must
// paint the whole dashboard without ever leaking a sealed secret, and every write
// path carries the same guardrails its Telegram twin enforces.
{
  b.configCache.clear()
  b.ownerCache.clear()
  const DASH = 555333000
  const OWNER = 555
  const sent = [] // Telegram calls
  const saved = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const u = String(url)
    if (u.startsWith('https://api.telegram.org/')) {
      const method = u.split('/').pop()
      const body = init?.body ? JSON.parse(init.body) : {}
      sent.push({ method, body })
      if (method === 'getMe') {
        const id = Number(u.slice('https://api.telegram.org/bot'.length, u.lastIndexOf('/')).split(':')[0])
        return Response.json({ ok: true, result: { id, username: `bot_${id}`, first_name: 'D' } })
      }
      return Response.json({ ok: true, result: {} })
    }
    return Response.json({ ok: true, result: {} })
  }
  try {
    await admin('POST', '/admin/bots', { token: `${DASH}:` + 'D'.repeat(35), owner_id: OWNER, plan: 'paid' })
    const secret = JSON.parse(store.get(`tb:${DASH}`)).secret
    const say = (from, text) =>
      b.botWebhook(
        new Request(`https://zeidexsoft.com/tg/${DASH}`, {
          method: 'POST',
          headers: { 'x-telegram-bot-api-secret-token': secret },
          body: JSON.stringify({ message: { chat: { id: from, type: 'private' }, from: { id: from, first_name: 'D' }, text } }),
        }),
        env,
        String(DASH),
      )
    const dash = (method, path, body, code) =>
      b.botsDash(
        new Request(`https://zeidexsoft.com/api/dash/${path}`, {
          method,
          headers: code ? { authorization: `Bearer ${code}` } : {},
          body: body ? JSON.stringify(body) : undefined,
        }),
        env,
        new URL(`https://zeidexsoft.com/api/dash/${path}`),
      )

    // /web hands the owner a personal link; the code is derived, never stored, and a
    // customer never sees one.
    sent.length = 0
    await say(OWNER, '/web')
    const link = [...sent].reverse().find((c) => c.method === 'sendMessage' && c.body.chat_id === OWNER)?.body.text ?? ''
    const code = (link.match(/k=([0-9]+\.[A-Za-z0-9]+)/) || [])[1]
    assert.ok(code, 'the /web answer carries the dashboard code')
    assert.ok(link.includes(`/dash/#id=${DASH}`), 'the link points at the owner\'s own dashboard')
    assert.ok(!store.get(`tb:${DASH}`).includes(code), 'the code is derived, never stored in KV')
    await say(777, '/web')
    assert.ok(!sent.some((c) => c.method === 'sendMessage' && c.body.chat_id === 777 && c.body.text.includes('/dash/')),
      "a customer never sees the owner's dashboard link")

    // The code is the only key: a missing one, a wrong one, and another bot's are all refused.
    assert.equal((await dash('GET', `${DASH}/state`)).status, 403, 'no code is refused')
    assert.equal((await dash('GET', `${DASH}/state`, null, '9999.deadbeef')).status, 403, 'a wrong code is refused')
    assert.equal((await dash('GET', `${DASH}/state`, null, await b.dashCode(env, 999888777))).status, 403,
      "another bot's code is refused")
    assert.equal((await dash('GET', '12/state', null, code)).status, 400, 'a bad id is a 400')

    // State paints the whole dashboard in one read, and never leaks a sealed secret.
    const state = await (await dash('GET', `${DASH}/state`, null, code)).json()
    assert.equal(state.bot.id, DASH)
    assert.ok(Array.isArray(state.items) && Array.isArray(state.faqs) && Array.isArray(state.sections), 'state carries the shop')
    assert.ok(!('token' in state.bot) && !('secret' in state.bot), 'the bot summary never carries a secret field')
    assert.ok(!JSON.stringify(state).includes('D'.repeat(20)), 'the sealed token material never appears in state')

    // Products: add with the same guardrails /add enforces, and the web store's SKU rides
    // on the item so the storefront's buy_<sku> deep link can land on it.
    assert.equal((await dash('POST', `${DASH}/items`, { title: 'E-book', stars: 250 }, code)).status, 200)
    assert.equal((await dash('POST', `${DASH}/items`, { title: '', stars: 250 }, code)).status, 400, 'an empty title is refused')
    assert.equal((await dash('POST', `${DASH}/items`, { title: 'X', stars: 0 }, code)).status, 400, 'zero stars is refused')
    assert.equal((await dash('POST', `${DASH}/items`, { title: 'X', stars: 10, section: 9 }, code)).status, 400,
      'an unknown section is refused')
    const added = await (await dash('POST', `${DASH}/items`, { title: 'Course', stars: 500, sku: 'E-COURSE!', usd: 7, features: ['A', 'B'], after: ['Step 1'] }, code)).json()
    assert.equal(added.item.sku, 'e-course', 'the sku is normalised the way the storefront builds its deep links')
    assert.equal((await dash('POST', `${DASH}/items`, { title: 'Twin', stars: 100, sku: 'e-course' }, code)).status, 400,
      'a duplicate sku is refused')

    // Editing moves only the sent fields, so a small GUI form can never wipe the rest.
    assert.equal((await dash('PUT', `${DASH}/items/1`, { title: 'E-book v2' }, code)).status, 200)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).items[0].stars, 250, 'an unsent field keeps its value')
    assert.equal((await dash('PUT', `${DASH}/items/1`, { stars: 0 }, code)).status, 400, 'a bad edit is refused')
    assert.equal((await dash('PUT', `${DASH}/items/999`, { title: 'X' }, code)).status, 404, 'an unknown item is a 404')
    assert.equal((await dash('PUT', `${DASH}/items/1`, { sku: 'e-course' }, code)).status, 400,
      'tying a second item to a taken sku is refused')
    const tied = await (await dash('PUT', `${DASH}/items/1`, { sku: 'e-book' }, code)).json()
    assert.equal(tied.item.sku, 'e-book', 'the tie lands')
    // The whole point of the tie: the storefront's buy_<sku> deep link now lands on the item.
    sent.length = 0
    await say(900, '/start buy_e-book')
    const card = sent.filter((c) => c.method === 'sendInvoice').at(-1)
    assert.ok(card && card.body.payload === `t${DASH}:1` && card.body.prices?.[0]?.amount === 250,
      'a dashboard-tied sku lands its storefront deep link on the item (here: its one-tap invoice)')
    const untied = await (await dash('PUT', `${DASH}/items/1`, { sku: '' }, code)).json()
    assert.equal(untied.item.sku, undefined, 'an empty sku unties the item')

    // Auto-delivery: a secret text or a stored file — exactly what /deliver sets.
    assert.equal((await dash('POST', `${DASH}/deliver`, { item: 1, text: 'SECRET-DELIVERY-TEXT' }, code)).status, 200)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).items[0].deliver.text, 'SECRET-DELIVERY-TEXT')
    assert.equal((await dash('POST', `${DASH}/deliver`, { item: 999, text: 'x' }, code)).status, 400, 'an unknown item is refused')
    assert.equal((await dash('POST', `${DASH}/deliver`, { item: 1 }, code)).status, 400, 'nothing to deliver is refused')
    const withFile = JSON.parse(store.get(`tb:${DASH}`))
    withFile.files = [{ id: 3, title: 'Guide.pdf', type: 'document', file_id: 'FID3' }]
    store.set(`tb:${DASH}`, JSON.stringify(withFile))
    b.configCache.clear()
    assert.equal((await dash('POST', `${DASH}/deliver`, { item: 1, file: 3 }, code)).status, 200)
    assert.deepEqual(JSON.parse(store.get(`tb:${DASH}`)).items[0].deliver, { file: { id: 'FID3', type: 'document' } })
    assert.equal((await dash('POST', `${DASH}/deliver`, { item: 1, file: 42 }, code)).status, 400, 'an unknown file is refused')
    assert.equal((await dash('POST', `${DASH}/deliver`, { item: 1, clear: true }, code)).status, 200)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).items[0].deliver, undefined, 'clear removes the delivery')

    // Deleting: the item goes, and an unknown one is a 404.
    assert.equal((await dash('DELETE', `${DASH}/items/1`, null, code)).status, 200)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).items.length, 1)
    assert.equal((await dash('DELETE', `${DASH}/items/999`, null, code)).status, 404)

    // FAQs: the same cap /faq enforces.
    assert.equal((await dash('POST', `${DASH}/faqs`, { q: 'كيف أدفع؟', a: 'بالنجوم' }, code)).status, 200)
    assert.equal((await dash('POST', `${DASH}/faqs`, { q: '', a: 'x' }, code)).status, 400, 'an empty question is refused')
    const full = JSON.parse(store.get(`tb:${DASH}`))
    full.faqs = Array.from({ length: 50 }, (_, i) => ({ q: `q${i}`, a: 'a' }))
    store.set(`tb:${DASH}`, JSON.stringify(full))
    b.configCache.clear()
    assert.equal((await dash('POST', `${DASH}/faqs`, { q: 'one more', a: 'x' }, code)).status, 409, 'the faq cap is enforced')
    assert.equal((await dash('DELETE', `${DASH}/faqs/0`, null, code)).status, 200)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).faqs.length, 49)
    assert.equal((await dash('DELETE', `${DASH}/faqs/99`, null, code)).status, 404, 'an unknown faq is a 404')

    // The welcome text, and pause/resume with one tap.
    assert.equal((await dash('POST', `${DASH}/welcome`, { text: 'أهلاً بكم في متجري الجديد' }, code)).status, 200)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).welcome, 'أهلاً بكم في متجري الجديد')
    assert.equal((await dash('POST', `${DASH}/welcome`, { text: '   ' }, code)).status, 400, 'an empty welcome is refused')
    await dash('POST', `${DASH}/pause`, {}, code)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).paused, true, 'pause flips the maintenance flag')
    await dash('POST', `${DASH}/pause`, { paused: false }, code)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).paused, false, 'and resume flips it back')

    // The stored files: sending uses the same method /send uses, and the index stays lean.
    sent.length = 0
    assert.equal((await dash('POST', `${DASH}/files/send`, { file: 3, user: 555 }, code)).status, 200)
    assert.ok(sent.some((c) => c.method === 'sendDocument' && c.body.chat_id === 555 && c.body.document === 'FID3'),
      'a stored file is sent to a customer')
    assert.equal((await dash('POST', `${DASH}/files/send`, { file: 42, user: 555 }, code)).status, 400, 'an unknown file is refused')
    assert.equal((await dash('DELETE', `${DASH}/files/3`, null, code)).status, 200)
    assert.equal(JSON.parse(store.get(`tb:${DASH}`)).files.length, 0)
    assert.equal((await dash('DELETE', `${DASH}/files/9`, null, code)).status, 404, 'an unknown file delete is a 404')

    // The item cap is the store's, not the GUI's.
    const fullItems = JSON.parse(store.get(`tb:${DASH}`))
    fullItems.items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, title: `p${i}`, stars: 10, desc: 'd' }))
    store.set(`tb:${DASH}`, JSON.stringify(fullItems))
    b.configCache.clear()
    assert.equal((await dash('POST', `${DASH}/items`, { title: 'Cap', stars: 10 }, code)).status, 409, 'the item cap is enforced')

    // Anything else the GUI never sends is a plain 405.
    assert.equal((await dash('GET', `${DASH}/items`, null, code)).status, 405)
    assert.equal((await dash('POST', `${DASH}/state`, {}, code)).status, 405)
  } finally {
    globalThis.fetch = saved
  }
}

console.log('hosted bots: all checks passed')
