import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CircleCheck, CircleDollarSign, CreditCard, ExternalLink, Gem, Landmark, Lock, Send, Smartphone, Star, Wallet } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { FRAGMENT_STARS, buyLink, starsLink, type Catalog, type StoreProduct } from '@/lib/store'
import { cn } from '@/lib/utils'
import { StarAmount } from '../atoms/StarAmount'
import { CopyField } from '../molecules/CopyField'

/**
 * Organism: every way to pay for one product.
 *
 * Stars are always offered and are the only method inside Telegram (Telegram requires it for
 * digital goods). The others exist only on this website and only when the operator set them
 * up in the bot's .env — the catalogue's `payments` block says which.
 */
type Method = 'stars' | 'kuraimi' | 'transfer' | 'ton' | 'usdt' | 'paypal' | 'card'

const NANO = 1_000_000_000
const USDT_UNITS = 1_000_000

export function PaymentMethods({ product, catalog }: { product: StoreProduct; catalog: Catalog }) {
  const { t } = useI18n()
  const reduce = useReducedMotion() ?? false
  const pay = catalog.payments ?? { stars: true }
  const card = pay.card?.[product.sku]
  const kuraimi = useKuraimi()
  // Every method is listed; the ones not configured yet stay visible as "soon" so buyers
  // see what is coming and can ask for it, instead of the list silently changing.
  const methodsList: { key: Method; label: string; icon: typeof Star; ready: boolean }[] = [
    { key: 'stars', label: t('نجوم تيليجرام', 'Telegram Stars'), icon: Star, ready: true },
    { key: 'transfer', label: t('حوالة الكريمي', 'Kuraimi transfer'), icon: Landmark, ready: !!pay.kuraimi_transfer },
    { key: 'kuraimi', label: t('الكريمي', 'Kuraimi'), icon: Landmark, ready: !!kuraimi },
    { key: 'ton', label: 'TON', icon: Gem, ready: !!pay.ton },
    { key: 'usdt', label: 'USDT', icon: CircleDollarSign, ready: !!pay.ton },
    { key: 'paypal', label: 'PayPal', icon: Wallet, ready: !!pay.paypal },
    { key: 'card', label: t('بطاقة', 'Card'), icon: CreditCard, ready: !!card },
  ]
  const methods = methodsList.sort((a, b) => Number(b.ready) - Number(a.ready))
  const current = (key: Method) => methods.find((m) => m.key === key)!
  const [active, setActive] = useState<Method>('stars')
  const tabsId = useId()
  // One reference per visit, written into the transfer comment so the admin can match it.
  const reference = useMemo(() => `ZX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, [])

  return (
    <div className="border-app bg-elevated shadow-app-md rounded-panel border p-4 sm:p-5">
      <div role="tablist" aria-label={t('طرق الدفع', 'Payment methods')} className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {methods.map(({ key, label, icon: Icon, ready }) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${tabsId}-${key}`}
            aria-selected={active === key}
            aria-controls={`${tabsId}-panel`}
            onClick={() => setActive(key)}
            className={cn(
              'flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold transition-colors',
              active === key
                ? ready
                  ? 'bg-ghost-500 text-white shadow-[0_6px_16px_rgb(109_92_255/0.35)]'
                  : 'bg-sunken text-app ring-app ring-1'
                : ready
                  ? 'bg-sunken text-muted hover:text-app'
                  : 'text-subtle hover:text-muted border-app border border-dashed',
            )}
          >
            <Icon className={cn('size-4', !ready && 'opacity-60')} aria-hidden="true" />
            {label}
            {!ready && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {t('قريباً', 'Soon')}
              </span>
            )}
          </button>
        ))}
      </div>

      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${active}`} className="mt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {!current(active).ready && (
              <SoonPanel label={current(active).label} whatsapp={catalog.whatsapp} onStars={() => setActive('stars')} />
            )}
            {active === 'stars' && <StarsPanel product={product} catalog={catalog} />}
            {active === 'kuraimi' && kuraimi && <KuraimiPanel product={product} rate={kuraimi} />}
            {active === 'transfer' && pay.kuraimi_transfer && (
              <TransferAccountsPanel product={product} accounts={pay.kuraimi_transfer} reference={reference} />
            )}
            {active === 'ton' && pay.ton && <TonPanel product={product} wallet={pay.ton.wallet} reference={reference} />}
            {active === 'usdt' && pay.ton && (
              <UsdtPanel product={product} wallet={pay.ton.wallet} master={pay.ton.usdt_master} reference={reference} />
            )}
            {active === 'paypal' && pay.paypal && (
              <LinkPanel
                product={product}
                method="paypal"
                href={`${pay.paypal}/${product.usd}USD`}
                cta={t(`ادفع $${product.usd} عبر PayPal`, `Pay $${product.usd} with PayPal`)}
                note={t(`اكتب الرمز ${reference} في ملاحظة الدفع.`, `Put ${reference} in the payment note.`)}
                reference={reference}
              />
            )}
            {active === 'card' && card && (
              <LinkPanel
                product={product}
                method="card"
                href={card}
                cta={t(`ادفع $${product.usd} بالبطاقة`, `Pay $${product.usd} by card`)}
                note={t('صفحة دفع آمنة لدى مزوّد الدفع، ويصلك إيصال بالبريد.', "A secure checkout at the payment provider; it emails your receipt.")}
                reference={reference}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/** A method that is not switched on yet: say so plainly, offer Stars now, and let the buyer
 *  ask for it — each request tells the operator which method to activate next. */
function SoonPanel({ label, whatsapp, onStars }: { label: string; whatsapp?: string; onStars: () => void }) {
  const { t } = useI18n()
  return (
    <div className="grid gap-3">
      <p className="text-muted text-[14px] leading-relaxed">
        {t(
          `الدفع عبر ${label} غير مفعّل بعد — نعمل على تفعيله. اطلبه الآن ونبلغك فور تفعيله، أو ادفع بالنجوم فوراً.`,
          `${label} is not switched on yet — we are working on it. Ask for it and we will tell you when it is live, or pay with Stars right now.`,
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onStars} className="btn btn-primary h-11 cursor-pointer px-5 font-bold">
          <Star className="size-4" aria-hidden="true" />
          {t('ادفع بالنجوم الآن', 'Pay with Stars now')}
        </button>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost h-11 cursor-pointer px-4"
          >
            {t('اطلب تفعيلها', 'Ask to enable it')}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}

function StarsPanel({ product, catalog }: { product: StoreProduct; catalog: Catalog }) {
  const { t } = useI18n()
  const sources: { icon: typeof Star; label: string }[] = [
    { icon: CreditCard, label: t('بطاقة', 'Card') },
    { icon: Smartphone, label: 'Apple Pay · Google Pay' },
    { icon: Gem, label: t('TON عبر Fragment', 'TON via Fragment') },
    { icon: CircleDollarSign, label: t('USDT عبر Fragment', 'USDT via Fragment') },
  ]
  return (
    <div>
      <p className="text-muted text-[14px] leading-relaxed">
        {t(
          'الدفع داخل تيليجرام بالنجوم، وهي الطريقة المعتمدة للمنتجات الرقمية. إن لم يكفِ رصيدك يعرض تيليجرام الشحن تلقائياً:',
          'Pay inside Telegram with Stars, the approved method for digital goods. If your balance is short, Telegram offers a top-up right there:',
        )}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {sources.map(({ icon: Icon, label }) => (
          <li key={label} className="bg-sunken text-app flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold">
            <Icon className="text-accent size-3.5" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a href={buyLink(catalog, product.sku)} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-11 cursor-pointer px-5 font-bold">
          <Send className="size-4" aria-hidden="true" />
          {t('ادفع', 'Pay')} <StarAmount value={product.stars} iconClassName="fill-white text-white" />
        </a>
        <a href={starsLink(catalog)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost h-11 cursor-pointer px-4">
          {t('شراء نجوم', 'Get Stars')}
        </a>
        <a href={FRAGMENT_STARS} target="_blank" rel="noopener noreferrer" className="text-accent inline-flex items-center gap-1 px-2 text-[13px] font-bold hover:underline hover:underline-offset-4">
          Fragment <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}

function useTonRate() {
  const [rate, setRate] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    fetch('/api/rates')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { ton_usd: number }) => alive && setRate(d.ton_usd))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])
  return { rate, failed }
}

function TonPanel({ product, wallet, reference }: { product: StoreProduct; wallet: string; reference: string }) {
  const { t } = useI18n()
  const { rate, failed } = useTonRate()
  if (failed) return <p className="text-muted text-[14px]">{t('تعذّر جلب سعر TON الآن. جرّب USDT أو النجوم.', 'Could not fetch the TON price. Try USDT or Stars.')}</p>
  if (!rate) return <div className="bg-sunken h-40 animate-pulse rounded-2xl" />
  // Round up to the cent of TON so a rounding error never under-pays.
  const ton = Math.ceil((product.usd / rate) * 100) / 100
  const link = `ton://transfer/${wallet}?amount=${Math.round(ton * NANO)}&text=${encodeURIComponent(reference)}`
  return (
    <TransferPanel
      product={product}
      method="ton"
      link={link}
      reference={reference}
      rows={[
        [t('المبلغ', 'Amount'), `${ton} TON`],
        [t('المحفظة', 'Wallet'), wallet],
        [t('التعليق (إلزامي)', 'Comment (required)'), reference],
      ]}
      hint={t(`السعر الحالي: 1 TON ≈ $${rate.toFixed(2)}`, `Current price: 1 TON ≈ $${rate.toFixed(2)}`)}
    />
  )
}

