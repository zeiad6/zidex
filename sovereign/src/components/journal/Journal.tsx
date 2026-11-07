import { useMemo, useRef, useState } from 'react'
import { ArrowUpLeft, Clock } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { posts, postCategories, type Post } from '@/lib/posts'
import { useLang } from '@/lib/i18n'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { cn } from '@/lib/cn'

const INITIAL = 6

const categoryLabel = (category: string, lang: 'ar' | 'en') => {
  if (category === 'الكل') return lang === 'ar' ? 'الكل' : 'All'
  if (lang === 'ar') return category
  return posts.find((post) => post.category === category)?.categoryEn ?? category
}

/**
 * Journal — the real index (17 entries), filterable, not a teaser strip.
 *
 * A row is the right shape for a reading list: it scans vertically, the
 * title carries the weight, and the whole row is the button. Filters are
 * client-side because the whole index is metadata only — the article
 * bodies never enter this bundle.
 */
export function Journal({ onOpen }: { onOpen: (post: Post) => void }) {
  const root = useRef<HTMLElement>(null)
  const { c, lang } = useLang()
  const [category, setCategory] = useState<string>('الكل')
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(
    () => (category === 'الكل' ? posts : posts.filter((post) => post.category === category)),
    [category],
  )
  const visible = expanded ? filtered : filtered.slice(0, INITIAL)

  useGSAP(
    () => {
      if (reducedMotion()) return
      const rows = gsap.utils.toArray<HTMLElement>('[data-row]', root.current)
      if (!rows.length) return
      gsap.from(rows, {
        y: 18,
        opacity: 0,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.05,
        overwrite: true,
        scrollTrigger: { trigger: root.current, start: 'top 80%', once: true },
      })
    },
    { scope: root, dependencies: [category, expanded, lang], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="journal" className="relative scroll-mt-28 pb-20 pt-6 sm:pb-28 sm:pt-8">
      <div className="shell">
        <div className="max-w-[54rem]">
          <SectionHeading
            index="06"
            eyebrow={c.journal.eyebrow}
            title={c.journal.title}
            lead={c.journal.lead}
          />
        </div>

        <div className="mt-9 flex flex-wrap gap-2">
          {postCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(item)
                setExpanded(false)
              }}
              aria-pressed={category === item}
              className={cn(
                'cursor-pointer rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-colors duration-300',
                category === item
                  ? 'border-jade/40 bg-jade/[0.1] text-jade-2'
                  : 'border-hair bg-wash text-muted hover:border-hair-2 hover:text-ink',
              )}
            >
              {categoryLabel(item, lang)}
            </button>
          ))}
          <span className="mono-label ms-auto hidden items-center gap-3 self-center text-[9px] sm:flex">
            <span className="tabular-nums">
              {filtered.length} {c.journal.matches}
              {filtered.length === 1 ? '' : c.journal.matchesPlural}
            </span>
            <span className="h-2.5 w-px bg-hair" aria-hidden="true" />
            <span className="text-subtle/60">AR · EN · NO PAYWALL</span>
          </span>
        </div>

        <div className="mt-8">
          <div className="hidden grid-cols-[3rem_1fr_7.5rem_3rem] items-center gap-4 pb-3 lg:grid">
            <span className="mono-label text-[8.5px]">NO.</span>
            <span className="mono-label text-[8.5px]">ENTRY</span>
            <span className="mono-label text-[8.5px]">DATE</span>
            <span />
          </div>

          {visible.map((post) => {
            const index = posts.findIndex((item) => item.slug === post.slug)
            return (
              <button
                key={post.slug}
                type="button"
                data-row
                onClick={() => onOpen(post)}
                className="row-link group w-full cursor-pointer grid-cols-[2.25rem_1fr_2.25rem] items-center gap-x-4 text-start lg:grid-cols-[3rem_1fr_7.5rem_3rem]"
              >
                <span className="mono-label text-[9px] text-subtle/60">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-hair bg-wash px-1.5 py-0.5 text-[9.5px] font-medium text-subtle">
                      {lang === 'ar' ? post.category : post.categoryEn}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-subtle/70 lg:hidden">
                      <Clock className="size-2.5" aria-hidden="true" />
                      {post.minutes} {c.journal.minuteShort}
                    </span>
                  </span>
                  <span className="mt-2 block text-[15px] font-medium leading-snug text-ink transition-colors duration-300 group-hover:text-jade-2">
                    {lang === 'ar' ? post.title : post.titleEn}
                  </span>
                  <span className="mt-1.5 line-clamp-1 text-[12px] leading-relaxed text-subtle">
                    {lang === 'ar' ? post.excerpt : post.excerptEn}
                  </span>
                </span>

                <span className="hidden flex-col items-start gap-1 lg:flex">
                  <span className="font-mono text-[10.5px] tabular-nums text-subtle" dir="ltr">
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10.5px] text-subtle/70">
                    <Clock className="size-2.5" aria-hidden="true" />
                    {post.minutes} {c.journal.minutes}
                  </span>
                </span>

                <span className="grid size-9 place-items-center justify-self-end rounded-full border border-hair text-subtle transition-[border-color,background-color,color] duration-300 group-hover:border-jade/40 group-hover:bg-jade/[0.08] group-hover:text-jade-2">
                  <ArrowUpLeft
                    className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              </button>
            )
          })}

          {visible.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-subtle">{c.journal.empty}</p>
          ) : null}
        </div>

        {filtered.length > INITIAL ? (
          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="btn btn-ghost !h-10 !px-5 !text-[12px]"
            >
              {expanded ? c.journal.collapse : `${c.journal.expand} (${filtered.length})`}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
