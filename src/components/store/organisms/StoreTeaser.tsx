import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { BorderBeam } from '@/components/ui/Decor'
import { useI18n } from '@/lib/i18n'
import { useCatalog } from '@/lib/store'
import { ProductMark } from '../atoms/ProductMark'
import { StarAmount } from '../atoms/StarAmount'

/** Organism: the shop on the home page — the store-bot packages and a way in. */
export function StoreTeaser() {
  const { t, lang } = useI18n()
  const { catalog } = useCatalog()
  const bots = catalog?.products.filter((p) => p.category === 'bots') ?? []
  if (!bots.length) return null
  return (
    <section
      aria-labelledby="home-store"
      className="border-app bg-elevated shadow-app-md relative grid gap-6 overflow-hidden rounded-panel border p-5 sm:p-7 lg:grid-cols-[1fr_1.1fr] lg:items-center"
    >
      <BorderBeam size={120} duration={9} />
      <div>
        <h2 id="home-store" className="text-app text-2xl leading-tight font-black text-balance">
          {t('بوت متجر رقمي لقناتك — بالدفع بالنجوم', 'A digital-store bot for your channel — paid in Stars')}
        </h2>
        <p className="text-muted mt-3 max-w-[52ch] text-[15px] leading-relaxed">
          {t(
            'متجرك داخل تيليجرام: عملاؤك يدفعون بالنجوم وتصلك الطلبات فوراً. ثلاث باقات بأسعار ثابتة.',
            'Your store inside Telegram: customers pay in Stars and orders reach you instantly. Three fixed-price packages.',
          )}
        </p>
        <Link to="/shop" className="btn btn-primary mt-5 h-11 cursor-pointer px-5 font-bold">
          <ShoppingBag className="size-4" aria-hidden="true" />
          {t('ادخل المتجر', 'Visit the store')}
        </Link>
      </div>
      <ul className="grid gap-2.5">
        {bots.map((p) => (
          <li key={p.sku}>
            <Link
              to={`/shop/${p.sku}`}
              className="bg-sunken hover:border-ghost-400/50 group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors"
            >
              <ProductMark product={p} size={40} className="transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none" />
              <span className="min-w-0 flex-1">
                <span className="text-app block text-[14px] leading-snug font-bold">{lang === 'en' ? p.title_en : p.title}</span>
                <span className="text-subtle text-[12px]">
                  {p.monthly ? t('اشتراك شهري', 'Monthly subscription') : t('دفعة واحدة', 'One-time')}
                </span>
              </span>
              <StarAmount value={p.stars} className="text-app" />
              <ArrowLeft className="text-subtle size-4 transition-transform ltr:rotate-180 rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