function UsdtPanel({ product, wallet, master, reference }: { product: StoreProduct; wallet: string; master: string; reference: string }) {
  const { t } = useI18n()
  const link = `ton://transfer/${wallet}?jetton=${master}&amount=${Math.round(product.usd * USDT_UNITS)}&text=${encodeURIComponent(reference)}`
  return (
    <TransferPanel
      product={product}
      method="usdt"
      link={link}
      reference={reference}
      rows={[
        [t('المبلغ', 'Amount'), `${product.usd} USDT`],
        [t('الشبكة', 'Network'), 'TON (USD₮)'],
        [t('المحفظة', 'Wallet'), wallet],
        [t('التعليق (إلزامي)', 'Comment (required)'), reference],
      ]}
      hint={t('أرسل USD₮ على شبكة TON فقط — لا ترسل من شبكة أخرى.', 'Send USD₮ on the TON network only — never from another chain.')}
    />
  )
}

function TransferPanel({
  product,
  method,
  link,
  reference,
  rows,
  hint,
}: {
  product: StoreProduct
  method: 'ton' | 'usdt'
  link: string
  reference: string
  rows: [string, string][]
  hint: string
}) {
  const { t } = useI18n()
  return (
    <div className="grid gap-2.5">
      {rows.map(([label, value]) => (
        <CopyField key={label} label={label} value={value} />
      ))}
      <p className="text-subtle text-[12px]">{hint}</p>
      <a href={link} className="btn btn-primary h-11 cursor-pointer px-5 font-bold">
        <Wallet className="size-4" aria-hidden="true" />
        {t('افتح المحفظة وادفع', 'Open wallet and pay')}
      </a>
      <ConfirmForm product={product} method={method} reference={reference} referenceLabel={t('رقم المعاملة (اختياري)', 'Transaction hash (optional)')} />
    </div>
  )
}

