import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/** Counts up to `value` once the element scrolls into view. */
export function CountUp({
  value,
  suffix = '',
  duration = 1400,
  className,
}: {
  value: number
  suffix?: string
  duration?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  // Reduced motion, or nothing to animate: render the final number directly.
  const [started, setStarted] = useState(reduce || value === 0)
  const [display, setDisplay] = useState(reduce || value === 0 ? value : 0)

  useEffect(() => {
    if (reduce || value === 0) {
      setDisplay(value)
      setStarted(true)
      return
    }
    setStarted(false)
    setDisplay(0)

    const el = ref.current
    if (!el) {
      setStarted(true)
      return
    }

    // Start when the number becomes visible…
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)

    // …but never leave a 0 on screen if the observer never fires (no
    // IntersectionObserver, an element already scrolled past, or an embedded
    // webview that throttles it). A real number beats an animated one.
    const failsafe = setTimeout(() => {
      io.disconnect()
      setStarted(true)
    }, 1200)

    return () => {
      clearTimeout(failsafe)
      io.disconnect()
    }
  }, [value, reduce])

  useEffect(() => {
    if (!started || reduce || value === 0) return
    let raf = 0
    const begin = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - begin) / duration, 1)
      // easeOutExpo — fast start, long settle.
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setDisplay(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, value, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Scroll-triggered entrance. One shared variant set keeps timings uniform.
 * ------------------------------------------------------------------ */

type RevealTag = 'div' | 'section' | 'li' | 'article' | 'header' | 'p'

/** Plain DOM tag + its framer-motion twin, resolved once at module load. */
const TAGS = {
  div: ['div', motion.div],
  section: ['section', motion.section],
  li: ['li', motion.li],
  article: ['article', motion.article],
  header: ['header', motion.header],
  p: ['p', motion.p],
} as const satisfies Record<RevealTag, readonly [string, React.ElementType]>

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: RevealTag
}) {
  const reduce = useReducedMotion()
  const [Plain, Animated] = TAGS[as]
  const [rescued, setRescued] = useState(false)

  useEffect(() => {
    if (reduce) return
    // whileInView depends on IntersectionObserver. If it never fires — a
    // throttled or hidden webview, a zero-height ancestor — the section would
    // sit at opacity 0 forever. Same failsafe idea as CountUp.
    const t = setTimeout(() => setRescued(true), 1500)
    return () => clearTimeout(t)
  }, [reduce])

  if (reduce || rescued) {
    const Static = Plain
    return <Static className={className}>{children}</Static>
  }

  return (
    <Animated
      className={className}
      // opacity + transform only. A blur() filter is not GPU-composited, it
      // repaints the whole subtree every frame, and on an ancestor it also
      // creates a containing block for position: fixed descendants.
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Animated>
  )
}
