import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { routes } from '@/lib/routes'

/**
 * ScrollRail — the instrument edge.
 *
 * A fixed hairline on the outer margin with a jade fill that tracks reading
 * progress, book-ended by the wordmark and the section ordinal. It exists
 * only where there is margin to spare (≥1280px) and never receives pointer
 * events, so it is decoration that cannot get in the way.
 */
export function ScrollRail() {
  const fill = useRef<HTMLSpanElement>(null)
  const { pathname } = useLocation()
  const route = routes.find((item) => item.path === pathname)
  const index = route ? route.index : '00'

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (fill.current) fill.current.style.transform = `scaleY(${p})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 start-2 z-30 hidden w-6 flex-col items-center justify-center gap-4 xl:flex"
    >
      <span className="font-mono text-[8px] tracking-[0.34em] text-subtle/45 [writing-mode:vertical-rl]">
        ZEIDEXSOFT
      </span>
      <span className="relative h-24 w-px overflow-hidden bg-hair">
        <span ref={fill} className="absolute inset-0 origin-top scale-y-0 bg-jade/70" />
      </span>
      <span className="font-mono text-[8px] tracking-[0.24em] text-subtle/45 [writing-mode:vertical-rl]">
        {index} / 08
      </span>
    </div>
  )
}