function LinkPanel({
  product,
  method,
  href,
  cta,
  note,
  reference,
}: {
  product: StoreProduct
  method: 'paypal' | 'card'
  href: string
  cta: string
  note: string
  reference: string
}) {
  const { t } = useI18n()
  return (
    <div className="grid gap-3">
      <p className="text-muted text-[14px] leading-relaxed">{note}</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-11 cursor-pointer px-5 font-bold">
        {cta}
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
      <ConfirmForm product={product} method={method} reference={reference} referenceLabel={t('رقم الإيصال (اختياري)', 'Receipt number (optional)')} />
    </div>
  )
}

/** After paying outside Telegram, the buyer tells us how to reach them; an admin verifies. */
function ConfirmForm({
  product,
  method,
  reference,
  referenceLabel,
}: {
  product: StoreProduct
  method: string
  reference: string
  referenceLabel: string
}) {
  const { t } = useI18n()
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error' | 'busy'>('idle')
  const [orderId, setOrderId] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState('sending')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sku: product.sku,
          method,
          contact: String(form.get('contact') ?? ''),
          reference: `${reference} ${String(form.get('tx') ?? '')}`.trim(),
        }),
      })
      if (res.status === 429) return setState('busy')
      if (!res.ok) return setState('error')
      setOrderId(((await res.json()) as { id: string }).id)
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <Notice icon={<CircleCheck className="size-5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />}>
        {t(`سجّلنا طلبك ${orderId}. سيتحقق المشرف من الدفع ويتواصل معك.`, `Order ${orderId} received. An admin will verify the payment and contact you.`)}
      </Notice>
    )
  }
  return (
    <form onSubmit={submit} className="border-app mt-1 grid gap-2.5 border-t pt-4">
      <p className="text-app text-[14px] font-bold">{t('دفعت؟ أكّد الطلب', 'Paid? Confirm the order')}</p>
      <label className="grid gap-1 text-[12px] font-semibold">
        <span className="text-subtle">{t('تيليجرام أو البريد للتواصل', 'Telegram or email to reach you')}</span>
        <input name="contact" required minLength={3} maxLength={120} autoComplete="email" dir="ltr" placeholder="@username" className="bg-sunken text-app focus:border-ghost-400 h-11 rounded-xl border border-transparent px-3 text-[14px] outline-none" />
      </label>
      <label className="grid gap-1 text-[12px] font-semibold">
        <span className="text-subtle">{referenceLabel}</span>
        <input name="tx" maxLength={150} dir="ltr" className="bg-sunken text-app focus:border-ghost-400 h-11 rounded-xl border border-transparent px-3 font-mono text-[13px] outline-none" />
      </label>
      <button type="submit" disabled={state === 'sending'} className="btn btn-ghost h-11 cursor-pointer px-5 font-bold disabled:cursor-wait disabled:opacity-60">
        {state === 'sending' ? t('جارٍ الإرسال…', 'Sending…') : t('أرسل التأكيد', 'Send confirmation')}
      </button>
      {state === 'error' && <p role="alert" className="text-[13px] text-red-600 dark:text-red-400">{t('تعذّر الإرسال. تحقق من البيانات وحاول مجدداً.', 'Could not send. Check the details and try again.')}</p>}
      {state === 'busy' && <p role="alert" className="text-[13px] text-amber-700 dark:text-amber-300">{t('محاولات كثيرة — انتظر عشر دقائق ثم أعد الإرسال.', 'Too many attempts — wait ten minutes and resend.')}</p>}
    </form>
  )
}

