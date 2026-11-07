import { CreditCard } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { TiltCard } from '@/components/ui/TiltCard'
import { CopyButton } from '@/components/ui/CopyButton'
import { bank, site } from '@/lib/content'
import { useLang } from '@/lib/i18n'

/**
 * KuraimiCard — the payment rail.
 *
 * The card is a real object: 1.586 ratio, chip, contactless arcs, holder
 * and account number on separate Z layers. The tilt is the only place on
 * the page where the third dimension is used, which is what keeps it
 * feeling like a card you could pick up instead of a div with a gradient.
 */
export function KuraimiCard() {
  const { c, lang } = useLang()
  const s = c.solutions.bank

  return (
    <SpotlightCard tone="aurum" as="article" className="h-full" innerClassName="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="mono-label text-[9px] text-subtle/70">03</span>
          <span className="h-px w-5 bg-hair-2" aria-hidden="true" />
          <span className="mono-label text-[9px]">{s.kicker}</span>
        </div>
        <span className="chip !py-1 !text-[9px]">
          <CreditCard className="size-2.5 text-aurum" aria-hidden="true" />
          {bank.name[lang]}
        </span>
      </div>

      <div className="mt-6">
        <TiltCard className="w-full">
          <div
            data-surface="dark"
            className="relative aspect-[1.586] w-full overflow-hidden rounded-2xl border border-jade/25 bg-[linear-gradient(135deg,#04302A_0%,#0A4A3C_46%,#052622_100%)] p-4 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.9),inset_0_1px_0_0_rgb(255_255_255/0.14)] sm:p-5"
          >
            {/* guilloche — the fine engine-turned pattern of a real card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  'repeating-radial-gradient(circle at 88% 118%, rgba(255,255,255,0.5) 0 1px, transparent 1px 9px)',
              }}
            />
            {/* glare, driven by the tilt */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(420px circle at var(--gx, 50%) var(--gy, 0%), rgba(255,255,255,0.16), transparent 62%)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/40 to-transparent"
            />

            <div className="tilt-layer relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-white/95">{bank.name[lang]}</p>
                  <p className="mt-0.5 font-mono text-[8px] tracking-[0.24em] text-white/50" dir="ltr">
                    SOVEREIGN ACCOUNT
                  </p>
                </div>
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-white/70" dir="ltr">
                  KURAIMI
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative h-7 w-9 shrink-0 overflow-hidden rounded-[5px] bg-[linear-gradient(135deg,#FCD34D,#F59E0B_60%,#B45309)]">
                  <span aria-hidden="true" className="absolute inset-x-1 top-1/2 h-px bg-black/25" />
                  <span aria-hidden="true" className="absolute inset-y-1 left-1/3 w-px bg-black/20" />
                  <span aria-hidden="true" className="absolute inset-y-1 right-1/3 w-px bg-black/20" />
                </div>
                <svg viewBox="0 0 24 24" className="size-5 text-white/45" fill="none" aria-hidden="true">
                  <path
                    d="M8.5 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M14.5 3.5a12 12 0 0 1 0 17"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <p className="font-mono text-[8px] tracking-[0.22em] text-white/45" dir="ltr">
                  {s.accountLabel}
                </p>
                <p
                  className="mt-1 font-mono text-[clamp(1.25rem,2.4vw,1.6rem)] font-medium leading-none tracking-[0.08em] text-white tabular-nums"
                  dir="ltr"
                >
                  {bank.display}
                </p>
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="flex gap-1">
                  {bank.currencies.map((currency) => (
                    <span
                      key={currency}
                      className="rounded border border-white/15 bg-white/[0.07] px-1.5 py-0.5 font-mono text-[8.5px] tracking-wider text-white/75"
                      dir="ltr"
                    >
                      {currency}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[8.5px] tracking-[0.18em] text-white/55" dir="ltr">
                  {bank.holder}
                </span>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="mt-5">
        <CopyButton value={bank.account} label={s.copy} className="w-full" />
      </div>

      <p className="mt-3.5 text-[11.5px] leading-relaxed text-subtle">
        {s.after.split('{bot}')[0]}
        <a
          href={site.bot}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-tg-2 underline decoration-tg/40 underline-offset-4 transition-colors hover:text-ink"
          dir="ltr"
        >
          {site.botHandle}
        </a>
        {s.after.split('{bot}')[1] ?? ''}
      </p>
    </SpotlightCard>
  )
}
