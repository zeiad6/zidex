import { useRef } from 'react'
import { ArrowUpLeft, Download, Link2, ShieldCheck } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { accountingChain, yusr } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { SectionHeading } from '@/components/ui/SectionHeading'

/**
 * Accounting — the sovereign ledger band.
 *
 * The hash chain is drawn as a chain: four blocks, each carrying the hash
 * of the one before it. That is the entire security argument, so it gets
 * the width of the section instead of being buried in a feature list.
 */
export function Accounting({ onReadArticle }: { onReadArticle: () => void }) {
  const root = useRef<HTMLElement>(null)
  const { c } = useLang()

  useGSAP(
    () => {
      if (reducedMotion()) return
      const blocks = gsap.utils.toArray<HTMLElement>('[data-block]', root.current)
      const pillars = gsap.utils.toArray<HTMLElement>('[data-pillar]', root.current)

      gsap.from(blocks, {
        y: 16,
        opacity: 0,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: root.current, start: 'top 78%', once: true },
      })
      // The hashes resolve from noise to hex, left to right. Latin
      // characters only, so the scramble can never break an Arabic join —
      // this is the one place on the site where a decrypt belongs.
      gsap.utils.toArray<HTMLElement>('[data-hash]', root.current).forEach((node, i) => {
        const final = node.dataset.hash ?? ''
        const state = { p: 0 }
        gsap.to(state, {
          p: 1,
          duration: 0.55,
          delay: 0.15 + i * 0.1,
          ease: 'none',
          scrollTrigger: { trigger: node, start: 'top 92%', once: true },
          onUpdate: () => {
            const shown = Math.floor(state.p * final.length)
            let out = ''
            for (let c = 0; c < final.length; c += 1) {
              const ch = final[c]
              out += c < shown || ch === '…' ? ch : '0123456789abcdef'[Math.floor(Math.random() * 16)]
            }
            node.textContent = out
          },
          onComplete: () => {
            node.textContent = final
          },
        })
      })

      gsap.from(pillars, {
        y: 22,
        opacity: 0,
        duration: 0.7,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: root.current, start: 'top 62%', once: true },
      })

      const web = gsap.utils.toArray<HTMLElement>('[data-web]', root.current)
      if (web.length) {
        gsap.from(web, {
          y: 20,
          opacity: 0,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: web[0], start: 'top 90%', once: true },
        })
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} id="accounting" className="relative scroll-mt-28 overflow-hidden pb-20 pt-6 sm:pb-28 sm:pt-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] opacity-70"
        style={{
          background: 'radial-gradient(70% 60% at 50% 0%, rgba(16,185,129,0.06), transparent 70%)',
        }}
      />

      <div className="shell">
        <div className="max-w-[54rem]">
          <SectionHeading
            index="04"
            eyebrow={c.accounting.eyebrow}
            title={c.accounting.title}
            lead={c.accounting.lead}
          />
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-hair-soft pt-4">
            <span className="chip !py-1 !text-[9px] text-jade-2/90">
              <ShieldCheck className="size-2.5" aria-hidden="true" />
              SHA-256
            </span>
            <span className="chip !py-1 !text-[9px]">PgSQL 18</span>
            <span className="chip !py-1 !text-[9px]">ZATCA · PHASE 2</span>
          </div>
        </div>

        <div className="mt-11 rounded-panel border border-hair-soft bg-slab/80 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="mono-label text-[8.5px]">{c.accounting.chain}</span>
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-jade-2/80" dir="ltr">
              <span className="size-1 rounded-full bg-jade-2 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
              {c.accounting.verified}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {accountingChain.map((block, index) => (
              <div key={block.n} data-block className="relative">
                <div className="rounded-xl border border-hair bg-[linear-gradient(180deg,var(--c-wash),transparent)] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-[0.14em] text-subtle" dir="ltr">
                      BLOCK {block.n}
                    </span>
                    <Link2 className="size-3 text-jade/60" aria-hidden="true" />
                  </div>
                  <p className="mt-2.5 font-mono text-[11.5px] text-ink/85">
                    <span data-hash={block.hash}>{block.hash}</span>
                  </p>
                  <p className="mt-1 text-[10.5px] text-subtle">{c.accounting.labels[index]}</p>
                </div>

                {index < accountingChain.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 left-1/2 h-2 w-px -translate-x-1/2 bg-jade/30 sm:hidden"
                  />
                ) : null}
                {index < accountingChain.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -left-2 top-1/2 hidden h-px w-2 -translate-y-1/2 bg-jade/30 lg:block"
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 border-t border-hair-soft pt-5 lg:grid-cols-2">
            {c.accounting.pillars.map((pillar) => (
              <div key={pillar.title} data-pillar className="flex gap-3 rounded-xl bg-wash p-3.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-jade/20 bg-jade/[0.07] text-jade-2">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-[13px] font-semibold text-ink">{pillar.title}</h3>
                    <span className="mono-label text-[7.5px] text-subtle/60">{pillar.note}</span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-[1.85] text-muted">{pillar.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5 border-t border-hair-soft pt-5 sm:flex-row sm:items-center">
            <a
              href={yusr.files[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-jade !h-10 !text-[12px]"
            >
              <Download className="size-3.5" aria-hidden="true" />
              {c.accounting.downloadMsi}
            </a>
            <a
              href={yusr.files[1].href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !h-10 !text-[12px]"
            >
              <Download className="size-3.5" aria-hidden="true" />
              {c.accounting.downloadDeb}
            </a>
            <button type="button" onClick={onReadArticle} className="btn btn-ghost !h-10 !text-[12px]">
              {c.accounting.readArticle}
              <ArrowUpLeft className="arrow-rtl size-3.5" aria-hidden="true" />
            </button>
            <span className="mono-label ms-auto text-[8.5px] text-subtle/70">
              v{yusr.version.replace(/^v/, '')} · {yusr.downloads} {c.accounting.downloads}
            </span>
          </div>
        </div>

        {/* Two systems are live on the web right now. A ledger you can only
            read about is a claim; a ledger you can open in the next tab is
            evidence, so the links get their own block and a live dot. */}
        <div className="mt-12 border-t border-hair-soft pt-7">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="mono-label text-[8.5px] text-jade/80">{c.accounting.web.eyebrow}</span>
            <span className="text-[11.5px] text-subtle">{c.accounting.web.lead}</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {c.accounting.web.items.map((system) => (
              <a
                key={system.name}
                data-web
                href={system.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card spot group relative flex flex-col gap-4 rounded-panel border border-hair-soft bg-panel/70 p-5 transition-[transform,border-color,background-color] duration-500 ease-expo hover:-translate-y-0.5 hover:border-hair hover:bg-panel"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="mono-label text-[8px] text-subtle/65">{system.tag}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.2em] text-jade-2/85">
                    <span
                      aria-hidden="true"
                      className="live-dot size-1 rounded-full bg-jade-2 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                    />
                    {c.accounting.web.live}
                  </span>
                </div>

                <div>
                  {/* the name stays on the reading edge: `dir` on a block
                      would also move its text-align to the left */}
                  <h3 className="font-mono text-[16.5px] font-semibold text-ink">
                    <bdi dir="ltr">{system.name}</bdi>
                  </h3>
                  <p className="mt-1.5 text-[11.5px] leading-[1.85] text-muted">{system.body}</p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-hair-soft pt-3.5">
                  <span className="truncate font-mono text-[10px] text-subtle">
                    <bdi dir="ltr">{system.host}</bdi>
                  </span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-hair text-subtle transition-[border-color,background-color,color] duration-500 ease-expo group-hover:border-jade/40 group-hover:bg-jade/[0.09] group-hover:text-jade-2">
                    <ArrowUpLeft className="size-3" aria-hidden="true" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