function Notice({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-1 flex items-start gap-2.5 rounded-2xl bg-emerald-500/10 p-3.5 text-[14px] leading-relaxed text-emerald-900 dark:text-emerald-100">
      {icon}
      <p>{children}</p>
    </div>
  )
}

/** Kuraimi (Haseb / KJ / Mfloos) is offered only when the Worker reports it configured. */
function useKuraimi() {
  const [rate, setRate] = useState<number | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/api/pay/kuraimi/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { enabled: boolean; yer_per_usd: number | null } | null) => alive && d?.enabled && setRate(d.yer_per_usd))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])
  return rate
}

type KuraimiResult = { refno: string; status: 'charging' | 'paid' | 'failed' | 'unknown'; yer: number; code?: string | null; message?: string | null }

function KuraimiPanel({ product, rate }: { product: StoreProduct; rate: number }) {
  const { t } = useI18n()
  const yer = Math.ceil(product.usd * rate)
  // One key per attempt: a double tap returns the first result instead of charging twice.
  const [key, setKey] = useState(() => crypto.randomUUID())
  const [state, setState] = useState<'idle' | 'sending' | 'busy' | 'error' | 'locked'>('idle')
  const [result, setResult] = useState<KuraimiResult | null>(null)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState('sending')
    try {
      const res = await fetch('/api/pay/kuraimi', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sku: product.sku, mobile: form.get('mobile'), pin: form.get('pin'), idempotency_key: key }),
      })
      if (res.status === 429) return setState('busy')
      if (res.status === 423) return setState('locked')
      if (res.ok || res.status === 402) {
        const data = (await res.json()) as KuraimiResult
        setResult(data)
        setState('idle')
        if (data.status === 'failed') setKey(crypto.randomUUID())
        return
      }
      setState('error')
    } catch {
      setState('error')
    }
  }

  if (result?.status === 'unknown' || result?.status === 'charging') {
    return (
      <Notice icon={<CircleCheck className="size-5 text-amber-600 dark:text-amber-300" aria-hidden="true" />}>
        {t(
          `لم يصلنا تأكيد البنك بعد للطلب ${result.refno}. لا تعِد الدفع — سنتحقق ونتواصل معك.`,
          `No bank confirmation yet for ${result.refno}. Do not pay again — we will verify and contact you.`,
        )}
      </Notice>
    )
  }
  if (result?.status === 'paid') {
    return (
      <Notice icon={<CircleCheck className="size-5 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />}>
        {t(`تم الدفع (${result.refno}).`, `Paid (${result.refno}).`)}{' '}
        {result.code
          ? <><br />{t('كودك:', 'Your code:')} <code dir="ltr" className="font-mono font-bold select-all">{result.code}</code></>
          : t('سيتواصل معك المشرف لتسليم طلبك.', 'An admin will contact you to deliver your order.')}
      </Notice>
    )
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      <p className="text-muted text-[14px] leading-relaxed">
        {t(
          `ادفع ${yer.toLocaleString('en-US')} ريال من حسابك في الكريمي (حاسب / كريمي جوال / إم فلوس).`,
          `Pay ${yer.toLocaleString('en-US')} YER from your Kuraimi account (Haseb / KJ / Mfloos).`,
        )}
      </p>
      <label className="grid gap-1 text-[12px] font-semibold">
        <span className="text-subtle">{t('رقم الجوال المسجّل في الكريمي', 'Kuraimi mobile number')}</span>
        <input name="mobile" required inputMode="numeric" pattern="7[0-9]{8}" maxLength={9} dir="ltr" placeholder="77XXXXXXX" autoComplete="tel-national" className="bg-sunken text-app focus:border-ghost-400 h-11 rounded-xl border border-transparent px-3 font-mono text-[14px] outline-none" />
      </label>
      <label className="grid gap-1 text-[12px] font-semibold">
        <span className="text-subtle">{t('رمز الدفع الإلكتروني', 'E-payment PIN')}</span>
        <input name="pin" type="password" required inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} dir="ltr" autoComplete="off" className="bg-sunken text-app focus:border-ghost-400 h-11 rounded-xl border border-transparent px-3 font-mono text-[14px] outline-none" />
      </label>
      <p className="text-subtle flex items-start gap-1.5 text-[12px]">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t('يُرسل الرمز مرة واحدة إلى البنك مباشرة عبر اتصال مشفّر، ولا نحفظه.', 'The PIN goes once, encrypted, straight to the bank. We never store it.')}
      </p>
      <button type="submit" disabled={state === 'sending'} className="btn btn-primary h-11 cursor-pointer px-5 font-bold disabled:cursor-wait disabled:opacity-60">
        <Landmark className="size-4" aria-hidden="true" />
        {state === 'sending' ? t('جارٍ الدفع…', 'Paying…') : t(`ادفع ${yer.toLocaleString('en-US')} ريال`, `Pay ${yer.toLocaleString('en-US')} YER`)}
      </button>
      {result?.status === 'failed' && <p role="alert" className="text-[13px] text-red-600 dark:text-red-400">{t('رفض البنك العملية', 'The bank declined')}{result.message ? `: ${result.message}` : '.'}</p>}
      {state === 'busy' && <p role="alert" className="text-[13px] text-amber-700 dark:text-amber-300">{t('محاولات كثيرة — انتظر عشر دقائق.', 'Too many attempts — wait ten minutes.')}</p>}
      {state === 'locked' && <p role="alert" className="text-[13px] text-red-600 dark:text-red-400">{t('أُوقف الدفع لهذا الرقم اليوم بعد عدة محاولات مرفوضة. حاول غداً أو تواصل معنا.', 'Payments for this number are paused today after several refusals. Try tomorrow or contact us.')}</p>}
      {state === 'error' && <p role="alert" className="text-[13px] text-red-600 dark:text-red-400">{t('تعذّر الاتصال بالبنك. حاول لاحقاً.', 'Could not reach the bank. Try later.')}</p>}
    </form>
  )
}

