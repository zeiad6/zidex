// Website orders for payment methods other than Telegram Stars (TON, USDT, PayPal, card).
// Inside Telegram digital goods must be paid in Stars; outside it, on this site, the buyer
// may pay another way and report the payment here. The order is stored in KV and every
// admin gets a Telegram message to verify it by hand.
//
// ponytail: verification is manual. Automate per method once volume justifies it
// (tonapi transaction lookup by comment, Stripe/PayPal webhooks).

type KV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}
export type OrdersEnv = {
  DOWNLOADS: KV
  ORDER_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> }
  ASSETS: { fetch(request: Request | URL): Promise<Response> }
  BOT_TOKEN?: string
  ADMIN_CHAT_IDS?: string
}

type Product = { sku: string; title: string; stars: number; usd: number }

const METHODS = new Set(['ton', 'usdt', 'paypal', 'card', 'kuraimi_transfer'])
const MAX_BODY = 2048
const RATE_LIMIT = 5
const RATE_WINDOW_S = 600
const ORDER_TTL_S = 90 * 24 * 3600

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

async function catalog(env: OrdersEnv, url: URL): Promise<Product[]> {
  const res = await env.ASSETS.fetch(new URL('/store/catalog.json', url))
  return ((await res.json()) as { products: Product[] }).products
}

async function notifyAdmins(env: OrdersEnv, text: string) {
  if (!env.BOT_TOKEN || !env.ADMIN_CHAT_IDS) return false
  const ids = env.ADMIN_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean)
  const sent = await Promise.all(
    ids.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      }).then((r) => r.ok, () => false),
    ),
  )
  return sent.some(Boolean)
}

export async function createOrder(request: Request, env: OrdersEnv): Promise<Response> {
  const url = new URL(request.url)
  if (request.headers.get('origin') !== url.origin) return new Response('forbidden', { status: 403 })

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  if (env.ORDER_LIMITER && !(await env.ORDER_LIMITER.limit({ key: ip })).success) {
    return new Response('too many requests', { status: 429 })
  }
  const rlKey = `orl:${ip}`
  const hits = Number((await env.DOWNLOADS.get(rlKey)) ?? '0')
  if (hits >= RATE_LIMIT) return new Response('too many requests', { status: 429 })
  await env.DOWNLOADS.put(rlKey, String(hits + 1), { expirationTtl: RATE_WINDOW_S })

  const raw = await request.text()
  if (raw.length > MAX_BODY) return new Response('payload too large', { status: 413 })
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return new Response('bad request', { status: 400 })
  }
  const sku = clean(body.sku, 64)
  const method = clean(body.method, 16)
  const contact = clean(body.contact, 120)
  const reference = clean(body.reference, 200)
  if (!METHODS.has(method) || contact.length < 3) return new Response('bad request', { status: 400 })

  const product = (await catalog(env, url)).find((p) => p.sku === sku)
  if (!product) return new Response('unknown product', { status: 400 })

  const id = `ZX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const order = { id, sku, method, contact, reference, usd: product.usd, ts: new Date().toISOString() }
  await env.DOWNLOADS.put(`order:${id}`, JSON.stringify(order), { expirationTtl: ORDER_TTL_S })

  const notified = await notifyAdmins(
    env,
    '🌐 <b>طلب من الموقع — بانتظار التحقق</b>\n' +
      `الطلب: <code>${id}</code>\n` +
      `المنتج: ${escapeHtml(product.title)} — $${product.usd}\n` +
      `الطريقة: ${method.toUpperCase()}\n` +
      `التواصل: ${escapeHtml(contact)}\n` +
      `المرجع: <code>${escapeHtml(reference || '—')}</code>`,
  )
  return Response.json({ id, notified }, { headers: { 'cache-control': 'no-store' } })
}

/** TON price in USD for the TON method, cached five minutes at the edge.
 *  Sources in order; tonapi rejects some edge egress, so it is not the only one. */
/** Safe deep read of untyped JSON: at(d, 'data', 0, 'last'). */
const at = (value: unknown, ...path: (string | number)[]): unknown =>
  path.reduce<unknown>((v, k) => (v !== null && typeof v === 'object' ? (v as Record<string | number, unknown>)[k] : undefined), value)
const num = (v: unknown) => Number(v) || undefined

const RATE_SOURCES: [string, (d: unknown) => number | undefined][] = [
  // Exchange tickers first: tonapi, CoinGecko and Binance rate-limit or block the shared
  // Cloudflare egress (429/403 seen 2026-10-06), so they are only the last resort.
  ['https://www.okx.com/api/v5/market/ticker?instId=TON-USDT', (d) => num(at(d, 'data', 0, 'last'))],
  ['https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=TON-USDT', (d) => num(at(d, 'data', 'price'))],
  ['https://api.kraken.com/0/public/Ticker?pair=TONUSD', (d) => num(at(Object.values((at(d, 'result') as object) ?? {})[0], 'c', 0))],
  ['https://min-api.cryptocompare.com/data/price?fsym=TON&tsyms=USD', (d) => num(at(d, 'USD'))],
  ['https://tonapi.io/v2/rates?tokens=ton&currencies=usd', (d) => num(at(d, 'rates', 'TON', 'prices', 'USD'))],
  ['https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd', (d) => num(at(d, 'the-open-network', 'usd'))],
]

export async function tonRate(): Promise<Response> {
  for (const [url, pick] of RATE_SOURCES) {
    try {
      const res = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'zeidexsoft.com/1.0' },
        cf: { cacheTtl: 300, cacheEverything: true },
      } as RequestInit)
      if (!res.ok) continue
      const usd = pick(await res.json())
      if (usd && usd > 0) {
        return Response.json({ ton_usd: usd }, { headers: { 'cache-control': 'public, max-age=300' } })
      }
    } catch {
      // next source
    }
  }
  return new Response('rate unavailable', { status: 502 })
}
