import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * The interaction kit.
 *
 * Hover states, micro-interactions and transitions, in one file so the
 * timings cannot drift apart between the surfaces that use them. Three
 * rules the whole file follows:
 *
 *   1. Animate transform / opacity / background-position only. A hover
 *      that changes width, height or box-shadow repaints on every frame
 *      and is the usual reason a card grid feels sticky on a phone.
 *   2. Every motion path checks prefers-reduced-motion and renders the
 *      static end state instead of a fast version of the animation.
 *   3. Nothing here costs a layout read per frame. The one effect that
 *      needs the pointer position writes two custom properties on an
 *      already-measured box — cheaper than a canvas or a rAF loop for a
 *      gradient this simple, and it never triggers layout.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Hover — sweep underline
 * ------------------------------------------------------------------ */

/**
 * A text link whose underline grows out of the reading edge on hover and
 * on focus, replacing the `hover:underline` pattern: the native underline
 * cannot animate, so it snaps between nothing and a line.
 *
 * The growth is `background-size` on a fixed gradient box (see
 * `.link-underline` in index.css) — the box never resizes, so the browser
 * repaints the element and not the flow around it. The physical direction
 * is flipped per `dir` in the stylesheet, because the line has to grow
 * from where the reader starts.
 */
export function SweepLink({ children, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...rest} className={cn('link-underline cursor-pointer', className)}>
      {children}
    </a>
  )
}

/* ------------------------------------------------------------------ *
 * Hover — card
 * ------------------------------------------------------------------ */

type CardTag = 'div' | 'article' | 'li' | 'section'

/**
 * The card surface the store, the link hub and the marketplace section
 * share: it lifts on hover, gains an accent edge, and carries a soft
 * highlight that follows the cursor.
 *
 * `interactive` adds press feedback, which is only wanted on a card that
 * is itself the click target — not on a card that merely contains one,
 * where it would fire while the user is reaching for the button inside.
 */
export function HoverCard({
  children,
  className,
  interactive = false,
  radius = 360,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
  /** Highlight radius in px. */
  radius?: number
  as?: CardTag
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (reduce || e.pointerType !== 'mouse') return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
      el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
    },
    [reduce],
  )

  return (
    <Tag
      ref={ref as never}
      onPointerMove={onMove}
      className={cn(
        'group/card card-lift hover-ring relative isolate overflow-hidden',
        interactive && 'press cursor-pointer',
        className,
      )}
      style={{ '--spot-radius': `${radius}px` } as CSSProperties}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100',
          reduce && 'hidden',
        )}
        style={{
          background:
            'radial-gradient(var(--spot-radius, 320px) circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--accent-soft), transparent 70%)',
        }}
      />
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------ *
 * Micro-interaction — shake
 * ------------------------------------------------------------------ */

/**
 * A one-shot horizontal shake, for a field or a button that was refused.
 *
 * The trigger is a counter rather than a boolean because the shake has to
 * *restart* on every failure: React does not re-run a CSS animation whose
 * class did not change, so a second failure after a first one would show
 * nothing at all.
 */
export function useShake() {
  const [shakeKey, setShakeKey] = useState(0)
  const shake = useCallback(() => setShakeKey((v) => v + 1), [])
  return { shake, shakeKey }
}

