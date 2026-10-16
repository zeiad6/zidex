import { type ElementType, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * SplitReveal — a heading whose words rise into place one after
 * another as it scrolls into view.
 *
 * The reference pattern is a per-character scramble; this one splits on
 * words instead, because Arabic is a connected script. Slicing Arabic
 * into characters produces isolated letterforms that no longer join,
 * which reads as broken text rather than as an effect — and this site is
 * Arabic-first. Words survive the split in both languages.
 *
 * Same rules as the rest of the kit: transform/opacity only, a real
 * static end state under prefers-reduced-motion, and no layout read per
 * frame. The words are inline-block spans inside a normal flow heading,
 * so the line still wraps on its own and keeps its own font rules.
 * ------------------------------------------------------------------ */

type SplitTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'

/** Plain DOM tag + its framer-motion twin, resolved once at module load. */
const TAGS = {
  h1: ['h1', motion.h1],
  h2: ['h2', motion.h2],
  h3: ['h3', motion.h3],
  h4: ['h4', motion.h4],
  p: ['p', motion.p],
  span: ['span', motion.span],
  div: ['div', motion.div],
} as const satisfies Record<SplitTag, readonly [string, ElementType]>

/** Splits on runs of whitespace so a stray double space cannot emit an empty word. */
const wordsOf = (s: string) => s.split(/\s+/).filter(Boolean)

export function SplitReveal({
  text,
  as = 'h2',
  className,
  delay = 0,
  stagger = 0.055,
  y = 14,
  duration = 0.6,
}: {
  /** The line to split. Already translated by the caller via `t(ar, en)`. */
  text: string
  as?: SplitTag
  className?: string
  /** Delay before the first word moves, in seconds. */
  delay?: number
  /** Gap between consecutive words, in seconds. */
  stagger?: number
  /** Distance each word rises from, in px. */
  y?: number
  duration?: number
}) {
  const reduce = useReducedMotion()
  const [Plain, Animated] = TAGS[as]

  // Reduced motion: the static end state as one plain string. No spans, so
  // the text stays selectable and copies out as a single line.
  if (reduce) return <Plain className={className}>{text}</Plain>

  return (
    <Animated className={className} initial="hidden" whileInView="shown" viewport={{ once: true, margin: '-60px' }}>
      {wordsOf(text).map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          // `inline-block` is what makes the transform stick — an inline span
          // ignores translateY. The small padding reserves room for Arabic
          // ignores translateY. The small padding reserves room for Arabic
          // descenders so the rise is never clipped by the line box.
          className="inline-block pb-[0.12em] align-bottom"
          variants={{ hidden: { opacity: 0, y }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
          {/* The word gap as a non-breaking space, kept outside the animated
              span so a normal line break can still happen between words. */}
          {i < wordsOf(text).length - 1 ? '\u00A0' : null}
        </motion.span>
      ))}
    </Animated>
  )
}

/**
 * A headline in two halves, where the second carries the accent — the
 * "we build … that runs your business" split. The accent words continue
 * the same stagger instead of starting their own, so the line reads as
 * one sentence arriving rather than two competing animations.
 */
export function SplitAccent({
  lead,
  accent,
  as = 'h1',
  id,
  leadClassName,
  accentClassName,
  className,
  delay = 0,
  stagger = 0.05,
}: {
  lead: string
  accent: string
  as?: SplitTag
  /** Passed straight through — section headings are labelled by id. */
  id?: string
  leadClassName?: string
  /** Applied to the accent words only — usually a colour. */
  accentClassName?: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const reduce = useReducedMotion()
  const [Plain, Animated] = TAGS[as]

  const parts = [
    ...wordsOf(lead).map((text) => ({ text, tone: false })),
    ...wordsOf(accent).map((text) => ({ text, tone: true })),
  ]

  if (reduce) {
    return (
      <Plain className={className} id={id}>
        {lead} <span className={accentClassName}>{accent}</span>
      </Plain>
    )
  }

  return (
    <Animated id={id} className={className} initial="hidden" whileInView="shown" viewport={{ once: true, margin: '-60px' }}>
      {parts.map((part, i) => (
        <motion.span
          key={`${part.text}-${i}`}
          className={cn('inline-block pb-[0.12em] align-bottom', part.tone ? accentClassName : leadClassName)}
          variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] }}
        >
          {part.text}
          {i < parts.length - 1 ? '\u00A0' : null}
        </motion.span>
      ))}
    </Animated>
  )
}

/* ------------------------------------------------------------------ *
 * GradientText — an animated gradient sweep across a short phrase.
 * ------------------------------------------------------------------ */

/**
 * One phrase in the brand gradient, sweeping.
 *
 * The gradient is painted once at 200% width and slid by
 * background-position rather than re-drawn per frame: it is a composited
 * property, so the sweep never repaints the glyphs or their neighbours,
 * which is exactly what a per-frame `background-image` rewrite would do.
 *
 * Under prefers-reduced-motion it falls back to a flat `text-accent` — a
 * gradient that cannot sweep is just a slightly off colour, which is
 * noise rather than polish. The span is aria-hidden because the sweep is
 * decoration; the caller keeps the real string beside it for screen
 * readers and for copy-paste.
 */
export function GradientText({
  children,
  className,
  speed = 6,
}: {
  children: ReactNode
  className?: string
  /** Seconds for one full sweep. */
  speed?: number
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <span className={cn('text-accent', className)} aria-hidden="true">
        {children}
      </span>
    )
  }

  return (
    <motion.span
      aria-hidden="true"
      className={cn('bg-clip-text text-transparent bg-size-[200%_auto]', className)}
      style={{
        // Accent → teal → accent, twice, so both ends match and the loop has
        // no visible seam when background-position wraps around.
        backgroundImage:
          'linear-gradient(100deg, var(--accent) 0%, var(--color-veil-500) 25%, var(--accent) 50%, var(--color-veil-500) 75%, var(--accent) 100%)',
      }}
      animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
      transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
    >
      {children}
    </motion.span>
  )
}
