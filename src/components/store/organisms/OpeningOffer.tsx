import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ShoppingBag } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { botLink, useCatalog } from '@/lib/store'

/** Arabic counts as people read them: يوم، يومين، 3 أيام، 11 يوماً. */
function count(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one
  if (n === 2) return two
  return `${n} ${n >= 3 && n <= 10 ? few : many}`
}

function left(ms: number, lang: string) {
  const d = Math.floor(ms / 864e5)
  const h = Math.floor((ms % 864e5) / 36e5)
  const m = Math.max(1, Math.floor((ms % 36e5) / 6e4))
  if (lang === 'en') return `Ends in ${d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`}`
  const dd = count(d, 'يوم', 'يومين', 'أيام', 'يوماً')
  const hh = count(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة')
  const mm = count(m, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')
  return `ينتهي خلال ${d ? dd + (h ? ` و${hh}` : '') : h ? `${hh} و${mm}` : mm}`
}

/**
 * Organism: the store-opening offer, shaped as what it is — a coupon. The stub holds the
 * number, a perforated seam separates the terms; gold is the Stars colour. Renders only
 * while catalog.offer is live, so it disappears on its own when the month ends.
 */
export function OpeningOffer() {
  const { t, lang } = useI18n()
  const { catalog } = useCatalog()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  const ends = catalog?.offer ? Date.parse(catalog.offer.ends) : NaN
  if (!catalog?.offer || !(ends > now)) return null
  const notch = 'border-app bg-app absolute size-4 rounded-full border'
  return (
    <section
      aria-labelledby="opening-offer"
      className="border-app bg-elevated shadow-app-md relative grid grid-cols-[6.5rem_1fr] overflow-hidden rounded-panel border sm:grid-cols-[8.5rem_1fr]"
      style={{ borderColor: 'color-mix(in srgb, #e0a100 45%, transparent)' }}
    >
      <div
        className="grid place-content-center justify-items-center gap-1 p-4 text-[#241800]"
        style={{ background: 'linear-gradient(160deg, #f6c445, #e08a00)' }}
      >
        <span dir="ltr" className="text-3xl leading-none font-black tracking-tight whitespace-nowrap tabular-nums sm:text-5xl">{catalog.offer.pct}%</span>
        <span className="text-[13px] font-bold">{t('خصم', 'off')}</span>
      </div>
      <div className="flex flex-col justify-center gap-2 border-dashed p-4 sm:p-6" style={{ borderInlineStartWidth: 2, borderColor: 'color-mix(in srgb, currentColor 18%, transparent)' }}>
        <h2 id="opening-offer" className="text-app text-lg leading-snug font-black text-balance sm:text-2xl">
          {t('افتتاح متجر ZeidexSoft: نصف السعر على كل البوتات', 'ZeidexSoft opening: every bot at half price')}
        </h2>
        <p className="text-muted max-w-[56ch] text-[14px] leading-relaxed">
          {t(
            'على كل الباقات وأنواع البوتات المدفوعة دفعة واحدة. الخصم يُحسب تلقائياً في الفاتورة داخل تيليجرام.',
            'On every one-time bot and package. The discount is applied automatically on the invoice in Telegram.',
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/shop" className="btn btn-primary h-10 cursor-pointer px-4 font-bold">
            <ShoppingBag className="size-4" aria-hidden="true" />
            {t('تسوّق بالخصم', 'Shop the offer')}
          </Link>
          <a href={botLink(catalog)} className="text-muted text-[13px] font-semibold underline-offset-4 hover:underline">
            {t('أو افتح البوت', 'or open the bot')}
          </a>
          <span className="text-subtle inline-flex items-center gap-1.5 text-[12.5px] tabular-nums">
            <Clock className="size-3.5" aria-hidden="true" />
            {left(ends - now, lang)}
          </span>
        </div>
      </div>
      <span aria-hidden="true" className={`${notch} -top-2 start-[calc(6.5rem-0.5rem)] sm:start-[calc(8.5rem-0.5rem)]`} />
      <span aria-hidden="true" className={`${notch} -bottom-2 start-[calc(6.5rem-0.5rem)] sm:start-[calc(8.5rem-0.5rem)]`} />
    </section>
  )
}
