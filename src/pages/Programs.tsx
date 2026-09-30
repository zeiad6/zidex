import { Link } from 'react-router-dom'
import { Glyph } from '@/components/ui/Glyphs'
import { ArrowLeft, ArrowUpLeft, FileCode2, HardDrive, Download, Package } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import {
  primaryDownload,
  programKinds,
  programs,
  type Program,
  type ProgramKind,
} from '@/data/programs'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate } from '@/lib/utils'
import { AuroraBackdrop } from '@/components/ui/AuroraBackdrop'
import { Reveal } from '@/components/ui/Reveal'
import { Magnetic } from '@/components/ui/Interactive'
import { TiltCard } from '@/components/ui/Interactive'
import NotFound from './NotFound'

/**
 * The program library, split by platform.
 *
 * Sections are generated from `programKinds` and only the kinds that
 * actually have programs are rendered, so adding a third platform is a
 * data change and not a layout change.
 */
export default function Programs() {
  const { t } = useI18n()
  const reduce = useReducedMotion() ?? false

  if (programs.length === 0) return <NotFound />

  const groups = (Object.keys(programKinds) as ProgramKind[])
    .map((kind) => ({ kind, meta: programKinds[kind], items: programs.filter((p) => p.kind === kind) }))
    .filter((g) => g.items.length > 0)

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden pt-24 pb-8 sm:pt-28">
        <AuroraBackdrop intensity="md" className="opacity-70" />
        <div className="container-app relative">
          <Reveal>
            <span className="chip bg-accent-soft text-accent mb-5 w-fit">
              <Glyph name="package" size={13} aria-hidden="true" />
              {t('مكتبة البرامج', 'Program library')}
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {t('برامج جاهزة', 'Ready-to-run')}{' '}
              <span className="gradient-text">{t('للتحميل', 'to download')}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-muted mt-5 max-w-2xl text-lg leading-relaxed">
              {t(
                'مقسّمة حسب المنصة. لكل برنامج توثيق يشرح كيف يعمل وما حدوده — لا رابط بلا سياق.',
                'Split by platform. Every program ships with documentation explaining what it does and where it stops — no bare links.',
              )}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Sections, one per platform */}
      <div className="container-app flex flex-col gap-14 pb-16 sm:pb-20">
        {groups.map(({ kind, meta, items }, gi) => (
          <section key={kind} aria-labelledby={`programs-${kind}`}>
            <Reveal delay={Math.min(gi * 0.06, 0.2)}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-app pb-4">
                <div className="flex items-center gap-3.5">
                  <span
                    className="bg-accent-soft text-accent grid size-11 shrink-0 place-items-center rounded-2xl"
                    aria-hidden="true"
                  >
                    <Glyph name={meta.glyph} size={22} />
                  </span>
                  <div>
                    <h2
                      id={`programs-${kind}`}
                      className="text-app text-xl leading-none font-black sm:text-2xl"
                    >
                      {t(meta.label, meta.labelEn)}
                    </h2>
                    <p className="text-subtle mt-1.5 text-[13px]">
                      {t(meta.hint, meta.hintEn)}
                    </p>
                  </div>
                </div>
                <span className="bg-sunken text-subtle rounded-full px-3 py-1 font-mono text-[11px]">
                  {items.length} {t('برنامج', items.length === 1 ? 'program' : 'programs')}
                </span>
              </div>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((prog, i) => (
                <ProgramTile key={prog.slug} program={prog} index={i} reduce={reduce} />
              ))}
            </div>
          </section>
        ))}

        <Reveal delay={0.12}>
          <div className="border-app flex flex-col items-start gap-3 rounded-3xl border border-dashed p-5 sm:flex-row sm:items-center">
            <span className="text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <p className="text-muted flex-1 text-[13px] leading-relaxed">
              {t(
                'قبل تشغيل أي برنامج: تحقّق من مصدر التنزيل، وراجع حدوده الموثّقة في المقال قبل الاعتماد عليه في إنتاج. الحزم غير الموقّعة رقمياً تُظهر تحذيراً في Windows — وهذا سلوك متوقّع لا دليل خطر بالضرورة.',
                'Before running anything: verify the source, and read its documented limits in the article. Unsigned installers warn in Windows — that is expected, not proof of danger.',
              )}
            </p>
          </div>
        </Reveal>
      </div>
    </>
  )
}

