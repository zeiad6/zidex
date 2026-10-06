import { Link } from 'react-router-dom'
import { ArrowLeft, FlaskConical, Send } from 'lucide-react'
import { BorderBeam } from '@/components/ui/Decor'
import { useI18n } from '@/lib/i18n'
import { buyLink, demoLink, useProductCopy, type Catalog, type StoreProduct } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Pill } from '../atoms/Pill'
import { ProductMark } from '../atoms/ProductMark'
import { FeatureList } from '../molecules/FeatureList'
import { Price } from '../molecules/Price'

/** Organism: a store-bot package — the bot's real avatar, price, inclusions, two actions. */
export function PackageCard({ product, catalog }: { product: StoreProduct; catalog: Catalog }) {
  const { t } = useI18n()
  const copy = useProductCopy()(product)
  return (
    <article
      className={cn(
        'group/card bg-elevated relative flex h-full flex-col rounded-panel border p-5 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 sm:p-6',
        product.featured ? 'border-ghost-400/50 shadow-app-lg' : 'border-app shadow-app-md hover:shadow-app-lg',
      )}
    >
      {product.featured && <BorderBeam />}
      <div className="flex items-start gap-3.5">
        <ProductMark
          product={product}
          size={56}
          className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:-rotate-6 group-hover/card:scale-110 motion-reduce:transition-none"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-app text-[17px] leading-snug font-black">{copy.title}</h3>
            {product.featured && <Pill>{t('الأكثر طلباً', 'Most popular')}</Pill>}
          </div>
          <div className="mt-2">
            <Price product={product} showUsd />
          </div>
        </div>
      </div>

      <FeatureList items={copy.features} className="mt-5 flex-1" />

      {product.demo ? (
        <a
          href={demoLink(catalog, product.demo)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent mt-5 inline-flex w-fit items-center gap-1.5 text-[13px] font-bold hover:underline hover:underline-offset-4"
        >
          <FlaskConical className="size-4" aria-hidden="true" />
          {t('جرّبه مجاناً داخل تيليجرام', 'Try it free in Telegram')}
        </a>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={buyLink(catalog, product.sku)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('btn h-11 flex-1 cursor-pointer px-4 font-bold whitespace-nowrap', product.featured ? 'btn-primary' : 'btn-ghost')}
        >
          <Send className="size-4" aria-hidden="true" />
          {product.monthly ? t('اشترك عبر تيليجرام', 'Subscribe in Telegram') : t('اشترِ عبر تيليجرام', 'Buy in Telegram')}
        </a>
        <Link to={`/shop/${product.sku}`} className="btn btn-ghost h-11 flex-1 cursor-pointer px-4 whitespace-nowrap">
          {t('عرض التفاصيل', 'View details')}
          <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
