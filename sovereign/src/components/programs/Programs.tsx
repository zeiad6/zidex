import { useMemo, useRef, useState } from 'react'
import { ArrowUpLeft, Download } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { programs, programKinds, totalDownloads, type Program } from '@/lib/programs'
import { useLang } from '@/lib/i18n'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { cn } from '@/lib/cn'

const fmt = (n: number) => n.toLocaleString('en-US')

/** Two letters from the English product name: the tile becomes an identity
 *  mark instead of a generic document icon repeated twenty times. */
function monogram(nameEn: string) {
  const base = nameEn.split('—')[0].trim()
  const words = base.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

/** Twenty builds: a dense two-column register, one row per program. */
export function Programs({ onDetails }: { onDetails: (program: Program) => void }) {
  const root = useRef<HTMLElement>(null)
  const { c, lang } = useLang()
  const [kind, setKind] = useState<string>('all')
  const visible = useMemo(
    () => (kind === 'all' ? programs : programs.filter((program) => program.kind === kind)),
    [kind],
  )

  useGSAP(
    () => {
      if (reducedMotion()) return
      const cards = gsap.utils.toArray<HTMLElement>('[data-program]', root.current)
      if (!cards.length) return
      gsap.from(cards, {
        y: 20,
        opacity: 0,
        duration: 0.55,
        ease: 'expo.out',
        stagger: 0.035,
        overwrite: true,
        scrollTrigger: { trigger: root.current, start: 'top 78%', once: true },
      })
    },
    { scope: root, dependencies: [kind, lang], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="programs" className="relative scroll-mt-28 pb-20 pt-6 sm:pb-28 sm:pt-8">
      <div className="shell">
        {/* One column: the register's totals are part of the sentence
            about the register, so they follow it on the same edge instead
            of floating at the far margin. */}
        <div className="max-w-[54rem]">
          <SectionHeading
            index="02"
            eyebrow={c.programs.eyebrow}
            title={c.programs.title}
            lead={c.programs.lead}
          />

          <div className="mt-6 flex items-center gap-5 border-t border-hair-soft pt-4">
            <div>
              <p className="font-mono text-[19px] font-medium leading-none text-ink tabular-nums">
                {(totalDownloads / 1_000_000).toFixed(1)}M
              </p>
              <p className="mono-label mt-1.5 text-[8.5px]">{c.programs.totalDownloads}</p>
            </div>
            <span aria-hidden="true" className="h-8 w-px bg-hair" />
            <div>
              <p className="font-mono text-[19px] font-medium leading-none text-ink tabular-nums">20</p>
              <p className="mono-label mt-1.5 text-[8.5px]">{c.programs.builds}</p>
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-2">
          {programKinds.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              aria-pressed={kind === item.id}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-colors duration-300',
                kind === item.id
                  ? 'border-jade/40 bg-jade/[0.1] text-jade-2'
                  : 'border-hair bg-wash text-muted hover:border-hair-2 hover:text-ink',
              )}
            >
              {lang === 'ar' ? item.label : item.labelEn}
              <span className="font-mono text-[9px] opacity-60">{item.count}</span>
            </button>
          ))}
          <span className="mono-label ms-auto hidden text-[9px] sm:block">
            {fmt(visible.length)} {c.programs.shown}
          </span>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {visible.map((program) => {
            const primary = program.downloads[0]
            return (
              <article
                key={program.slug}
                data-program
                className="card spot group relative flex flex-col gap-4 rounded-card border border-hair-soft bg-panel/80 p-5 transition-[border-color,background-color,transform] duration-500 ease-expo hover:-translate-y-0.5 hover:border-hair hover:bg-panel hover:shadow-[0_28px_60px_-44px_rgb(0_0_0/0.9)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-hair bg-wash px-1.5 py-0.5 text-[9.5px] font-medium text-subtle">
                        {lang === 'ar' ? program.badge : program.badgeEn}
                      </span>
                      <span className="font-mono text-[9px] text-subtle/70" dir="ltr">
                        v{program.version.replace(/^v/, '')}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-[14.5px] font-semibold leading-snug text-ink">
                      {lang === 'ar' ? program.name : program.nameEn}
                    </h3>
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-[11px] border border-hair bg-[linear-gradient(160deg,var(--c-wash-2),transparent)] font-mono text-[11px] font-medium tracking-[0.04em] text-subtle transition-colors duration-500 group-hover:border-jade/35 group-hover:text-jade-2"
                  >
                    {monogram(program.nameEn)}
                  </span>
                </div>

                <p className="line-clamp-2 text-[12px] leading-[1.85] text-muted">
                  {lang === 'ar' ? program.tagline : program.taglineEn}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-hair-soft pt-3.5">
                  <span className="font-mono text-[9.5px] text-subtle" dir="ltr">
                    {program.platform}
                  </span>
                  <span className="font-mono text-[9.5px] text-subtle/70" dir="ltr">
                    {primary.size}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[9.5px] text-jade-2/80" dir="ltr">
                    <Download className="size-3" aria-hidden="true" />
                    {program.downloadsCount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={primary.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-jade/30 bg-jade/[0.08] text-[11.5px] font-semibold text-jade-2 transition-colors hover:border-jade/50 hover:bg-jade/[0.14]"
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                    {c.programs.download}
                    <span className="font-mono text-[9px] opacity-70" dir="ltr">
                      {primary.host}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onDetails(program)}
                    className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-hair bg-wash text-[11.5px] font-medium text-muted transition-colors hover:border-hair-2 hover:text-ink"
                  >
                    {c.programs.details}
                    <ArrowUpLeft className="arrow-rtl size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {visible.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-subtle">{c.programs.empty}</p>
        ) : null}
      </div>
    </section>
  )
}