/** Wraps any element so a change in `shakeKey` replays the shake on it. */
export function Shake({
  shakeKey,
  className,
  children,
  ...rest
}: { shakeKey: number; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const reduce = useReducedMotion()
  const [on, setOn] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    // A non-zero key on mount is the caller re-hydrating, not a rejection.
    if (first.current) {
      first.current = false
      return
    }
    if (reduce || !shakeKey) return
    setOn(true)
    const t = setTimeout(() => setOn(false), 460)
    return () => clearTimeout(t)
  }, [shakeKey, reduce])

  return (
    <div {...rest} className={cn(on && 'animate-shake', className)}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Micro-interaction — submit → check
 * ------------------------------------------------------------------ */

/**
 * A submit button that reports the request's whole life inside itself:
 * idle label, a spinner while sending, then a green check that draws
 * itself. The label is *replaced* rather than joined by an icon, so the
 * button never changes width mid-request and the row under it never jumps.
 *
 * `state` stays owned by the caller — this only renders it, which keeps the
 * fetch logic where it already lives.
 */
export function SubmitButton({
  state,
  idle,
  sending,
  done,
  className,
  variant = 'primary',
  children,
  ...rest
}: {
  state: 'idle' | 'sending' | 'done' | 'error' | 'busy' | 'locked'
  idle: string
  sending: string
  /** Label after success; defaults to `idle`. */
  done?: string
  className?: string
  variant?: 'primary' | 'ghost'
  children?: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>) {
  const reduce = useReducedMotion()
  const settled = state === 'done'

  return (
    <button
      type="submit"
      disabled={state === 'sending' || settled || rest.disabled}
      aria-busy={state === 'sending'}
      className={cn(
        'btn h-11 cursor-pointer px-5 font-bold disabled:cursor-wait disabled:opacity-70',
        settled ? 'btn-ok' : variant === 'ghost' ? 'btn-ghost' : 'btn-primary',
        className,
      )}
      {...rest}
    >
      {state === 'sending' ? (
        <>
          <Loader2 className="motion-safe:size-4 motion-safe:animate-spin" aria-hidden="true" />
          {sending}
        </>
      ) : settled ? (
        <>
          <CheckMark animated={!reduce} />
          {done ?? idle}
        </>
      ) : (
        children ?? idle
      )}
    </button>
  )
}

/** The check itself, its stroke written on by dashoffset. */
function CheckMark({ animated }: { animated: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path
        d="m4.5 12.5 4.5 4.5L19.5 6.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animated
            ? { strokeDasharray: 24, strokeDashoffset: 24, animation: 'draw-check 0.42s var(--ease-out-expo) 0.1s forwards' }
            : undefined
        }
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Micro-interaction — small pieces
 * ------------------------------------------------------------------ */

/** A pulsing status dot: a solid core plus one expanding ring. */
export function LiveDot({ tone = 'accent', className }: { tone?: 'accent' | 'ok' | 'warn'; className?: string }) {
  const reduce = useReducedMotion()
  const bg = { accent: 'bg-accent', ok: 'bg-emerald-500', warn: 'bg-amber-500' }[tone]
  return (
    <span className={cn('relative grid size-2 shrink-0 place-items-center', className)} aria-hidden="true">
      <span className={cn('size-2 rounded-full', bg)} />
      {reduce ? null : <span className={cn('animate-ping-soft absolute inset-0 rounded-full', bg)} />}
    </span>
  )
}

/**
 * A number that pops when it changes — a download counter, a result count.
 * The key follows a bump counter, so the pop replays per change rather
 * than only on mount.
 */
export function CountPop({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion()
  const [bump, setBump] = useState(0)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    setBump((v) => v + 1)
  }, [value])

  return (
    <span
      key={reduce ? undefined : bump}
      className={cn('inline-block', !reduce && bump > 0 && 'animate-pop-number', className)}
    >
      {value}
    </span>
  )
}

/**
 * Press feedback for a clickable that is not a `.btn` — a card, a list
 * row, a disclosure header. A spring rather than a class, so the release
 * overshoots slightly, which is what makes a tap feel answered.
 *
 * The accepted props are a named subset rather than all HTML attributes:
 * framer-motion claims `onAnimationStart` and friends with its own
 * signature, so a blanket `HTMLAttributes` spread does not typecheck.
 */
type PressableProps = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'id' | 'role' | 'tabIndex' | 'title' | 'style' | 'onClick' | 'onKeyDown' | 'aria-label' | 'aria-current' | 'aria-expanded'
>

export function Pressable({
  children,
  className,
  scale = 0.975,
  ...rest
}: { children: ReactNode; className?: string; scale?: number } & PressableProps) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <div {...rest} className={className}>
        {children}
      </div>
    )
  }
  return (
    <motion.div
      {...rest}
      className={className}
      whileTap={{ scale }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * An icon that leads a row and answers it: it nudges along the reading
 * direction while the row is hovered or focused. The physical direction is
 * handled in the stylesheet (`.arrow-nudge`), because RTL and LTR are
 * opposites and the icon set is already mirrored per direction.
 */
export function ArrowNudge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('arrow-nudge inline-flex', className)} aria-hidden="true">
      {children}
    </span>
  )
}