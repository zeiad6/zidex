import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Magnetic hover — the element eases toward the cursor while it is nearby.
 * Skipped for coarse pointers (touch) and when reduced motion is requested.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.4 })

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * 3D tilt with a cursor-tracking specular highlight. The highlight is a radial
 * gradient positioned from the pointer, which is what actually sells the depth.
 */
export function TiltCard({
  children,
  className,
  max = 7,
  glare = true,
  radius = '1.5rem',
}: {
  children: ReactNode
  className?: string
  max?: number
  glare?: boolean
  radius?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const srx = useSpring(rx, { stiffness: 200, damping: 24 })
  const sry = useSpring(ry, { stiffness: 200, damping: 24 })
  const highlight = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 62%)`

  if (reduce) return <div className={className}>{children}</div>

  return (
    <div className={cn('[perspective:1200px] overflow-hidden', className)}>
      <motion.div
        ref={ref}
        style={{ rotateX: srx, rotateY: sry, borderRadius: radius, overflow: 'hidden' }}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || !ref.current) return
          const rect = ref.current.getBoundingClientRect()
          const px = (e.clientX - rect.left) / rect.width
          const py = (e.clientY - rect.top) / rect.height
          ry.set((px - 0.5) * max * 2)
          rx.set(-(py - 0.5) * max * 2)
          gx.set(px * 100)
          gy.set(py * 100)
        }}
        onPointerLeave={() => {
          rx.set(0)
          ry.set(0)
          gx.set(50)
          gy.set(50)
        }}
        className="relative h-full"
      >
        {children}
        {glare ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: highlight }}
          />
        ) : null}
      </motion.div>
    </div>
  )
}

/**
 * A card that lifts on hover and carries a soft highlight with the cursor.
 *
 * The highlight is a radial gradient whose centre is set from the pointer's
 * position inside the card. Setting a CSS custom property on pointer move
 * costs one style write per event; a canvas or a per-frame animation loop
 * would cost far more for an effect this simple, and the gradient is the
 * part that actually reads as a surface catching light.
 *
 * `--spot-x` / `--spot-y` fall back to 50% so the highlight sits centred and
 * invisible before the first pointer move, and stays put under
 * prefers-reduced-motion where it is switched off entirely.
 */
export function SpotlightCard({
  children,
  className,
  radius = 320,
}: {
  children: ReactNode
  className?: string
  /** Radius of the highlight in px. */
  radius?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse') return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    ref.current?.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    ref.current?.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        'group relative isolate overflow-hidden transition-[transform,box-shadow] duration-300',
        !reduce && 'hover:-translate-y-1 motion-reduce:hover:translate-y-0',
        className,
      )}
      style={{ '--spot-radius': `${radius}px` } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          reduce && 'hidden',
        )}
        style={{
          background:
            'radial-gradient(var(--spot-radius, 320px) circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--accent-soft), transparent 70%)',
        }}
      />
      {children}
    </div>
  )
}
