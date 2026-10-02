import { Link } from 'react-router-dom'
import { Glyph } from '@/components/ui/Glyphs'
import { primaryDownload, type Program } from '@/data/programs'
import { useI18n } from '@/lib/i18n'
import { Cloud, Flame, Package } from 'lucide-react'

function hostIcon(host: string) {
  if (host.toLowerCase().includes('mediafire')) return Flame
  if (host.toLowerCase().includes('drive')) return Cloud
  return Package
}

export function ProgramCard({ program }: { program: Program }) {
  const { t } = useI18n()
  const primary = primaryDownload(program)

  return (
    <article className="group border-app bg-elevated shadow-app-md hover:shadow-app-lg flex flex-col gap-3 rounded-2xl border p-4 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center">
      <span
        className="bg-sunken group-hover:bg-accent-soft grid size-11 shrink-0 place-items-center rounded-xl transition-colors duration-300"
        aria-hidden="true"
      >
        <Glyph name={program.glyph} size={20} className="text-accent" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-app text-[15px] font-semibold">{t(program.name, program.nameEn)}</h3>
          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" dir="ltr">
            v{program.version}
          </span>
        </div>
        <p className="text-muted mt-0.5 line-clamp-2 text-[13px] leading-relaxed">{t(program.tagline, program.taglineEn)}</p>
        <p className="text-subtle mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px]" dir="ltr">
          <span>{program.platform}</span>
          <span>{primary.size}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {program.downloads.map((d) => {
          const HostIcon = hostIcon(d.host)
          return (
            <a
              key={d.href}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title={d.note ? d.note : `${d.file} · ${d.size}`}
              className="btn btn-primary h-9 cursor-pointer gap-1.5 px-3.5 text-[13px]"
            >
              <HostIcon className="size-3.5" aria-hidden="true" />
              {d.host}
            </a>
          )
        })}
        {program.post ? (
          <Link to={`/blog/${program.post}`} className="btn btn-ghost h-9 cursor-pointer px-3 text-[13px]">
            <Glyph name="doc" size={14} aria-hidden="true" />
            {t('التفاصيل', 'Details')}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
