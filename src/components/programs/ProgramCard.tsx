import { Link } from 'react-router-dom'
import { Glyph } from '@/components/ui/Glyphs'
import type { Program } from '@/data/programs'
import { useI18n } from '@/lib/i18n'

/** One downloadable program: identity, the three facts people check, and the two actions. */
export function ProgramCard({ program }: { program: Program }) {
  const { t } = useI18n()

  return (
    <article className="bg-elevated flex flex-col gap-4 rounded-2xl border border-app p-5 sm:flex-row sm:items-center">
      <span className="bg-sunken grid size-14 shrink-0 place-items-center rounded-2xl text-3xl" aria-hidden="true">
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
          <span>{program.size}</span>
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <a
          href={program.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn btn-primary h-10 cursor-pointer px-4"
        >
          <Glyph name="download" size={16} aria-hidden="true" />
          {t('تحميل', 'Download')}
        </a>
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
