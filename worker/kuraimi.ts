// Kuraimi Bank E-Pay (Haseb / KJ / Mfloos) + LikeCard wholesale codes, website only.
//
// Why the website and not the bot: inside Telegram, digital goods must be paid in Stars,
// and a payment PIN typed into a chat would sit in the chat history. Here the PIN goes
// over HTTPS straight to the bank, once, and is never stored or logged.
//
// Flow (matches the bank's E-Pay API as used by github.com/al-saloul/kurimibanck):
//   1. buyer enters Kuraimi mobile + payment PIN on /shop/<sku>
//   2. POST /api/pay/kuraimi  → we record the order as "charging", then call
//      {base}/alk-payments-exp/v1/PHEPaymentAPI/EPayment/SendPayment
//   3. the bank calls POST /api/pay/kuraimi/check-user (Basic auth) to confirm the
//      customer; we answer Code 1 for a valid mobile in the configured currency zone
//   4. SendPayment answers Code 1 → paid. If the SKU maps to a LikeCard product, we buy
//      the code (create_order, referenceId = our REFNO) and return it; otherwise the admin
//      is notified to deliver the service by hand.
//
// Everything is off until the secrets exist: KURAIMI_BASE_URL, KURAIMI_USERNAME,
// KURAIMI_PASSWORD, KURAIMI_WEBHOOK_USER, KURAIMI_WEBHOOK_PASS, KURAIMI_YER_PER_USD
// (+ optional LIKECARD_* and SUPPLIER_PRODUCTS="sku=productId,…").
// Field names follow that open-source client; confirm them against the contract the bank
// gives you at merchant onboarding before going live.

type KV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

type Limiter = { limit(opts: { key: string }): Promise<{ success: boolean }> }

export type KuraimiEnv = {
  DOWNLOADS: KV
  PAY_LIMITER?: Limiter
  ASSETS: { fetch(request: Request | URL): Promise<Response> }
  BOT_TOKEN?: string
  ADMIN_CHAT_IDS?: string
  KURAIMI_BASE_URL?: string
  KURAIMI_USERNAME?: string
  KURAIMI_PASSWORD?: string
  KURAIMI_WEBHOOK_USER?: string
  KURAIMI_WEBHOOK_PASS?: string
  KURAIMI_YER_PER_USD?: string
  KURAIMI_CURRENCY_ZONE?: string // old | new | all
  LIKECARD_DEVICE_ID?: string
  LIKECARD_EMAIL?: string
  LIKECARD_PASSWORD?: string
  LIKECARD_SECURITY_CODE?: string
  LIKECARD_PHONE?: string
  LIKECARD_HASH_KEY?: string
  SUPPLIER_PRODUCTS?: string
}

const MOBILE = /^7\d{8}$/ // Yemeni mobile, as the bank's KJ/Mfloos apps use it
const PIN = /^\d{4,8}$/
const ORDER_TTL_S = 30 * 24 * 3600
const RATE_LIMIT = 3 // per IP per 10 minutes — a PIN form must not be brute-forceable
// Per target mobile: after this many bank refusals in a day the number is locked here,
// whatever IP the attempts come from. PIN guessing needs many tries; this allows three.
const MOBILE_FAILURES_PER_DAY = 3
const ZONES: Record<string, string[]> = {
  old: ['YE0012003', 'YE0012004', 'YE0012005'],
  new: ['YE0012006', 'YE0012007', 'YE0012008', 'YE0012009'],
}

export const kuraimiReady = (env: KuraimiEnv) =>
  Boolean(env.KURAIMI_BASE_URL && env.KURAIMI_USERNAME && env.KURAIMI_PASSWORD && Number(env.KURAIMI_YER_PER_USD) > 0)

const likecardReady = (env: KuraimiEnv) =>
  Boolean(env.LIKECARD_DEVICE_ID && env.LIKECARD_EMAIL && env.LIKECARD_PASSWORD && env.LIKECARD_SECURITY_CODE && env.LIKECARD_PHONE && env.LIKECARD_HASH_KEY)

/** Whole rials, rounded up so rounding never under-charges. */
export const yerAmount = (usd: number, rate: number) => Math.ceil(usd * rate)

/** Constant-time string compare (credentials, signatures). */
export function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

export function basicAuthOk(header: string | null, user?: string, pass?: string) {
  if (!header?.startsWith('Basic ') || !user || !pass) return false
  let decoded = ''
  try {
    // atob yields Latin-1 code units; decode them as UTF-8 so non-ASCII passwords match.
    decoded = new TextDecoder().decode(Uint8Array.from(atob(header.slice(6).trim()), (c) => c.charCodeAt(0)))
  } catch {
    return false
  }
  const i = decoded.indexOf(':')
  return i > 0 && safeEqual(decoded.slice(0, i), user) && safeEqual(decoded.slice(i + 1), pass)
}

