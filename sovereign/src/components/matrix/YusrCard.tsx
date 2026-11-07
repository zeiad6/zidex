import { ArrowUpLeft, Download, Terminal } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { yusr } from '@/lib/content'
import { useLang } from '@/lib/i18n'

/**
 * YusrCard — the strict card.
 *
 * No glow, no gradient headline: a system that audits money should look
 * like a spec sheet, not a landing page. The stack is a two-column ledger
 * and the two installers are rows, not buttons, because a download is a
 * file fact and not a call to action.
 */
export function YusrCard() {
  const { c } = useLang()
  const s = c.solutions.yusr

  return (
    <SpotlightCard tone="jade" as="article" className="h-full" innerClassName="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="mono-label text-[9px] text-subtle/70">02</span>
          <span className="h-px w-5 bg-hair-2" aria-hidden="true" />
          <span className="mono-label text-[9px]">{s.kicker}</span>
        </div>
        <span className="chip !py-1 !text-[9px] text-jade-2/90">{yusr.version}</span>
      </div>

      <div className="mt-5 flex items-baseline gap-3">
        <h3 className="text-[clamp(1.3rem,2.2vw,1.6rem)] font-semibold text-ink">{s.name}</h3>
        <span className="text-[12px] text-subtle">{s.sub}</span>
      </div>

      <p className="mt-2.5 text-[13px] leading-[1.85] text-muted">{s.desc}</p>

      <dl className="mt-5 overflow-hidden rounded-xl border border-hair-soft">
        {yusr.stack.map(([key, value], index) => (
          <div
            key={key}
            className={
              index > 0
                ? 'flex items-center justify-between gap-3 border-t border-hair-soft px-3.5 py-2.5'
                : 'flex items-center justify-between gap-3 px-3.5 py-2.5'
            }
          >
            <dt className="mono-label text-[8.5px] text-subtle/80">{key}</dt>
            <dd className="font-mono text-[11px] text-ink/85" dir="ltr">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-2">
        {yusr.files.map((file) => (
          <a
            key={file.label}
            href={file.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group/file flex items-center gap-3 rounded-xl border border-hair bg-wash px-3.5 py-2.5 transition-colors hover:border-jade/35 hover:bg-jade/[0.05]"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-hair bg-sunken text-jade-2">
              {file.label === '.msi' ? (
                <Terminal className="size-3.5" aria-hidden="true" />
              ) : (
                <Download className="size-3.5" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[11.5px] text-ink/90">
                {file.label}
              </span>
              <span className="mt-0.5 block font-mono text-[9px] text-subtle">
                {file.meta}
              </span>
            </span>
            <ArrowUpLeft
              className="size-3.5 shrink-0 text-subtle transition-transform duration-300 group-hover/file:-translate-y-0.5 group-hover/file:text-jade-2"
              aria-hidden="true"
            />
          </a>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="font-mono text-[9px] text-subtle/60" dir="ltr">
          sha256:9f2c…c41a
        </span>
        <span className="mono-label text-[8.5px] text-subtle">
          <span dir="ltr">{yusr.downloads}</span> {s.downloads}
        </span>
      </div>
    </SpotlightCard>
  )
}
