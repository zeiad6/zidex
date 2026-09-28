import { useEffect, useState } from 'react'
import { site, tiktok } from '@/lib/site'

/* ------------------------------------------------------------------ *
 * Live profile figures via TikTok's public oEmbed endpoint — no API key
 * and no backend. It degrades to a dated snapshot when the request fails
 * (offline, blocked CDN, or rate-limited), so the page never lies about
 * showing live data.
 * ------------------------------------------------------------------ */

type OEmbed = {
  author_name?: string
  author_url?: string
  author_thumbnail?: string
}

export function useTikTokProfile() {
  const [oembed, setOembed] = useState<OEmbed | null>(null)
  const [state, setState] = useState<'loading' | 'live' | 'snapshot'>('loading')

  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 7000)

    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktok.profile)}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: OEmbed) => {
        setOembed(json)
        setState('live')
      })
      .catch(() => setState('snapshot'))
      .finally(() => clearTimeout(timer))

    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

  return {
    state,
    handle: oembed?.author_name ?? site.name,
    avatar: oembed?.author_thumbnail ?? tiktok.avatar,
    // oEmbed exposes no follower counts, so the numbers come from the snapshot
    // in `tiktok.stats`; only the identity fields come from the live response.
    stats: {
      followers: tiktok.stats.followers,
      following: tiktok.stats.following,
      likes: tiktok.stats.likes,
      videos: tiktok.stats.videos,
    },
  }
}