export function supplierProductFor(env: KuraimiEnv, sku: string): number | null {
  for (const pair of (env.SUPPLIER_PRODUCTS ?? '').split(',')) {
    const [k, v] = pair.split('=').map((s) => s.trim())
    if (k === sku && /^\d+$/.test(v ?? '')) return Number(v)
  }
  return null
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** LikeCard create_order. Returns the first card code, or null on any failure. */
export async function buyCode(env: KuraimiEnv, productId: number, referenceId: string) {
  const time = String(Math.floor(Date.now() / 1000))
  const form = new FormData()
  const fields: Record<string, string> = {
    deviceId: env.LIKECARD_DEVICE_ID!,
    email: env.LIKECARD_EMAIL!,
    password: env.LIKECARD_PASSWORD!,
    securityCode: env.LIKECARD_SECURITY_CODE!,
    langId: '1',
    productId: String(productId),
    referenceId, // = our REFNO: a retried call can never buy a second code
    quantity: '1',
    time,
    hash: await sha256Hex(time + env.LIKECARD_EMAIL!.toLowerCase() + env.LIKECARD_PHONE! + env.LIKECARD_HASH_KEY!),
  }
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  try {
    const res = await fetch('https://taxes.like4app.com/online/create_order', { method: 'POST', body: form })
    const data = (await res.json()) as { response?: number; serials?: { serialCode?: string }[]; cards?: { code?: string }[] }
    if (data.response !== 1) return null
    return data.serials?.[0]?.serialCode ?? data.cards?.[0]?.code ?? null
  } catch {
    return null
  }
}

const escapeHtml = (s: unknown) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

async function notifyAdmins(env: KuraimiEnv, text: string) {
  if (!env.BOT_TOKEN || !env.ADMIN_CHAT_IDS) return
  await Promise.all(
    env.ADMIN_CHAT_IDS.split(',').map((chat_id) =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat_id.trim(), text, parse_mode: 'HTML' }),
      }).catch(() => undefined),
    ),
  )
}

/** GET /api/pay/kuraimi/status — lets the website show the tab only when it works. */
export function kuraimiStatus(env: KuraimiEnv) {
  return Response.json(
    { enabled: kuraimiReady(env), yer_per_usd: kuraimiReady(env) ? Number(env.KURAIMI_YER_PER_USD) : null },
    { headers: { 'cache-control': 'public, max-age=300' } },
  )
}

/** POST /api/pay/kuraimi/check-user — called by the bank, Basic auth. */
export async function kuraimiCheckUser(request: Request, env: KuraimiEnv) {
  if (!basicAuthOk(request.headers.get('authorization'), env.KURAIMI_WEBHOOK_USER, env.KURAIMI_WEBHOOK_PASS)) {
    return Response.json({ success: false, error: 'Forbidden. Unauthenticated.' }, { status: 403 })
  }
  const body = (await request.json().catch(() => ({}))) as { MobileNo?: string; CustomerZone?: string }
  const mobile = String(body.MobileNo ?? '')
  const zone = String(body.CustomerZone ?? '')
  const zoneSetting = env.KURAIMI_CURRENCY_ZONE ?? 'old'
  const zones = zoneSetting === 'all' ? [...ZONES.old, ...ZONES.new] : (ZONES[zoneSetting] ?? [])
  // No per-checkout lookup: KV takes up to a minute to reach the bank's edge location, so a
  // "pending" marker made real payments fail at random. The PIN is what authorises payment.
  const known = MOBILE.test(mobile) && zones.includes(zone)
  return Response.json(
    known
      ? { Code: '1', SCustID: mobile, DescriptionAr: 'تم التحقق من تفاصيل العميل بنجاح', DescriptionEn: 'Customer details verified successfully' }
      : { Code: '2', SCustID: null, DescriptionAr: 'تفاصيل العميل غير صالحة', DescriptionEn: 'Invalid customer details' },
  )
}

type Product = { sku: string; title: string; usd: number }
type Stored = {
  status: 'charging' | 'paid' | 'failed' | 'unknown'
  sku: string
  yer: number
  bankRef?: string
  code?: string | null
}

