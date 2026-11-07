import { useRef } from 'react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { useLang } from '@/lib/i18n'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StoreBotCard } from './StoreBotCard'
import { YusrCard } from './YusrCard'
import { KuraimiCard } from './KuraimiCard'
import { VerityCard } from './VerityCard'
import type { OrderTarget } from '@/lib/content'

const tones = ['bg-tg-2', 'bg-jade-2', 'bg-aurum-2']

/**
 * BentoMatrix — 7/5, 5/12.
 *
 * The grid is deliberately uneven: the flagship bot gets the tall column,
 * the two "proof" cards stack beside it, and the wide card closes the
 * section with the only moving visual. Every card is a SpotlightCard, so
 * the pointer light is consistent across four different card designs.
 */
export function BentoMatrix({ onOrder }: { onOrder: (target: OrderTarget) => void }) {
  const root = useRef<HTMLElement>(null)
  const { c } = useLang()

  useGSAP(
    () => {
      if (reducedMotion()) return
      const cards = gsap.utils.toArray<HTMLElement>('[data-card]', root.current)
      if (!cards.length) return

      gsap.from(cards, {
        y: 38,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 74%', once: true },
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="solutions" className="relative scroll-mt-28 pb-20 pt-6 sm:pb-28 sm:pt-8">
      <div className="shell">
        <div className="max-w-[54rem]">
          <SectionHeading
            index="01"
            eyebrow={c.solutions.eyebrow}
            title={c.solutions.title}
            lead={c.solutions.lead}
          />

          {/* The legend is the key to the colour system, so it sits on the
              same reading edge as the lead instead of drifting to the far
              margin where it reads as an orphan. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-hair-soft pt-4">
            <span className="mono-label text-[8.5px] text-subtle/60">ONE TOKEN · ONE MEANING</span>
            <span aria-hidden="true" className="hidden h-3 w-px bg-hair sm:block" />
            {c.solutions.legend.map((label, index) => (
              <span key={label} className="flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${tones[index]}`} aria-hidden="true" />
                <span className="text-[11.5px] text-muted">{label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12 lg:gap-5">
          <div data-card className="flex lg:col-span-7">
            <StoreBotCard onOrder={onOrder} />
          </div>
          <div data-card className="flex lg:col-span-5">
            <YusrCard />
          </div>
          <div data-card className="flex lg:col-span-5">
            <KuraimiCard />
          </div>
          <div data-card className="flex lg:col-span-7">
            <VerityCard />
          </div>
        </div>
      </div>
    </section>
  )
}
