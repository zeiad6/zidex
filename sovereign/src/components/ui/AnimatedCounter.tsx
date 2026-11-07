import { useRef } from 'react'
import { gsap, useGSAP, ScrollTrigger, reducedMotion } from '@/lib/motion'
import { cn } from '@/lib/cn'

type Props = {
  value: number
  prefix?: string
  suffix?: string
  className?: string
  /** seconds */
  duration?: number
}

/**
 * AnimatedCounter — counts up once, the first time it is seen.
 *
 * The final value is what renders, so the number is correct with JS off,
 * with motion reduced, and for a screen reader at any moment. A number
 * that is already on screen at mount starts on the next frame rather than
 * waiting for a ScrollTrigger refresh — otherwise the first paint shows a
 * half-counted figure for a second, which reads as a bug, not an entrance.
 */
export function AnimatedCounter({ value, prefix = '', suffix = '', className, duration = 1.25 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || reducedMotion()) return

      const format = (n: number) => `${prefix}${Math.round(n).toLocaleString('en-US')}${suffix}`
      const state = { n: 0 }

      const run = () => {
        el.textContent = format(0)
        gsap.to(state, {
          n: value,
          duration,
          ease: 'expo.out',
          onUpdate: () => {
            el.textContent = format(state.n)
          },
          onComplete: () => {
            el.textContent = format(value)
          },
        })
      }

      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        run()
        return
      }

      const trigger = ScrollTrigger.create({ trigger: el, start: 'top bottom', once: true, onEnter: run })
      return () => trigger.kill()
    },
    { scope: ref, dependencies: [value] },
  )

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {value.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}