/** POST /api/pay/kuraimi — the website checkout. Same-origin, rate limited, idempotent. */
export async function kuraimiPay(request: Request, env: KuraimiEnv): Promise<Response> {
  if (!kuraimiReady(env)) return new Response('kuraimi not configured', { status: 503 })
  const url = new URL(request.url)
  if (request.headers.get('origin') !== url.origin) return new Response('forbidden', { status: 403 })

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  // Burst limit that is atomic per location (Workers rate-limit binding); the KV counter
  // below only adds the longer 10-minute window.
  if (env.PAY_LIMITER && !(await env.PAY_LIMITER.limit({ key: ip })).success) {
    return new Response('too many requests', { status: 429 })
  }
  const rlKey = `krl:${ip}`
  const hits = Number((await env.DOWNLOADS.get(rlKey)) ?? '0')
  if (hits >= RATE_LIMIT) return new Response('too many requests', { status: 429 })
  await env.DOWNLOADS.put(rlKey, String(hits + 1), { expirationTtl: 600 })

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const sku = String(body.sku ?? '')
  const mobile = String(body.mobile ?? '').replace(/\D/g, '').replace(/^967/, '')
  const pin = String(body.pin ?? '')
  const key = String(body.idempotency_key ?? '')
  if (!MOBILE.test(mobile) || !PIN.test(pin) || !/^[A-Za-z0-9-]{16,64}$/.test(key)) {
    return new Response('bad request', { status: 400 })
  }

  // One checkout = one REFNO. A double tap or a retried request returns the first result
  // instead of charging again. ponytail: KV is eventually consistent, so two requests in
  // the same instant could both pass this check; move to a Durable Object if that matters.
  const refno = `ZX${(await sha256Hex(key)).slice(0, 14).toUpperCase()}`
  const previous = await env.DOWNLOADS.get(`kref:${refno}`)
  if (previous) return Response.json({ refno, ...(JSON.parse(previous) as Stored) })

  const failKey = `kfail:${mobile}`
  if (Number((await env.DOWNLOADS.get(failKey)) ?? '0') >= MOBILE_FAILURES_PER_DAY) {
    return new Response('mobile locked for today', { status: 423 })
  }

  const catalog = (await (await env.ASSETS.fetch(new URL('/store/catalog.json', url))).json()) as { products: Product[] }
  const product = catalog.products.find((p) => p.sku === sku)
  if (!product?.usd) return new Response('unknown product', { status: 400 })
  const yer = yerAmount(product.usd, Number(env.KURAIMI_YER_PER_USD))

  // Written before the bank call: a retry with the same key now finds "charging" and never
  // sends SendPayment a second time.
  await env.DOWNLOADS.put(`kref:${refno}`, JSON.stringify({ status: 'charging', sku, yer } satisfies Stored), { expirationTtl: ORDER_TTL_S })
  let bank: { Code?: number | string; ResultSet?: { PH_REF_NO?: string }; MessageDesc?: string } = {}
  try {
    const res = await fetch(`${env.KURAIMI_BASE_URL!.replace(/\/$/, '')}/alk-payments-exp/v1/PHEPaymentAPI/EPayment/SendPayment`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${btoa(`${env.KURAIMI_USERNAME}:${env.KURAIMI_PASSWORD}`)}`,
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({ SCustID: mobile, REFNO: refno, AMOUNT: yer, CRCY: 'YER', MRCHNTNAME: 'ZeidexSoft', PINPASS: btoa(pin) }),
    })
    bank = await res.json()
  } catch {
    // Timeout or non-JSON: the bank may have charged. Never report this as a failure.
    const unknown: Stored = { status: 'unknown', sku, yer }
    await env.DOWNLOADS.put(`kref:${refno}`, JSON.stringify(unknown), { expirationTtl: ORDER_TTL_S }).catch(() => undefined)
    await notifyAdmins(env, `⚠️ <b>دفع الكريمي غير مؤكد</b>\nالطلب: <code>${refno}</code>\nالجوال: <code>${mobile}</code>\nالمبلغ: ${yer} ريال\nتحقق من البنك قبل أي إجراء.`)
    return Response.json({ refno, ...unknown }, { status: 202 })
  }

  if (String(bank.Code) !== '1') {
    const failed: Stored = { status: 'failed', sku, yer }
    const fails = Number((await env.DOWNLOADS.get(failKey)) ?? '0') + 1
    await env.DOWNLOADS.put(failKey, String(fails), { expirationTtl: 86400 }).catch(() => undefined)
    await env.DOWNLOADS.put(`kref:${refno}`, JSON.stringify(failed), { expirationTtl: 600 }).catch(() => undefined)
    return Response.json({ refno, ...failed, message: bank.MessageDesc ?? null }, { status: 402 })
  }

  const supplierId = supplierProductFor(env, sku)
  const code = supplierId && likecardReady(env) ? await buyCode(env, supplierId, refno) : null
  const stored: Stored = { status: 'paid', sku, yer, bankRef: bank.ResultSet?.PH_REF_NO, code }

  // Admins first: if the KV write below fails, a paid order is still never lost.
  await notifyAdmins(
    env,
    `🏦 <b>دفع الكريمي ناجح</b>\nالطلب: <code>${refno}</code>\nالمنتج: ${escapeHtml(product.title)}\nالمبلغ: ${yer.toLocaleString('en-US')} ريال\nمرجع البنك: <code>${escapeHtml(stored.bankRef ?? '—')}</code>\n` +
      (supplierId
        ? code
          ? 'الكود سُلّم تلقائياً من LikeCard.'
          : '⚠️ <b>فشل شراء الكود من LikeCard</b> — سلّمه يدوياً أو اعكس الدفعة.'
        : 'سلّم الخدمة يدوياً للعميل.'),
  )
  await env.DOWNLOADS.put(`kref:${refno}`, JSON.stringify(stored), { expirationTtl: ORDER_TTL_S }).catch(() => undefined)
  return Response.json({ refno, ...stored })
}
