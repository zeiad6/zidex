import { Link } from 'react-router-dom'
import { ArrowUpLeft, Clock } from 'lucide-react'
import { posts } from '@/lib/posts'
import { useLang } from '@/lib/i18n'
import { Reveal } from '@/components/ui/Reveal'

/** Three entries, read-only, with the whole index one click away. */
export function LatestJournal() {
  const { c, lang } = useLang()
  const latest = posts.slice(0, 3)

  return (
    <section className="relative pb-20 sm:pb-24">
      <div className="shell">
        <div className="max-w-[54rem]">
          <span className="mono-label text-[9px] text-jade/80">{c.home.journalEyebrow}</span>
          <h2 className="mt-3 text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold text-ink">
            {c.home.journalTitle}
          </h2>
          <p className="mt-2 max-w-[52ch] text-[13px] leading-[1.9] text-muted">{c.home.journalLead}</p>
          {/* The way out belongs under the sentence that promises it, not
              marooned on the opposite edge of the page. */}
          <Link to="/journal" className="btn btn-ghost mt-5 !h-10 !px-4 !text-[12px] w-full sm:w-auto">
            {c.home.journalCta}
            <ArrowUpLeft className="arrow-rtl size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <Reveal className="mt-10" stagger={0.06}>
          {latest.map((post) => (
            <Link
              key={post.slug}
              data-reveal-item
              to="/journal"
              className="row-link group grid-cols-[1fr_2.25rem] items-center gap-x-4"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[10px] text-subtle">
                  <span className="rounded border border-hair bg-wash px-1.5 py-0.5">
                    {lang === 'ar' ? post.category : post.categoryEn}
                  </span>
                  <Clock className="size-2.5" aria-hidden="true" />
                  {post.minutes} {c.journal.minutes}
                </span>
                <span className="mt-2 block text-[14.5px] font-medium leading-snug text-ink transition-colors group-hover:text-jade-2">
                  {lang === 'ar' ? post.title : post.titleEn}
                </span>
              </span>
              <span className="grid size-9 place-items-center justify-self-end rounded-full border border-hair text-subtle transition-colors group-hover:border-jade/40 group-hover:text-jade-2">
                <ArrowUpLeft className="arrow-rtl size-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
