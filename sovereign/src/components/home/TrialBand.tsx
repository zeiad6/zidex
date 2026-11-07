import { Link } from 'react-router-dom'
import { ArrowUpLeft, Clock } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { Reveal } from '@/components/ui/Reveal'

/** The trial in one screen: three steps, one button, no second argument. */
export function TrialBand() {
  const { c } = useLang()

  return (
    <section className="relative pb-20 sm:pb-24">
      <div className="shell">
        <div className="relative overflow-hidden rounded-panel border border-aurum/20 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--c-aurum)_7%,transparent),transparent_55%)] p-6 sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <Clock className="size-3.5 text-aurum" aria-hidden="true" />
                <span className="mono-label text-[9px] text-aurum/80">{c.home.trialEyebrow}</span>
              </div>
              <h2 className="mt-3 text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold text-ink">
                {c.home.trialTitle}
              </h2>
              <p className="mt-2 max-w-[52ch] text-[13px] leading-[1.9] text-muted">{c.home.trialLead}</p>
            </div>
            <Link to="/trial" className="btn btn-primary w-full shrink-0 sm:w-auto">
              {c.home.trialCta}
              <ArrowUpLeft className="arrow-rtl size-4" aria-hidden="true" />
            </Link>
          </div>

          <Reveal as="ul" className="mt-8 grid gap-3 sm:grid-cols-3" stagger={0.06}>
            {c.trial.steps.map((step) => (
              <li key={step.n} data-reveal-item className="rounded-xl border border-hair-soft bg-panel/60 p-4">
                <span className="font-mono text-[10px] text-aurum/80">{step.n}</span>
                <p className="mt-2 text-[12.5px] font-semibold text-ink">{step.title}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-[1.8] text-muted">{step.body}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
