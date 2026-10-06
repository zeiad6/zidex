// Sold bots hosted on Cloudflare Workers — webhooks, no server, no phone, always on.
//
// One Worker serves many customer bots. Each bot is a KV record (prefix "tb:") holding its
// AES-GCM-encrypted token, a random webhook secret, and the shop data its owner edits from
// inside the bot (/add, /faq, /welcome, /pause, /admin). Telegram calls
// POST /tg/<botId> with header X-Telegram-Bot-Api-Secret-Token; anything without the
// right secret is dropped before the token is even decrypted.
//
// Provisioning (from the main bot's /provision, or curl) is POST /admin/bots with
// "Authorization: Bearer <BOTS_ADMIN_TOKEN>". Secrets: BOTS_KEY (base64, 32 bytes),
// BOTS_ADMIN_TOKEN. KV free tier allows 1,000 writes/day across the account — enough for
// small shops; Workers Paid ($5/month) lifts it to millions.

import { issueLicense, type LicenseEnv } from './license'

type KV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}
type Limiter = { limit(opts: { key: string }): Promise<{ success: boolean }> }

export type BotsEnv = {
  DOWNLOADS: KV
  BOT_LIMITER?: Limiter
  BOTS_KEY?: string
  BOTS_ADMIN_TOKEN?: string
  /** Telegram id of the platform's own bot; see DEFAULT_PLATFORM_BOT_ID. */
  BOT_PLATFORM_ID?: string
} & LicenseEnv

type Item = { id: number; title: string; stars: number; desc: string }
type Cfg = {
  id: number
  username: string
  owner: number
  token: string // iv.ciphertext, base64
  secret: string // derived (webhookSecret); kept for reference
  welcome: string
  paused: boolean
  items: Item[]
  faqs: { q: string; a: string }[]
  users: number[]
  orders: number
  stars: number
  created: string
}

const ORIGIN = 'https://zeidexsoft.com'
const MAX_ITEMS = 50

/**
 * The platform's own bot, which gets the extra menu rows (the app downloads and
 * the donation button) on top of the standard shop menu.
 *
 * Matched by numeric id, not by username. The username changes whenever the
 * owner renames the bot in BotFather, and a rename that silently demotes the
 * platform's own bot to a bare shop menu is exactly the kind of bug that ships
 * unnoticed — the storefront still works, it is just missing its buttons. The
 * id is assigned by Telegram at creation and never changes.
 *
 * Env override: BOT_PLATFORM_ID, for when this Worker serves a fork whose
 * platform bot was re-created under a different account.
 */
/** Verified against getMe on 2026-10-06: @deanonimaizer_2hbot_8fml_bot. */
const DEFAULT_PLATFORM_BOT_ID = 8968001501

const platformBotId = (env: BotsEnv) => Number(env.BOT_PLATFORM_ID ?? DEFAULT_PLATFORM_BOT_ID)

/**
 * How long a cached owner id is trusted before the record is read again.
 *
 * Bounds the worst case of the owner cache — a bot re-provisioned to a new
 * owner is unreachable for at most this long — and caps the read cost at one
 * per bot per interval. A minute keeps a stale entry far shorter than any human
 * would notice, while 1,440 reads/day/bot stays well inside the 100,000/day
 * free tier even with several dozen bots on one account.
 */
const OWNER_CACHE_TTL_MS = 60_000

/**
 * Test-only hook: ages every cached owner id out, so the stale-cache path can
 * be exercised without sleeping for the real TTL.
 *
 * Exported because it is the only way to reach that state deterministically,
 * and the alternative — a 60-second sleep in the suite — is worse than a
 * slightly wider module surface.
 */
export function __expireOwnerCache() {
  for (const [k, v] of ownerCache) ownerCache.set(k, { owner: v.owner, at: 0 })
}

const MAX_FAQS = 50
const MAX_USERS = 5000
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

// ── crypto ──────────────────────────────────────────────────────────
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function key(env: BotsEnv) {
  return crypto.subtle.importKey('raw', unb64(env.BOTS_KEY!), 'AES-GCM', false, ['encrypt', 'decrypt'])
}
export async function seal(env: BotsEnv, plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(env), new TextEncoder().encode(plain)))
  return `${b64(iv)}.${b64(ct)}`
}
export async function open(env: BotsEnv, sealed: string) {
  const [iv, ct] = sealed.split('.')
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await key(env), unb64(ct)))
}
/** Webhook secret derived from BOTS_KEY: checkable before any KV read, so junk
 *  requests to /tg/<id> cannot burn the account's daily KV quota. */
export async function webhookSecret(env: BotsEnv, botId: string | number) {
  const k = await crypto.subtle.importKey('raw', unb64(env.BOTS_KEY!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`tg:${botId}`)))
  return b64(mac).replace(/[^A-Za-z0-9]/g, '').slice(0, 48)
}

function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let d = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return d === 0
}

