import { productImage, type StoreProduct } from '@/lib/store'
import { cn } from '@/lib/utils'

/** Atom: a product's own app-icon mark, sized by the caller. */
export function ProductMark({
  product,
  size = 52,
  className,
  alt = '',
}: {
  product: Pick<StoreProduct, 'sku' | 'image'>
  size?: number
  className?: string
  alt?: string
}) {
  return (
    <img
      src={productImage(product)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size }}
      className={cn('shrink-0 rounded-[22%] shadow-[0_10px_24px_-6px_rgb(0_0_0/0.35)]', className)}
    />
  )
}
