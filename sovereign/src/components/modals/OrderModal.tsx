import { useEffect, useState } from 'react'
import { ArrowUpLeft, Send, Star } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { CopyButton } from '@/components/ui/CopyButton'
import { bank, site, type OrderTarget } from '@/lib/content'
import { useLang } from '@/lib/i18n'

/**
 * OrderModal — the confirmation state for a package.
 *
 * It keeps the last target while the exit animation runs: if the content
 * unmounted the instant `target` became null, the panel would collapse
 * from its full height to zero mid-spring. A tiny detail, very visible.
 */
export function OrderModal({ target, onClose }: { target: OrderTarget | null; onClose: () => void }) {
  const [shown, setShown] = useState<OrderTarget | null>(target)
  const { c, lang } = useLang()

  useEffect(() => {
    if (target) setShown(target)
  }, [target])

  return (
    <Modal open={Boolean(target)} onClose={onClose} labelledBy="order-title">
      {shown ? (
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2.5 pe-10">
            <span className="mono-label text-[9px] text-jade/80">{c.order.kicker}</span>
            <span className="h-px w-6 bg-hair-2" aria-hidden="true" />
            <span className="mono-label text-[9px]">{c.order.confirmation}</span>
          </div>

          <h2 id="order-title" className="mt-4 text-[22px] font-semibold leading-snug text-ink">
            {c.order.title}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{c.order.lead}</p>

          <div className="mt-5 overflow-hidden rounded-xl border border-hair bg-wash">
            <div className="flex items-start justify-between gap-3 border-b border-hair-soft px-4 py-3.5">
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{shown.name[lang]}</p>
                <p className="mt-1 text-[11px] text-subtle">{shown.note[lang]}</p>
              </div>
              <div className="shrink-0 text-end">
                <p className="flex items-center gap-1 font-mono text-[14px] text-ink tabular-nums">
                  {shown.priceStars.replace(' ⭐', '')}
                  <Star className="size-3 fill-aurum text-aurum" aria-hidden="true" />
                </p>
                <p className="mt-1 font-mono text-[10px] text-subtle">
                  <bdi dir="ltr">{shown.priceUsd}</bdi>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="mono-label text-[8.5px] text-subtle/80">KURAIMI ACCOUNT</p>
                <p className="mt-1 font-mono text-[15px] tracking-[0.08em] text-ink tabular-nums">
                  {bank.account}
                </p>
              </div>
              <CopyButton value={bank.account} label={c.order.copy} className="!h-9 !px-3 !text-[11.5px]" />
            </div>
          </div>

          <ol className="mt-5 space-y-3.5">
            {c.order.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-hair bg-wash-2 font-mono text-[9px] text-muted">
                  {index + 1}
                </span>
                <span className="text-[12px] leading-[1.8] text-muted">{step}</span>
              </li>
            ))}
          </ol>

          <a href={site.bot} target="_blank" rel="noopener noreferrer" className="btn btn-tg mt-6 w-full">
            <Send className="size-4" aria-hidden="true" />
            {c.order.open} {site.botHandle}
            <ArrowUpLeft className="arrow-rtl size-3.5 opacity-70" aria-hidden="true" />
          </a>

          <p className="mt-3 text-center text-[10.5px] text-subtle">{c.order.note}</p>
        </div>
      ) : null}
    </Modal>
  )
}
