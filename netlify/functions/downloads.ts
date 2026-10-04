// Shared, cross-visitor download counter for the /programs page.
//
// One blob store, two kinds of keys:
//   count:<slug>          — the number shown on the card, as a string
//   seen:<slug>:<visitor>  — a sentinel marking "this visitor already counted"
//
// A visitor id is a random UUID the client keeps in localStorage (see
// src/lib/downloads.ts) — not personal data, just a de-dupe token.
import { getStore } from '@netlify/blobs'

const SLUG = /^[a-z0-9-]{1,64}$/
const VISITOR = /^[A-Za-z0-9-]{4,64}$/
const MAX_BODY = 512
// Per-IP cap on POSTs. Without it, a script can mint visitor ids forever and
// inflate any counter, and every new id writes a new blob key.
// ponytail: fixed window, read-modify-write like the counter below — a burst
// can slip a few past the cap, enough to stop a script.
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

export default async (req: Request, context: { ip?: string }) => {
  const store = getStore('download-counts')

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const slugs = (url.searchParams.get('slugs') ?? '')
      .split(',')
      .filter((s) => SLUG.test(s))
      .slice(0, 20)
    const counts: Record<string, number> = {}
    await Promise.all(
      slugs.map(async (slug) => {
        const raw = await store.get(`count:${slug}`)
        counts[slug] = raw ? Number(raw) : 0
      }),
    )
    return Response.json(counts, { headers: { 'cache-control': 'no-store' } })
  }

  if (req.method === 'POST') {
    // Browsers always send Origin on POST. Only this site's own pages count;
    // a plain script can still set Origin, which is what the rate limit covers.
    if (req.headers.get('origin') !== new URL(req.url).origin) return new Response('forbidden', { status: 403 })

    const ip = context.ip ?? 'unknown'
    const now = Date.now()
    const prev = await store.get(`rl:${ip}`, { type: 'json' }) as { t: number; n: number } | null
    const cur = prev && now - prev.t < RATE_WINDOW_MS ? prev : { t: now, n: 0 }
    if (cur.n >= RATE_LIMIT) return new Response('too many requests', { status: 429 })
    await store.setJSON(`rl:${ip}`, { t: cur.t, n: cur.n + 1 })

    const raw = await req.text()
    if (raw.length > MAX_BODY) return new Response('payload too large', { status: 413 })
    let body: { slug?: string; visitor?: string } | null = null
    try {
      body = JSON.parse(raw)
    } catch {
      body = null
    }
    const slug = body?.slug
    const visitor = body?.visitor
    if (typeof slug !== 'string' || typeof visitor !== 'string') return new Response('bad request', { status: 400 })
    if (!SLUG.test(slug) || !VISITOR.test(visitor)) return new Response('bad request', { status: 400 })

    const seenKey = `seen:${slug}:${visitor}`
    const countKey = `count:${slug}`
    const alreadySeen = await store.get(seenKey)
    let count = Number((await store.get(countKey)) ?? '0')

    if (!alreadySeen) {
      count += 1
      // ponytail: read-modify-write, not atomic — fine at this traffic;
      // switch to a CAS retry loop if concurrent clicks ever visibly race.
      await store.set(countKey, String(count))
      await store.set(seenKey, '1')
    }

    return Response.json({ count }, { headers: { 'cache-control': 'no-store' } })
  }

  return new Response('method not allowed', { status: 405 })
}

export const config = { path: '/api/downloads' }
