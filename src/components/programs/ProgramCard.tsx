import { Link } from 'react-router-dom'
import { Glyph } from '@/components/ui/Glyphs'
import { primaryDownload, type Program } from '@/data/programs'
import { useI18n } from '@/lib/i18n'

/** One downloadable program: identity, the three facts people check, and the two actions. */
export function ProgramCard({ program }: { program: Program }) {
  const { t } = useI18n()
  const primary = primaryDownload(program)

  return (
    <article className="group border-app bg-elevated shadow-app-md hover:shadow-app-lg flex flex-col gap-4 rounded-2xl border p-5 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center">
      <span
        className="bg-sunken group-hover:bg-accent-soft grid size-14 shrink-0 place-items-center rounded-2xl transition-colors duration-300"
        aria-hidden="true"
      >
        <Glyph name={program.glyph} size={22} className="text-accent" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-app text-base font-semibold">{t(program.name, program.nameEn)}</h3>
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
            {t('مجاني', 'Free')}
          </span>
        </div>
        <p className="text-muted mt-1 line-clamp-2 text-sm leading-relaxed">{t(program.tagline, program.taglineEn)}</p>
        <p className="text-subtle mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]" dir="ltr">
          <span>v{program.version}</span>
          <span>{program.platform}</span>
          <span>{primary.size}</span>
        </p>
      </div>

      {/* One button per mirror, host named on it. A single download button
          that silently picks a host leaves no way to try the other one when
          the first is down. */}
      <div className="flex shrink-0 flex-wrap gap-2">
        {program.downloads.map((d) => (
          <a
            key={d.href}
            href={d.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={d.note ? d.note : `${d.file} · ${d.size}`}
            className="btn btn-primary h-10 cursor-pointer px-4"
          >
            <Glyph name="download" size={16} aria-hidden="true" />
            {t('تحميل', 'Download')}
            <span className="opacity-70" dir="ltr">
              · {d.host}
            </span>
          </a>
        ))}
        {program.post ? (
          <Link to={`/blog/${program.post}`} className="btn btn-ghost h-10 cursor-pointer px-4">
            <Glyph name="doc" size={16} aria-hidden="true" />
            {t('التفاصيل', 'Details')}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
