import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Bot, ExternalLink, MonitorPlay } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site } from '@/lib/site'
import { botLink, buyLink, useCatalog } from '@/lib/store'
import { TEMPLATES, templateBySlug } from '@/data/templates'
import { Reveal } from '@/components/ui/Reveal'
import NotFound from '@/pages/NotFound'

/** صفحة التجربة الحية: القالب نفسه داخل إطار على نفس الأصل، مع شريط للسعر والشراء. */
export default function TemplatePreview() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useI18n()
  const { catalog } = useCatalog()
  const tpl = templateBySlug(slug)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  usePageMeta(
    tpl ? `${t(tpl.name.ar, tpl.name.en)} — ${t('تجربة حية', 'live trial')} — ${site.name}` : `${site.name}`,
    tpl
      ? t(
          `جرّب ${tpl.name.ar} حياً: ${tpl.tagline.ar} — عربي أولاً بإنجليزية كاملة وصفر تبعيات.`,
          `Try ${tpl.name.en} live: ${tpl.tagline.en} — Arabic-first with full English and zero dependencies.`,
        )
      : '',
    `/templates/${tpl?.slug ?? ''}`,
  )

  useEffect(() => {
    if (!tpl) return
    document.title = `${t(tpl.name.ar, tpl.name.en)} — ${t('تجربة حية', 'live trial')}`
  }, [tpl, t])

  if (!tpl) return <NotFound />

  const others = TEMPLATES.filter((x) => x.slug !== tpl.slug)

  return (
    <div className="container-app flex flex-col gap-6 py-8 sm:py-10">
      <Reveal>
        <Link to="/templates" className="text-muted hover:text-app group inline-flex items-center gap-1.5 text-[14px] font-bold">
          <ArrowLeft className="size-4 transition-transform duration-200 rtl:rotate-180 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" aria-hidden="true" />
          {t('كل القوالب', 'All templates')}
        </Link>
      </Reveal>

      <Reveal>
        <div className="border-app bg-elevated shadow-app-md rounded-panel flex flex-wrap items-center justify-between gap-4 border p-4 sm:p-5">
          <div className="min-w-0">
            <h1 className="text-app text-xl font-black sm:text-2xl">{t(tpl.name.ar, tpl.name.en)}</h1>
            <p className="text-muted text-[14px] font-semibold">{t(tpl.tagline.ar, tpl.tagline.en)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-app flex rounded-full border p-0.5">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                aria-pressed={device === 'desktop'}
                className={`cursor-pointer rounded-full px-3 py-1 text-[13px] font-bold ${
                  device === 'desktop' ? 'bg-accent text-accent-fg' : 'text-muted'
                }`}
              >
                {t('سطح المكتب', 'Desktop')}
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                aria-pressed={device === 'mobile'}
                className={`cursor-pointer rounded-full px-3 py-1 text-[13px] font-bold ${
                  device === 'mobile' ? 'bg-accent text-accent-fg' : 'text-muted'
                }`}
              >
                {t('جوال', 'Mobile')}
              </button>
            </div>
            <a
              href={tpl.demoPath}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost h-10 cursor-pointer px-4 text-[14px]"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t('افتح في تبويب', 'Open in tab')}
            </a>
            {catalog ? (
              <>
                <a
                  href={buyLink(catalog, tpl.sku)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary h-10 cursor-pointer px-5 text-[14px] font-bold"
                >
                  {t(`اشترِ بـ $${tpl.usd}`, `Buy for $${tpl.usd}`)}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
                <a
                  href={botLink(catalog)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost h-10 cursor-pointer px-4 text-[14px]"
                >
                  <Bot className="size-4" aria-hidden="true" />
                  {t('بوت المتجر', 'Store bot')}
                </a>
              </>
            ) : null}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="border-app bg-elevated shadow-app-md rounded-panel overflow-hidden border">
          <div className="border-app text-muted flex items-center gap-2 border-b px-4 py-2 text-[12px] font-bold">
            <MonitorPlay className="size-3.5" aria-hidden="true" />
            <span className="truncate">
              {site.domain}
              {tpl.demoPath}
            </span>
            <span className="ms-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
              {t('مباشر', 'Live')}
            </span>
          </div>
          <iframe
            key={device}
            src={`${tpl.demoPath}index.html`}
            title={`${t(tpl.name.ar, tpl.name.en)} — ${t('تجربة حية', 'live trial')}`}
            className={`block w-full border-0 bg-white ${device === 'mobile' ? 'mx-auto max-w-[390px]' : ''}`}
            style={{ height: 'min(78vh, 780px)' }}
            loading="lazy"
            allow="clipboard-write"
          />
        </div>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <div className="border-app bg-elevated shadow-app rounded-panel border p-5 sm:p-6">
            <h2 className="text-app text-lg font-black">{t('عن هذا القالب', 'About this template')}</h2>
            <p className="text-muted mt-2 leading-relaxed">{t(tpl.description.ar, tpl.description.en)}</p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {tpl.features.map((f) => (
                <li key={f.en} className="text-app flex items-start gap-2 text-[14px]">
                  <span aria-hidden="true" className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" />
                  {t(f.ar, f.en)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="border-app bg-elevated shadow-app rounded-panel flex h-full flex-col gap-3 border p-5 sm:p-6">
            <h2 className="text-app text-lg font-black">{t('قوالب أخرى', 'Other templates')}</h2>
            {others.map((o) => (
              <Link
                key={o.slug}
                to={`/templates/${o.slug}`}
                className="border-app card-lift hover-ring hover:border-accent flex items-center gap-3 rounded-2xl border p-3"
              >
                <span className="size-10 shrink-0 rounded-xl" style={{ background: o.swatch }} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="text-app block text-[14px] font-bold">{t(o.name.ar, o.name.en)}</span>
                  <span className="text-muted block text-[12px]">{t(o.tagline.ar, o.tagline.en)}</span>
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
