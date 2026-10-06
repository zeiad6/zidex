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
}

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
const MAX_ITEMS = 30
const MAX_FAQS = 30
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
  return (await res.json()) as { ok: boolean; result?: any; description?: string }
}
const send = (token: string, chat_id: number, text: string, extra: Record<string, unknown> = {}) =>
  tg(token, 'sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra })

const load = async (env: BotsEnv, id: string) => {
  const raw = await env.DOWNLOADS.get(`tb:${id}`)
  return raw ? (JSON.parse(raw) as Cfg) : null
}
const save = (env: BotsEnv, cfg: Cfg) => env.DOWNLOADS.put(`tb:${cfg.id}`, JSON.stringify(cfg))

const CONTACT_PROMPT = 'اكتب رسالتك للمالك ردّاً على هذه الرسالة.'

const menu = { inline_keyboard: [[{ text: '🛍 المنتجات', callback_data: 't:items' }, { text: '❓ الأسئلة', callback_data: 't:faqs' }], [{ text: '💬 راسل المالك', callback_data: 't:contact' }]] }

// ── webhook ─────────────────────────────────────────────────────────
export async function botWebhook(request: Request, env: BotsEnv, id: string): Promise<Response> {
  if (!env.BOTS_KEY) return new Response('not configured', { status: 503 })
  // Wrong secret: 200 with nothing (no retries), and no KV read or decryption at all.
  if (!safeEqual(request.headers.get('x-telegram-bot-api-secret-token') ?? '', await webhookSecret(env, id))) {
    return new Response('ok')
  }
  const cfg = await load(env, id)
  if (!cfg) return new Response('ok')
  const update = (await request.json().catch(() => ({}))) as Record<string, any>
  const from = update.message?.from ?? update.callback_query?.from ?? update.pre_checkout_query?.from
  // Payments are never throttled: Telegram has already taken the Stars.
  const payment = update.pre_checkout_query || update.message?.successful_payment
  if (from && from.id !== cfg.owner && env.BOT_LIMITER && !payment) {
    if (!(await env.BOT_LIMITER.limit({ key: `${id}:${from.id}` })).success) return new Response('ok')
  }
  try {
    await handle(env, cfg, await open(env, cfg.token), update)
  } catch {
    // A bad update (or a rotated key) must never make Telegram retry it forever.
  }
  return new Response('ok')
}

async function handle(env: BotsEnv, cfg: Cfg, token: string, u: Record<string, any>) {
  const isOwner = (uid?: number) => uid === cfg.owner

  if (u.pre_checkout_query) {
    const q = u.pre_checkout_query
    const itemId = Number(String(q.invoice_payload).split(':')[1])
    const item = cfg.items.find((i) => i.id === itemId)
    const ok = !cfg.paused && String(q.invoice_payload).startsWith(`t${cfg.id}:`) && !!item && item.stars === q.total_amount && q.currency === 'XTR'
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
    if (data === 't:items') {
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
    await send(token, chat, '✅ <b>تم الدفع، شكراً لك!</b> سيتواصل معك المالك.')
    await send(token, cfg.owner, `🛒 طلب مدفوع: ⭐️ ${m.successful_payment.total_amount} من ${esc(m.from?.first_name)} (<code>${uid}</code>)`)
    cfg.orders += 1
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
    await send(token, chat, esc(cfg.welcome) + hint, { reply_markup: menu })
    return
  }

  if (isOwner(uid) && text.startsWith('/')) return void (await owner(env, cfg, token, chat, text))

  if (uid && m.reply_to_message?.from?.id === cfg.id && m.reply_to_message?.text === CONTACT_PROMPT) {
    await send(token, cfg.owner, `📩 من ${esc(m.from?.first_name)} (<code>${uid}</code>):\n${esc(text.slice(0, 2000))}\n\nللرد: <code>/reply ${uid} نص</code>`)
    await send(token, chat, '✅ وصلت رسالتك للمالك.')
  }
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
        'الأوامر: /add /items /del /faq /faqs /delfaq /welcome /pause /resume /reply',
    )
  } else if (cmd === 'reply') {
    const [target, ...words] = arg.split(' ')
    if (!/^\d+$/.test(target) || !words.length) return void (await say('الاستخدام: <code>/reply رقم_العميل نص</code>'))
    const r = await send(token, Number(target), `💬 رد المالك:\n${esc(words.join(' ').slice(0, 2000))}`)
    await say(r.ok ? '✅ أُرسل.' : 'تعذّر الإرسال.')
  }
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
    await tg(token, 'setMyCommands', { commands: [{ command: 'start', description: 'القائمة الرئيسية' }] })
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
