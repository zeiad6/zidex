// Cloudflare Pages twin of netlify/functions/downloads.ts — same keys and
// rules, backed by the DOWNLOADS KV namespace (bound in wrangler.toml).
type KV = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}
type Ctx = { request: Request; env: { DOWNLOADS: KV } }

const SLUG = /^[a-z0-9-]{1,64}$/
const VISITOR = /^[A-Za-z0-9-]{4,64}$/
const MAX_BODY = 512
const RATE_LIMIT = 10
// KV's minimum TTL is 60 s, so the window is the key's lifetime.
const RATE_WINDOW_S = 60

export const onRequestGet = async ({ request, env }: Ctx) => {
  const slugs = (new URL(request.url).searchParams.get('slugs') ?? '')
    .split(',')
    .filter((s) => SLUG.test(s))
    .slice(0, 20)
  const counts: Record<string, number> = {}
  await Promise.all(
    slugs.map(async (slug) => {
      counts[slug] = Number((await env.DOWNLOADS.get(`count:${slug}`)) ?? '0')
    }),
  )
  return Response.json(counts, { headers: { 'cache-control': 'no-store' } })
}

export const onRequestPost = async ({ request, env }: Ctx) => {
  const store = env.DOWNLOADS
  if (request.headers.get('origin') !== new URL(request.url).origin) return new Response('forbidden', { status: 403 })

  const rlKey = `rl:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`
  const hits = Number((await store.get(rlKey)) ?? '0')
  if (hits >= RATE_LIMIT) return new Response('too many requests', { status: 429 })
  await store.put(rlKey, String(hits + 1), { expirationTtl: RATE_WINDOW_S })

  const raw = await request.text()
  if (raw.length > MAX_BODY) return new Response('payload too large', { status: 413 })
  let body: { slug?: unknown; visitor?: unknown } | null = null
  try {
    body = JSON.parse(raw)
  } catch {
    body = null
  }
  const slug = body?.slug
  const visitor = body?.visitor
  if (typeof slug !== 'string' || typeof visitor !== 'string') return new Response('bad request', { status: 400 })
  if (!SLUG.test(slug) || !VISITOR.test(visitor)) return new Response('bad request', { status: 400 })

  // The visitor id is client-chosen, so it cannot be the de-dupe key alone (a new id per
  // request counted every click). Key on a hash of the IP instead, and let the marker
  // expire so KV does not grow forever.
  const who = `${request.headers.get('cf-connecting-ip') ?? visitor}:${slug}`
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(who)))
  const ipHash = [...digest.slice(0, 12)].map((b) => b.toString(16).padStart(2, '0')).join('')
  const seenKey = `seen:${slug}:${ipHash}`
  const countKey = `count:${slug}`
  let count = Number((await store.get(countKey)) ?? '0')
  if (!(await store.get(seenKey))) {
    count += 1
    // ponytail: read-modify-write on eventually consistent KV — fine at this
    // traffic; move to a Durable Object if counts ever visibly drift.
    await store.put(countKey, String(count))
    await store.put(seenKey, '1', { expirationTtl: 90 * 24 * 3600 })
  }
  return Response.json({ count }, { headers: { 'cache-control': 'no-store' } })
}
