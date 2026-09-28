import { Link } from 'react-router-dom'
import { Glyph } from '@/components/ui/Glyphs'
import { ArrowLeft, ArrowUpLeft, Download, FileCode2, HardDrive, Package } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { programs } from '@/data/programs'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate } from '@/lib/utils'
import { AuroraBackdrop } from '@/components/ui/AuroraBackdrop'
import { Reveal } from '@/components/ui/Reveal'
import { Magnetic } from '@/components/ui/Interactive'
import { TiltCard } from '@/components/ui/Interactive'
import NotFound from './NotFound'

/**
 * The program library. Everything on this page is driven by `data/programs.ts`:
 * add an entry there and it appears in the grid, in the header search, and in
 * the dashboard — nothing else to wire.
 */
export default function Programs() {
  const { lang, t } = useI18n()
  const reduce = useReducedMotion()

  if (programs.length === 0) return <NotFound />

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
                'كل برنامج هنا موثّق بمقال مستقل يشرح كيف يعمل وما حدوده — لا رابط بلا سياق.',
                'Every program here is documented in its own article — what it does and where it stops. No bare links.',
              )}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Grid */}
      <section className="container-app pb-16 sm:pb-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((prog, i) => {
            const name = t(prog.name, prog.nameEn)
            const tagline = t(prog.tagline, prog.taglineEn)
            return (
              <Reveal key={prog.slug} delay={Math.min(i * 0.06, 0.24)} className="h-full">
                <TiltCard max={4} className="group h-full">
                  <div className="bg-elevated/80 relative flex h-full min-w-0 flex-col rounded-3xl border border-app p-5 backdrop-blur-sm transition-colors duration-300 hover:border-strong sm:p-6">
                    <div className="relative flex items-start gap-4">
                      <span
                        className="bg-accent-soft grid size-14 shrink-0 place-items-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-105"
                        aria-hidden="true"
                      >
                        <Glyph name={prog.glyph} size={30} className="text-accent" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h2 className="text-app text-lg font-bold leading-snug">{name}</h2>
                        <p className="text-muted mt-1.5 text-sm leading-relaxed">{tagline}</p>
                      </div>
                    </div>

                    {/* Facts */}
                    <dl className="border-app mt-5 grid grid-cols-2 gap-2 border-t pt-4 text-[11px] sm:grid-cols-4">
                      {[
                        { k: t('الإصدار', 'Version'), v: prog.version, icon: FileCode2 },
                        { k: t('المنصة', 'Platform'), v: prog.platform, icon: HardDrive },
                        { k: t('الحجم', 'Size'), v: prog.size, icon: Download },
                        { k: t('المضيف', 'Host'), v: prog.host, icon: Package },
                      ].map(({ k, v, icon: Icon }) => (
                        <div key={k} className="bg-sunken/60 rounded-xl border border-app px-2.5 py-2">
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

                    {/* File name — the thing a reader compares against their disk. */}
                    <p className="text-subtle mt-3 truncate font-mono text-[10px]" dir="ltr">
                      {prog.file}
                    </p>

                    <div className="relative mt-5 flex flex-wrap items-center gap-2.5 border-t border-app pt-4">
                      {reduce ? (
                        <a
                          href={prog.href}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="btn btn-primary h-10 cursor-pointer px-5"
                        >
                          <Download className="size-4" aria-hidden="true" />
                          {t('تحميل', 'Download')}
                        </a>
                      ) : (
                        <Magnetic strength={0.18}>
                          <a
                            href={prog.href}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="btn btn-primary h-10 cursor-pointer px-5"
                          >
                            <Download className="size-4" aria-hidden="true" />
                            {t('تحميل', 'Download')}
                            <ArrowUpLeft className="size-3.5" aria-hidden="true" />
                          </a>
                        </Magnetic>
                      )}

                      {prog.post ? (
                        <Link
                          to={`/blog/${prog.post}`}
                          className="btn btn-ghost h-10 cursor-pointer px-4 text-sm"
                        >
                          {t('اقرأ التوثيق', 'Read the docs')}
                          <ArrowLeft className="size-3.5" aria-hidden="true" />
                        </Link>
                      ) : null}

                      <time
                        dateTime={prog.date}
                        className={cn('text-subtle mr-auto text-[11px]')}
                      >
                        {formatDate(prog.date, lang === 'en' ? 'en' : 'ar')}
                      </time>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={0.12}>
          <div className="border-app mt-8 flex flex-col items-start gap-3 rounded-3xl border border-dashed p-5 sm:flex-row sm:items-center">
            <span className="text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <p className="text-muted flex-1 text-[13px] leading-relaxed">
              {t(
                'قبل تشغيل أي برنامج: تحقّق من مصدر التنزيل، وراجع حدوده الموثّقة في المقال قبل الاعتماد عليه في إنتاج. الحزم غير الموقّعة رقمياً تُظهر تحذيراً في Windows — وهذا سلوك متوقّع لا Indicator عن خطر بالضرورة.',
                'Before running anything: verify the source, and read its documented limits in the article. Unsigned installers warn in Windows — that is expected, not proof of danger.',
              )}
            </p>
          </div>
        </Reveal>
      </section>
    </>
  )
}