// ── Telegram ────────────────────────────────────────────────────────
async function tg(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await res.json()) as { ok: boolean; result?: any; description?: string }
}
const send = (token: string, chat_id: number, text: string, extra: Record<string, unknown> = {}) =>
  tg(token, 'sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra })

const load = async (env: BotsEnv, id: string) => {
  const raw = await env.DOWNLOADS.get(`tb:${id}`)
  return raw ? (JSON.parse(raw) as Cfg) : null
}
const save = (env: BotsEnv, cfg: Cfg) => env.DOWNLOADS.put(`tb:${cfg.id}`, JSON.stringify(cfg))

/**
 * Owner ids, cached per isolate so the rate limiter can run *before* the KV
 * read on the common path.
 *
 * The limiter has to know whether the sender is the owner, because owners are
 * never throttled — and reading the whole bot record to learn one integer is
 * the cost being optimised away.
 *
 * The first update for a bot in a cold isolate therefore always pays one read
 * to fill the cache, and every update after that is free of it. That is the
 * honest trade: the alternative designs were all worse, and this one is worth
 * being explicit about.
 *
 *   · Limiter first, unconditionally → the cache can never be filled by a
 *     throttled request, so an owner under rate limiting is never recognised
 *     and is locked out permanently. This is the bug the cache replaced.
 *   · Limiter after the read (the original order) → correct, but every spam
 *     message costs a read out of the 100,000/day free-tier budget.
 *
 * Keyed by the bot id as a string on both sides. The lookup gets the raw URL
 * path segment and the write has `cfg.id` (a number, from getMe), so keying the
 * write with `cfg.id` and the read with the URL param silently never matches.
 */
const ownerCache = new Map<string, { owner: number; at: number }>()
const botKey = (id: string | number) => String(id)
const rememberOwner = (id: string | number, owner: number) => ownerCache.set(botKey(id), { owner, at: Date.now() })

/**
 * Cached owner, or undefined when there is nothing usable — which includes an
 * entry that has aged out.
 *
 * The TTL is what stops a re-provision from locking the new owner out forever.
 * Without it the warm path never reads KV, so a cached owner id is trusted for
 * the isolate's whole lifetime: hand the bot to a new owner and they are
 * throttled as a customer, permanently, with nothing able to correct it. An
 * expiry bounds that to one TTL instead of infinity.
 *
 * One read per bot per TTL is the price, which is what makes the spam case
 * affordable: a spamming customer refreshes the cache, so it stops costing
 * reads, rather than costing one per message for as long as they keep sending.
 */
const knownOwnerOf = (id: string | number, ttl: number) => {
  const hit = ownerCache.get(botKey(id))
  if (!hit) return undefined
  if (Date.now() - hit.at > ttl) return undefined
  return hit.owner
}

const CONTACT_PROMPT = 'اكتب رسالتك للمالك ردّاً على هذه الرسالة.'

const menu = { inline_keyboard: [[{ text: '🛍 المنتجات', callback_data: 't:items' }, { text: '❓ الأسئلة', callback_data: 't:faqs' }], [{ text: '💬 راسل المالك', callback_data: 't:contact' }]] }

// ── customer search ─────────────────────────────────────────────────
// /search, /catalog, /help and the plain-message fallback share ONE matcher, so words and
// buttons can never disagree. Every path here is read-only: the reply's buttons carry the
// same t:buy / t:faq callbacks the menu already uses, so a search costs zero KV writes
// (free tier: 1,000/day across every bot on the account).
type Btn = { text: string; callback_data: string }
const btnRow = (b: Btn): Btn[] => [b]

const SEARCH_ITEM_CAP = 8
const SEARCH_FAQ_CAP = 5
const SEARCH_HINT =
  '🔎 أرسل الكلمة التي تبحث عنها، مثال: <code>/search مثال</code>\n<code>/catalog</code> يعرض كل المنتجات — أو افتح القائمة من الأزرار.'
const HELP_TEXT =
  '<b>الأوامر</b>\n/start — القائمة الرئيسية\n/search — ابحث في المنتجات\n/catalog — كل المنتجات\n/apps — تطبيقاتنا (أندرويد وويندوز)\n/donate — دعم وتبرع\n/help — هذه القائمة'

/** Fold Arabic and Latin text into one comparable form: lowercase, no harakat or tatweel,
 *  Arabic-Indic and Persian digits as Latin, one alef/ya/ha spelling, no punctuation.
 *  Owners type shop data with full spelling; customers type the sloppy version, so
 *  "بوتّ المتجّر" and "بوت المتجر" have to land on the same key. */
const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[\u064b-\u0652\u0670\u0640]/g, '') // harakat, superscript alef, tatweel
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660)) // ٠-٩
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x6f0)) // ۰-۹
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // آ أ إ ٱ → ا
    .replace(/\u0649/g, '\u064a') // ى → ي
    .replace(/\u0629/g, '\u0647') // ة → ه
    .replace(/[^\p{L}\p{N}]+/gu, ' ') // punctuation of both scripts out, runs collapse
    .trim()

/** A fresh copy of the main menu rows, appended to every reply so a customer who wandered
 *  in through /search or /catalog can always get back. Copied, never handed out as the
 *  shared `menu` object, so a caller cannot mutate the menu for every later message. */
const mainRows = (): Btn[][] => menu.inline_keyboard.map((row) => [...row])

/** Matching items plus matching FAQ indices. A row hits when ANY whitespace token of the
 *  query is a substring of its normalised title+desc (or question+answer), so "بوت متجر"
 *  finds "بوت المتجر الذكي" without the customer typing the exact phrase; the whole
 *  query as one substring also counts. Returns null when nothing searchable was typed —
 *  an empty /search and a punctuation-only one get the same usage hint. */
function searchKeys(cfg: Cfg, query: string) {
  const q = norm(query)
  const tokens = q.split(' ').filter(Boolean)
  if (!tokens.length) return null
  const items: Item[] = []
  const faqs: number[] = []
  for (const it of cfg.items) {
    if (items.length >= SEARCH_ITEM_CAP) break
    const hay = norm(`${it.title} ${it.desc}`)
    if (hay.includes(q) || tokens.some((t) => hay.includes(t))) items.push(it)
  }
  cfg.faqs.forEach((f, i) => {
    if (faqs.length >= SEARCH_FAQ_CAP) return
    const hay = norm(`${f.q} ${f.a}`)
    if (hay.includes(q) || tokens.some((t) => hay.includes(t))) faqs.push(i)
  })
  return { q, items, faqs }
}

