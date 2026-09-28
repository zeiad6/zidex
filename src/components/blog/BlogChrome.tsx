import { useEffect, useMemo, useRef, useState } from 'react'
import { Glyph } from '@/components/ui/Glyphs'
import { getHeadings, type PostMeta } from '@/data/posts'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

/* ------------------------------------------------------------------ *
 * Table of contents with scroll-spy. Uses IntersectionObserver against
 * the actual heading elements, so it stays correct no matter how long
 * the post is.
 * ------------------------------------------------------------------ */

export function TableOfContents({ post }: { post: PostMeta }) {
  const headings = useMemo(() => getHeadings(post), [post])
  const { t } = useI18n()
  const [active, setActive] = useState<string>(headings[0]?.id ?? '')
  const ticking = useRef(false)

  useEffect(() => {
    setActive(headings[0]?.id ?? '')
    if (headings.length === 0) return

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        // The heading nearest the top of the viewport, with a 140px bias so it
        // switches as soon as the next section starts rather than at its middle.
        let current = headings[0]!.id
        for (const h of headings) {
          const el = document.getElementById(h.id)
          if (!el) continue
          if (el.getBoundingClientRect().top <= 140) current = h.id
        }
        setActive(current)
        ticking.current = false
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav aria-label={t('محتويات المقال', 'On this page')} className="w-full">
      <h2 className="text-app mb-3 text-xs font-semibold tracking-wide">{t('محتويات المقال', 'On this page')}</h2>
      <ul className="border-app relative space-y-0.5 border-s ps-3">
        <span
          aria-hidden="true"
          className="bg-accent absolute -start-px w-0.5 rounded-full transition-all duration-300"
          style={{
            height: '1.5rem',
            top: `calc(${(headings.findIndex((h) => h.id === active) / headings.length) * 100}% )`,
          }}
        />
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                history.replaceState(null, '', `#${h.id}`)
              }}
              className={cn(
                'block py-1.5 text-[13px] leading-snug transition-colors',
                h.level === 3 && 'ps-3',
                active === h.id ? 'text-accent font-semibold' : 'text-muted hover:text-app',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* ------------------------------------------------------------------ *
 * Reading progress bar.
 * ------------------------------------------------------------------ */

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const { t } = useI18n()

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className="fixed inset-x-0 top-0 z-60 h-0.5 bg-transparent"
      role="progressbar"
      aria-label={t('تقدّم القراءة', 'Reading progress')}
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="tiktok-gradient h-full transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Blog search box — debounced so filtering 6+ posts never blocks paint.
 * ------------------------------------------------------------------ */

export function BlogSearch({
  value,
  onChange,
  resultCount,
}: {
  value: string
  onChange: (v: string) => void
  resultCount: number
}) {
  const { t } = useI18n()
  return (
    <div className="relative w-full max-w-sm">
      <Glyph
        name="search"
        size={16}
        className="text-subtle pointer-events-none absolute start-4 top-1/2 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('ابحث في المقالات…', 'Search posts…')}
        aria-label={t('ابحث في المقالات', 'Search posts')}
        className={cn(
          'bg-elevated text-app placeholder:text-subtle h-11 w-full min-w-0 rounded-full border border-app ps-11 pe-10 text-sm',
          'focus:border-accent focus:ring-accent/30 focus:ring-[3px] focus:outline-none',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('مسح البحث', 'Clear search')}
          className="text-subtle hover:text-app absolute end-3 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full hover:bg-sunken"
        >
          <Glyph name="close" size={14} />
        </button>
      ) : (
        <span className="text-subtle absolute end-4 top-1/2 -translate-y-1/2 font-mono text-[10px]">
          {resultCount}
        </span>
      )}
    </div>
  )
}
