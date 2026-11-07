import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpLeft, Check, ShieldCheck } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { site } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { DecryptedText } from '@/components/ui/DecryptedText'
import { Terminal } from './Terminal'
import { TiltCard } from '@/components/ui/TiltCard'
import { useMagnetic } from '@/components/ui/Magnetic'
import { StatRail } from './StatRail'
import { CapabilityTicker } from './CapabilityTicker'

/**
 * Hero — asymmetric on purpose.
 *
 * The headline holds the reading edge (right, in RTL) and the terminal
 * sits in the opposite corner as evidence. Nothing is centred: a centred
 * hero would make the terminal a decoration, and this one is an argument.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)
  const primary = useMagnetic()
  const secondary = useMagnetic(0.16)
  const { c, lang } = useLang()

  useGSAP(
    () => {
      if (reducedMotion()) return
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({ delay: 0.05, defaults: { ease: 'expo.out' } })

      tl.from(q('[data-hero-eyebrow]'), { y: 12, opacity: 0, duration: 0.4 })
        .from(q('[data-hero-line]'), { y: 22, opacity: 0, duration: 0.55, stagger: 0.07 }, '-=0.3')
        .from(q('[data-hero-lead]'), { y: 12, opacity: 0, duration: 0.45 }, '-=0.35')
        .from(q('[data-hero-cta]'), { y: 10, opacity: 0, duration: 0.4, stagger: 0.05 }, '-=0.28')
        .from(q('[data-hero-trust]'), { y: 8, opacity: 0, duration: 0.35 }, '-=0.22')
        // The terminal enters early and on its own clock: leaving the left
        // column empty for a second reads as a broken layout, not as drama.
        .from(q('[data-hero-term]'), { y: 18, opacity: 0, duration: 0.55 }, 0.05)
        .from(q('[data-hero-badge]'), { y: 8, opacity: 0, duration: 0.3, stagger: 0.04 }, 0.35)

      // Depth on scroll: the seal falls slower than the paper, the terminal
      // lifts a hair. Both are scrub-bound, so scrolling back rewinds them.
      gsap.to(q('[data-hero-seal]'), {
        yPercent: 16,
        rotate: 5,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.7 },
      })
      gsap.to(q('[data-hero-term]'), {
        yPercent: -4,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.7 },
      })
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="hero" className="relative overflow-hidden pb-4 pt-[8.75rem] sm:pt-[9.5rem]">
      {/* seal watermark — depth without a blob */}
      <div data-hero-seal aria-hidden="true" className="pointer-events-none absolute -top-6 left-[4%] -z-10 will-change-transform">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-[36rem] w-[36rem] text-seal"
        fill="none"
      >
        <path d="M12 2.2 20.6 7v10L12 21.8 3.4 17V7z" stroke="currentColor" strokeWidth="0.18" />
        <path d="M12 4.9 18.1 8.4v7.2L12 19.1 5.9 15.6V8.4z" stroke="currentColor" strokeWidth="0.12" />
        <circle cx="12" cy="12" r="7.4" stroke="currentColor" strokeWidth="0.1" />
      </svg>
      </div>

      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob" data-glow="jade" />
        <span className="aurora-blob" data-glow="tg" />
        <span className="aurora-blob" data-glow="aurum" />
      </div>

      <div className="shell">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div data-hero-eyebrow className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-jade/25 bg-jade/[0.07] py-1 pe-3 ps-2">
                <span className="relative grid size-1.5 place-items-center">
                  <span className="size-1.5 rounded-full bg-jade-2" />
                  <span className="absolute inset-0 pulse-ring rounded-full bg-jade-2/70" />
                </span>
                <span className="font-mono text-[9.5px] font-medium tracking-[0.22em] text-jade-2/95" dir="ltr">
                  {c.hero.eyebrow}
                </span>
              </span>
              <span className="chip !text-[9.5px]">{site.version}</span>
              <span className="hidden h-px flex-1 bg-gradient-to-l from-hair-2 to-transparent sm:block" />
            </div>

            <h1 className="mt-6 text-[clamp(1.95rem,4.2vw,3.25rem)] leading-[1.24] text-ink">
              {c.hero.lines.map((line, index) => (
                <span key={`${lang}-${line}`} data-hero-line className="block">
                  {index === c.hero.accentLine ? (
                    <span className="relative inline-block text-jade-2">
                      <DecryptedText key={lang} text={line} delay={0.18 + index * 0.08} duration={0.75} />
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-1 h-px bg-[repeating-linear-gradient(90deg,var(--color-jade)_0_4px,transparent_4px_8px)] opacity-45"
                      />
                    </span>
                  ) : (
                    <DecryptedText key={lang} text={line} delay={0.14 + index * 0.08} duration={0.75} />
                  )}
                </span>
              ))}
            </h1>

            <p data-hero-lead className="mt-6 max-w-[56ch] text-[15px] leading-[1.95] text-muted sm:text-[15.5px]">
              {c.hero.lead}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link ref={primary} data-hero-cta to="/trial" className="btn btn-primary w-full sm:w-auto">
                {c.hero.primaryCta}
                <ArrowUpLeft className="arrow-rtl size-4" aria-hidden="true" />
              </Link>
              <Link ref={secondary} data-hero-cta to="/solutions" className="btn btn-ghost w-full sm:w-auto">
                {c.hero.secondaryCta}
              </Link>
            </div>

            <ul data-hero-trust className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              {c.hero.trust.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-[12px] text-subtle">
                  <Check className="size-3.5 text-jade" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div data-hero-term>
              <TiltCard max={2.6}>
                <Terminal />
              </TiltCard>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {c.hero.badges.map((badge) => (
                <span key={badge} data-hero-badge className="chip !gap-1.5 !py-1 !text-[9.5px] text-muted/90">
                  <ShieldCheck className="size-3 text-jade/80" aria-hidden="true" />
                  <span dir="ltr">{badge}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <StatRail />
        <CapabilityTicker />
      </div>
    </section>
  )
}
