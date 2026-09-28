import { useRef, type ReactNode } from 'react'
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
