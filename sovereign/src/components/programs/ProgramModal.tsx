import { useEffect, useState } from 'react'
import { ArrowUpLeft, BookOpen, Download, ExternalLink, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { type Program } from '@/lib/programs'
import { cn } from '@/lib/cn'
import { useLang } from '@/lib/i18n'

type Props = {
  program: Program | null
  onClose: () => void
  onReadArticle: (slug: string) => void
}

/**
 * ProgramModal — the full record for one build.
 *
 * Every mirror is listed with its host and size, because "download failed"
 * is usually "the mirror is down", not "the file is gone". The download
 * total is the real one from the release mirrors, and the article link
 * only appears when a written article actually exists for this build.
 */
export function ProgramModal({ program, onClose, onReadArticle }: Props) {
  const [shown, setShown] = useState<Program | null>(program)
  const { c, lang } = useLang()

  useEffect(() => {
    if (program) setShown(program)
  }, [program])

  return (
    <Modal open={Boolean(program)} onClose={onClose} labelledBy="program-title" className="sm:max-w-[40rem]">
      {shown ? (
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5 pe-10">
            <span className="rounded border border-jade/25 bg-jade/[0.07] px-2 py-0.5 text-[10px] font-medium text-jade-2">
              {lang === 'ar' ? shown.badge : shown.badgeEn}
            </span>
            <span className="chip !py-1 !text-[9px]">v{shown.version.replace(/^v/, '')}</span>
            <span className="font-mono text-[9.5px] text-subtle" dir="ltr">
              {shown.platform}
            </span>
            <span className="mono-label ms-auto text-[8.5px]">{shown.date}</span>
          </div>

          <h2 id="program-title" className="mt-4 text-[21px] font-semibold leading-[1.45] text-ink">
            {lang === 'ar' ? shown.name : shown.nameEn}
          </h2>
          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-subtle/70">
            {shown.nameEn}
          </p>

          <p className="mt-3.5 text-[12.5px] leading-[1.95] text-muted">{lang === 'ar' ? shown.tagline : shown.taglineEn}</p>

          <div className="mt-5 grid grid-cols-3 divide-x divide-hair-soft rounded-xl border border-hair bg-wash rtl:divide-x-reverse">
            {[
              ['DOWNLOADS', shown.downloadsCount],
              ['COMPACT', lang === 'ar' ? shown.compactDownloads : shown.compactDownloadsEn],
              ['MIRRORS', String(shown.downloads.length)],
            ].map(([key, value]) => (
              <div key={key} className="px-3 py-2.5">
                <p className="mono-label text-[8px] text-subtle/70">{key}</p>
                <p className="mt-1 truncate font-mono text-[11px] tabular-nums text-ink/85">
                  <span dir="ltr">{value}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <p className="mono-label text-[8.5px]">{c.programs.whatItDoes}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {(lang === 'ar' ? shown.items : shown.itemsEn).map((item) => (
                <li key={item} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-jade/80" aria-hidden="true" />
                  <span className="text-[11.5px] leading-[1.8] text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <p className="mono-label text-[8.5px]">{c.programs.downloadMirrors}</p>
            <div className="mt-3 grid gap-2">
              {shown.downloads.map((file, index) => (
                <a
                  key={file.href}
                  href={file.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'group/file flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors',
                    index === 0
                      ? 'border-jade/30 bg-jade/[0.05] hover:border-jade/50'
                      : 'border-hair bg-wash hover:border-hair-2',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-lg border',
                      index === 0
                        ? 'border-jade/25 bg-jade/10 text-jade-2'
                        : 'border-hair bg-sunken text-subtle',
                    )}
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-ink/90" dir="ltr">
                        {file.host}
                      </span>
                      {index === 0 ? (
                        <span className="rounded bg-jade/12 px-1 py-0.5 font-mono text-[8px] text-jade-2">
                          {c.programs.primary}
                        </span>
                      ) : null}
                      {file.note ? <span className="text-[9.5px] text-subtle">{lang === 'ar' ? file.note : (file.noteEn ?? file.note)}</span> : null}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[9px] text-subtle">
                      <span dir="ltr">
                        {file.file} · {file.size}
                      </span>
                    </span>
                  </span>
                  <ExternalLink className="size-3.5 shrink-0 text-subtle transition-colors group-hover/file:text-jade-2" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            {shown.post ? (
              <button
                type="button"
                onClick={() => onReadArticle(shown.post!)}
                className="btn btn-primary !h-11 flex-1"
              >
                <BookOpen className="size-4" aria-hidden="true" />
                {c.programs.readArticle}
              </button>
            ) : null}
            {shown.docs ? (
              <a
                href={shown.docs}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('btn !h-11', shown.post ? 'btn-ghost' : 'btn-primary', 'flex-1')}
              >
                {c.programs.docs}
                <ArrowUpLeft className="arrow-rtl size-3.5" aria-hidden="true" />
              </a>
            ) : null}
            {!shown.post && !shown.docs ? (
              <button type="button" onClick={onClose} className="btn btn-ghost !h-11 flex-1">
                {c.programs.close}
              </button>
            ) : null}
          </div>

          <p className="mt-3 text-center text-[10px] text-subtle">
            {c.programs.directNote}
          </p>
        </div>
      ) : null}
    </Modal>
  )
}
