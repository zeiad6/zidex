import { ArrowUpRight, Gem, Gamepad2, Globe2, Receipt, ShieldCheck, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { MARKETPLACES, type Marketplace } from '@/lib/marketplaces'
import { ArrowNudge, HoverCard, LiveDot } from '@/components/ui/Motion'
import { Marquee } from '@/components/ui/Marquee'
import { StoreSection } from '@/components/store/templates/StoreSection'
import { Reveal } from '@/components/ui/Reveal'

/** One icon and one accent per venue, keyed by id so adding a row is one object. */
const VENUE = {
  fragment: { Icon: Gem, tile: 'from-ghost-500 to-ghost-400', text: 'text-ghost-700 dark:text-ghost-300' },
  playerup: { Icon: Globe2, tile: 'from-veil-500 to-veil-400', text: 'text-veil-700 dark:text-veil-300' },
  epicnpc: { Icon: Gamepad2, tile: 'from-amber-500 to-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  fameswap: { Icon: Users, tile: 'from-rose-500 to-rose-400', text: 'text-rose-700 dark:text-rose-300' },
} as const

/**
 * Organism: the other venues where these digital goods change hands.
 *
 * This section is deliberately the least promotional surface on the store.
 * It names four third-party platforms, quotes what each one charges, and
 * says plainly that the transaction happens there under its rules — a card
 * that read like an advertisement for someone else's escrow would be both
 * wrong and, the first time a buyer was charged off-platform, the thing
 * they remembered about us.
 */
export function Marketplaces() {
  const { t } = useI18n()

  return (
    <StoreSection
      id="shop-marketplaces"
      title={t('أسواق أخرى تبيع نفس النوع من المنتجات', 'Other venues that sell the same kind of goods')}
      subtitle={t(
        'إن كنت تبحث عن اسم مستخدم أو حساب قناة بجمهور جاهز، فهذه وجهات معروفة في هذا المجال. الشراء يتم داخل كل منصة من هذه المنصات بالرسوم والضمانات الخاصة بها، ولا يمرّ أي مبلغ عبر هذا الموقع.',
        'Looking for a username or a channel account with an audience? These are the known venues for it. Each deal happens inside that platform under its own fees and guarantees — no money passes through this site.',
      )}
      action={
        <span className="text-subtle flex items-center gap-2 text-[12px] font-semibold">
          <LiveDot tone="ok" />
          {t('روابط مباشرة بلا وساطة', 'Direct links, no middleman')}
        </span>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {MARKETPLACES.map((m, i) => (
          <Reveal key={m.id} delay={Math.min(i * 0.05, 0.15)} className="h-full">
            <VenueCard market={m} />
          </Reveal>
        ))}
      </div>

      {/* The venues as a ticker, above the full cards: the same real names
          and fees, in a single line, so a visitor sees the landscape before
          reading any one card in detail. */}
      <Marquee speed={34} className="mt-5 py-1" gap="2.75rem">
        {MARKETPLACES.map((m) => (
          <span key={m.id} className="text-subtle flex items-baseline gap-2 text-[12.5px] whitespace-nowrap">
            <span className="text-app font-bold">{m.name}</span>
            <span className="font-mono text-[11px]">{t(m.fee, m.feeEn)}</span>
          </span>
        ))}
      </Marquee>

      <p className="text-subtle mt-4 flex items-start gap-2 text-[12px] leading-relaxed">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t(
          'نصيحة قبل أي صفقة خارج الموقع: استخدم وسيط المنصة نفسها ولا تدفع بالتحويل المباشر قبل المعاينة، لأن الحسابات تُسلَّم بالبريد ولا يمكن استرجاعها بعد تسليم بيانات الدخول.',
          'Before any off-site deal: use the platform’s own middleman, and never pay by direct transfer before seeing the account. Credentials are handed over by email and cannot be pulled back once delivered.',
        )}
      </p>
    </StoreSection>
  )
}

function VenueCard({ market: m }: { market: Marketplace }) {
  const { t } = useI18n()
  const { Icon, tile, text } = VENUE[m.id as keyof typeof VENUE] ?? VENUE.fragment
  const href = m.storefront || m.href

  return (
    <HoverCard as="article" className="bg-elevated border-app flex h-full flex-col rounded-card border p-5">
      <div className="flex items-start gap-3.5">
        <span className={cnTile(tile)} aria-hidden="true">
          <Icon className="size-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-app flex items-center gap-1.5 text-[16px] leading-snug font-black" dir="ltr">
            {m.name}
            <ArrowUpRight className="text-subtle size-3.5 shrink-0" aria-hidden="true" />
          </h3>
          <p className="text-muted mt-1 text-[13px] leading-relaxed">{t(m.blurb, m.blurbEn)}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-2.5">
        <Row icon={<Receipt className="size-3.5" aria-hidden="true" />} label={t('ما يُباع', 'Sells')}>
          {t(m.sells, m.sellsEn)}
        </Row>
        <Row icon={<span className="font-mono text-[11px] leading-none">%</span>} label={t('الرسوم', 'Fees')}>
          {t(m.fee, m.feeEn)}
        </Row>
        <Row icon={<ShieldCheck className="size-3.5" aria-hidden="true" />} label={t('الحماية', 'Protection')}>
          {t(m.escrow, m.escrowEn)}
        </Row>
      </dl>

      <div className="mt-5 flex items-center gap-3 pt-1">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost press h-10 flex-1 cursor-pointer px-4 text-[13px] font-bold"
        >
          {m.storefront ? t('متجري هناك', 'My storefront there') : t('افتح المنصة', 'Open the platform')}
          <ArrowNudge>
            <ArrowUpRight className="size-4" />
          </ArrowNudge>
        </a>
        <span className={cnText(text)} title={t('رسوم محدثة', 'Fees checked')}>
          {m.feeChecked}
        </span>
      </div>
    </HoverCard>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-subtle mt-0.5 grid size-5 shrink-0 place-items-center" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-subtle text-[11px] font-bold">{label}</dt>
        <dd className="text-muted mt-0.5 text-[12.5px] leading-relaxed">{children}</dd>
      </div>
    </div>
  )
}

const cnTile = (tile: string) =>
  `grid size-11 shrink-0 place-items-center rounded-xl border border-app ${tile}`

const cnText = (text: string) => `shrink-0 font-mono text-[11px] font-bold ${text}`