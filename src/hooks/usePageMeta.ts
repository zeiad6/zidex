import { useEffect } from 'react'

/**
 * Every route serves the same static index.html, so the canonical link and
 * description stay pinned to the homepage unless a page updates them. That
 * told search engines every route was a duplicate of "/", which kept them
 * out of the index. This sets title, description, canonical and og:url for
 * the current route, restoring the previous values on unmount.
 */
export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const prevCanonical = canonicalEl?.getAttribute('href') ?? null
    // Fixed host: mirrors (pages.dev, netlify.app) must point search engines here.
    const url = `https://zeidexsoft.com${path}`
    canonicalEl?.setAttribute('href', url)

    const set = (selector: string, value: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector)
      const prev = el?.getAttribute('content') ?? null
      el?.setAttribute('content', value)
      return [prev, selector] as const
    }

    const prevs = [
      set('meta[name="description"]', description),
      set('meta[property="og:title"]', title),
      set('meta[property="og:description"]', description),
      set('meta[property="og:url"]', url),
      set('meta[name="twitter:title"]', title),
      set('meta[name="twitter:description"]', description),
    ]

    return () => {
      document.title = prevTitle
      if (prevCanonical !== null) canonicalEl?.setAttribute('href', prevCanonical)
      for (const [prev, selector] of prevs) {
        if (prev === null) continue
        document.querySelector(selector)?.setAttribute('content', prev)
      }
    }
  }, [title, description, path])
}
