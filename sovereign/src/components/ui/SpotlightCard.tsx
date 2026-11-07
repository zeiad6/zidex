import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'jade' | 'tg' | 'aurum'

const TONE: Record<Tone, string> = {
  jade: 'var(--color-jade)',
  tg: 'var(--color-tg)',
  aurum: 'var(--color-aurum)',
}

type Props = {
  children: ReactNode
  className?: string
  tone?: Tone
  /** extra classes for the inner content wrapper */
  innerClassName?: string
  as?: 'div' | 'article' | 'li'
}

/**
 * SpotlightCard — React Bits spotlight, two layers.
 *
 * A soft radial wash inside the card and a 1px ring lit only where the
 * cursor is. Both read the same two CSS variables, written at most once
 * per animation frame, so the card costs one style write per frame and
 * nothing when the pointer is still.
 */
export function SpotlightCard({ children, className, tone = 'jade', innerClassName, as = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const frame = useRef(0)

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const el = ref.current
    if (!el || event.pointerType !== 'mouse' || frame.current) return
    const { clientX, clientY } = event
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--sx', `${clientX - rect.left}px`)
      el.style.setProperty('--sy', `${clientY - rect.top}px`)
    })
  }

  const Tag = as as 'div'

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      onPointerMove={onPointerMove}
      style={{ '--tone': TONE[tone] } as CSSProperties}
      className={cn(
        /* w-full: the card is a flex child of a grid cell. Without it the
           card shrinks to its content and leaves a ragged hole in the
           column, so the 7/5 rhythm of the matrix breaks on every row. */
        'group/spot relative w-full overflow-hidden rounded-card border border-hair-soft bg-panel',
        'shadow-[inset_0_1px_0_0_rgb(255_255_255/0.045)]',
        'transition-[border-color,box-shadow,transform] duration-500 ease-expo',
        'hover:-translate-y-0.5',
        'hover:border-hair hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.07),0_30px_80px_-40px_rgb(0_0_0/0.95)]',
        className,
      )}
    >
      {/* specular pass on hover — one composited translate, no repaint */}
      <span aria-hidden="true" className="sheen-sweep" />

      {/* soft wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(360px circle at var(--sx, 50%) var(--sy, 0%), color-mix(in oklab, var(--tone) 9%, transparent), transparent 62%)',
        }}
      />
      {/* 1px ring, lit at the cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          padding: '1px',
          background:
            'radial-gradient(280px circle at var(--sx, 50%) var(--sy, 0%), color-mix(in oklab, var(--tone) 62%, transparent), transparent 58%)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
        }}
      />
      <div className={cn('relative flex h-full flex-col', innerClassName)}>{children}</div>
    </Tag>
  )
}
