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

// ── Plans: the free tier is capped and signed; platform commands stay on the platform ──
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
    assert.deepEqual(await (await admin('GET', '/admin/bots')).json(), { plans: ['free', 'paid'] }, 'the capability probe /freebot reads first')
    const made = await (await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9, plan: 'free' })).json()
    assert.equal(made.plan, 'free')
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

    // A mid-range month: 30 products, then a refusal that points at the paid plan.
    for (let i = 0; i < 31; i++) await say(9, `/add P${i} | 10`)
    assert.equal(rec().items.length, 30, 'the free plan caps products at 30')
    assert.ok(lastText().includes('الحد 30'), 'the 31st /add explains the cap')

    // One month, set once: re-provisioning cannot move the end date.
    const ends = Date.parse(rec().expires)
    assert.ok(Math.abs(ends - Date.now() - 30 * 864e5) < 60e3, 'free month = 30 days')
    await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9, plan: 'free' })
    assert.equal(Date.parse(rec().expires), ends, 're-provisioning never extends the month')

    // The signature rides on the welcome — on free bots only.
    await say(70, '/start')
    assert.ok(lastText().includes('مدعوم من ZeidexSoft'), 'free bots carry the ZeidexSoft line')
    assert.ok(!lastText().includes('zeidexsoft.com'), 'free accounts are not linked to the platform site')

    // A customer's shop never answers with the platform's apps or its bank accounts.
    sent.length = 0
    await say(70, '/donate')
    await say(70, '/apps')
    assert.equal(sent.filter((c) => c.method === 'sendMessage').length, 0, 'platform commands are silent on a hosted shop')
    await say(70, '/help')
    assert.ok(!lastText().includes('/donate') && !lastText().includes('/apps'), '/help lists only the shop commands')

    // Re-provisioning without a plan keeps it; an explicit plan changes it.
    await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9 })
    assert.equal(rec().plan, 'free')
    assert.equal(rec().items.length, 30, 're-provisioning keeps the shop')
    await admin('POST', '/admin/bots', { token: FREE_TOKEN, owner_id: 9, plan: 'paid' })
    assert.equal(rec().plan, 'paid')
    await say(70, '/start')
    assert.ok(!lastText().includes('مدعوم من ZeidexSoft'), 'paid bots are unsigned')
    assert.equal((await (await admin('GET', `/admin/bots/${FREE_ID}`)).json()).plan, 'paid')
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

    // The free plan has no smart answers.
    await admin('POST', '/admin/bots', { token: TOK, owner_id: 11, plan: 'free' })
    aiCalls.length = 0
    await say(80, 'سؤال لا تطابقه كلمة')
    assert.equal(aiCalls.length, 0, 'free shops never call the model')
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

// ── Sections, pages, and the end of a free month ─────────────────────────
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
    await admin('POST', '/admin/bots', { token: TOK, owner_id: 12, plan: 'free' })
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

    // The month ends: customers see a closed sign, payments are refused, the owner keeps access.
    const lapsedRec = { ...rec(), expires: new Date(Date.now() - 1000).toISOString() }
    store.set(`tb:${ID}`, JSON.stringify(lapsedRec))
    b.configCache.clear()
    b.ownerCache.clear()
    await say(81, '/start')
    assert.ok(last().text.includes('متوقف مؤقتاً'), 'customers get the closed sign')
    sent.length = 0
    const item = rec().items[0]
    await post({ pre_checkout_query: { id: 'pc', from: { id: 81 }, currency: 'XTR', total_amount: item.stars, invoice_payload: `t${ID}:${item.id}` } })
    assert.equal(sent.find((c) => c.method === 'answerPreCheckoutQuery').body.ok, false, 'no sales after the month')
    await say(12, '/start')
    assert.ok(last().text.includes('انتهى الشهر المجاني'), 'the owner is told why, with the upgrade path')

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
