import { useEffect, useRef } from 'react'
import { ArrowUpLeft, Clock } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { site } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { SectionHeading } from '@/components/ui/SectionHeading'

/**
 * TrialTimeline — the only pinned section.
 *
 * On desktop the module holds still for ~0.8 viewport heights while a
 * 1px line draws right-to-left between the three numbered nodes. The
 * geometry is measured from the real DOM (not guessed from a viewBox), so
 * the line always lands in the centre of a badge whatever the gap is.
 *
 * Mobile gets the same story without the pin: a vertical rail that fills
 * as the section scrolls. Reduced motion gets a finished line and lit
 * nodes — the information never depends on the animation.
 */
export function TrialTimeline() {
  const root = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const path = useRef<SVGPathElement>(null)
  const glow = useRef<SVGPathElement>(null)
  const vline = useRef<HTMLSpanElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const baseRail = useRef<SVGPathElement>(null)
  const { c, lang } = useLang()

  // Measure the three node centres and write a path through them.
  //
  // The viewBox is rewritten to the measured pixel width before the path is
  // written. With a fixed 1000-unit viewBox and `preserveAspectRatio="none"`
  // every x coordinate is scaled by width/1000, so a path built from real
  // pixel centres lands nowhere near the badges.
  useEffect(() => {
    const box = rail.current
    const line = path.current
    const soft = glow.current
    if (!box || !line || !soft) return

    const draw = () => {
      const rect = box.getBoundingClientRect()
      const nodes = Array.from(box.querySelectorAll<HTMLElement>('[data-node]'))
      if (nodes.length < 2 || !svg.current) return

      const svgRect = svg.current.getBoundingClientRect()
      const height = Math.max(1, Math.round(svgRect.height))
      svg.current.setAttribute('viewBox', `0 0 ${Math.round(rect.width)} ${height}`)

      const xs = nodes.map((node) => {
        const r = node.getBoundingClientRect()
        return r.left - rect.left + r.width / 2
      })
      const y = nodes[0].getBoundingClientRect().top - svgRect.top + nodes[0].getBoundingClientRect().height / 2
      const d = `M ${xs[0].toFixed(1)} ${y.toFixed(1)} L ${xs[xs.length - 1].toFixed(1)} ${y.toFixed(1)}`
      line.setAttribute('d', d)
      soft.setAttribute('d', d)
      baseRail.current?.setAttribute('d', d)
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(box)
    return () => observer.disconnect()
  }, [lang])

  useGSAP(
    () => {
      const line = path.current
      const soft = glow.current
      const badges = gsap.utils.toArray<HTMLElement>('[data-node]', root.current)

      const lit = {
        borderColor: 'rgba(16,185,129,0.5)',
        backgroundColor: 'rgba(16,185,129,0.1)',
        color: '#10b981',
      }

      if (reducedMotion()) {
        gsap.set([line, soft], { strokeDashoffset: 0 })
        badges.forEach((badge) => gsap.set(badge, lit))
        if (vline.current) gsap.set(vline.current, { scaleY: 1 })
        return
      }

      const mm = gsap.matchMedia()

      // Desktop: pin, then draw the rail across the pinned distance.
      mm.add('(min-width: 1024px)', () => {
        if (!line || !soft) return
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top 96px',
            end: '+=78%',
            pin: pin.current,
            pinSpacing: true,
            scrub: 0.55,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        tl.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0)
          .fromTo(soft, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0)

        badges.forEach((badge, i) => {
          if (i === 0) {
            gsap.set(badge, lit)
            return
          }
          tl.to(badge, { ...lit, duration: 0.18 }, 0.34 + i * 0.24)
        })

        return () => {
          tl.scrollTrigger?.kill()
          tl.kill()
        }
      })

      // Mobile / tablet: no pin, a vertical rail that fills on scroll.
      mm.add('(max-width: 1023px)', () => {
        if (!vline.current) return
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rail.current,
            start: 'top 72%',
            end: 'bottom 60%',
            scrub: 0.5,
          },
        })
        tl.fromTo(vline.current, { scaleY: 0 }, { scaleY: 1, duration: 1, ease: 'none' }, 0)
        badges.forEach((badge, i) => {
          if (i === 0) return
          tl.to(badge, { ...lit, duration: 0.15 }, 0.3 + i * 0.25)
        })
        return () => {
          tl.scrollTrigger?.kill()
          tl.kill()
        }
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="trial" className="relative scroll-mt-28 pb-20 pt-6 sm:pb-28 sm:pt-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[26rem] opacity-60"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--c-jade) 7%, transparent), transparent 70%)',
        }}
      />

      <div ref={pin} className="shell">
        <div className="max-w-[54rem]">
          <SectionHeading
            index="05"
            eyebrow={c.trial.eyebrow}
            title={c.trial.title}
            lead={c.trial.lead}
          />
          <div className="mt-6 flex items-center gap-2.5 border-t border-hair-soft pt-4">
            <Clock className="size-3.5 text-aurum" aria-hidden="true" />
            <span className="mono-label text-[9px] text-aurum/80" dir="ltr">
              {c.trial.hours}
            </span>
            <span className="mono-label ms-auto hidden text-[8.5px] text-subtle/60 sm:block">
              THREE STEPS · NO FRICTION
            </span>
          </div>
        </div>

        <div ref={rail} className="relative mt-14 lg:mt-16">
          {/* desktop rail */}
          <svg
            ref={svg}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-14 w-full lg:block"
            viewBox="0 0 1000 56"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="trial-grad" x1="100%" y1="0" x2="0%" y2="0">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="52%" stopColor="#0088CC" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            {/* the un-travelled rail */}
            <path
              ref={baseRail}
              d="M 833 28 L 167 28"
              stroke="var(--c-hair)"
              strokeWidth="1"
              strokeDasharray="2 6"
              strokeLinecap="round"
            />
            {/* the glow under the drawn line */}
            <path
              ref={glow}
              d="M 833 28 L 167 28"
              pathLength={1}
              className="draw-path"
              stroke="rgba(16,185,129,0.35)"
              strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: 'blur(6px)' }}
            />
            {/* the drawn line */}
            <path
              ref={path}
              d="M 833 28 L 167 28"
              pathLength={1}
              className="draw-path"
              stroke="url(#trial-grad)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          {/* mobile rail */}
          <span aria-hidden="true" className="absolute inset-y-3 start-7 w-px bg-hair lg:hidden" />
          <span
            ref={vline}
            aria-hidden="true"
            className="absolute inset-y-3 start-7 w-px origin-top scale-y-0 bg-gradient-to-b from-jade via-tg to-aurum lg:hidden"
          />

          <ol className="grid gap-10 ps-0 lg:grid-cols-3 lg:gap-8">
            {c.trial.steps.map((step) => (
              <li key={step.n} className="relative flex flex-col gap-3 ps-20 lg:items-center lg:ps-0 lg:text-center">
                <div className="absolute start-0 top-0 lg:static lg:order-1">
                  <span
                    data-node
                    className="step-badge grid size-14 place-items-center rounded-full border border-hair bg-void font-mono text-[13px] font-medium text-muted transition-colors duration-500"
                  >
                    {step.n}
                  </span>
                </div>

                <span className="mono-label text-[8.5px] text-subtle/70 lg:order-2 lg:mt-1">{step.meta}</span>

                <h3 className="text-[16.5px] font-semibold text-ink lg:order-3">{step.title}</h3>

                <p className="max-w-[36ch] text-[12.5px] leading-[1.9] text-muted lg:order-4">{step.body}</p>

              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 border-t border-hair-soft pt-7 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={site.bot}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-jade w-full sm:w-auto"
          >
            {c.trial.cta} {site.botHandle}
            <ArrowUpLeft className="arrow-rtl size-4" aria-hidden="true" />
          </a>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="mono-label text-[9px]">{c.trial.sampleKey}</span>
            <code
              className="rounded-md border border-hair bg-wash px-2 py-1 font-mono text-[10.5px] text-jade-2/90"
              dir="ltr"
            >
              {site.trialKey}
            </code>
            <span className="text-[11px] text-subtle">{c.trial.sampleNote}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
