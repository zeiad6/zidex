import { useRef } from 'react'
import { ShieldCheck } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { useLang } from '@/lib/i18n'
import { SectionHeading } from '@/components/ui/SectionHeading'

/**
 * About — the house and its principles.
 *
 * The principles are the same four claims the rest of the site proves;
 * putting them here in plain language gives a reader who skipped the
 * diagrams one place to check what the company actually promises.
 */
export function About() {
  const root = useRef<HTMLElement>(null)
  const { c } = useLang()

  useGSAP(
    () => {
      if (reducedMotion()) return
      const items = gsap.utils.toArray<HTMLElement>('[data-principle]', root.current)
      gsap.from(items, {
        y: 20,
        opacity: 0,
        duration: 0.65,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: root.current, start: 'top 76%', once: true },
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="about" className="relative scroll-mt-28 pb-16 pt-6 sm:pb-20 sm:pt-8">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <SectionHeading index="07" eyebrow={c.about.eyebrow} title={c.about.title} lead={c.about.lead} />

            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5">
              {c.about.metrics.map((metric) => (
                <div key={metric.note}>
                  <dt className="font-mono text-[22px] font-medium leading-none text-ink tabular-nums">
                    <bdi dir="ltr">{metric.value}</bdi>
                  </dt>
                  <dd className="mt-2 text-[11.5px] text-muted">{metric.label}</dd>
                  <dd className="mono-label mt-1 text-[8px] text-subtle/70">{metric.note}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {c.about.principles.map((principle) => (
                <div
                  key={principle.note}
                  data-principle
                  className="card rounded-card border border-hair-soft bg-panel/70 p-5 transition-[border-color,transform] duration-500 ease-expo hover:-translate-y-0.5 hover:border-hair"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="size-4 shrink-0 text-jade/80" aria-hidden="true" />
                    <span className="mono-label text-[8px] text-subtle/70">
                      <bdi>{principle.note}</bdi>
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-[13.5px] font-semibold text-ink">{principle.title}</h3>
                  <p className="mt-1.5 text-[11.5px] leading-[1.9] text-muted">{principle.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
