import { ArrowUpRight, Bot, Code2, ExternalLink, LayoutTemplate, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site } from '@/lib/site'
import { botLink, buyLink, useCatalog } from '@/lib/store'
import { TEMPLATES } from '@/data/templates'
import { Reveal } from '@/components/ui/Reveal'
import { AuroraBackdrop } from '@/components/ui/AuroraBackdrop'
import { Magnetic } from '@/components/ui/Interactive'
import { Link } from 'react-router-dom'

export default function Templates() {
  const { t } = useI18n()
  const { catalog } = useCatalog()

  usePageMeta(
    `${t('قوالب المتاجر', 'Store templates')} — ${site.name}`,
    t(
      'قوالب متاجر إلكترونية جاهزة: عربية أولاً، إنجليزية كاملة، صفر تبعيات، وأعلى معايير الأمان — جرّبها حية قبل أن تشتري.',
      'Ready e-commerce storefront templates: Arabic-first, full English, zero dependencies, top security standards — try them live before you buy.',
    ),
    '/templates',
  )

  return (
    <>
      <section className="relative overflow-hidden pt-10 pb-10 sm:pt-14">
        <AuroraBackdrop intensity="md" className="opacity-70" />
        <div className="container-app relative">
          <Reveal>
            <span className="text-accent border-app bg-surface inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold">
              <LayoutTemplate className="size-3.5" aria-hidden="true" />
              {t('خدمة جديدة', 'New service')}
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-app mt-4 text-[2rem] leading-[1.15] font-black tracking-tight text-balance sm:text-5xl">
              {t('قوالب متاجر تُجرَّب قبل أن تُشترى', 'Store templates you can try before you buy')}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted mt-5 max-w-[62ch] text-lg leading-relaxed">
              {t(
                'ثلاثة متاجر كاملة بهويات مختلفة: عطور فاخرة، إلكترونيات، وضيافة تمر وقهوة. كل قالب عربي أولاً (RTL) مع إنجليزية كاملة، صفر تبعيات تشغيلية، ورؤوس أمان صارمة — والسعر يشمل الاستضافة والنشر.',
                'Three complete stores with distinct identities: luxury fragrance, electronics, and date-and-coffee hospitality. Each template is Arabic-first (RTL) with full English, zero runtime dependencies and strict security headers — price includes hosting and deployment.',
              )}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container-app flex flex-col gap-10 pb-16 sm:pb-20">
        {TEMPLATES.map((tpl, i) => (
          <Reveal key={tpl.slug} delay={0.06 * i}>
            <article className="border-app bg-surface rounded-panel overflow-hidden border">
              <div className="grid gap-0 lg:grid-cols-[1fr_1.15fr]">
                {/* لوحة الهوية + التجربة المباشرة */}
                <div className="border-app relative border-b lg:border-b-0 lg:border-e">
                  {/* معاينة حيّة للمتجر الفعلي داخل الموقع — iframe من نفس الأصل /templates/<slug>/.
                      مستجيبة (المتجر يعرض تخطيطه المحمول)، بلا تفاعل (pointer-events)، تحميل كسول. */}
                  <div className="relative h-72 overflow-hidden sm:h-80" style={{ background: tpl.swatch }}>
                    <iframe
                      src={`/templates/${tpl.slug}/`}
                      title={t(tpl.name.ar, tpl.name.en)}
                      loading="lazy"
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full border-0"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5">
                      <h2 className="text-2xl font-black text-white drop-shadow-sm">{t(tpl.name.ar, tpl.name.en)}</h2>
                      <p className="text-sm font-semibold text-white/85">{t(tpl.tagline.ar, tpl.tagline.en)}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <Link
                      to={`/templates/${tpl.slug}`}
                      className="btn btn-primary h-11 w-full cursor-pointer justify-center px-5 text-[15px] font-bold"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      {t('جرّب المتجر حياً', 'Try the store live')}
                    </Link>
                  </div>
                </div>

                {/* التفاصيل والسعر */}
                <div className="p-5 sm:p-7">
                  <p className="text-muted leading-relaxed">{t(tpl.description.ar, tpl.description.en)}</p>
                  <ul className="mt-4 grid gap-2">
                    {tpl.features.map((f) => (
                      <li key={f.en} className="text-app flex items-start gap-2 text-[14px]">
                        <Sparkles className="text-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {t(f.ar, f.en)}
                      </li>
                    ))}
                  </ul>

                  <div className="border-app mt-6 flex flex-wrap items-end justify-between gap-4 border-t pt-5">
                    <div>
                      <div className="text-app text-2xl font-black">
                        ${tpl.usd}
                        <span className="text-muted ms-1 text-[13px] font-bold">/ {t('لمرة واحدة', 'one-time')}</span>
                      </div>
                      <div className="text-muted mt-1 text-[13px] font-bold">
                        {t(
                          `أو ${tpl.stars.toLocaleString('en-US')} نجمة تيليجرام`,
                          `or ${tpl.stars.toLocaleString('en-US')} Telegram Stars`,
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {catalog ? (
                        <>
                          <Magnetic strength={0.2}>
                            <a
                              href={buyLink(catalog, tpl.sku)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary h-11 cursor-pointer px-5 text-[15px] font-bold"
                            >
                              {t('اشترِ القالب', 'Buy the template')}
                              <ArrowUpRight className="size-4" aria-hidden="true" />
                            </a>
                          </Magnetic>
                          <a
                            href={botLink(catalog)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost h-11 cursor-pointer px-5 text-[15px]"
                          >
                            <Bot className="size-4" aria-hidden="true" />
                            {t('بوت المتجر مجاناً', 'Free store bot')}
                          </a>
                        </>
                      ) : null}
                      <a
                        href={tpl.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost h-11 cursor-pointer px-4 text-[14px]"
                      >
                        <Code2 className="size-4" aria-hidden="true" />
                        {t('المستودع', 'Repository')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        ))}

        <Reveal>
          <div className="border-app bg-surface rounded-panel border p-6 text-center sm:p-8">
            <h2 className="text-app text-xl font-black">
              {t('تريد متجراً بهويتك الخاصة؟', 'Want a store with your own identity?')}
            </h2>
            <p className="text-muted mx-auto mt-2 max-w-[58ch] leading-relaxed">
              {t(
                'نبدأ من قالب جاهز ونغيّر الهوية والألوان والمنتجات حسب نشاطك — ويوصل ببوت متجر يبيع على تيليجرام في نفس اليوم.',
                'We start from a ready template and change the identity, colors and products for your business — delivered with a store bot that sells on Telegram the same day.',
              )}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/shop" className="btn btn-primary h-11 cursor-pointer px-6 text-[15px] font-bold">
                {t('تصفّح كل المنتجات', 'Browse all products')}
              </Link>
              {catalog ? (
                <a
                  href={botLink(catalog)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost h-11 cursor-pointer px-6 text-[15px]"
                >
                  <Bot className="size-4" aria-hidden="true" />
                  {t('أنشئ بوت متجرك الآن', 'Create your store bot now')}
                </a>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </>
  )
}