function ProgramTile({
  program,
  index,
  reduce,
}: {
  program: Program
  index: number
  reduce: boolean
}) {
  const { lang, t } = useI18n()
  const primary = primaryDownload(program)

  return (
    <Reveal delay={Math.min(index * 0.06, 0.24)} className="h-full">
      <TiltCard max={4} className="group h-full">
        <div className="border-app bg-elevated shadow-app-md hover:shadow-app-lg relative flex h-full min-w-0 flex-col rounded-panel border p-5 transition-[box-shadow] duration-300 hover:border-strong sm:p-6">
          <div className="relative flex items-start gap-4">
            <span
              className="bg-accent-soft text-accent grid size-14 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
              aria-hidden="true"
            >
              <Glyph name={program.glyph} size={30} />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-app text-lg leading-snug font-bold">
                {t(program.name, program.nameEn)}
              </h3>
              <p className="text-muted mt-1.5 text-sm leading-relaxed">
                {t(program.tagline, program.taglineEn)}
              </p>
            </div>
          </div>

          {/* Facts */}
          <dl className="border-app mt-5 grid grid-cols-2 gap-2 border-t pt-4 text-[11px] sm:grid-cols-4">
            {[
              { k: t('الإصدار', 'Version'), v: program.version, icon: FileCode2 },
              { k: t('المنصة', 'Platform'), v: program.platform, icon: HardDrive },
              { k: t('الحجم', 'Size'), v: primary.size, icon: Download },
              { k: t('المضيف', 'Host'), v: primary.host, icon: Package },
            ].map(({ k, v, icon: Icon }) => (
              <div key={k} className="bg-sunken rounded-xl border border-app px-2.5 py-2">
                <dt className="text-subtle flex items-center gap-1">
                  <Icon className="size-3" aria-hidden="true" />
                  {k}
                </dt>
                <dd className="text-app mt-0.5 font-semibold tabular-nums" dir="ltr">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          {/* Every mirror, named. One button that silently picks a host
              leaves no way to try the other when the first is down. */}
          <ul className="mt-3 flex flex-col gap-1">
            {program.downloads.map((d) => (
              <li key={d.href} className="text-subtle truncate font-mono text-[10px]" dir="ltr">
                {d.file} · {d.host}
                {d.note ? <span className="ms-2 font-sans">{d.note}</span> : null}
              </li>
            ))}
          </ul>

          <div className="relative mt-5 flex flex-wrap items-center gap-2.5 border-t border-app pt-4">
            {program.downloads.map((d) => {
              const btn = (
                <a
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  title={`${d.file} · ${d.size}`}
                  className="btn btn-primary h-10 cursor-pointer px-5"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {t('تحميل', 'Download')}
                  <span className="opacity-70" dir="ltr">
                    · {d.host}
                  </span>
                </a>
              )
              return (
                <li key={d.href} className="contents">
                  {reduce ? btn : <Magnetic strength={0.18}>{btn}</Magnetic>}
                </li>
              )
            })}

            {program.post ? (
              <Link
                to={`/blog/${program.post}`}
                className="btn btn-ghost h-10 cursor-pointer px-4 text-sm"
              >
                {t('اقرأ التوثيق', 'Read the docs')}
                <ArrowLeft className="size-3.5" aria-hidden="true" />
              </Link>
            ) : program.docs ? (
              <a
                href={program.docs}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn btn-ghost h-10 cursor-pointer px-4 text-sm"
              >
                {t('التوثيق الكامل', 'Full documentation')}
                <ArrowUpLeft className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}

            <time dateTime={program.date} className={cn('text-subtle mr-auto text-[11px]')}>
              {formatDate(program.date, lang === 'en' ? 'en' : 'ar')}
            </time>
          </div>
        </div>
      </TiltCard>
    </Reveal>
  )
}
