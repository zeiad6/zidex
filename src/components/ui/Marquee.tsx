import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useAnimationControls, useInView, useReducedMotion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * Marquee — a seamless horizontal ticker row.
 * ------------------------------------------------------------------ */

/**
 * A row that scrolls continuously without a visible seam.
 *
 * Seamlessness is the whole problem, so it is worth spelling out how it
 * is solved: the children are rendered exactly twice, the track is
 * translated by one copy's width, and the loop restarts. At the restart
 * the second copy sits exactly where the first began, so there is no
 * jump. Duplicating more than twice, or translating by a hard-coded
 * pixel distance, both break that alignment as soon as the content or
 * the viewport changes width.
 *
 * Three deliberate constraints, matching the rest of the kit:
 *
 *   · Only `translateX` is animated, on a layer the browser composites
 *     once. The distance is derived from one measured copy width, so
 *     nothing is read per frame.
 *   · The loop stops when the row scrolls out of view, so a ticker at the
 *     bottom of a long page costs nothing while it is off-screen.
 *   · RTL is reactive to application language context. In Arabic the row
 *     travels rightwards (into the leftward reading flow) so new items arrive seamlessly.
 *
 * Pausing uses animation controls rather than a CSS class so the row
 * freezes exactly where it is: `controls.stop()` holds the current
 * transform, and resuming continues from there instead of snapping back
 * to the start.
 */
export function Marquee({
  children,
  className,
  speed = 42,
  gap = '2.5rem',
  pauseOnHover = true,
  fade = true,
}: {
  children: ReactNode
  className?: string
  /** Pixels travelled per second. Higher is faster. */
  speed?: number
  /** Horizontal gap between items, as any CSS length. */
  gap?: string
  /** Hold the row still while the pointer is over it. */
  pauseOnHover?: boolean
  /** Mask the left and right edges so items enter and leave softly. */
  fade?: boolean
}) {
  const reduce = useReducedMotion()
  const { lang } = useI18n()
  const viewRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const inView = useInView(viewRef, { margin: '120px' })
  const [distance, setDistance] = useState(0)

  // Reactive RTL derived from the active language
  const rtl = lang !== 'en'

  // Measure the exact stride distance between copy 1 and copy 2.
  // This guarantees seamless loop alignment with zero stutter.
  useEffect(() => {
    const el = trackRef.current
    if (!el || reduce) return
    const measure = () => {
      if (el.children.length >= 2) {
        const c1 = el.children[0] as HTMLElement
        const c2 = el.children[1] as HTMLElement
        const dist = Math.abs(c2.offsetLeft - c1.offsetLeft)
        if (dist > 0) {
          setDistance(dist)
          return
        }
      }
      setDistance(el.scrollWidth / 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [reduce, rtl])

  // One copy's width is the full loop distance, so duration = distance /
  // speed keeps the pace constant whatever the content turns out to be.
  const duration = distance > 0 ? distance / speed : 0
  const to = rtl ? distance : -distance
  const run = useCallback(
    () => {
      if (duration <= 0) return
      controls.start({ x: [0, to], transition: { duration, ease: 'linear', repeat: Infinity } })
    },
    [controls, duration, to],
  )

  useEffect(() => {
    if (reduce || !inView || duration <= 0) return
    run()
    return () => controls.stop()
  }, [controls, duration, inView, reduce, run])

  // Reduced motion: laid out once, static and readable. A ticker that
  // cannot move is just a list, so it is rendered as one.
  if (reduce) {
    return (
      <div ref={viewRef} className={cn('overflow-hidden', className)}>
        <div className="flex flex-wrap items-center" style={{ gap }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={viewRef}
      className={cn('relative overflow-hidden', className)}
      onPointerEnter={pauseOnHover ? () => controls.stop() : undefined}
      onPointerLeave={pauseOnHover ? () => run() : undefined}
      // The edge mask is a pair of gradients to transparent. Cheaper and
      // crisper than a blur filter, which would repaint the whole row.
      style={
        fade
          ? {
              maskImage:
                'linear-gradient(to right, transparent 0, #000 5rem, #000 calc(100% - 5rem), transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0, #000 5rem, #000 calc(100% - 5rem), transparent 100%)',
            }
          : undefined
      }
    >
      <motion.div
        ref={trackRef}
        animate={controls}
        className="flex w-max items-center will-change-transform"
        style={{ gap }}
      >
        {/* First copy — the one assistive tech reads. */}
        <div className="flex shrink-0 items-center" style={{ gap }}>
          {children}
        </div>
        {/* Second copy — identical, and hidden from screen readers so the
            content is announced once rather than twice. */}
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden="true" dir={rtl ? 'rtl' : 'ltr'}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
