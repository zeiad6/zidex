/* ------------------------------------------------------------------ *
 * Download counter for the programs cards. Counted server-side (one
 * Netlify Blobs store behind /api/downloads, see netlify/functions/
 * downloads.ts) so the number is the same for every visitor, de-duped
 * per browser by a random id kept in localStorage.
 * ------------------------------------------------------------------ */
import { useEffect, useState } from 'react'

const VISITOR_KEY = 'dl-visitor-id'

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

async function fetchDownloadCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {}
  try {
    const res = await fetch(`/api/downloads?slugs=${encodeURIComponent(slugs.join(','))}`)
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

function trackDownload(slug: string) {
  fetch('/api/downloads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, visitor: getVisitorId() }),
  }).catch(() => {})
}

/**
 * Counts for several programs in one request.
 *
 * `useDownloadCount` fetches per component, so a page listing every program
 * would issue one request per row. The dashboard needs them together anyway,
 * so this takes the whole set in one call.
 */
export function downloadCountsFor(slugs: string[]) {
  return fetchDownloadCounts(slugs)
}

/** Live count for one program, plus a `bump` to call from the download link's onClick. */
export function useDownloadCount(slug: string) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    fetchDownloadCounts([slug]).then((counts) => {
      if (alive) setCount(counts[slug] ?? 0)
    })
    return () => {
      alive = false
    }
  }, [slug])

  function bump() {
    setCount((c) => (c ?? 0) + 1)
    trackDownload(slug)
  }

  return { count, bump }
}
