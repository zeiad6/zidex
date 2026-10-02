// Shared, cross-visitor download counter for the /programs page.
//
// One blob store, two kinds of keys:
//   count:<slug>          — the number shown on the card, as a string
//   seen:<slug>:<visitor>  — a sentinel marking "this visitor already counted"
//
// A visitor id is a random UUID the client keeps in localStorage (see
// src/lib/downloads.ts) — not personal data, just a de-dupe token.
import { getStore } from '@netlify/blobs'

export default async (req: Request) => {
  const store = getStore('download-counts')

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const slugs = (url.searchParams.get('slugs') ?? '').split(',').filter(Boolean)
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
    const body = (await req.json().catch(() => null)) as { slug?: string; visitor?: string } | null
    const slug = body?.slug
    const visitor = body?.visitor
    if (!slug || !visitor) return new Response('bad request', { status: 400 })

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
