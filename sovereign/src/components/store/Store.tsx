import { useRef, useState } from 'react'
import { ArrowUpLeft, Eye, ShoppingBag, Sparkles, Star } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { itemsFor, storeTabs, type StoreItem } from '@/lib/store'
import { site, type OrderTarget } from '@/lib/content'
import { cn } from '@/lib/cn'
import { useLang } from '@/lib/i18n'

const targetFor = (item: StoreItem, note: { ar: string; en: string }): OrderTarget => ({
  id: item.sku,
  name: { ar: item.title, en: item.titleEn },
  priceStars: `${item.stars.toLocaleString('en-US')} ⭐`,
  priceUsd: `~$${item.usd}`,
  note,
})

/**
 * Store — every SKU in the catalogue, grouped the way the bot groups them.
 *
 * A tab switch is instant and local; nothing is fetched. Templates carry
 * their own identity swatch and a live preview link, because a storefront
 * is bought with the eyes. Everything else goes straight to the order
 * confirmation, which is the only place payment details appear.
 */
export function Store({ onOrder }: { onOrder: (target: OrderTarget) => void }) {
  const { c, lang } = useLang()
  const root = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<(typeof storeTabs)[number]['id']>('bots')
  const items = itemsFor(tab)

  useGSAP(
    () => {
      if (reducedMotion()) return
      const cards = gsap.utils.toArray<HTMLElement>('[data-sku]', root.current)
      if (!cards.length) return
      gsap.from(cards, {
        y: 18,
        opacity: 0,
        duration: 0.5,
        ease: 'expo.out',
        stagger: 0.03,
        overwrite: true,
        scrollTrigger: { trigger: root.current, start: 'top 80%', once: true },
      })
    },
    { scope: root, dependencies: [tab], revertOnUpdate: true },
  )

  return (
    <section ref={root} id="store" className="relative scroll-mt-28 pb-20 pt-6 sm:pb-28 sm:pt-8">
      <div className="shell">
        <div className="max-w-[54rem]">
          <SectionHeading
            index="03"
            eyebrow={c.store.eyebrow}
            title={c.store.title}
            lead={c.store.lead}
          />
        </div>
      </div>

      <div className="shell">
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {storeTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-colors duration-300',
                tab === item.id
                  ? 'border-tg/45 bg-tg/[0.12] text-tg-2'
                  : 'border-hair bg-wash text-muted hover:border-hair-2 hover:text-ink',
              )}
            >
              {lang === 'ar' ? item.label : item.labelEn}
              <span className="font-mono text-[9px] opacity-60">{itemsFor(item.id).length}</span>
            </button>
          ))}
          <a
            href={site.bot}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label ms-auto hidden items-center gap-1.5 text-[9px] text-subtle transition-colors hover:text-tg-2 sm:flex"
          >
            {c.store.openInBot}
            <ArrowUpLeft className="arrow-rtl size-3" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.sku}
              data-sku
              className="card spot group relative flex flex-col overflow-hidden rounded-card border border-hair-soft bg-panel/80 transition-[border-color,background-color,transform] duration-500 ease-expo hover:-translate-y-0.5 hover:border-hair hover:bg-panel hover:shadow-[0_28px_60px_-44px_rgb(0_0_0/0.9)]"
            >
              {item.swatch ? (
                <div
                  aria-hidden="true"
                  className="relative h-24 w-full overflow-hidden border-b border-hair-soft"
                  style={{ background: item.swatch }}
                >
                  <span className="absolute inset-0 bg-[radial-gradient(90%_130%_at_15%_0%,rgba(255,255,255,0.26),transparent_58%)]" />
                  {/* a scrim, so the white wireframe holds on pale and deep
                      swatches alike */}
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.34))]" />

                  {/* The swatch is not a colour chip, it is a thumbnail: a
                      storefront skeleton — bar, headline, product row — so a
                      buyer can read the layout before opening the preview. */}
                  <div className="absolute inset-0 origin-center p-3.5 transition-transform duration-700 ease-expo group-hover:scale-[1.03]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-7 rounded-full bg-white/70" />
                      <span className="ms-auto h-1 w-4 rounded-full bg-white/35" />
                      <span className="h-1 w-4 rounded-full bg-white/35" />
                      <span className="h-3 w-7 rounded-[3px] bg-white/70" />
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <span className="block h-2 w-[58%] rounded-full bg-white/60" />
                      <span className="block h-1.5 w-[38%] rounded-full bg-white/30" />
                    </div>

                    <div className="absolute inset-x-3.5 bottom-3 grid grid-cols-3 gap-1.5">
                      <span className="h-4 rounded-[3px] bg-white/20" />
                      <span className="h-4 rounded-[3px] bg-white/20" />
                      <span className="h-4 rounded-[3px] bg-white/20" />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-hair bg-wash px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-subtle">
                        {item.category === 'sites' ? c.store.labels.template : item.category === 'channel' ? c.store.labels.channel : c.store.labels.bot}
                      </span>
                      {item.featured ? (
                        <span className="inline-flex items-center gap-1 rounded bg-aurum/12 px-1.5 py-0.5 text-[9px] font-semibold text-aurum-2">
                          <Sparkles className="size-2.5" aria-hidden="true" />
                          {c.store.featured}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2.5 text-[13.5px] font-semibold leading-snug text-ink">{lang === 'ar' ? item.title : item.titleEn}</h3>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-[11.5px] leading-[1.8] text-muted">{lang === 'ar' ? item.desc : item.descEn}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(lang === 'ar' ? item.features : item.featuresEn).slice(0, 2).map((feature) => (
                    <span
                      key={feature}
                      className="rounded border border-hair-soft bg-wash px-1.5 py-0.5 text-[9px] text-subtle"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-hair-soft pt-4">
                  <div>
                    <p className="flex items-center gap-1 font-mono text-[14px] font-medium leading-none text-ink tabular-nums">
                      {item.stars.toLocaleString('en-US')}
                      <Star className="size-3 fill-aurum text-aurum" aria-hidden="true" />
                    </p>
                    <p className="mt-1.5 font-mono text-[10.5px] text-subtle">
                      <bdi dir="ltr">~${item.usd}</bdi>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.demoPath ? (
                      <a
                        href={`https://zeidexsoft.com${item.demoPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`معاينة ${item.title}`}
                        title="معاينة حية"
                        className="grid size-9 place-items-center rounded-lg border border-hair text-subtle transition-colors hover:border-hair-2 hover:text-ink"
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onOrder(targetFor(item, c.store.notes[(item.category === 'sites' ? 'sites' : item.category === 'channel' ? 'channel' : 'bots') as 'bots' | 'sites' | 'channel']))}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-tg/35 bg-tg/[0.1] px-3 text-[11.5px] font-semibold text-tg-2 transition-colors hover:border-tg/60 hover:bg-tg/[0.18]"
                    >
                      <ShoppingBag className="size-3.5" aria-hidden="true" />
                      {c.store.order}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
          <span className="mono-label text-[8.5px]">PAYMENT</span>
          {c.store.paymentNote}
        </p>
      </div>
    </section>
  )
}
