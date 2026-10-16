import { ArrowUpRight, Bot, Code2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site } from '@/lib/site'
import { botLink, buyLink, useCatalog } from '@/lib/store'
import { TEMPLATES } from '@/data/templates'
import { Reveal } from '@/components/ui/Reveal'
import { Link } from 'react-router-dom'

/* ------------------------------------------------------------------ *
 * Store templates — Swiss International Typographic Style.
 * An editorial catalogue: a masthead, then one hairline-ruled entry per
 * template pairing a live preview with its specifics and price. No aurora,
 * no rounded panels, no gradient badges — type, grid and rules carry it.
 * ------------------------------------------------------------------ */

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
    <div className="swiss container-app flex flex-col gap-16 py-10 lg:gap-24 lg:py-14">
      {/* Masthead. */}
      <section>
        <div className="swiss-rule h-px w-full" style={{ background: 'var(--line-strong)' }} />
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="swiss-label text-app font-semibold">{t('قوالب المتاجر', 'Store templates')}</span>
          <span className="swiss-label text-subtle">
            {t(`${TEMPLATES.length} قوالب`, `${TEMPLATES.length} templates`)}
          </span>
        </div>
        <div className="swiss-rule h-px w-full" style={{ background: 'var(--line-strong)' }} />

        <div className="grid gap-x-10 gap-y-8 pt-10 lg:grid-cols-12 lg:pt-14">
          <div className="lg:col-span-8">
            <h1 className="swiss-headline swiss-display text-app">
              {t('متاجر تُجرَّب ', 'Stores you try ')}
              <span style={{ color: 'var(--swiss-accent)' }}>{t('قبل أن تُشترى.', 'before you buy.')}</span>
            </h1>
          </div>
          <p className="text-muted self-end text-base leading-relaxed lg:col-span-4">
            {t(
              'متاجر كاملة بهويات مختلفة — كل قالب عربي أولاً (RTL) بإنجليزية كاملة، صفر تبعيات تشغيلية، ورؤوس أمان صارمة. السعر يشمل الاستضافة والنشر.',
              'Complete stores with distinct identities — each Arabic-first (RTL) with full English, zero runtime dependencies and strict security headers. Price includes hosting and deployment.',
            )}
          </p>
        </div>
      </section>

      {/* The catalogue. */}
      <section className="flex flex-col">
        {TEMPLATES.map((tpl, i) => (
          <Reveal key={tpl.slug} delay={0.04}>
            <article className="border-t border-app py-10 first:border-t-0 first:pt-0 lg:py-14">
              <div className="grid gap-x-10 gap-y-7 lg:grid-cols-12">
                {/* Identity + live preview. */}
                <div className="lg:col-span-6">
                  <div className="flex items-baseline gap-4">
                    <span className="swiss-figure text-subtle text-3xl tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h2 className="swiss-display text-app text-2xl leading-none font-bold sm:text-3xl" dir="auto">
                        {t(tpl.name.ar, tpl.name.en)}
                      </h2>
                      <p className="swiss-label text-subtle mt-2">{t(tpl.tagline.ar, tpl.tagline.en)}</p>
                    </div>
                  </div>

                  <div
                    className="border-app bg-elevated group/frame card-lift hover-ring relative mt-6 h-72 overflow-hidden rounded-2xl border shadow-xs sm:h-80"
                    style={{ background: tpl.swatch }}
                  >
                    <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5 rounded-full border border-app/60 bg-elevated/85 px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
                      <span className="text-app">{t('معاينة حية', 'Live Preview')}</span>
                    </div>
                    <iframe
                      src={`/templates/${tpl.slug}/index.html`}
                      title={t(tpl.name.ar, tpl.name.en)}
                      loading="lazy"
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full border-0 transition-transform duration-500 group-hover/frame:scale-[1.02] motion-reduce:transition-none"
                    />
                  </div>
                  <Link to={`/templates/${tpl.slug}`} className="btn btn-ghost group mt-4 h-11 w-full justify-between px-5">
                    <span>{t('جرّب المتجر حياً', 'Try the store live')}</span>
                    <ArrowUpRight className="size-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                  </Link>
                </div>

                {/* Specifics + price. */}
                <div className="lg:col-span-6 lg:ps-10 lg:border-s lg:border-app">
                  <p className="text-muted leading-relaxed">{t(tpl.description.ar, tpl.description.en)}</p>

                  <ul className="mt-6 grid gap-0 sm:grid-cols-2">
                    {tpl.features.map((f) => (
                      <li
                        key={f.en}
                        className="text-app flex items-start gap-3 border-t border-app py-3 text-sm leading-snug"
                      >
                        <span className="bg-accent mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                        {t(f.ar, f.en)}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-t border-app pt-6">
                    <div>
                      <div className="swiss-figure text-app text-4xl leading-none">
                        ${tpl.usd}
                        <span className="swiss-label text-subtle ms-2 align-middle">{t('لمرة واحدة', 'one-time')}</span>
                      </div>
                      <div className="text-subtle mt-2 text-[13px] font-semibold">
                        {t(
                          `أو ${tpl.stars.toLocaleString('en-US')} نجمة تيليجرام`,
                          `or ${tpl.stars.toLocaleString('en-US')} Telegram Stars`,
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {catalog ? (
                        <a
                          href={buyLink(catalog, tpl.sku)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary h-11 px-6"
                        >
                          {t('اشترِ القالب', 'Buy the template')}
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </a>
                      ) : null}
                      <a
                        href={tpl.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost h-11 px-6"
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
      </section>

      {/* Custom-build close. */}
      <section className="border-t border-app pt-10">
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12">
          <h2 className="swiss-display text-app text-2xl leading-tight sm:text-3xl lg:col-span-7">
            {t('تريد متجراً بهويتك الخاصة؟', 'Want a store with your own identity?')}
          </h2>
          <div className="lg:col-span-5">
            <p className="text-muted leading-relaxed">
              {t(
                'نبدأ من قالب جاهز ونغيّر الهوية والألوان والمنتجات حسب نشاطك — ويوصل ببوت متجر يبيع على تيليجرام في نفس اليوم.',
                'We start from a ready template and change the identity, colors and products for your business — delivered with a store bot that sells on Telegram the same day.',
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/shop" className="btn btn-primary h-11 px-6">
                {t('تصفّح كل المنتجات', 'Browse all products')}
              </Link>
              {catalog ? (
                <a href={botLink(catalog)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost h-11 px-6">
                  <Bot className="size-4" aria-hidden="true" />
                  {t('أنشئ بوت متجرك', 'Create your store bot')}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
