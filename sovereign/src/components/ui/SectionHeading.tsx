import { useRef } from 'react'
import { gsap, useGSAP, SplitText, reducedMotion } from '@/lib/motion'
import { cn } from '@/lib/cn'

type Props = {
  eyebrow: string
  index?: string
  title: string
  lead?: string
  align?: 'start' | 'center'
  className?: string
  titleClassName?: string
}

/**
 * SectionHeading — SplitText at the WORD level only.
 *
 * Splitting Arabic into characters breaks the cursive joins, so the
 * animation would tear the word apart mid-flight. Words are the smallest
 * unit that can move without damaging the script.
 *
 * The kicker, its rule and the lead join the same timeline, so the block
 * arrives as one composed gesture: the rule draws first, the words rise
 * after it, the lead settles last.
 */
export function SectionHeading({ eyebrow, index, title, lead, align = 'start', className, titleClassName }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const el = heading.current
      if (!el || reducedMotion()) return

      const kicker = root.current?.querySelector('[data-kicker]')
      const rule = root.current?.querySelector('[data-rule]')
      const leadEl = root.current?.querySelector('[data-lead]')

      const split = new SplitText(el, { type: 'words', wordsClass: 'split-word' })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })

      /* immediateRender: false on every from() — if the ticker stalls (a
         late webfont, a busy main thread) the words stay legible instead of
         sitting at opacity 0 for two seconds, which reads as a broken page. */
      if (kicker) tl.from(kicker, { y: 8, opacity: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, 0)
      if (rule) tl.from(rule, { scaleX: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, 0.05)

      tl.from(
        split.words,
        { yPercent: 55, opacity: 0, duration: 0.85, ease: 'expo.out', stagger: 0.045, immediateRender: false },
        0.08,
      )

      if (leadEl)
        tl.from(leadEl, { y: 10, opacity: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, 0.3)

      return () => {
        tl.kill()
        split.revert()
      }
    },
    { scope: root },
  )

  return (
    <div
      ref={root}
      className={cn('flex flex-col gap-4', align === 'center' && 'items-center text-center', className)}
    >
      <div className="flex items-center gap-3">
        {index ? (
          <span data-kicker className="mono-label text-jade/80">
            {index}
          </span>
        ) : null}
        <span data-rule className="h-px w-8 origin-left bg-hair-2" aria-hidden="true" />
        <span data-kicker className="mono-label">
          {eyebrow}
        </span>
      </div>

      <h2
        ref={heading}
        className={cn(
          'max-w-[22ch] text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.22] text-ink',
          align === 'center' && 'mx-auto',
          titleClassName,
        )}
      >
        {title}
      </h2>

      {lead ? (
        <p
          data-lead
          className={cn('max-w-[58ch] text-[15px] leading-[1.85] text-muted', align === 'center' && 'mx-auto')}
        >
          {lead}
        </p>
      ) : null}
    </div>
  )
}
