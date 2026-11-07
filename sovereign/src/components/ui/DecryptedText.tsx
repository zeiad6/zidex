import { Fragment, useRef, type ElementType } from 'react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'

/**
 * DecryptedText — kept as the public name, rewritten as a mask reveal.
 *
 * The previous version scrambled characters. That is a nice effect in Latin
 * and a disaster in Arabic: the scramble pool mixes medial and final forms,
 * so every word visibly breaks its joins while it resolves, and the
 * headline reads as corrupted text for a full second. A headline is the one
 * place on the page that must never be illegible, even for a frame.
 *
 * So the reveal is now typographic instead of cryptographic: each word sits
 * inside its own clipping box and rises out of it with a short blur burn-off,
 * staggered in reading order. Same drama, no broken glyphs — and because the
 * boxes are inline-block with locked widths, the line cannot reflow.
 */

type Props = {
  text: string
  className?: string
  /** seconds before the first word resolves */
  delay?: number
  /** total run time */
  duration?: number
  as?: ElementType
}

export function DecryptedText({ text, className, delay = 0.15, duration = 0.9, as }: Props) {
  const Tag = (as ?? 'span') as ElementType
  const root = useRef<HTMLElement>(null)
  const words = text.split(' ')

  useGSAP(
    () => {
      const el = root.current
      if (!el) return

      const inner = Array.from(el.querySelectorAll<HTMLElement>('[data-word]'))
      if (!inner.length || reducedMotion()) return

      const stagger = inner.length > 1 ? Math.min(0.085, duration / inner.length) : 0

      gsap.fromTo(
        inner,
        { yPercent: 118, opacity: 0, filter: 'blur(7px)' },
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.86,
          delay,
          ease: 'expo.out',
          stagger,
          clearProps: 'filter,transform',
        },
      )
    },
    { scope: root },
  )

  return (
    <Tag ref={root} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            {i > 0 ? ' ' : null}
            <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
              <span data-word={word} className="inline-block will-change-transform">
                {word}
              </span>
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  )
}
