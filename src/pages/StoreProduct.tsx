import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, AppWindow, Bot, CalendarClock, LayoutDashboard, LayoutTemplate, Star, WalletCards } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site } from '@/lib/site'
import { hasBotInterface } from '@/data/botInterfaces'
import { STORE_SHOT, botLink, productImage, useCatalog, useProductCopy } from '@/lib/store'
import { TiltCard } from '@/components/ui/Interactive'
import { Reveal } from '@/components/ui/Reveal'
import { BorderBeam } from '@/components/ui/Decor'
import { ChatDemo } from '@/components/store/organisms/ChatDemo'
import { PaymentMethods } from '@/components/store/organisms/PaymentMethods'
import { FeatureList } from '@/components/store/molecules/FeatureList'
import { Price } from '@/components/store/molecules/Price'
import NotFound from './NotFound'

export default function StoreProduct() {
  const { sku = '' } = useParams()
  const { t } = useI18n()
  const { catalog, failed } = useCatalog()
  const copy = useProductCopy()
  const product = catalog?.products.find((p) => p.sku === sku)
  const c = product ? copy(product) : null

  usePageMeta(
    `${c?.title ?? t('المتجر', 'Store')} — ${site.name}`,
    c?.description ?? t('منتج من متجر ZeidexSoft.', 'A product from the ZeidexSoft store.'),
    `/shop/${sku}`,
  )

  // Product rich result for search engines: name, image and the website USD offer.
  const ldName = c?.title
  const ldText = c?.description
  useEffect(() => {
    if (!product || !ldName || !product.usd) return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: ldName,
      description: ldText,
      image: `https://zeidexsoft.com/store/img/products/${product.sku}.png`,
      brand: { '@type': 'Brand', name: 'ZeidexSoft' },
      offers: {
        '@type': 'Offer',
        price: product.usd,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `https://zeidexsoft.com/shop/${product.sku}`,
      },
    })
    document.head.append(el)
    return () => el.remove()
  }, [product, ldName, ldText])

  if (failed || (catalog && !product)) return <NotFound />
  if (!catalog || !product || !c) {
    return <div className="container-app py-10"><div className="bg-sunken h-[32rem] animate-pulse rounded-panel" /></div>
  }

  const isBot = product.category === 'bots' || product.category === 'types'

  return (
    <div className="container-app py-8 sm:py-10">
      <Link to="/shop" className="text-subtle hover:text-accent inline-flex items-center gap-1.5 text-[13px] font-bold">
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
        {t('كل المنتجات', 'All products')}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.05fr]">
        <Reveal>
          <figure className="flex flex-col gap-3">
            <TiltCard max={8} radius="var(--radius-panel)">
              <div className="bg-sunken border-app relative grid aspect-[4/3] place-items-center overflow-hidden rounded-panel border">
                {product.featured && <BorderBeam size={140} />}
                <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-60 mask-fade-radial" />
                <img
                  src={productImage(product)}
                  alt={t(`شعار ${c.title}`, `${c.title} mark`)}
                  width={200}
                  height={200}
                  className="relative size-36 rounded-[22%] shadow-[0_28px_56px_-12px_rgb(0_0_0/0.45)] motion-safe:animate-[floaty_6s_ease-in-out_infinite] sm:size-48"
                />
              </div>
            </TiltCard>
            {isBot && (
              <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                <img
                  src={STORE_SHOT}
                  alt={t('لقطة حقيقية من واجهة المتجر داخل تيليجرام', 'Real screenshot of the storefront inside Telegram')}
                  width={180}
                  height={400}
                  loading="lazy"
                  className="border-app h-64 w-auto rounded-2xl border object-cover object-top shadow-app-md"
                />
                <figcaption className="text-subtle text-[13px] leading-relaxed">
                  {t(
                    'لقطة حقيقية لواجهة المتجر (Mini App) التي تحصل عليها في الباقة الاحترافية — هي نفسها متجر هذا الموقع.',
                    'A real capture of the Mini App storefront included in Pro — it is this site’s own store.',
                  )}
                </figcaption>
              </div>
            )}
          </figure>
        </Reveal>

        <Reveal delay={0.06}>
          <div>
            <h1 className="text-app text-3xl leading-tight font-black tracking-tight text-balance sm:text-4xl">{c.title}</h1>
            <div className="mt-4">
              <Price product={product} size="lg" showUsd />
            </div>
            <p className="text-muted mt-5 max-w-[62ch] text-[16px] leading-relaxed">{c.description}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-sunken rounded-2xl p-3.5">
                <dt className="text-subtle flex items-center gap-1.5 text-[12px] font-semibold">
                  <WalletCards className="size-3.5" aria-hidden="true" />
                  {t('الدفع', 'Billing')}
                </dt>
                <dd className="text-app mt-1 font-bold">
                  {product.monthly ? t('كل 30 يوماً', 'Every 30 days') : t('مرة واحدة', 'One-time')}
                </dd>
              </div>
              <div className="bg-sunken rounded-2xl p-3.5">
                <dt className="text-subtle flex items-center gap-1.5 text-[12px] font-semibold">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  {t('العملة', 'Currency')}
                </dt>
                <dd className="text-app mt-1 flex items-center gap-1 font-bold">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {t('نجوم تيليجرام', 'Telegram Stars')}
                </dd>
              </div>
            </dl>

            {c.features.length ? (
              <>
                <h2 className="text-app mt-8 text-lg font-black">{t('ما الذي تحصل عليه', 'What you get')}</h2>
                <FeatureList items={c.features} className="mt-3" />
              </>
            ) : null}

            <h2 className="text-app mt-8 mb-3 text-lg font-black">{t('طرق الدفع', 'Ways to pay')}</h2>
            <PaymentMethods product={product} catalog={catalog} />
            {isBot && (
              <a
                href={botLink(catalog)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold hover:underline hover:underline-offset-4"
              >
                <Bot className="size-4" aria-hidden="true" />
                {t('جرّب البوت قبل الشراء', 'Try the bot before buying')}
              </a>
            )}
            {hasBotInterface(product.sku) && (
              <a
                href={`/bot-suite/#/bot/${product.sku}`}
                className="text-accent mt-2 inline-flex items-center gap-1.5 text-[14px] font-bold hover:underline hover:underline-offset-4"
              >
                <AppWindow className="size-4" aria-hidden="true" />
                {t('الواجهة الرسومية للبوت', "The bot's graphical interface")}
              </a>
            )}
            {(isBot || product.sku === 'panel-pro') && (
              <a
                href="/bot-suite/#/panel"
                className="text-accent mt-2 inline-flex items-center gap-1.5 text-[14px] font-bold hover:underline hover:underline-offset-4"
              >
                <LayoutDashboard className="size-4" aria-hidden="true" />
                {t('لوحة التحكم الموحّدة', 'The unified control panel')}
              </a>
            )}
            {/* قالب المتجر: تجربته الحيّة على /templates/<slug> — نفس النسخة التي يستلمها المشتري،
                بعد تخصيص نسخة العرض بحساب المنصة. الرابط من الـSKU نفسه فلا تكرار ولا انحراف. */}
            {product.category === 'sites' && /^site-([a-z0-9-]+)$/.test(product.sku) && (
              <a
                href={`/templates/${product.sku.replace(/^site-/, '')}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent mt-2 inline-flex items-center gap-1.5 text-[14px] font-bold hover:underline hover:underline-offset-4"
              >
                <LayoutTemplate className="size-4" aria-hidden="true" />
                {t('تجربة القالب مباشرة', 'Try the template live')}
              </a>
            )}
          </div>
        </Reveal>
      </div>

      {isBot && (
        <section aria-labelledby="product-demo" className="border-app mt-14 grid items-center gap-8 border-t pt-12 lg:grid-cols-2">
          <div>
            <h2 id="product-demo" className="text-app text-2xl font-black text-balance">
              {t('هكذا يشتري عميلك', 'This is how your customer buys')}
            </h2>
            <p className="text-muted mt-3 max-w-[56ch] leading-relaxed">
              {t(
                'من أمر /shop إلى الفاتورة إلى الإيصال، دون مغادرة تيليجرام. وبعد الدفع يسأل البوت عن تفاصيل الطلب ويرسلها إليك.',
                'From /shop to the invoice to the receipt, without leaving Telegram. After payment the bot asks for the order details and sends them to you.',
              )}
            </p>
          </div>
          <ChatDemo stars={product.stars} title={c.title} />
        </section>
      )}
    </div>
  )
}