/** SAR is pegged at 3.75 per USD. YER has no single rate (old/new rial), so it is quoted
 *  as the USD price at the day's rate rather than as a number we would have to invent. */
const SAR_PER_USD = 3.75

function TransferAccountsPanel({
  product,
  accounts,
  reference,
}: {
  product: StoreProduct
  accounts: NonNullable<NonNullable<Catalog['payments']>['kuraimi_transfer']>
  reference: string
}) {
  const { t } = useI18n()
  const amount = (cur: string) =>
    cur === 'USD'
      ? `$${product.usd}`
      : cur === 'SAR'
        ? `${Math.ceil(product.usd * SAR_PER_USD)} ${t('ريال سعودي', 'SAR')}`
        : t(`ما يعادل $${product.usd} بسعر صرف اليوم`, `$${product.usd} equivalent at today's rate`)
  const label = { USD: t('دولار', 'USD'), YER: t('ريال يمني', 'YER'), SAR: t('ريال سعودي', 'SAR') } as const
  return (
    <div className="grid gap-2.5">
      <p className="text-muted text-[14px] leading-relaxed">
        {t(
          'حوّل المبلغ إلى أحد حساباتنا في بنك الكريمي (من التطبيق أو أي فرع)، واكتب رمز الطلب في الملاحظة، ثم أكّد الطلب أدناه.',
          'Transfer the amount to one of our Kuraimi Bank accounts (app or any branch), put the order code in the note, then confirm below.',
        )}
      </p>
      {(['USD', 'YER', 'SAR'] as const)
        .filter((cur) => accounts.accounts[cur])
        .map((cur) => (
          <div key={cur} className="grid gap-1">
            <CopyField label={`${t('حساب', 'Account')} ${label[cur]} — ${amount(cur)}`} value={accounts.accounts[cur]!} />
          </div>
        ))}
      {accounts.name ? <p className="text-subtle text-[12px]">{t('باسم', 'Account name')}: {accounts.name}</p> : null}
      <CopyField label={t('رمز الطلب (اكتبه في ملاحظة الحوالة)', 'Order code (put it in the transfer note)')} value={reference} />
      <ConfirmForm product={product} method="kuraimi_transfer" reference={reference} referenceLabel={t('رقم الحوالة / الإشعار', 'Transfer / receipt number')} />
    </div>
  )
}
