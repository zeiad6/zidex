import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { site } from '@/lib/site'
import { buyLink, type Catalog, type StoreProduct } from '@/lib/store'
import { ArrowNudge, HoverCard } from '@/components/ui/Motion'
import { Reveal } from '@/components/ui/Reveal'
import { StoreSection } from '@/components/store/templates/StoreSection'
import { ProductMark } from '@/components/store/atoms/ProductMark'
import { StarAmount } from '@/components/store/atoms/StarAmount'

/**
 * Organism: the non-bot half of the catalogue — the one-off and monthly
 * services a channel owner buys, plus the escape hatch for anything not
 * on the list.
 *
 * These are the cheapest things in the shop, which is why they get a real
 * card each rather than a table row: at 250–900 Stars the decision is
 * quick, and the row has to survive that speed on a phone.
 */
export function ChannelServices({ catalog, services }: { catalog: Catalog; services: StoreProduct[] }) {
  const { t } = useI18n()

  return (
    <StoreSection
      id="shop-services"
      title={t('خدمات للقنوات والمحتوى', 'Channel and content services')}
      subtitle={t(
        'خدمات تُنفَّذ مباشرة على قناتتك أو حسابك، تُدفع بالنجوم داخل تيليجرام ولا تحتاج اشتراكاً. وأي خدمة أخرى غير مذكورة تُسعَّر لك حسب الطلب.',
        'Work carried out directly on your channel or account, paid for in Stars inside Telegram with no subscription. Anything not listed here is quoted on request.',
      )}
    >
      <ul className="grid gap-3.5 sm:grid-cols-2">
        {services.map((p, i) => (
          <Reveal key={p.sku} as="li" delay={Math.min(i * 0.05, 0.15)} className="h-full">
            <ServiceRow product={p} catalog={catalog} />
          </Reveal>
        ))}

        <Reveal as="li" delay={Math.min(services.length * 0.05, 0.2)} className="h-full">
          <HoverCard className="bg-elevated border-app hover:border-ghost-400/60 flex h-full flex-col justify-between gap-4 rounded-card border border-dashed p-5">
            <div>
              <span className="bg-accent-soft text-accent grid size-11 place-items-center rounded-xl" aria-hidden="true">
                <Sparkles className="size-5" />
              </span>
              <h3 className="text-app mt-3 text-[16px] leading-snug font-black">
                {t('خدمة غير مذكورة؟', 'Need something else?')}
              </h3>
              <p className="text-muted mt-1 text-[13px] leading-relaxed">
                {t(
                  'اكتب ما تحتاجه وسنردّ بسعر ومدة. أغلب الأعمال المخصّصة لها سعر ثابت.',
                  'Describe what you need and we reply with a price and a timeline. Most custom work is fixed-price.',
                )}
              </p>
            </div>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary press h-10 w-full cursor-pointer px-4 text-[13px] font-bold"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {t('اسأل على واتساب', 'Ask on WhatsApp')}
            </a>
          </HoverCard>
        </Reveal>
      </ul>
    </StoreSection>
  )
}

/** One service: mark, name, what it does, price, and a single buy action. */
function ServiceRow({ product, catalog }: { product: StoreProduct; catalog: Catalog }) {
  const { t } = useI18n()
  const copy = useServiceCopy(product)
  return (
    <HoverCard
      as="article"
      className="bg-elevated border-app flex h-full items-start gap-3.5 rounded-card border p-4"
    >
      <ProductMark
        product={product}
        size={46}
        className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:-rotate-6 group-hover/card:scale-110"
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-app text-[15px] leading-snug font-black transition-colors duration-200 group-hover/card:text-accent">
          {copy.title}
        </h3>
        <p className="text-subtle mt-1 text-[12.5px] leading-relaxed">{copy.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <StarAmount value={product.stars} className="text-app" />
          {product.usd ? (
            <span className="text-subtle text-[12px]" dir="ltr">
              {t('أو', 'or')} ${product.usd}
            </span>
          ) : null}
          <a
            href={buyLink(catalog, product.sku)}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-accent ms-auto inline-flex items-center gap-1 text-[13px] font-bold"
          >
            {t('اطلب', 'Order')}
            <ArrowNudge>
              <ArrowLeft className="size-3.5" />
            </ArrowNudge>
          </a>
        </div>
      </div>
    </HoverCard>
  )
}

function useServiceCopy(p: StoreProduct) {
  const { lang } = useI18n()
  const en = lang === 'en'
  return { title: en ? p.title_en : p.title, description: en ? p.description_en : p.description }
}