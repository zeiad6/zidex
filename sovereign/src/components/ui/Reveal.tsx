import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { cn } from '@/lib/cn'

type Props = {
  children: ReactNode
  className?: string
  /** stagger between direct children that carry [data-reveal-item] */
  stagger?: number
  /** distance travelled, in px */
  y?: number
  /** delay before the group starts */
  delay?: number
  as?: 'div' | 'ul' | 'section'
}

/**
 * Reveal — one entrance, used everywhere.
 *
 * Children marked with `data-reveal-item` rise and fade in reading order;
 * the rest of the block simply participates in the opacity fade. This is
 * deliberately a group animation rather than per-element observers: one
 * ScrollTrigger per block instead of one per card, and the stagger is
 * guaranteed to be ordered rather than racing.
 *
 * Reduced motion keeps the exact same layout with no transition at all.
 */
export function Reveal({ children, className, stagger = 0.055, y = 16, delay = 0, as = 'div' }: Props) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = root.current
      if (!el || reducedMotion()) return

      const items = gsap.utils.toArray<HTMLElement>('[data-reveal-item]', el)
      const targets = items.length ? items : [el]

      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 0.75,
        ease: 'expo.out',
        stagger: items.length ? stagger : 0,
        delay,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })
    },
    { scope: root },
  )

  const Tag = as as 'div'

  return (
    <Tag ref={root as never} className={cn(className)}>
      {children}
    </Tag>
  )
}
