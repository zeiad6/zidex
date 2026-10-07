import { ArrowLeft, Bot, Gem, Send, ShoppingBag, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site } from '@/lib/site'
import {
  FRAGMENT_STARS,
  MINI_APP_PATH,
  botLink,
  buyLink,
  starsLink,
  useCatalog,
  useProductCopy,
} from '@/lib/store'
import { Reveal } from '@/components/ui/Reveal'
import { AuroraBackdrop } from '@/components/ui/AuroraBackdrop'
import { ArrowNudge, LiveDot, SweepLink } from '@/components/ui/Motion'
import { ChatDemo } from '@/components/store/organisms/ChatDemo'
import { OpeningOffer } from '@/components/store/organisms/OpeningOffer'
import { PackageCard } from '@/components/store/organisms/PackageCard'
import { Magnetic } from '@/components/ui/Interactive'
import { StoreSection } from '@/components/store/templates/StoreSection'
import { StoreFaq } from '@/components/store/organisms/StoreFaq'
import { ChannelServices } from '@/components/store/organisms/ChannelServices'
import { Marketplaces } from '@/components/store/organisms/Marketplaces'
import { BotCommands } from '@/components/store/organisms/BotCommands'

export default function Store() {
  const { t } = useI18n()
  const { catalog, failed } = useCatalog()
  const copy = useProductCopy()

  usePageMeta(
    `${t('المتجر', 'Store')} — ${site.name}`,
    t(
      'بوت متجر رقمي على تيليجرام يقبل الدفع بالنجوم: باقة أساسية واحترافية واستضافة شهرية.',
      'A Telegram digital-store bot that takes Stars: Basic, Pro and monthly hosting.',
    ),
    '/shop',
  )

  const bots = catalog?.products.filter((p) => p.category === 'bots') ?? []
  const types = catalog?.products.filter((p) => p.category === 'types') ?? []
  const services = catalog?.products.filter((p) => p.category === 'channel') ?? []
  const pro = bots.find((p) => p.featured) ?? bots[0]

  return (
    <>
      <section className="relative overflow-hidden pt-10 pb-10 sm:pt-14 lg:pb-14">
        <AuroraBackdrop intensity="md" className="opacity-70" />
        <div className="container-app relative grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <h1 className="text-app text-[2rem] leading-[1.15] font-black tracking-tight text-balance sm:text-5xl">
                {t('بوت متجر رقمي يبيع عنك على تيليجرام', 'A digital-store bot that sells for you on Telegram')}
              </h1>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="text-muted mt-5 max-w-[60ch] text-lg leading-relaxed">
                {t(
                  'عملاؤك يدفعون بنجوم تيليجرام من داخل التطبيق — بلا بطاقة ولا بوابة دفع — وتصلهم مشترياتهم وتصلك الطلبات فوراً. البوت الذي تراه في المحادثة هو المنتج نفسه.',
                  'Customers pay with Telegram Stars inside the app — no card, no gateway — they get their purchase and you get the order instantly. The bot in the chat is the product itself.',
                )}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap gap-3">
                {catalog && pro ? (
                  <Magnetic strength={0.2}>
                    <a
                      href={buyLink(catalog, pro.sku)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary h-12 cursor-pointer px-6 text-[15px] font-bold"
                    >
                      <Send className="size-4" aria-hidden="true" />
                      {t(`اطلب ${copy(pro).title}`, `Order ${copy(pro).title}`)}
                    </a>
                  </Magnetic>
                ) : null}
                {catalog ? (
                  <a
                    href={botLink(catalog)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost h-12 cursor-pointer px-6 text-[15px]"
                  >
                    <Bot className="size-4" aria-hidden="true" />
                    {t('جرّب البوت الآن', 'Try the bot now')}
                  </a>
                ) : null}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            {pro ? <ChatDemo stars={pro.stars} title={copy(pro).title} /> : <div className="min-h-[28rem]" />}
          </Reveal>
        </div>
      </section>

      <div className="container-app flex flex-col gap-16 pb-16 sm:pb-20">
        <OpeningOffer />
        <StoreSection
          id="shop-packages"
          title={t('باقات بوت المتجر', 'Store-bot packages')}
          subtitle={t(
            'سعر ثابت بالنجوم داخل تيليجرام، أو بالدولار على الموقع عبر TON وUSDT وPayPal والبطاقة متى فُعّلت. الاستضافة اشتراك يمكنك إلغاؤه متى شئت.',
            'A fixed Stars price inside Telegram, or in USD on this site via TON, USDT, PayPal and card where enabled. Hosting is a subscription you can cancel any time.',
          )}
          action={
            <SweepLink href={MINI_APP_PATH} className="text-accent flex items-center gap-1.5 text-[13px] font-bold">
              <ShoppingBag className="size-4" aria-hidden="true" />
              {t('نسخة تطبيق تيليجرام المصغّر', 'Telegram Mini App version')}
            </SweepLink>
          }
        >
          {failed ? (
            <p className="text-muted border-app rounded-panel border border-dashed p-6 text-center">
              {t('تعذّر تحميل المنتجات. حدّث الصفحة.', 'Could not load the products. Refresh the page.')}
            </p>
          ) : !catalog ? (
            <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-sunken h-96 animate-pulse rounded-panel" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {bots.map((p, i) => (
                <Reveal key={p.sku} delay={Math.min(i * 0.06, 0.18)} className="h-full">
                  <PackageCard product={p} catalog={catalog} />
                </Reveal>
              ))}
            </div>
          )}
        </StoreSection>

        {catalog && types.length ? (
          <StoreSection
            id="shop-types"
            title={t('بوت لكل نشاط', 'A bot for every business')}
            subtitle={t('إدارة مجموعات، خدمة عملاء، حجوزات، اشتراكات مدفوعة، مسابقات، ومساعد ذكي — جرّب أي واحد مجاناً قبل أن تشتري.', 'Group management, support, bookings, paid subscriptions, quizzes and an AI assistant — try any of them free first.')}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {types.map((p, i) => (
                <Reveal key={p.sku} delay={Math.min(i * 0.05, 0.2)} className="h-full">
                  <PackageCard product={p} catalog={catalog} />
                </Reveal>
              ))}
            </div>
          </StoreSection>
        ) : null}

        {catalog && services.length ? (
          <ChannelServices catalog={catalog} services={services} />
        ) : null}

        {catalog ? <BotCommands catalog={catalog} /> : null}

        <Marketplaces />

        <StoreSection id="shop-faq" title={t('أسئلة قبل الشراء', 'Before you buy')}>
          <StoreFaq />
        </StoreSection>

        <section aria-labelledby="shop-stars" className="brand-gradient relative overflow-hidden rounded-panel p-6 text-white sm:p-10">
          <Sparkles className="absolute -end-6 -top-6 size-40 opacity-15" aria-hidden="true" />
          <h2 id="shop-stars" className="max-w-[24ch] text-2xl font-black text-balance sm:text-3xl">
            {t('ليس لديك نجوم؟ اشحن في ثوانٍ', 'No Stars yet? Top up in seconds')}
          </h2>
          <p className="mt-3 max-w-[62ch] leading-relaxed text-white/90">
            {t(
              'النجوم تُشترى من تيليجرام نفسه: داخل التطبيق بالبطاقة أو Apple/Google Pay، أو أرخص بنحو 38٪ بعملة TON عبر Fragment. وعند الدفع يعرض تيليجرام الشحن تلقائياً إن نقص رصيدك.',
              'Stars are sold by Telegram itself: in the app by card or Apple/Google Pay, or about 38% cheaper with TON on Fragment. At checkout Telegram offers a top-up automatically if your balance is short.',
            )}
          </p>

          {/* The concrete numbers, because "cheaper" is a claim and this is the
              evidence for it: 1,000 Stars is $15 in-app and $9.74 through Fragment. */}
          <dl className="mt-6 grid max-w-lg grid-cols-3 gap-2.5 text-center">
            <div className="rounded-2xl bg-white/12 p-3">
              <dt className="text-[11px] font-bold text-white/70">{t('داخل التطبيق', 'In the app')}</dt>
              <dd className="mt-1 text-lg font-black" dir="ltr">
                $15
              </dd>
            </div>
            <div className="rounded-2xl bg-white/12 p-3">
              <dt className="text-[11px] font-bold text-white/70">{t('عبر Fragment', 'Via Fragment')}</dt>
              <dd className="mt-1 text-lg font-black" dir="ltr">
                $9.74
              </dd>
            </div>
            <div className="rounded-2xl bg-white/25 p-3 ring-1 ring-white/40">
              <dt className="text-[11px] font-bold text-white/80">{t('التوفير على 1000 نجمة', 'You save on 1,000')}</dt>
              <dd className="mt-1 flex items-center justify-center gap-1 text-lg font-black">
                <LiveDot tone="ok" />
                <span dir="ltr">38%</span>
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            {catalog ? (
              <a
                href={starsLink(catalog)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn press h-11 cursor-pointer bg-white px-5 font-bold text-[#3b2f8f] hover:bg-white/90"
              >
                <Send className="size-4" aria-hidden="true" />
                {t('اشترِ النجوم من البوت', 'Buy Stars via the bot')}
              </a>
            ) : null}
            <a
              href={FRAGMENT_STARS}
              target="_blank"
                rel="noopener noreferrer"
              className="btn press h-11 cursor-pointer border border-white/40 px-5 text-white hover:bg-white/10"
            >
              <Gem className="size-4" aria-hidden="true" />
              {t('Fragment — بعملة TON', 'Fragment — pay with TON')}
              <ArrowNudge>
                <ArrowLeft className="size-4" />
              </ArrowNudge>
            </a>
          </div>
        </section>

        <p className="text-subtle text-center text-[13px]">
          {t('تريد بوتاً بمواصفات خاصة؟', 'Need something custom?')}{' '}
          <SweepLink href={`mailto:${site.email}`} className="text-accent font-bold" dir="ltr">
            {site.email}
          </SweepLink>
        </p>
      </div>
    </>
  )
}
