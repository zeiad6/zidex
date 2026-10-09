// zeidexsoft.com — static site from Workers assets, plus the download counter.
// The counter is the same code Cloudflare Pages ran (functions/api/downloads.ts).
import { onRequestGet, onRequestPost } from '../functions/api/downloads'
import { createOrder, tonRate, type OrdersEnv } from './orders'
import { kuraimiCheckUser, kuraimiPay, kuraimiStatus, type KuraimiEnv } from './kuraimi'
import { botWebhook, botsAdmin, botsDash, wfInbound, waBotWebhook, type BotsEnv } from './bots'
import { activate, confirm, status, licenseAdmin, type LicenseAdminEnv } from './license'
import { waWebhook, type WhatsAppEnv } from './whatsapp'
import { anthropicProxy } from './anthropic'

type Env = Parameters<typeof onRequestGet>[0]['env'] & OrdersEnv & KuraimiEnv & BotsEnv & LicenseAdminEnv & WhatsAppEnv

const HOST = 'zeidexsoft.com'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.hostname !== HOST && url.hostname.endsWith(HOST)) {
      return Response.redirect(`https://${HOST}${url.pathname}${url.search}`, 301)
    }
    if (url.pathname === '/api/downloads') {
      if (request.method === 'GET') return onRequestGet({ request, env })
      if (request.method === 'POST') return onRequestPost({ request, env })
      return new Response('method not allowed', { status: 405 })
    }
    // Pro licensing. activate+confirm is a two-step proof of possession: the app registers its
    // Keystore public key, gets a nonce, and returns a signature over it. seats are counted here,
    // never trusted from the client.
    if (url.pathname === '/api/license/activate' && request.method === 'POST') return activate(request, env)
    if (url.pathname === '/api/license/confirm' && request.method === 'POST') return confirm(request, env)
    if (url.pathname === '/api/license/status' && request.method === 'POST') return status(request, env)
    if (url.pathname === '/admin/license' || url.pathname.startsWith('/admin/license/')) {
      return licenseAdmin(request, env, url)
    }
    if (url.pathname === '/api/orders') {
      return request.method === 'POST' ? createOrder(request, env) : new Response('method not allowed', { status: 405 })
    }
    if (url.pathname === '/api/rates') return tonRate()
    const hosted = url.pathname.match(/^\/tg\/(\d{4,15})$/)
    if (hosted && request.method === 'POST') return botWebhook(request, env, hosted[1])
    if (url.pathname === '/admin/bots' || url.pathname.startsWith('/admin/bots/')) return botsAdmin(request, env, url)
    // The browser dashboard's API (public/dash/ calls it with the /web link's Bearer code).
    if (url.pathname.startsWith('/api/dash/')) return botsDash(request, env, url)
    if (url.pathname === '/api/wa') return waWebhook(request, env)
    // A hosted shop's own bridges: the automation engine's send path and the owner's
    // WhatsApp Business number. The bot id in the path picks the record; the derived
    // token (in the Bearer header) or the Meta signature picks the authorization.
    const wfRoute = url.pathname.match(/^\/api\/wf\/(\d{4,15})$/)
    if (wfRoute) return wfInbound(request, env, wfRoute[1])
    const waRoute = url.pathname.match(/^\/api\/wa\/(\d{4,15})$/)
    if (waRoute) return waBotWebhook(request, env, waRoute[1])
    if (url.pathname === '/api/pay/kuraimi/status') return kuraimiStatus(env)
    if (url.pathname === '/api/pay/kuraimi/check-user' && request.method === 'POST') return kuraimiCheckUser(request, env)
    if (url.pathname === '/api/pay/kuraimi' && request.method === 'POST') return kuraimiPay(request, env)
    if (url.pathname === '/api/anthropic' || url.pathname.startsWith('/api/anthropic/')) {
      return anthropicProxy(request, url)
    }
    // Google's HTML-file verification fetches the exact .html name and expects 200;
    // assets would 307 it to the extensionless path.
    if (/^\/google[0-9a-f]+\.html$/.test(url.pathname)) {
      const res = await env.ASSETS.fetch(new URL(url.pathname.slice(0, -'.html'.length), url))
      return new Response(res.body, { status: res.status, headers: res.headers })
    }
    const res = await env.ASSETS.fetch(request)
    // A missing hashed chunk must 404, not fall back to index.html: /assets/* is cached
    // immutably for a year, so an HTML fallback there would stick after every deploy.
    if (url.pathname.startsWith('/assets/') && res.headers.get('content-type')?.startsWith('text/html')) {
      return new Response('not found', { status: 404, headers: { 'cache-control': 'no-store' } })
    }
    return res
  },
}
