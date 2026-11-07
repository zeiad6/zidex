import { useEffect, useRef } from 'react'
import { gsap, finePointer, reducedMotion } from '@/lib/motion'

/**
 * GridField — the room the page sits in.
 *
 * Three layers, cheapest first: a static hairline grid at 2% (one paint),
 * a static dot matrix at 4%, and a 560px dot spotlight that follows the
 * pointer. The spotlight is a fixed-size element moved with a transform —
 * not a full-screen mask recomputed per frame — so following the cursor
 * costs one composited translate instead of a repaint of the viewport.
 */
export function GridField() {
  const spot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = spot.current
    if (!el || !finePointer() || reducedMotion()) return

    const xTo = gsap.quickTo(el, 'x', { duration: 0.75, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.75, ease: 'power3.out' })

    gsap.set(el, { x: window.innerWidth * 0.62, y: window.innerHeight * 0.3, xPercent: -50, yPercent: -50, opacity: 1 })

    let frame = 0
    const onMove = (event: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        xTo(event.clientX)
        yTo(event.clientY)
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base void with a single cold falloff at the top of the page */}
      <div className="absolute inset-0 bg-void" />
      <div
        className="absolute inset-x-0 top-0 h-[70vh] opacity-70"
        style={{
          background:
            'radial-gradient(110% 70% at 50% -10%, color-mix(in oklab, var(--c-jade) 9%, transparent), transparent 62%)',
        }}
      />

      {/* static drafting grid */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '76px 76px',
          maskImage: 'radial-gradient(120% 100% at 50% 0%, #000 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(120% 100% at 50% 0%, #000 20%, transparent 78%)',
        }}
      />

      {/* static dot matrix */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(var(--grid-dot) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          maskImage: 'linear-gradient(to bottom, #000, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent 85%)',
        }}
      />

      {/* pointer spotlight */}
      <div
        ref={spot}
        className="absolute left-0 top-0 h-[560px] w-[560px] opacity-0 will-change-transform"
        style={{
          backgroundImage: 'radial-gradient(var(--grid-spot) 1.1px, transparent 1.1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 68%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, transparent 68%)',
        }}
      />
    </div>
  )
}
