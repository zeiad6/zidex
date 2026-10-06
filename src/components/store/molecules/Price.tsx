import { useI18n } from '@/lib/i18n'
import type { StoreProduct } from '@/lib/store'
import { cn } from '@/lib/utils'
import { StarAmount } from '../atoms/StarAmount'

/** Molecule: Stars price with its unit, and the website USD price beside it. */
export function Price({ product, size = 'md', showUsd = false }: { product: StoreProduct; size?: 'md' | 'lg'; showUsd?: boolean }) {
  const { t } = useI18n()
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <StarAmount
        value={product.stars}
        className={cn('text-app', size === 'lg' ? 'text-4xl' : 'text-2xl')}
        iconClassName={size === 'lg' ? 'size-6' : 'size-4'}
      />
      <span className="text-subtle text-[13px] font-semibold">
        {product.monthly ? t('نجمة / شهرياً', 'Stars / month') : t('نجمة', 'Stars')}
      </span>
      {showUsd && product.usd ? (
        <span className="text-subtle text-[13px]" dir="ltr">
          {t('أو', 'or')} ${product.usd}
          {product.monthly ? t(' / شهر', ' / mo') : ''}
        </span>
      ) : null}
    </span>
  )
}
