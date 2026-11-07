import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, finePointer, reducedMotion } from '@/lib/motion'
import { cn } from '@/lib/cn'

type Props = {
  children: ReactNode
  className?: string
  /** degrees of travel on each axis */
  max?: number
}

/**
 * TiltCard — 3D tilt with pointer parallax.
 *
 * Two quickTo tweens (rotationX / rotationY) instead of a re-render per
 * pointer event: the transform is written straight to the element, and the
 * glare is driven by the same two CSS variables. Touch and reduced-motion
 * users get a completely flat, fully static card.
 */
export function TiltCard({ children, className, max = 7 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || !finePointer() || reducedMotion()) return

      gsap.set(el, { transformPerspective: 1100, transformStyle: 'preserve-3d' })

      const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' })
      const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' })

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        const rect = el.getBoundingClientRect()
        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5
        rotY(px * max * 2)
        rotX(-py * max * 2)
        el.style.setProperty('--gx', `${(px + 0.5) * 100}%`)
        el.style.setProperty('--gy', `${(py + 0.5) * 100}%`)
      }

      const onLeave = () => {
        rotX(0)
        rotY(0)
        el.style.setProperty('--gx', '50%')
        el.style.setProperty('--gy', '0%')
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={cn('tilt-card relative', className)}>
      {children}
    </div>
  )
}
