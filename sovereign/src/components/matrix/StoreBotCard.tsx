import { ArrowUpLeft, Check, Star } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { storeBot, type OrderTarget } from '@/lib/content'
import { useLang } from '@/lib/i18n'

const target: OrderTarget = {
  id: storeBot.id,
  name: { ar: 'بوت المتجر المتكامل — Pro', en: 'Integrated Store Bot — Pro' },
  priceStars: `${storeBot.stars} ⭐`,
  priceUsd: storeBot.usd,
  note: {
    ar: 'الأكثر طلباً · تركيب وتفعيل خلال 24 ساعة',
    en: 'Most ordered · installed and live within 24 hours',
  },
}

export function StoreBotCard({ onOrder }: { onOrder: (target: OrderTarget) => void }) {
  const { c } = useLang()
  const s = c.solutions.store

  return (
    <SpotlightCard tone="tg" as="article" className="h-full" innerClassName="p-6 sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70"
        style={{
          background:
            'radial-gradient(80% 100% at 80% 0%, color-mix(in oklab, var(--c-tg) 14%, transparent), transparent 70%)',
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="mono-label text-[9px] text-subtle/70">01</span>
          <span className="h-px w-5 bg-hair-2" aria-hidden="true" />
          <span className="mono-label text-[9px]">{s.kicker}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-aurum/30 bg-aurum/[0.09] py-1 pe-2.5 ps-2 text-[10px] font-semibold text-aurum-2">
          <span className="size-1 rounded-full bg-aurum-2" aria-hidden="true" />
          {s.badge}
        </span>
      </div>

      <h3 className="relative mt-5 text-[clamp(1.3rem,2.2vw,1.6rem)] font-semibold text-ink">
        {s.title}
        <span className="ms-2 align-middle font-mono text-[12px] font-medium text-tg-2">{s.pro}</span>
      </h3>

      <p className="relative mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.85] text-muted">{s.desc}</p>

      <div className="relative mt-6 grid gap-2.5 sm:grid-cols-2">
        {s.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-jade/12">
              <Check className="size-2.5 text-jade-2" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-[12.5px] leading-relaxed text-muted/95">{feature}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-xl border border-hair-soft bg-sunken">
        {s.spec.map(([key, value], index) => (
          <div
            key={key}
            className={
              index > 0
                ? 'flex items-center justify-between gap-3 border-t border-hair-soft px-3.5 py-2.5'
                : 'flex items-center justify-between gap-3 px-3.5 py-2.5'
            }
          >
            <span className="mono-label text-[9px] text-subtle/80">{key}</span>
            <span className="text-[12px] font-medium text-ink/85">{value}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[1.55rem] font-medium leading-none text-ink tabular-nums">
              {storeBot.stars}
            </span>
            <Star className="size-4 translate-y-px fill-aurum text-aurum" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-[10px] text-subtle">
            <bdi dir="ltr">{storeBot.usd}</bdi> · {s.priceNote}
          </p>
        </div>

        <button type="button" onClick={() => onOrder(target)} className="btn btn-primary !h-11 cursor-pointer">
          {s.cta}
          <ArrowUpLeft className="arrow-rtl size-4" aria-hidden="true" />
        </button>
      </div>
    </SpotlightCard>
  )
}
