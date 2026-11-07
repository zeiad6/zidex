import { useEffect } from 'react'
import { finePointer, reducedMotion } from '@/lib/motion'

/**
 * useSpotlight — one pointer listener for every card that wants a light.
 *
 * The React Bits SpotlightCard pattern, inverted: instead of a component
 * per card (a ref, a handler and a re-render hook each), one document
 * listener finds the nearest `.spot` ancestor, writes two custom
 * properties, and the tint is a static radial-gradient in CSS. Twenty
 * cards cost exactly what one costs, and React never re-renders on a
 * pointer move.
 *
 * Mouse only, and never under reduced motion — a highlight that follows
 * a finger is noise, not depth.
 */
export function useSpotlight() {
  useEffect(() => {
    if (!finePointer() || reducedMotion()) return

    let frame = 0
    let pending: PointerEvent | null = null

    const paint = () => {
      frame = 0
      const event = pending
      if (!event) return
      const target = event.target as HTMLElement | null
      const card = target?.closest?.<HTMLElement>('.spot')
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      card.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pending = event
      if (!frame) frame = requestAnimationFrame(paint)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
}
