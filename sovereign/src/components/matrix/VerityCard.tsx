import { Link } from 'react-router-dom'
import { ArrowUpLeft, Download, ScanLine } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { verity } from '@/lib/content'
import { useLang } from '@/lib/i18n'

/**
 * VerityCard — the wide one, and the only animated visual below the fold.
 *
 * The radar is built from borders and one conic gradient: the sweep is a
 * single rotating element, the blips are three static dots with a ping
 * ring. It costs one compositor layer and stops dead under reduced motion.
 */
export function VerityCard() {
  const { c } = useLang()
  const s = c.solutions.verity

  return (
    <SpotlightCard tone="jade" as="article" className="h-full" innerClassName="p-6 sm:p-8">
      <div className="grid gap-9 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mono-label text-[9px] text-subtle/70">04</span>
            <span className="h-px w-5 bg-hair-2" aria-hidden="true" />
            <span className="mono-label text-[9px]">{s.kicker}</span>
            <span className="chip !py-1 !text-[9px] text-jade-2/90">
              <ScanLine className="size-2.5" aria-hidden="true" />
              {s.local}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-mono text-[clamp(1.3rem,2.2vw,1.55rem)] font-medium tracking-[-0.01em] text-ink" dir="ltr">
              {s.name}
            </h3>
            <span className="text-[12.5px] text-subtle">{s.sub}</span>
          </div>

          <p className="mt-3 max-w-[52ch] text-[13px] leading-[1.9] text-muted">{s.desc}</p>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            {verity.facts.map(([key, value]) => (
              <div key={key}>
                <dt className="mono-label text-[8.5px] text-subtle/80">{key}</dt>
                <dd className="mt-1.5 font-mono text-[11.5px] text-ink/85" dir="ltr">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={verity.apk} target="_blank" rel="noopener noreferrer" className="btn btn-jade !h-11">
              <Download className="size-4" aria-hidden="true" />
              {s.download}
              <span className="font-mono text-[10px] opacity-70" dir="ltr">
                {verity.version}
              </span>
            </a>
            <Link
              to="/programs"
              className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink"
            >
              {s.details}
              <ArrowUpLeft
                className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative mx-auto aspect-square w-[min(100%,17rem)]">
            <div className="absolute inset-0 rounded-full border border-jade/15 bg-[radial-gradient(circle,color-mix(in_oklab,var(--c-jade)_8%,transparent),transparent_68%)]" />
            <div className="absolute inset-[13%] rounded-full border border-jade/12" />
            <div className="absolute inset-[27%] rounded-full border border-jade/10" />
            <div className="absolute inset-[41%] rounded-full border border-jade/[0.09]" />

            <span aria-hidden="true" className="absolute inset-y-0 start-1/2 w-px bg-jade/[0.09]" />
            <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-jade/[0.09]" />

            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="radar-sweep" aria-hidden="true" />
            </div>

            {[
              { top: '26%', left: '64%', delay: '0s' },
              { top: '58%', left: '33%', delay: '0.9s' },
              { top: '70%', left: '68%', delay: '1.7s' },
            ].map((blip) => (
              <span
                key={`${blip.top}-${blip.left}`}
                aria-hidden="true"
                className="absolute size-1.5"
                style={{ top: blip.top, left: blip.left }}
              >
                <span className="absolute inset-0 rounded-full bg-jade-2 shadow-[0_0_10px_2px_color-mix(in_oklab,var(--c-jade)_55%,transparent)]" />
                <span
                  className="absolute inset-0 pulse-ring rounded-full bg-jade-2/60"
                  style={{ animationDelay: blip.delay, animationDuration: '3.2s' }}
                />
              </span>
            ))}

            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-jade-2 shadow-[0_0_18px_5px_color-mix(in_oklab,var(--c-jade)_45%,transparent)]"
            />
          </div>

          <div className="mt-5 flex items-center justify-center gap-2" dir="ltr">
            <span className="mono-label text-[8.5px] text-jade-2/70">SCAN</span>
            <span className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="h-2.5 w-1 rounded-[1px] bg-jade/45" />
              ))}
            </span>
            <span className="mono-label text-[8.5px] text-subtle">5 MODELS · 0 UPLOAD</span>
          </div>
        </div>
      </div>
    </SpotlightCard>
  )
}
