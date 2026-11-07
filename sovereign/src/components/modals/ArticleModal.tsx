import { useEffect, useState } from 'react'
import { ArrowUpLeft, Clock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { Article } from '@/lib/articles'
import { useLang } from '@/lib/i18n'
import { site } from '@/lib/content'

/**
 * ArticleModal — the summary state.
 *
 * Same shell as the order dialog, so the two open with one physical
 * language. The summary is the payload; the points are the part a reader
 * can act on, so they get the ticks rather than the paragraph.
 */
export function ArticleModal({ article, onClose }: { article: Article | null; onClose: () => void }) {
  const [shown, setShown] = useState<Article | null>(article)
  const { c, lang } = useLang()

  useEffect(() => {
    if (article) setShown(article)
  }, [article])

  const post = shown?.post
  const points = post ? (lang === 'ar' ? post.headings : post.headingsEn) : []

  return (
    <Modal open={Boolean(article)} onClose={onClose} labelledBy="article-title" className="sm:max-w-[38rem]">
      {post ? (
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5 pe-10">
            <span className="rounded border border-jade/25 bg-jade/[0.07] px-2 py-0.5 text-[10px] font-medium text-jade-2">
              {lang === 'ar' ? post.category : post.categoryEn}
            </span>
            <span className="flex items-center gap-1 text-[10.5px] text-subtle">
              <Clock className="size-3" aria-hidden="true" />
              {post.minutes} {c.journal.readTime}
            </span>
            <span className="mono-label text-[8.5px]">{c.journal.summary}</span>
          </div>

          <h2 id="article-title" className="mt-4 text-[21px] font-semibold leading-[1.45] text-ink">
            {lang === 'ar' ? post.title : post.titleEn}
          </h2>

          <p className="mt-3.5 text-[13px] leading-[1.95] text-muted">
            {lang === 'ar' ? post.excerpt : post.excerptEn}
          </p>

          <div className="mt-5 rounded-xl border border-hair bg-wash p-4">
            <p className="mono-label text-[8.5px]">{c.journal.keyPoints}</p>
            <ul className="mt-3 space-y-2.5">
              {points.slice(0, 5).map((point) => (
                <li key={point} className="flex gap-2.5">
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-jade-2" aria-hidden="true" />
                  <span className="text-[12px] leading-[1.8] text-muted">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={site.blog} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !h-11 flex-1">
              {c.journal.openFull}
              <ArrowUpLeft className="arrow-rtl size-3.5" aria-hidden="true" />
            </a>
            <button type="button" onClick={onClose} className="btn btn-primary !h-11 flex-1">
              {c.journal.done}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
