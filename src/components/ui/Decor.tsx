import type { CSSProperties, ReactNode } from 'react'
import { motion, useReducedMotion, type MotionStyle } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Decorative geometry. Each piece is deterministic — no random values, no
 * Math.random in render — so the server and the client always agree and
 * React never logs a hydration mismatch.
 *
 * Patterns adapted from 21st.dev community components (MIT):
 *   · shine-border      — @dillionverma  (conic sweep around a border)
 *   · gradient-dots     — @efferd
 *   · constellation-grid — @daiwiikharihar
 */

/* ---------------------------------------------------------------- *
 * Shine border — a gradient that travels around the edge of a card.
 * One pseudo-element, one conic gradient, one mask. No JS, no reflow.
 * ---------------------------------------------------------------- */

export function ShineBorder({
  children,
  className,
  colors = ['var(--color-ghost-500)', 'var(--color-veil-500)', 'var(--color-tiktok-600)'],
  duration = 6,
  /** Logical border width; the highlight is clipped to this ring. */
  width = 1.5,
}: {
  children: ReactNode
  className?: string
  colors?: string[]
  duration?: number
  width?: number
}) {
  return (
    <div
      className={cn('group/shine relative isolate overflow-hidden', className)}
      style={{ '--shine-colors': colors.join(', ') } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[200%] z-0 opacity-0 transition-opacity duration-500 group-hover/shine:opacity-100 motion-reduce:!hidden"
        style={{
          background:
            'conic-gradient(from var(--shine-angle, 0deg), transparent 0 62%, var(--shine-colors) 78%, transparent 92%)',
          animation: `shine-spin ${duration}s linear infinite`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
        style={{
          padding: width,
          background: 'var(--bg)',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div className="relative z-[2]">{children}</div>

      <style>{`@keyframes shine-spin{to{--shine-angle:360deg}}`}</style>
    </div>
  )
}

/* ---------------------------------------------------------------- *
 * Conic sheen used on the hero and on primary panels.
 * ---------------------------------------------------------------- */

export function ConicSheen({
  className,
  intensity = 0.5,
}: {
  className?: string
  intensity?: number
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <span
        className="absolute top-1/2 left-1/2 aspect-square w-[140%] -translate-x-1/2 -translate-y-1/2 animate-[spin_28s_linear_infinite] motion-reduce:animate-none"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--color-ghost-500) 40%, transparent) 90deg, transparent 180deg, color-mix(in oklab, var(--color-veil-500) 34%, transparent) 270deg, transparent 360deg)',
          opacity: intensity,
          maskImage: 'radial-gradient(closest-side, black 30%, transparent 100%)',
        }}
      />
    </span>
  )
}

/* ---------------------------------------------------------------- *
 * Dotted field — a masked grid, used behind page headers. Cheaper
 * than a canvas and it never re-paints on scroll.
 * ---------------------------------------------------------------- */

export function DotField({
  className,
  size = 22,
  opacity = 0.7,
}: {
  className?: string
  size?: number
  opacity?: number
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        opacity,
        backgroundImage: 'radial-gradient(var(--grid-dot) 1px, transparent 1px)',
        backgroundSize: `${size}px ${size}px`,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent 78%)',
      }}
    />
  )
}

/* ---------------------------------------------------------------- *
 * Constellation — fixed-seed points joined to their nearest neighbour.
 * The positions are a hard-coded table, not random, so they are stable
 * across reloads and identical on server and client.
 * ---------------------------------------------------------------- */

const STARS = [
  [8, 22], [17, 9], [26, 30], [34, 16], [43, 26], [52, 11],
  [61, 33], [70, 20], [79, 37], [88, 14], [12, 47], [22, 58],
  [31, 44], [40, 62], [49, 48], [58, 66], [67, 52], [76, 70],
  [85, 57], [94, 74], [5, 71], [15, 84], [24, 74], [35, 88],
  [44, 79], [55, 91], [64, 80], [73, 93], [84, 86], [92, 95],
] as const

const EDGES: readonly [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
  [0, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16],
  [16, 17], [17, 18], [18, 19], [10, 20], [20, 21], [21, 22], [22, 23],
  [23, 24], [24, 25], [25, 26], [26, 27], [27, 28], [28, 29],
]

export function Constellation({
  className,
  stroke = 'var(--grid-dot)',
}: {
  className?: string
  stroke?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    >
      <g stroke={stroke} strokeWidth="0.18" fill="none">
        {EDGES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={STARS[a][0]} y1={STARS[a][1]} x2={STARS[b][0]} y2={STARS[b][1]} />
        ))}
      </g>
      <g fill={stroke}>
        {STARS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 0.5 : 0.28} />
        ))}
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------- *
 * Corner brackets — a framing detail for cards that should feel
 * "indexed" rather than "floating".
 * ---------------------------------------------------------------- */

export function CornerBrackets({ className, inset = 0 }: { className?: string; inset?: number }) {
  const base = 'absolute size-3 border-current opacity-40'
  const style = (v: 'top' | 'bottom', h: 'left' | 'right') =>
    ({ [v]: `${inset}px`, [h]: `${inset}px` }) as CSSProperties
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      <span className={cn(base, 'border-t border-s')} style={style('top', 'left')} />
      <span className={cn(base, 'border-t border-s')} style={style('top', 'right')} />
      <span className={cn(base, 'border-b border-s')} style={style('bottom', 'left')} />
      <span className={cn(base, 'border-b border-s')} style={style('bottom', 'right')} />
    </span>
  )
}

/* ---------------------------------------------------------------- *
 * A pill of segmented ticks — reads as "index", used beside section
 * numbers so the numbering is not the only visual cue.
 * ---------------------------------------------------------------- */

export function TickRule({ className, ticks = 12 }: { className?: string; ticks?: number }) {
  return (
    <span aria-hidden="true" className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: ticks }, (_, i) => (
        <span
          key={i}
          className="bg-current block h-3 w-px opacity-60"
          style={{ opacity: i < 3 ? 0.9 : 0.28 }}
        />
      ))}
    </span>
  )
}

/* ---------------------------------------------------------------- *
 * Border beam — a short beam of light that travels the border.
 * Adapted from Magic UI `border-beam` (MIT, magicui.design, also on
 * 21st.dev): framer-motion instead of motion/react, brand colours, and
 * a reduced-motion path that renders nothing rather than a frozen beam.
 * Needs a positioned parent with a border-radius.
 * ---------------------------------------------------------------- */
export function BorderBeam({
  size = 90,
  duration = 7,
  colorFrom = 'var(--color-ghost-500)',
  colorTo = 'var(--color-veil-500)',
  borderWidth = 1.5,
}: {
  size?: number
  duration?: number
  colorFrom?: string
  colorTo?: string
  borderWidth?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--beam-w) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={{ '--beam-w': `${borderWidth}px` } as CSSProperties}
    >
      <motion.div
        className="absolute aspect-square bg-linear-to-l from-(--beam-from) via-(--beam-to) to-transparent"
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            '--beam-from': colorFrom,
            '--beam-to': colorTo,
          } as MotionStyle
        }
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ repeat: Infinity, ease: 'linear', duration }}
      />
    </div>
  )
}
