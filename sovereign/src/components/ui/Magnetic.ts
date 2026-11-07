import { useRef } from 'react'
import { gsap, useGSAP, finePointer, reducedMotion } from '@/lib/motion'

/**
 * useMagnetic — a control that leans toward the pointer.
 *
 * Not a tilt: the whole button travels a fraction of the distance from its
 * centre to the cursor, so it feels like it is being *pulled*, and snaps
 * back on leave. Two quickTo tweens write the transform directly, so there
 * is no React render per pointer event.
 *
 * Mouse only, and never under reduced motion: on a touch screen there is no
 * hover, and a button that moves under a finger is a bug.
 */
export function useMagnetic<T extends HTMLElement = HTMLAnchorElement>(strength = 0.22) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || !finePointer() || reducedMotion()) return

      const toX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })
      const toY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' })

      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        const rect = el.getBoundingClientRect()
        toX((event.clientX - (rect.left + rect.width / 2)) * strength)
        toY((event.clientY - (rect.top + rect.height / 2)) * strength)
      }

      const rest = () => {
        toX(0)
        toY(0)
      }

      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', rest)
      el.addEventListener('blur', rest)

      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', rest)
        el.removeEventListener('blur', rest)
      }
    },
    { scope: ref },
  )

  return ref
}
