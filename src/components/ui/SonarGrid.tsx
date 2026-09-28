import { useEffect, useRef, type ReactNode } from 'react'
import { useTheme } from '@/lib/theme'

/* ------------------------------------------------------------------ *
 * SonarGrid — interactive canvas dot-grid backdrop.
 *
 * Port of the 21st.dev pattern (n1m4mz/sonar-grid, MIT): ambient pings
 * keep the grid alive, taps launch expanding rings, the colour is read
 * from `--accent` so light/dark need no duplication, and reduced motion
 * renders one static frame instead of looping.
 *
 * Performance note: the base grid is batched into a single path, and the
 * ring pass is bounded by a bounding box so a ring only touches dots that
 * can actually be inside it. At 1920x1080 / spacing 26 that is ~3,100
 * dots total instead of ~18,600 fills per frame.
 * ------------------------------------------------------------------ */

type SonarGridProps = {
  id: string
  className?: string
  children?: ReactNode
  /** Distance between grid dots, in CSS pixels. */
  spacing?: number
  /** Base dot opacity before any ring passes over. */
  baseOpacity?: number
  /** Half-width of a ring's sweep, in CSS pixels. */
  ringWidth?: number
  /** Milliseconds for a ring to travel from the centre to the edge. */
  speed?: number
  /** Seconds between two ambient pings. */
  pingEvery?: number
  /** Fraction of the canvas an ambient ping may travel from. */
  amplitude?: number
  interactive?: boolean
  color?: string
  childrenClassName?: string
}

type Ring = { x: number; y: number; t: number; r: number }

export function SonarGrid({
  id,
  className = '',
  children,
  spacing = 26,
  baseOpacity = 0.28,
  ringWidth = 90,
  speed = 260,
  pingEvery = 2.4,
  amplitude = 0.42,
  interactive = true,
  color,
  childrenClassName = '',
}: SonarGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ringRef = useRef<Ring[]>([])
  const pointerRef = useRef<{ x: number; y: number; inside: boolean }>({
    x: 0,
    y: 0,
    inside: false,
  })
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const maybe = canvas.getContext('2d', { alpha: true })
    if (!maybe) return
    // Re-bound under a fresh name: `draw` is a hoisted function declaration, so
    // TypeScript does not carry the narrowing from the guard above into its body.
    const ctx = maybe

    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = mqReduce.matches

    let width = 0
    let height = 0
    let raf = 0
    let looping = false

    // Resolved once per effect run, not per frame. The effect already
    // re-runs on theme change, so a getComputedStyle read inside draw()
    // would be a forced-style-read 60x/second for nothing.
    const stroke =
      color ||
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
      '#5b8dfc'

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Assigning canvas.width wipes the bitmap. With no rAF loop running
      // (reduced motion) nothing would ever repaint it, so the hero grid
      // would go permanently blank on the first resize or rotation.
      if (!looping) draw(performance.now())
    }

    const maxRadius = () => Math.hypot(Math.max(width, height), 0) + spacing * 6

    const pushRing = (x: number, y: number) => {
      ringRef.current.push({ x, y, t: 0, r: maxRadius() })
      if (ringRef.current.length > 6) ringRef.current.shift()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return
      const rect = canvas.getBoundingClientRect()
      // The canvas is pointer-events-none, so it never receives pointerleave.
      // Hit-testing against its rect is the only way to know the cursor left.
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      pointerRef.current.inside = inside
      if (inside) {
        pointerRef.current.x = e.clientX - rect.left
        pointerRef.current.y = e.clientY - rect.top
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return
      const rect = canvas.getBoundingClientRect()
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return
      }
      pushRing(e.clientX - rect.left, e.clientY - rect.top)
    }

    let last = performance.now()
    let ambientAt = last + 600

    function draw(now: number) {
      const dt = Math.min(now - last, 64)
      last = now

      ctx.clearRect(0, 0, width, height)

      // Ambient ping on a timer keeps the surface alive when idle.
      if (now >= ambientAt) {
        ambientAt = now + pingEvery * 1000
        const spread = Math.max(0.1, Math.min(amplitude, 0.9))
        pushRing(
          width * (0.5 + (Math.random() - 0.5) * spread * 2),
          height * (0.5 + (Math.random() - 0.5) * spread * 2),
        )
      }

      // Trail a ring behind the cursor, but only while the cursor is over
      // the canvas — otherwise a stale point would emit rings forever.
      if (interactive && pointerRef.current.inside) {
        const { x, y } = pointerRef.current
        const tail = ringRef.current[ringRef.current.length - 1]
        if (!tail || Math.hypot(tail.x - x, tail.y - y) > spacing * 5) pushRing(x, y)
      }

      const step = (dt / speed) * (ringWidth / 90)

      ctx.fillStyle = stroke
      for (let i = ringRef.current.length - 1; i >= 0; i--) {
        const ring = ringRef.current[i]!
        ring.t += step
        if (ring.t >= 1) {
          ringRef.current.splice(i, 1)
          continue
        }
        const r = ring.t * ring.r
        const fade = Math.sin(ring.t * Math.PI) * baseOpacity
        if (fade <= 0.001) continue

        // Bounding box: only rows and columns the ring can still touch.
        const reach = r + ringWidth
        const x0 = Math.max(spacing / 2, ring.x - reach)
        const x1 = Math.min(width, ring.x + reach)
        const y0 = Math.max(spacing / 2, ring.y - reach)
        const y1 = Math.min(height, ring.y + reach)
        if (x1 <= x0 || y1 <= y0) continue

        for (let y = y0; y < y1; y += spacing) {
          for (let x = x0; x < x1; x += spacing) {
            const d = Math.hypot(x - ring.x, y - ring.y)
            const dist = Math.abs(d - r)
            if (dist > ringWidth) continue
            const a = (1 - dist / ringWidth) * fade
            if (a <= 0.004) continue
            ctx.globalAlpha = Math.min(baseOpacity + a, 1)
            ctx.beginPath()
            ctx.arc(x, y, 1.35, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Base grid — batched into one path, one fill for the whole field.
      ctx.globalAlpha = baseOpacity
      ctx.beginPath()
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          ctx.moveTo(x, y)
          ctx.arc(x, y, 1.1, 0, Math.PI * 2)
        }
      }
      ctx.fill()
      ctx.globalAlpha = 1

      if (looping) raf = requestAnimationFrame(draw)
    }

    const start = () => {
      if (looping) return
      looping = true
      last = performance.now()
      ambientAt = last + 600
      raf = requestAnimationFrame(draw)
    }

    const stop = () => {
      looping = false
      cancelAnimationFrame(raf)
    }

    const onReduceChange = (e: MediaQueryListEvent) => {
      reduced = e.matches
      stop()
      if (reduced) draw(performance.now())
      else start()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (reduced) {
      draw(performance.now())
    } else {
      start()
    }

    mqReduce.addEventListener('change', onReduceChange)
    if (interactive) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerdown', onPointerDown, { passive: true })
    }

    return () => {
      stop()
      ro.disconnect()
      mqReduce.removeEventListener('change', onReduceChange)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
    }
    // `theme` re-runs the effect so `stroke` is re-read from the new tokens.
  }, [spacing, baseOpacity, ringWidth, speed, pingEvery, amplitude, interactive, color, theme])

  return (
    <div id={id} className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {children ? <div className={`relative z-10 ${childrenClassName}`}>{children}</div> : null}
    </div>
  )
}
