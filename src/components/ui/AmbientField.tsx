import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ambient background field: a pointer-tracked light bloom over a dot grid,
 * with a second bloom lagging behind the first for parallax.
 *
 * Constraints that shaped this:
 *
 *  - **No React state.** Pointer and scroll events write CSS custom
 *    properties straight onto one node inside a single rAF frame. Routing
 *    them through setState would re-render the whole app tree on every
 *    mousemove, which is the single most expensive mistake available on a
 *    page like this.
 *
 *  - **No canvas.** Three gradients and one background-image repaint, all
 *    composited on the GPU, versus a canvas element re-rastering the
 *    gradient in JS on each frame.
 *
 *  - **Light.** In light mode the whole field peaks at a few percent alpha.
 *    The previous page had coloured aurora blobs at 40% over the content,
 *    which tinted every heading. A background must be felt, not seen.
 *
 *  - **RTL-safe.** Everything is positioned in logical units or driven by
 *    client coordinates, so nothing mirrors or flips.
 *
 *  - **Reduced motion.** Layers are parked and the listeners never attach,
 *    rather than being animated with a zero duration, which would still
 *    leave them tracking the pointer.
 */
export function AmbientField({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Targets are written by the events; the frame below eases the rendered
    // values toward them. Reading on rAF instead of in the handler means a
    // burst of events still costs exactly one style write.
    let tx = 0.5
    let ty = 0.35
    let x = tx
    let y = ty
    let lx = tx
    let ly = ty
    let sy = 0
    let ry = 0
    let raf = 0
    let running = true

    // Any input wakes the loop. Without this the field settles once and then
    // ignores the rest of the session, because the settle branch above stops
    // scheduling frames.
    const wake = () => {
      running = true
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = e.clientX / window.innerWidth
      ty = e.clientY / window.innerHeight
      wake()
    }

    const onScroll = () => {
      sy = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.4)
      wake()
    }

    function tick() {
      if (!el) return
      raf = 0
      // 0.12 for the near bloom, 0.05 for the far one. Different rates are
      // what make the layers read as separate depths rather than one blob.
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      lx += (tx - lx) * 0.05
      ly += (ty - ly) * 0.05
      ry += (sy - ry) * 0.08

      el.style.setProperty('--mx', `${(x * 100).toFixed(2)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(2)}%`)
      el.style.setProperty('--lx', `${(lx * 100).toFixed(2)}%`)
      el.style.setProperty('--ly', `${(ly * 100).toFixed(2)}%`)
      el.style.setProperty('--sy', ry.toFixed(4))

      // Settled to within a pixel: stop burning frames.
      if (
        Math.abs(tx - x) < 0.0005 &&
        Math.abs(ty - y) < 0.0005 &&
        Math.abs(tx - lx) < 0.0005 &&
        Math.abs(ty - ly) < 0.0005 &&
        Math.abs(sy - ry) < 0.002
      ) {
        running = false
        return
      }
      if (running) raf = requestAnimationFrame(tick)
    }

    // Safari fires pointermove with pointerType "mouse"; a touch drag would
    // otherwise drag the bloom around, so the mouse-only guard matters.
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}
    >
      {/* Far bloom. Larger, cooler, and slower. */}
      <div
        className="ambient-far absolute -inset-[30%]"
        style={{ transform: 'translate3d(calc((var(--lx, 50%) - 50%) * -0.022), calc((var(--ly, 35%) - 50%) * -0.022 + var(--sy, 0) * -18px), 0)' }}
      />

      {/* Near bloom. Follows the cursor. */}
      <div
        className="ambient-near absolute -inset-[30%]"
        style={{ transform: 'translate3d(calc((var(--mx, 50%) - 50%) * -0.04), calc((var(--my, 35%) - 50%) * -0.04 + var(--sy, 0) * -34px), 0)' }}
      />

      {/* The grid drifts at a third of the bloom's rate, so the field has
          depth instead of moving as one sheet. */}
      <div
        className="ambient-grid absolute inset-0"
        style={{ transform: 'translate3d(0, calc(var(--sy, 0) * 26px), 0)' }}
      />
    </div>
  )
}
