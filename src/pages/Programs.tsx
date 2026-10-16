import { Link } from 'react-router-dom'
import { Glyph } from '@/components/ui/Glyphs'
import { ArrowLeft, ArrowUpLeft, HardDrive, Download, Package, Cloud, Flame, Smartphone, Monitor } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  primaryDownload,
  programKinds,
  programs,
  type Program,
  type ProgramKind,
} from '@/data/programs'
import { useDownloadCount } from '@/lib/downloads'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site } from '@/lib/site'
import { formatDate } from '@/lib/utils'
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

  usePageMeta(
    `${t('البرامج', 'Programs')} — ${site.name}`,
    t('برامج وتطبيقات جاهزة للتحميل من ZeidexSoft.', 'Ready-to-download apps and tools from ZeidexSoft.'),
    '/programs',
  )

  if (programs.length === 0) return <NotFound />

  const groups = (Object.keys(programKinds) as ProgramKind[])
    .map((kind) => ({ kind, meta: programKinds[kind], items: programs.filter((p) => p.kind === kind) }))
    .filter((g) => g.items.length > 0)

  return (
    <>
      {/* Header */}
      <section className="swiss relative pt-10 pb-8 sm:pt-12">
        <div className="container-app relative">
          <div className="h-px w-full" style={{ background: 'var(--line-strong)' }} />
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="swiss-label text-app font-semibold">{t('مكتبة البرامج', 'Program library')}</span>
            <span className="swiss-label text-subtle">{t(`${programs.length} برنامج`, `${programs.length} programs`)}</span>
          </div>
          <div className="h-px w-full" style={{ background: 'var(--line-strong)' }} />
          <Reveal delay={0.06}>
            <h1 className="swiss-headline swiss-display text-app mt-10">
              {t('برامج جاهزة ', 'Ready-to-run ')}
              <span style={{ color: 'var(--swiss-accent)' }}>{t('للتحميل.', 'to download.')}</span>
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
                <span className="bg-sunken text-subtle rounded-full px-3 py-1 font-mono text-[11px] tabular-nums">
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

function hostIcon(host: string) {
  if (host.toLowerCase().includes('mediafire')) return Flame
  if (host.toLowerCase().includes('drive')) return Cloud
  return Package
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
  const { count, bump } = useDownloadCount(program.slug)

  return (
    <Reveal delay={Math.min(index * 0.06, 0.24)} className="h-full">
      <TiltCard max={4} className="group h-full">
        <div className="border-app bg-elevated shadow-app card-lift hover:border-accent/40 hover:shadow-app-lg relative flex h-full min-w-0 flex-col rounded-card border p-4 sm:p-5">
          <div className="relative flex items-start gap-3">
            <span className="relative shrink-0">
              <span
                className="bg-accent-soft text-accent grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                aria-hidden="true"
              >
                <Glyph name={program.glyph} size={22} />
              </span>
              {program.kind === 'android' && (
                <span className="absolute -end-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <Smartphone className="size-3" />
                </span>
              )}
              {program.kind === 'windows' && (
                <span className="absolute -end-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full bg-blue-500 text-white shadow-sm">
                  <Monitor className="size-3" />
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-app group-hover:text-accent text-base leading-snug font-bold transition-colors">
                  {t(program.name, program.nameEn)}
                </h3>
                <span className="border-app rounded-md border bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300" dir="ltr">
                  v{program.version}
                </span>
              </div>
              <p className="text-muted mt-1 line-clamp-2 text-[13px] leading-relaxed">
                {t(program.tagline, program.taglineEn)}
              </p>
            </div>
          </div>

          {/* Compact facts row */}
          <div className="border-app mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 font-mono text-[11px]">
            <span className="text-subtle flex items-center gap-1">
              <HardDrive className="size-3" aria-hidden="true" />
              {program.platform}
            </span>
            <span className="text-subtle flex items-center gap-1">
              <Download className="size-3" aria-hidden="true" />
              {primary.size}
            </span>
            {count !== null && (
              <span className="text-subtle flex items-center gap-1">
                <Download className="size-3" aria-hidden="true" />
                {reduce ? (
                  count.toLocaleString(lang === 'en' ? 'en' : 'ar')
                ) : (
                  <motion.span
                    key={count}
                    initial={{ scale: 1.35, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {count.toLocaleString(lang === 'en' ? 'en' : 'ar')}
                  </motion.span>
                )}{' '}
                {t('تحميل', 'downloads')}
              </span>
            )}
            <time dateTime={program.date} className="text-subtle ms-auto text-[10px] tabular-nums">
              {formatDate(program.date, lang === 'en' ? 'en' : 'ar')}
            </time>
          </div>

          {/* Download buttons with host icons */}
          <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-app pt-3">
            {program.downloads.map((d) => {
              const HostIcon = hostIcon(d.host)
              const btn = (
                <a
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  title={`${d.file} · ${d.size}`}
                  onClick={bump}
                  className="btn btn-primary h-9 cursor-pointer gap-1.5 px-3.5 text-[13px]"
                >
                  <HostIcon className="size-3.5" aria-hidden="true" />
                  {d.host}
                  {d.note ? <span className="text-[10px] opacity-60">({d.note})</span> : null}
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
                className="btn btn-ghost h-9 cursor-pointer px-3 text-[13px]"
              >
                {t('التفاصيل', 'Details')}
                <ArrowLeft className="size-3 ltr:rotate-180" aria-hidden="true" />
              </Link>
            ) : program.docs ? (
              <a
                href={program.docs}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn btn-ghost h-9 cursor-pointer px-3 text-[13px]"
              >
                {t('التوثيق', 'Docs')}
                <ArrowUpLeft className="size-3 ltr:scale-x-[-1]" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </TiltCard>
    </Reveal>
  )
}