/** The one search reply, shared by /search and by a customer's plain words. Never saves. */
async function sendSearch(token: string, chat: number, cfg: Cfg, query: string) {
  const hit = searchKeys(cfg, query)
  if (!hit) return void (await send(token, chat, SEARCH_HINT, { reply_markup: { inline_keyboard: mainRows() } }))
  const rows: Btn[][] = [
    ...hit.items.map((it) => btnRow({ text: `⭐️ ${it.stars} — ${it.title}`, callback_data: `t:buy:${it.id}` })),
    ...hit.faqs.map((i) => btnRow({ text: cfg.faqs[i].q, callback_data: `t:faq:${i}` })),
  ]
  if (!rows.length) {
    return void (await send(token, chat, 'لم أجد شيئاً. جرّب كلمة أخرى، أو افتح القائمة.', { reply_markup: { inline_keyboard: mainRows() } }))
  }
  await send(token, chat, `🔎 <b>نتائج «${esc(hit.q)}»</b>`, { reply_markup: { inline_keyboard: [...rows, ...mainRows()] } })
}

// ── webhook ─────────────────────────────────────────────────────────
export async function botWebhook(request: Request, env: BotsEnv, id: string): Promise<Response> {
  if (!env.BOTS_KEY) return new Response('not configured', { status: 503 })
  // Wrong secret: 200 with nothing (no retries), and no KV read or decryption at all.
  if (!safeEqual(request.headers.get('x-telegram-bot-api-secret-token') ?? '', await webhookSecret(env, id))) {
    return new Response('ok')
  }
  // Parse the body before touching KV. It is free — the body has already been
  // received — and it yields the sender id, which is what the limiter needs.
  //
  // Order matters for the free-tier read budget (100,000/day across every bot
  // on the account). The limiter used to run *after* load(), so a chatty or
  // spamming customer cost one KV read per message before being throttled at
  // all. Checking first means a throttled message costs nothing but the parse.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = (await request.json().catch(() => ({}))) as Record<string, any>
  const from = update.message?.from ?? update.callback_query?.from ?? update.pre_checkout_query?.from
  // Payments are never throttled: Telegram has already taken the Stars, and
  // refusing to answer the pre-checkout query would leave the buyer stuck at
  // the payment sheet.
  const payment = update.pre_checkout_query || update.message?.successful_payment

  // Cold isolate: the owner id is unknown, so the exemption cannot be decided
  // without a read. Pay it once. Warm isolate: the answer is already here.
  const cached = knownOwnerOf(id, OWNER_CACHE_TTL_MS)
  const cfg = cached === undefined ? await load(env, id) : null
  if (cfg) rememberOwner(cfg.id, cfg.owner)
  const owner = cfg?.owner ?? cached

  const isOwner = from ? from.id === owner : false
  // A spammer costs nothing past the parse on a warm isolate; only a cold
  // isolate (or an owner on their first message) spends a read.
  if (from && !isOwner && env.BOT_LIMITER && !payment) {
    if (!(await env.BOT_LIMITER.limit({ key: `${id}:${from.id}` })).success) return new Response('ok')
  }

  const record = cfg ?? (await load(env, id))
  if (!record) return new Response('ok')
  rememberOwner(record.id, record.owner)
  try {
    await handle(env, record, await open(env, record.token), update)
  } catch {
    // A bad update (or a rotated key) must never make Telegram retry it forever.
  }
  return new Response('ok')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handle(env: BotsEnv, cfg: Cfg, token: string, u: Record<string, any>) {
  const isOwner = (uid?: number) => uid === cfg.owner

  if (u.pre_checkout_query) {
    const q = u.pre_checkout_query
    const payload = String(q.invoice_payload)
    if (payload.startsWith(`t${cfg.id}:don:`)) {
      const amount = Number(payload.split(':')[2])
      const ok = !cfg.paused && amount === q.total_amount && q.currency === 'XTR'
      await tg(token, 'answerPreCheckoutQuery', { pre_checkout_query_id: q.id, ok, ...(ok ? {} : { error_message: 'خطأ في العملية.' }) })
      return
    }
    const itemId = Number(payload.split(':')[1])
    const item = cfg.items.find((i) => i.id === itemId)
    const ok = !cfg.paused && payload.startsWith(`t${cfg.id}:`) && !!item && item.stars === q.total_amount && q.currency === 'XTR'
    await tg(token, 'answerPreCheckoutQuery', { pre_checkout_query_id: q.id, ok, ...(ok ? {} : { error_message: 'المنتج غير متاح.' }) })
    return
  }

  if (u.callback_query) {
    const q = u.callback_query
    const chat = q.message?.chat?.id
    await tg(token, 'answerCallbackQuery', { callback_query_id: q.id })
    if (!chat) return
    if (cfg.paused && !isOwner(q.from.id)) return void (await send(token, chat, '🛠 البوت في صيانة قصيرة.'))
    const data = String(q.data ?? '')
    if (data === 't:android') {
      const text =
        '📱 <b>تطبيقات الأندرويد من ZeidexSoft</b>\n\n' +
        '1️⃣ <b>أرشيف برو EDMS</b> (v1.0.1)\nنظام إدارة وأرشفة الوثائق الإلكترونية، يعمل على الهاتف محلياً مع إمكانية المزامنة الآمنة مع الحاسوب.\n\n' +
        '2️⃣ <b>VerityScope — كاشف التزييف العميق</b> (v0.4.0)\nكشف التزييف في الصور والفيديو والنصوص والصوت بـ 5 نماذج ذكاء اصطناعي محلية + تحليلات رقمية جنائية.'
      const rows = [
        [{ text: '📥 تحميل أرشيف برو (MediaFire)', url: 'https://www.mediafire.com/file/inn8lf6tznv95nx/app-debug.apk/file' }],
        [{ text: '📥 تحميل VerityScope (MediaFire)', url: 'https://www.mediafire.com/file/0taluz31zdblh8y/VerityScope-v0.4.0-release.apk/file' }],
        [{ text: '🌐 استعراض البرامج على الموقع', url: 'https://zeidexsoft.com/programs' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
      ]
      await send(token, chat, text, { reply_markup: { inline_keyboard: rows } })
    } else if (data === 't:windows') {
      const text =
        '💻 <b>تطبيقات ويندوز من ZeidexSoft</b>\n\n' +
        '🔹 <b>أرشيف برو EDMS</b> (v1.0.6 - x64)\nنظام مكتبي متطور لإدارة وأرشفة الوثائق والمستندات: بحث نصي كامل، إصدارات غير قابلة للاستبدال، وسير عمل إلكتروني.'
      const rows = [
        [{ text: '📥 تحميل الإعداد (GitHub)', url: 'https://github.com/zeiad6/Edms-archive/releases/download/v1.0.6/EDMS-Archive-1.0.6-Setup-x64.exe' }],
        [{ text: '📥 مرآة التحميل (MediaFire)', url: 'https://www.mediafire.com/file/cezytgi4hqxmorc/EDMS-Archive-1.0.6-Setup-x64.exe/file' }],
        [{ text: '🌐 صفحة البرنامج على الموقع', url: 'https://zeidexsoft.com/programs/edms-archive-pro' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
      ]
      await send(token, chat, text, { reply_markup: { inline_keyboard: rows } })
    } else if (data === 't:myapps') {
      const rows = [
        [{ text: '📱 تطبيقات أندرويد', callback_data: 't:android' }, { text: '💻 تطبيقات ويندوز', callback_data: 't:windows' }],
        [{ text: '🌐 جميع البرامج على الموقع', url: 'https://zeidexsoft.com/programs' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
      ]
      await send(token, chat, '🌐 <b>برمجيات وتطبيقات موقعنا</b>\nاختر المنصة لاستعراض وتحميل التطبيقات المتاحة:', { reply_markup: { inline_keyboard: rows } })
    } else if (data === 't:donate') {
      const rows = [
        [{ text: '⭐️ تبرع بالنجوم (Telegram Stars)', callback_data: 't:don_stars' }],
        [{ text: '🏦 حسابات بنك الكريمي', callback_data: 't:don_kuraimi' }],
        [{ text: '💎 تبرع بالعملات الرقمية (Crypto)', callback_data: 't:don_crypto' }],
        [{ text: '🌐 التبرع عبر المتجر الإلكتروني', url: 'https://zeidexsoft.com/shop' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
      ]
      await send(token, chat, '💖 <b>تبرع لدعم تطوير مشاريع ZeidexSoft</b>\nاختر وسيلة الدفع التي تناسبك:', { reply_markup: { inline_keyboard: rows } })
    } else if (data === 't:don_kuraimi') {
      const text =
        '🏦 <b>حسابات بنك الكريمي للتبرع والدعم:</b>\n\n' +
        '• دولار (USD): <code>3212959129</code>\n' +
        '• ريال يمني (YER): <code>3179177535</code>\n' +
        '• ريال سعودي (SAR): <code>3212932816</code>\n\n' +
        '<i>اضغط على رقم الحساب لنسخه مباشرة. بعد التحويل يمكنك مراسلة المالك عبر البوت لتأكيد الدعم.</i>'
      const rows = [
        [{ text: '💬 إرسال إشعار للمالك', callback_data: 't:contact' }],
        [{ text: '🔙 رجوع لخيارات التبرع', callback_data: 't:donate' }]
      ]
      await send(token, chat, text, { reply_markup: { inline_keyboard: rows } })
    } else if (data === 't:don_crypto') {
      const text =
        '💎 <b>التبرع بالعملات الرقمية (TON / USDT):</b>\n\n' +
        '• يمكنك التبرع بنجوم تيليجرام وشحنها عبر TON من Fragment، أو التحويل المباشر عبر صفحة المتجر الإلكتروني.\n\n' +
        '🌐 تفضل بزيارة صفحة الدفع الرقمي على موقعنا:'
      const rows = [
        [{ text: '🌐 فتح صفحة الدفع الرقمي', url: 'https://zeidexsoft.com/shop' }],
        [{ text: '🔙 رجوع لخيارات التبرع', callback_data: 't:donate' }]
      ]
      await send(token, chat, text, { reply_markup: { inline_keyboard: rows } })
    } else if (data === 't:main') {
      let currentMenu = menu
      if (cfg.id === platformBotId(env)) {
        currentMenu = {
          inline_keyboard: [
            [{ text: '📱 تطبيقات أندرويد', callback_data: 't:android' }, { text: '💻 تطبيقات ويندوز', callback_data: 't:windows' }],
            [{ text: '🌐 تطبيقات موقعي', callback_data: 't:myapps' }, { text: '💖 تبرع', callback_data: 't:donate' }],
            ...menu.inline_keyboard
          ]
        }
      }
      await send(token, chat, esc(cfg.welcome), { reply_markup: currentMenu })
    } else if (data === 't:don_stars') {
      const rows = [
        [{ text: '⭐️ 50', callback_data: 't:don:50' }, { text: '⭐️ 100', callback_data: 't:don:100' }],
        [{ text: '⭐️ 500', callback_data: 't:don:500' }, { text: '⭐️ 1000', callback_data: 't:don:1000' }],
        [{ text: '🔙 رجوع لخيارات التبرع', callback_data: 't:donate' }]
      ]
      await send(token, chat, '⭐️ <b>اختر عدد النجوم للتبرع:</b>', { reply_markup: { inline_keyboard: rows } })
    } else if (data.startsWith('t:don:') && q.message?.chat?.type === 'private') {
      const amount = Number(data.slice(6))
      if (amount) {
        await tg(token, 'sendInvoice', {
          chat_id: chat, title: 'تبرع للمطور', description: `تبرع بقيمة ${amount} نجمة لدعمنا.`, payload: `t${cfg.id}:don:${amount}`,
          provider_token: '', currency: 'XTR', prices: [{ label: 'تبرع', amount }]
        })
      }
    } else if (data === 't:items') {
      const rows = cfg.items.map((i) => [{ text: `⭐️ ${i.stars} — ${i.title}`, callback_data: `t:buy:${i.id}` }])
      await send(token, chat, cfg.items.length ? '🛍 <b>المنتجات</b>' : 'لا منتجات بعد.', { reply_markup: { inline_keyboard: rows } })
    } else if (data === 't:faqs') {
      const rows = cfg.faqs.map((f, i) => [{ text: f.q, callback_data: `t:faq:${i}` }])
      await send(token, chat, cfg.faqs.length ? '❓ <b>الأسئلة الشائعة</b>' : 'لا أسئلة بعد.', { reply_markup: { inline_keyboard: rows } })
    } else if (data.startsWith('t:faq:')) {
      const f = cfg.faqs[Number(data.slice(6))]
      if (f) await send(token, chat, `<b>${esc(f.q)}</b>\n${esc(f.a)}`)
    } else if (data === 't:contact') {
      // force_reply, not a KV flag: a tap must cost no KV write (free tier: 1,000/day).
      await send(token, chat, CONTACT_PROMPT, { reply_markup: { force_reply: true, input_field_placeholder: 'رسالتك…' } })
    } else if (data.startsWith('t:buy:') && q.message.chat.type === 'private') {
      const item = cfg.items.find((i) => i.id === Number(data.slice(6)))
      if (item) {
        await tg(token, 'sendInvoice', {
          chat_id: chat, title: item.title, description: item.desc, payload: `t${cfg.id}:${item.id}`,
          provider_token: '', currency: 'XTR', prices: [{ label: item.title, amount: item.stars }],
        })
      }
    }
    return
  }

  const m = u.message
  if (!m?.chat || m.chat.type !== 'private') return
  const chat = m.chat.id
  const uid = m.from?.id
  const text: string = m.text ?? ''

  if (m.successful_payment) {
    // Tell both people first: a failed KV write must never hide a paid order.
    if (m.successful_payment.invoice_payload?.includes(':don:')) {
      await send(token, chat, '✅ <b>شكراً لتبرعك السخي!</b> دعمك يعني لنا الكثير.')
      await send(token, cfg.owner, `💖 تبرع جديد: ⭐️ ${m.successful_payment.total_amount} من ${esc(m.from?.first_name)} (<code>${uid}</code>)`)
    } else {
      await send(token, chat, '✅ <b>تم الدفع، شكراً لك!</b> سيتواصل معك المالك.')
      await send(token, cfg.owner, `🛒 طلب مدفوع: ⭐️ ${m.successful_payment.total_amount} من ${esc(m.from?.first_name)} (<code>${uid}</code>)`)
      cfg.orders += 1
    }
    cfg.stars += m.successful_payment.total_amount
    await save(env, cfg).catch(() => undefined)
    return
  }

  if (text.startsWith('/start')) {
    if (!isOwner(uid) && uid && !cfg.users.includes(uid) && cfg.users.length < MAX_USERS) {
      cfg.users.push(uid)
      await save(env, cfg)
    }
    if (cfg.paused && !isOwner(uid)) return void (await send(token, chat, '🛠 البوت في صيانة قصيرة — عُد بعد قليل.'))
    const hint = isOwner(uid) ? '\n\n<i>أنت المالك: /admin للوحة التحكم.</i>' : ''
    
    let currentMenu = menu
    if (cfg.id === platformBotId(env)) {
      currentMenu = {
        inline_keyboard: [
          [{ text: '📱 تطبيقات أندرويد', callback_data: 't:android' }, { text: '💻 تطبيقات ويندوز', callback_data: 't:windows' }],
          [{ text: '🌐 تطبيقات موقعي', callback_data: 't:myapps' }, { text: '💖 تبرع', callback_data: 't:donate' }],
          ...menu.inline_keyboard
        ]
      }
    }
    
    await send(token, chat, esc(cfg.welcome) + hint, { reply_markup: currentMenu })
    return
  }

  // Customer commands, BEFORE the owner branch below: an owner typing /search should get
  // search results, not silence, and a customer must reach them at all. The command word is
  // matched exactly (so "/searchx" is not a search) and a "@BotName" mention is tolerated.
  const sp = text.search(/\s/)
  const cmd = text.slice(1, sp < 0 ? undefined : sp).split('@')[0].toLowerCase()
  const arg = sp < 0 ? '' : text.slice(sp).trim()
  if (cmd === 'search') return void (await sendSearch(token, chat, cfg, arg))
  if (cmd === 'catalog') {
    const rows = cfg.items.map((i) => btnRow({ text: `⭐️ ${i.stars} — ${i.title}`, callback_data: `t:buy:${i.id}` }))
    const kb = rows.length ? [...rows, ...mainRows()] : mainRows()
    return void (await send(token, chat, rows.length ? '🛍 <b>المنتجات</b>' : 'لا منتجات بعد.', { reply_markup: { inline_keyboard: kb } }))
  }
  if (cmd === 'apps' || cmd === 'myapps') {
    const rows = [
      [{ text: '📱 تطبيقات أندرويد', callback_data: 't:android' }, { text: '💻 تطبيقات ويندوز', callback_data: 't:windows' }],
      [{ text: '🌐 جميع البرامج على الموقع', url: 'https://zeidexsoft.com/programs' }],
      [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
    ]
    return void (await send(token, chat, '🌐 <b>برمجيات وتطبيقات موقعنا</b>\nاختر المنصة لاستعراض وتحميل التطبيقات المتاحة:', { reply_markup: { inline_keyboard: rows } }))
  }
  if (cmd === 'android') {
    const text =
      '📱 <b>تطبيقات الأندرويد من ZeidexSoft</b>\n\n' +
      '1️⃣ <b>أرشيف برو EDMS</b> (v1.0.1)\nنظام إدارة وأرشفة الوثائق الإلكترونية، يعمل على الهاتف محلياً مع إمكانية المزامنة الآمنة مع الحاسوب.\n\n' +
      '2️⃣ <b>VerityScope — كاشف التزييف العميق</b> (v0.4.0)\nكشف التزييف في الصور والفيديو والنصوص والصوت بـ 5 نماذج ذكاء اصطناعي محلية + تحليلات رقمية جنائية.'
    const rows = [
      [{ text: '📥 تحميل أرشيف برو (MediaFire)', url: 'https://www.mediafire.com/file/inn8lf6tznv95nx/app-debug.apk/file' }],
      [{ text: '📥 تحميل VerityScope (MediaFire)', url: 'https://www.mediafire.com/file/0taluz31zdblh8y/VerityScope-v0.4.0-release.apk/file' }],
      [{ text: '🌐 استعراض البرامج على الموقع', url: 'https://zeidexsoft.com/programs' }],
      [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
    ]
    return void (await send(token, chat, text, { reply_markup: { inline_keyboard: rows } }))
  }
  if (cmd === 'windows') {
    const text =
      '💻 <b>تطبيقات ويندوز من ZeidexSoft</b>\n\n' +
      '🔹 <b>أرشيف برو EDMS</b> (v1.0.6 - x64)\nنظام مكتبي متطور لإدارة وأرشفة الوثائق والمستندات: بحث نصي كامل، إصدارات غير قابلة للاستبدال، وسير عمل إلكتروني.'
    const rows = [
      [{ text: '📥 تحميل الإعداد (GitHub)', url: 'https://github.com/zeiad6/Edms-archive/releases/download/v1.0.6/EDMS-Archive-1.0.6-Setup-x64.exe' }],
      [{ text: '📥 مرآة التحميل (MediaFire)', url: 'https://www.mediafire.com/file/cezytgi4hqxmorc/EDMS-Archive-1.0.6-Setup-x64.exe/file' }],
      [{ text: '🌐 صفحة البرنامج على الموقع', url: 'https://zeidexsoft.com/programs/edms-archive-pro' }],
      [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
    ]
    return void (await send(token, chat, text, { reply_markup: { inline_keyboard: rows } }))
  }
  if (cmd === 'donate') {
    const rows = [
      [{ text: '⭐️ تبرع بالنجوم (Telegram Stars)', callback_data: 't:don_stars' }],
      [{ text: '🏦 حسابات بنك الكريمي', callback_data: 't:don_kuraimi' }],
      [{ text: '💎 تبرع بالعملات الرقمية (Crypto)', callback_data: 't:don_crypto' }],
      [{ text: '🌐 التبرع عبر المتجر الإلكتروني', url: 'https://zeidexsoft.com/shop' }],
      [{ text: '🔙 القائمة الرئيسية', callback_data: 't:main' }]
    ]
    return void (await send(token, chat, '💖 <b>تبرع لدعم تطوير مشاريع ZeidexSoft</b>\nاختر وسيلة الدفع التي تناسبك:', { reply_markup: { inline_keyboard: rows } }))
  }
  if (cmd === 'help') return void (await send(token, chat, HELP_TEXT, { reply_markup: { inline_keyboard: mainRows() } }))

  if (isOwner(uid) && text.startsWith('/')) return void (await owner(env, cfg, token, chat, text))

  const isContactReply = m.reply_to_message?.from?.id === cfg.id && m.reply_to_message?.text === CONTACT_PROMPT
  if (uid && isContactReply) {
    await send(token, cfg.owner, `📩 من ${esc(m.from?.first_name)} (<code>${uid}</code>):\n${esc(text.slice(0, 2000))}\n\nللرد: <code>/reply ${uid} نص</code>`)
    await send(token, chat, '✅ وصلت رسالتك للمالك.')
    return
  }

  // A customer's plain words ARE a query: the same matcher as /search, and never a KV write.
  // Non-owners only, and never a /command — an owner command or an unknown slash command
  // stays silent as before rather than being answered with "nothing found".
  if (uid && !isOwner(uid) && text && !text.startsWith('/')) await sendSearch(token, chat, cfg, text)
}

async function owner(env: BotsEnv, cfg: Cfg, token: string, chat: number, text: string) {
  const [head, ...rest] = text.split(' ')
  const cmd = head.slice(1).split('@')[0]
  const arg = rest.join(' ').trim()
  const parts = arg.split('|').map((s) => s.trim())
  const say = (t: string) => send(token, chat, t)
  if (cmd === 'add') {
    const stars = Number(parts[1])
    if (!parts[0] || !Number.isInteger(stars) || stars < 1 || stars > 10000) return void (await say('الاستخدام: <code>/add اسم | 100 | وصف</code>'))
    if (cfg.items.length >= MAX_ITEMS) return void (await say(`الحد ${MAX_ITEMS} منتجاً.`))
    cfg.items.push({ id: Date.now() % 1e9, title: parts[0].slice(0, 32), stars, desc: (parts[2] || parts[0]).slice(0, 255) })
    await save(env, cfg)
    await say('✅ أُضيف المنتج.')
  } else if (cmd === 'items') {
    await say(cfg.items.map((i, n) => `${n + 1}. ${esc(i.title)} — ⭐️ ${i.stars}`).join('\n') || 'لا منتجات.')
  } else if (cmd === 'del' || cmd === 'delfaq') {
    const list = cmd === 'del' ? cfg.items : cfg.faqs
    const n = Number(arg)
    if (!Number.isInteger(n) || n < 1 || n > list.length) return void (await say(`الاستخدام: <code>/${cmd} رقم</code>`))
    list.splice(n - 1, 1)
    await save(env, cfg)
    await say('🗑 حُذف.')
  } else if (cmd === 'faq') {
    if (!parts[0] || !parts[1]) return void (await say('الاستخدام: <code>/faq سؤال | جواب</code>'))
    if (cfg.faqs.length >= MAX_FAQS) return void (await say(`الحد ${MAX_FAQS} سؤالاً.`))
    cfg.faqs.push({ q: parts[0].slice(0, 60), a: parts[1].slice(0, 1000) })
    await save(env, cfg)
    await say('✅ أُضيف السؤال.')
  } else if (cmd === 'faqs') {
    await say(cfg.faqs.map((f, n) => `${n + 1}. ${esc(f.q)}`).join('\n') || 'لا أسئلة.')
  } else if (cmd === 'welcome') {
    if (!arg) return void (await say('الاستخدام: <code>/welcome نص</code>'))
    cfg.welcome = arg.slice(0, 500)
    await save(env, cfg)
    await say('✅ حُدّثت رسالة الترحيب.')
  } else if (cmd === 'pause' || cmd === 'resume') {
    cfg.paused = cmd === 'pause'
    await save(env, cfg)
    await say(cfg.paused ? '⏸ البوت متوقف للعملاء.' : '▶️ عاد البوت للعمل.')
  } else if (cmd === 'admin') {
    await say(
      `<b>📊 لوحة التحكم</b>\n👥 العملاء: ${cfg.users.length}\n🧾 الطلبات: ${cfg.orders} · ⭐️ ${cfg.stars}\n` +
        `📦 المنتجات: ${cfg.items.length} · ❓ الأسئلة: ${cfg.faqs.length}\n${cfg.paused ? '⏸ في صيانة' : '▶️ يعمل'}\n\n` +
        'الأوامر: /add /items /del /faq /faqs /delfaq /welcome /pause /resume /reply\n' +
        'الترخيص: /licnew /lExtend /lRevoke /lRelease',
    )
  } else if (cmd === 'licnew') {
    // Pro licence minting. The key is shown ONCE and only its hash is stored, so this reply is the
    // only moment the plaintext exists anywhere — losing it means reissuing, not recovering.
    //
    // Split on whitespace, NOT the `|` delimiter the shop commands above use. Those take
    // `/add name | price | desc`; the licence commands are positional (`/licnew seats days count`),
    // and reusing `parts` here silently defaulted seats to 1 while the help text promised otherwise.
    const a = arg.split(/\s+/).filter(Boolean)
    const seats = Number(a[0] ?? 1)
    const days = Number(a[1] ?? 365)
    const count = Math.min(Math.max(Math.trunc(Number(a[2] ?? 1)), 1), 20)
    if (!Number.isInteger(seats) || seats < 1 || seats > 8 || !Number.isInteger(days)) {
      return void (await say('الاستخدام: <code>/licnew [أجهزة] [أيام] [عدد] [ملاحظة]</code>\nمثال: <code>/licnew 2 365 1</code>\n(0 أيام = دائم)'))
    }
    if (!env.LICENSE_SIGNING_KEY) return void (await say('⚠️ <code>LICENSE_SIGNING_KEY</code> غير مُعدّ.'))
    const note = a.slice(3).join(' ')
    const lines: string[] = []
    for (let i = 0; i < count; i++) {
      const { key, license } = await issueLicense(env, {
        seats, days, tg: 0, ...(note ? { note } : {}),
      })
      lines.push(`🔑 <code>${esc(key)}</code>\n   المعرّف: <code>${license.id}</code> · ${seats} جهاز · ${days === 0 ? 'دائم' : `${days} يوم`}`)
    }
    await say(`<b>✅ مفاتيح Pro</b>\n\n${lines.join('\n\n')}\n\n⚠️ انسخ المفتاح الآن — يُحفظ بصيغة مُجزّأة فقط، ولا يمكن استرجاع نصّه.`)
  } else if (cmd === 'licextend' || cmd === 'lExtend') {
    await licenseOp(env, say, 'extend', arg, 'لتمديد المدة')
  } else if (cmd === 'licrevoke' || cmd === 'lRevoke') {
    await licenseOp(env, say, 'revoke', arg, 'إبطال الترخيص')
  } else if (cmd === 'licrelease' || cmd === 'lRelease') {
    await licenseOp(env, say, 'release', arg, 'تحرير مقعد جهاز')
  } else if (cmd === 'reply') {
    const [target, ...words] = arg.split(' ')
    if (!/^\d+$/.test(target) || !words.length) return void (await say('الاستخدام: <code>/reply رقم_العميل نص</code>'))
    const r = await send(token, Number(target), `💬 رد المالك:\n${esc(words.join(' ').slice(0, 2000))}`)
    await say(r.ok ? '✅ أُرسل.' : 'تعذّر الإرسال.')
  }
}

/**
 * Owner-facing licence operations, funnelled through the same store the admin API uses.
 *
 * These read and write KV directly rather than calling the HTTP admin API: the Worker calling itself
 * over the network to perform a KV write would be slower, costlier and one more thing that can fail
 * while a customer waits. The authorisation is the same — only the bot owner reaches this function.
 */
async function licenseOp(
  env: BotsEnv,
  say: (t: string) => Promise<{ ok: boolean }>,
  action: 'extend' | 'revoke' | 'release',
  arg: string,
  label: string,
) {
  // The command the owner actually types, so the usage line can be copy-pasted. Derived from the
  // action because every action is exposed under a short name the operator will remember.
  const command = action === 'extend' ? 'lExtend' : action === 'revoke' ? 'lRevoke' : 'lRelease'
  const parts = arg.split(/\s+/).filter(Boolean)
  const [id, ...rest] = parts
  if (!/^[0-9a-f]{10}$/.test(id ?? '')) {
    return void (await say(`الاستخدام: <code>/${command} ${id ? '' : '&lt;المعرّف&gt;'}…</code>\n${label}\nمثال: <code>/${command} a1b2c3d4e5 30</code>`))
  }
  const kh = await env.DOWNLOADS.get(`licid:${id}`)
  if (!kh) return void (await say('❌ لا يوجد ترخيص بهذا المعرّف.'))
  const raw = await env.DOWNLOADS.get(`lic:${kh}`)
  if (!raw) return void (await say('❌ سجل الترخيص مفقود.'))
  const lic = JSON.parse(raw) as {
    id: string; seats: number; exp: number; revoked: number
    dev: { pk: string; fp: string; at: number; seen: number; strong: number }[]
  }

  if (action === 'extend') {
    const days = Math.trunc(Number(rest[0]))
    if (!Number.isInteger(days) || days === 0) return void (await say('الاستخدام: <code>/lExtend معرّف أيام</code>'))
    const base = lic.exp && lic.exp > Date.now() / 1000 ? lic.exp : Math.floor(Date.now() / 1000)
    lic.exp = base + days * 86400
    await env.DOWNLOADS.put(`lic:${kh}`, JSON.stringify(lic))
    return void (await say(`✅ مُدّد <code>${lic.id}</code> حتى ${new Date(lic.exp * 1000).toISOString().slice(0, 10)}`))
  }

  if (action === 'revoke') {
    if (!lic.revoked) {
      lic.revoked = Math.floor(Date.now() / 1000)
      await env.DOWNLOADS.put(`lic:${kh}`, JSON.stringify(lic))
    }
    return void (await say(`🚫 أُبطِل <code>${lic.id}</code>. سيتوقف عند أول اتصال.`))
  }

  const fp = (rest[0] ?? '').toLowerCase()
  if (!/^[0-9a-f]{8}$/.test(fp)) {
    const used = lic.dev.length
    return void (await say(
      `المقاعد المستخدمة: ${used}/${lic.seats}\n` +
      (lic.dev.length
        ? lic.dev.map((d, i) => `${i + 1}. <code>${esc(d.fp)}</code>${d.strong ? ' 🔒' : ''} · ${new Date(d.at * 1000).toISOString().slice(0, 10)}`).join('\n')
        : 'لا أجهزة.') +
      `\n\nللتحرير: <code>/lRelease ${lic.id} ${esc(lic.dev[0]?.fp ?? '')}</code>`,
    ))
  }
  const before = lic.dev.length
  lic.dev = lic.dev.filter((d) => d.fp !== fp)
  if (lic.dev.length === before) return void (await say('❌ لا يوجد جهاز بهذه البصمة.'))
  await env.DOWNLOADS.put(`lic:${kh}`, JSON.stringify(lic))
  return void (await say(`✅ حُرّر مقعد الجهاز <code>${esc(fp)}</code>. المتبقي ${lic.dev.length}/${lic.seats}`))
}

// ── admin API (provisioning) ────────────────────────────────────────
function adminOk(request: Request, env: BotsEnv) {
  const auth = request.headers.get('authorization') ?? ''
  return !!env.BOTS_ADMIN_TOKEN && auth.startsWith('Bearer ') && safeEqual(auth.slice(7), env.BOTS_ADMIN_TOKEN)
}

export async function botsAdmin(request: Request, env: BotsEnv, url: URL): Promise<Response> {
  if (!env.BOTS_KEY || !env.BOTS_ADMIN_TOKEN) return new Response('not configured', { status: 503 })
  if (!adminOk(request, env)) return new Response('forbidden', { status: 403 })
  const id = url.pathname.split('/')[3]
  if (id && !/^\d{4,15}$/.test(id)) return new Response('bad id', { status: 400 })

  if (request.method === 'POST' && !id) {
    const body = (await request.json().catch(() => ({}))) as { token?: string; owner_id?: number; welcome?: string }
    const token = String(body.token ?? '')
    if (!/^\d{6,12}:[A-Za-z0-9_-]{30,50}$/.test(token) || !Number.isInteger(body.owner_id)) return new Response('bad request', { status: 400 })
    const me = await tg(token, 'getMe', {})
    if (!me.ok) return new Response('invalid token', { status: 400 })
    const secret = await webhookSecret(env, me.result.id)
    // Re-provisioning (new token, new owner) keeps the shop: products, FAQs, customers.
    const prev = await load(env, String(me.result.id))
    const cfg: Cfg = {
      items: [], faqs: [], users: [], orders: 0, stars: 0, paused: false, created: new Date().toISOString(),
      welcome: (body.welcome || `أهلاً بك في ${me.result.first_name} 👋`).slice(0, 500),
      ...(prev ?? {}),
      id: me.result.id, username: me.result.username, owner: body.owner_id!, token: await seal(env, token), secret,
    }
    await save(env, cfg)
    const hook = await tg(token, 'setWebhook', {
      url: `${ORIGIN}/tg/${cfg.id}`, secret_token: secret, drop_pending_updates: true,
      // One update at a time per bot: each update rewrites the whole KV record, so parallel
      // deliveries would overwrite each other (a product added during a /start vanishes).
      max_connections: 1,
      allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
    })
    if (!hook.ok) return Response.json({ error: hook.description }, { status: 502 })
    // The customer's three entry points, so the Telegram "/" menu offers them without typing.
    await tg(token, 'setMyCommands', {
      commands: [
        { command: 'start', description: 'القائمة الرئيسية' },
        { command: 'search', description: 'ابحث في المنتجات' },
        { command: 'catalog', description: 'كل المنتجات' },
        { command: 'help', description: 'المساعدة' },
      ],
    })
    await send(token, cfg.owner, `🚀 <b>بوتك @${esc(cfg.username)} يعمل الآن على سحابة ZeidexSoft</b>\nافتحه وأرسل /admin للوحة التحكم.`)
    return Response.json({ bot_id: cfg.id, username: cfg.username })
  }

  if (request.method === 'GET' && !id) {
    // ponytail: no KV list() on this binding type; the main bot keeps the index (hosted_bots).
    return new Response('use /admin/bots/<id>', { status: 400 })
  }

  if (request.method === 'GET' && id) {
    const cfg = await load(env, id)
    if (!cfg) return new Response('not found', { status: 404 })
    return Response.json({ id: cfg.id, username: cfg.username, owner: cfg.owner, users: cfg.users.length, orders: cfg.orders, stars: cfg.stars, paused: cfg.paused })
  }

  if (request.method === 'DELETE' && id) {
    const cfg = await load(env, id)
    if (!cfg) return new Response('not found', { status: 404 })
    await tg(await open(env, cfg.token), 'deleteWebhook', { drop_pending_updates: true })
    await env.DOWNLOADS.delete(`tb:${id}`)
    return Response.json({ deleted: Number(id) })
  }
  return new Response('method not allowed', { status: 405 })
}
