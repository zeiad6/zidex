import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * Parallax — a decorative element that drifts as the page scrolls.
 * ------------------------------------------------------------------ */

/**
 * Subtle translateY driven by scroll position.
 *
 * The offset is a `useScroll` progress value mapped through
 * `useTransform` into pixels and applied as a transform. That matters:
 * because the value is a transform on a composited layer, the drift runs
 * on the compositor and never triggers layout — a parallax that animates
 * `top`, `margin` or `height` instead reflows the page on every frame and
 * is the usual reason a scrolling page stutters on a phone.
 *
 * The range is deliberately small. `amount` is the total travel in px,
 * so the default 60px moves a decorative shape by roughly a thumb's
 * width across a viewport — enough to read as depth, not enough to
 * detach the element from the section it belongs to.
 *
 * Under prefers-reduced-motion the transform is dropped entirely rather
 * than shortened: the element renders at its natural position, because
 * scroll-linked movement is exactly the kind of motion that setting is
 * asking us not to do.
 *
 * Meant for decoration only. Content that carries meaning must never sit
 * inside a Parallax — a reader who scrolls fast would see it slide out of
 * alignment with the text it explains.
 */
export function Parallax({
  children,
  className,
  amount = 60,
  /** 'far' drifts more slowly than the page (reads as background). */
  depth = 'far',
}: {
  children: ReactNode
  className?: string
  /** Total travel in px across the element's time in view. */
  amount?: number
  depth?: 'far' | 'near'
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  // Progress of this element through the viewport: 0 as its top enters the
  // bottom edge, 1 as its bottom leaves the top edge.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // A background layer travels with the scroll and therefore appears to
  // lag; a foreground layer travels against it and appears to lead. Halving
  // the range for 'far' is what separates the two.
  const range = depth === 'far' ? amount : amount * 0.5
  const y = useTransform(scrollYProgress, [0, 1], [range, -range])

  // Reduced motion: no transform at all, not a smaller one.
  if (reduce) {
    return (
      <div ref={ref} className={cn(className)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div ref={ref} style={{ y }} className={cn('will-change-transform', className)}>
      {children}
    </motion.div>
  )
}
