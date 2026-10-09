// The store's front desk on WhatsApp — official Meta Cloud API, webhooks on this Worker.
//
// Meta calls GET /api/wa once to verify the webhook (hub.verify_token), then POSTs every
// message signed with the app secret (X-Hub-Signature-256 over the RAW body). Nothing is
// read or answered before that signature checks out.
//
// The replies are built from the same /store/catalog.json and /store/apps.json the Mini App
// shows, so WhatsApp can never advertise something the store does not have. Buying stays in
// Telegram (Stars): WhatsApp only points there.
//
// Secrets (wrangler secret put): WA_VERIFY_TOKEN, WA_APP_SECRET, WA_TOKEN, WA_PHONE_ID.
// Optional var: WA_GRAPH_VERSION — Meta retires Graph versions after about two years.
import { safeEqual } from './bots'

export type WhatsAppEnv = {
  ASSETS: { fetch(input: Request | URL | string): Promise<Response> }
  WA_VERIFY_TOKEN?: string
  WA_APP_SECRET?: string
  WA_TOKEN?: string
  WA_PHONE_ID?: string
  WA_GRAPH_VERSION?: string
}

const ORIGIN = 'https://zeidexsoft.com'
const DEFAULT_GRAPH_VERSION = 'v23.0'
const MAX_LISTED = 8

type Product = { title: string; stars: number }
type App = { name: string; version: string; platform: string; downloads: { href: string }[] }
type Catalog = { bot: string; products: Product[] }

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  return Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function json<T>(env: WhatsAppEnv, path: string): Promise<T | null> {
  try {
    const res = await env.ASSETS.fetch(new Request(`${ORIGIN}${path}`))
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

async function graph(env: WhatsAppEnv, message: Record<string, unknown>) {
  const version = env.WA_GRAPH_VERSION || DEFAULT_GRAPH_VERSION
  await fetch(`https://graph.facebook.com/${version}/${env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.WA_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...message }),
  })
}

const text = (to: string, body: string) => ({ to, type: 'text', text: { body: body.slice(0, 4096), preview_url: true } })

/** Three reply buttons is WhatsApp's limit, and each title is at most 20 characters. */
const menu = (to: string) => ({
  to,
  type: 'interactive',
  interactive: {
    type: 'button',
    body: { text: 'أهلاً بك في ZeidexSoft 👋\nبوتات متاجر على تيليجرام، وتطبيقات مجانية. اختر:' },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'shop', title: '🛍 المنتجات' } },
        { type: 'reply', reply: { id: 'free', title: '🎁 المجانية' } },
        { type: 'reply', reply: { id: 'contact', title: '💬 تواصل معنا' } },
      ],
    },
  },
})

async function answer(env: WhatsAppEnv, to: string, choice: string) {
  const catalog = await json<Catalog>(env, '/store/catalog.json')
  const bot = catalog?.bot ? `https://t.me/${catalog.bot}` : ORIGIN
  if (choice === 'shop' && catalog) {
    const lines = catalog.products.slice(0, MAX_LISTED).map((p) => `• ${p.title} — ⭐️ ${p.stars}`)
    return graph(env, text(to, `🛍 *المنتجات*\n${lines.join('\n')}\n\nالمتجر كاملاً: ${ORIGIN}/store/\nالشراء بنجوم تيليجرام من البوت: ${bot}`))
  }
  if (choice === 'free') {
    const apps = (await json<{ apps: App[] }>(env, '/store/apps.json'))?.apps ?? []
    const lines = apps.map((a) => `• ${a.name} v${a.version} (${a.platform})\n  ${a.downloads[0]?.href ?? ''}`)
    return graph(env, text(to, `🎁 *تطبيقات مجانية*\n${lines.join('\n')}\n\n🧪 جرّب متجر تيليجرام الخاص بك مجاناً 7 أيام: ${bot}?start=trial`))
  }
  if (choice === 'contact') {
    return graph(env, text(to, `💬 نردّ عليك هنا، أو أسرع على تيليجرام: ${bot}`))
  }
  return graph(env, menu(to))
}

export async function waWebhook(request: Request, env: WhatsAppEnv): Promise<Response> {
  if (!env.WA_VERIFY_TOKEN || !env.WA_APP_SECRET || !env.WA_TOKEN || !env.WA_PHONE_ID) {
    return new Response('not configured', { status: 503 })
  }
  const url = new URL(request.url)
  if (request.method === 'GET') {
    const ok = url.searchParams.get('hub.mode') === 'subscribe' && safeEqual(url.searchParams.get('hub.verify_token') ?? '', env.WA_VERIFY_TOKEN)
    return ok ? new Response(url.searchParams.get('hub.challenge') ?? '') : new Response('forbidden', { status: 403 })
  }
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 })

  const raw = await request.text()
  const sent = request.headers.get('x-hub-signature-256') ?? ''
  if (!safeEqual(sent, `sha256=${await hmacHex(env.WA_APP_SECRET, raw)}`)) return new Response('bad signature', { status: 401 })

  // Signed by Meta from here on. Always 200: a non-2xx makes Meta retry the same batch.
  try {
    type Incoming = {
      from?: string
      type?: string
      text?: { body?: string }
      interactive?: { button_reply?: { id?: string } }
    }
    const update = JSON.parse(raw) as { entry?: { changes?: { value?: { messages?: Incoming[] } }[] }[] }
    for (const entry of update.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const m of change.value?.messages ?? []) {
          let choice = m.type === 'interactive' ? String(m.interactive?.button_reply?.id ?? '') : ''
          if (!choice && m.type === 'text' && m.text?.body) {
            const txt = m.text.body.trim().toLowerCase()
            if (txt.includes('منتج') || txt.includes('متجر') || txt.includes('شراء') || txt.includes('أسعار') || txt.includes('اسعار') || txt === 'shop') {
              choice = 'shop'
            } else if (txt.includes('تطبيق') || txt.includes('مجاني') || txt.includes('برامج') || txt === 'free' || txt === 'apps') {
              choice = 'free'
            } else if (txt.includes('تواصل') || txt.includes('مالك') || txt.includes('دعم') || txt.includes('ادمن') || txt.includes('أدمن') || txt === 'contact') {
              choice = 'contact'
            }
          }
          if (m.from) await answer(env, String(m.from), choice)
        }
      }
    }
  } catch {
    // A malformed batch is dropped, not retried forever.
  }
  return new Response('ok')
}
