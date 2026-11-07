import { stats } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

/**
 * StatRail — three numbers, separated by hairlines, no cards.
 *
 * The value is mono and tabular so the digits do not jitter while the
 * counter runs; the label is the reader's language and the note is the
 * machine name for the same fact, which is how the rest of the page speaks.
 */
export function StatRail() {
  const { c, lang } = useLang()

  return (
    <div className="mt-14 sm:mt-16">
      <div className="rule" />
      <div className="grid grid-cols-1 sm:grid-cols-3">
        {stats.map((stat, index) => {
          const text = c.stats[stat.key]
          return (
            <div
              key={stat.key}
              className={
                index > 0
                  ? 'border-t border-hair-soft py-6 sm:border-t-0 sm:border-s sm:py-8 sm:ps-8'
                  : 'py-6 sm:py-8'
              }
            >
              <p className="font-mono text-[clamp(1.65rem,3vw,2.25rem)] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">
                <span dir="ltr" className="inline-block">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </span>
              </p>
              <p className="mt-2.5 text-[13.5px] font-medium text-muted">{text.label}</p>
              <p className="mono-label mt-1.5 text-[9px] text-subtle/80" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {text.note}
              </p>
            </div>
          )
        })}
      </div>
      <div className="rule" />
    </div>
  )
}
