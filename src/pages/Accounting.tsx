import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  Calculator,
  FileText,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/Primitives'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useI18n } from '@/lib/i18n'
import { site } from '@/lib/site'

/* ================================================================== *
 * Accounting systems — a services section, not a fake catalogue.
 * ZeidexSoft builds bespoke accounting systems on request; nothing on
 * this page pretends to be an off-the-shelf product. Every card says
 * what gets built when it is ordered, the flow says how, and the two
 * honest CTAs are WhatsApp (scope + quote) and the store (ready bots).
 * ================================================================== */

const modules = [
  {
    icon: Receipt,
    title: 'فواتير وسندات',
    titleEn: 'Invoicing & vouchers',
    body: 'فواتير بيع وشراء وسندات قبض وصرف بترقيم آلي، تُصدَّر PDF ويقفز كل مستند إلى أرشيفه فور الصدور.',
    bodyEn: 'Sales and purchase invoices plus receipt and payment vouchers — auto-numbered, exported to PDF, and archived the moment they are issued.',
  },
  {
    icon: Boxes,
    title: 'جرد ومخزون',
    titleEn: 'Inventory & stock',
    body: 'أصناف ووحدات ومخازن متعددة، حركات إدخال وإخراج، وربح تقديري لكل صنف، وتنبيه عند اقتراب نفاد الكمية.',
    bodyEn: 'Items, units and multiple warehouses with stock in/out movements, an indicative margin per item, and alerts as quantities run low.',
  },
  {
    icon: Wallet,
    title: 'حسابات وخزائن',
    titleEn: 'Accounts & cash boxes',
    body: 'كشف حساب لكل عميل ومورّد، وخزائن نقدية بدفعاتها، وتسوية واضحة للفروق بلا دفاتر ورقية.',
    bodyEn: 'Per-customer and per-supplier statements, cash boxes with their payments, and clean settlement of the differences — no paper ledgers.',
  },
  {
    icon: BarChart3,
    title: 'تقارير تُقرأ',
    titleEn: 'Reports that read',
    body: 'تقارير مبيعات ومخزون وربحية بفلاتر تاريخ ومستخدم، وتصدير Excel/CSV لمن يطلب الأرقام.',
    bodyEn: 'Sales, stock and margin reports with date and user filters, exported to Excel/CSV for whoever asks for the numbers.',
  },
  {
    icon: Calculator,
    title: 'عملات وضريبة',
    titleEn: 'Currencies & tax',
    body: 'الريال والدولار بأسعار تُحدَّد مرة واحدة، وحقل ضريبة يُفعَّل وفق نظام نشاطك — لا نعدّ بامتثال لا نضمنه.',
    bodyEn: 'YER and USD with rates fixed in one place, plus an optional tax field configured to your regime — we never promise compliance we cannot guarantee.',
  },
  {
    icon: ShieldCheck,
    title: 'صلاحيات وسجل',
    titleEn: 'Roles & audit trail',
    body: 'مدراء وموظفون بصلاحيات دقيقة، وسجل لكل إجراء: من أدخله، ومتى، وماذا عدّل.',
    bodyEn: 'Managers and staff with fine-grained permissions, and an audit log of every action: who entered it, when, and what changed.',
  },
] as const

const steps = [
  {
    icon: FileText,
    title: 'تحليل نشاطك',
    titleEn: 'Scope your business',
    body: 'جلسة قصيرة على واتساب نحدد بها المستندات والتقارير والمستخدمين فعلياً — بلا وحدات لن تفتحها أبداً.',
    bodyEn: 'A short WhatsApp session fixes your real documents, reports and users — no modules you will never open.',
  },
  {
    icon: Receipt,
    title: 'بناء وتجربة',
    titleEn: 'Build & trial',
    body: 'نسخة تعمل ببياناتك تتطور على مراحل قصيرة، وتجرب كل مرحلة قبل الانتقال إلى التي بعدها.',
    bodyEn: 'A working copy on your own data evolves in short stages; you accept each stage before we move to the next.',
  },
  {
    icon: ArrowUpRight,
    title: 'تسليم ومرافقة',
    titleEn: 'Deliver & accompany',
    body: 'تسليم بإجراءات مكتوبة وتدريب موظفيك على النظام، مع شهر كامل من التعديلات المجانية.',
    bodyEn: 'Delivery with written procedures and your staff trained on the system, plus a full month of free fixes.',
  },
] as const

export default function Accounting() {
  const { lang, t } = useI18n()

  usePageMeta(
    t('أنظمة محاسبية — ZeidexSoft', 'Accounting systems — ZeidexSoft'),
    t(
      'أنظمة محاسبية مخصصة تُبنى حسب نشاطك: فواتير، جرد، تقارير، عملات وصلاحيات — مع ربط اختياري ببوت تيليجرام.',
      'Bespoke accounting systems built for your business: invoicing, inventory, reports, currencies and roles — with an optional Telegram bot link.',
    ),
    '/accounting',
  )

  return (
    <div className="container-app flex flex-col gap-8 py-6 sm:py-8">
      {/* Hero — one card, one accent word, two honest CTAs. */}
      <Reveal>
        <section className="border-app bg-elevated shadow-app-lg relative overflow-hidden rounded-panel border">
          <span
            aria-hidden="true"
            className="from-ghost-500/15 to-veil-500/10 absolute -top-32 -start-32 size-96 rounded-full bg-linear-to-br blur-3xl"
          />
          <span aria-hidden="true" className="brand-gradient absolute inset-x-0 top-0 h-0.5 opacity-80" />

          <div className="relative flex flex-col gap-6 p-7 sm:p-10">
            <span className="chip w-fit bg-accent-soft text-accent">
              <Calculator className="size-3.5" aria-hidden="true" />
              {t('خدمة مخصصة', 'Bespoke service')}
            </span>
            <h1 className="text-app text-3xl font-black tracking-tight sm:text-4xl">
              {lang === 'en' ? (
                <>
                  Accounting systems,{' '}
                  <span className="bg-accent text-transparent bg-clip-text">built around your business.</span>
                </>
              ) : (
                <>
                  أنظمة محاسبية{' '}
                  <span className="bg-accent text-transparent bg-clip-text">تُبنى على مقاس نشاطك.</span>
                </>
              )}
            </h1>
            <p className="text-muted max-w-2xl text-[15px] leading-relaxed">
              {t(
                'نبني نظاماً محاسبياً يناسب نشاطك بالضبط: فواتير وسندات، جرد ومخازن، تقارير وعملات وصلاحيات — بلا اشتراك سنوي ولا وحدات لا تحتاجها. وعند الطلب نربطه ببوت تيليجرام يجيب عن أرصدة العملاء ويستقبل الطلبات.',
                'We build an accounting system that fits your business exactly: invoices and vouchers, inventory, reports, currencies and roles — no yearly subscription, no modules you will never open. On request, we link it to a Telegram bot that answers customer balances and takes orders.',
              )}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-11 px-6">
                <MessageCircle className="size-4" aria-hidden="true" />
                {t('اطلب عرض سعر', 'Request a quote')}
              </a>
              <Link to="/shop" className="btn btn-ghost h-11 px-6">
                {t('تصفح المتجر', 'Browse the store')}
              </Link>
            </div>

            {/* Facts strip: honest, sourced, tabular. */}
            <dl className="border-app grid grid-cols-3 gap-3 border-t pt-5">
              {[
                { k: t('نظام واحد لكل نشاط', 'One system per business'), v: t('مخصص بالكامل', 'Fully bespoke') },
                { k: t('يعمل على', 'Runs on'), v: 'Windows · Android' },
                { k: t('مرافقة بعد التسليم', 'Post-delivery'), v: t('شهر كامل', 'One month') },
              ].map((s) => (
                <div key={s.k} className="min-w-0">
                  <dt className="text-subtle text-[11px] font-medium">{s.k}</dt>
                  <dd className="text-app mt-1 truncate text-sm font-black" dir="auto">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Reveal>

      {/* Modules — what actually gets built. */}
      <section className="flex flex-col gap-5">
        <Reveal>
          <SectionHeading
            eyebrow={t('ما داخل النظام', 'Inside the system')}
            title={t('وحدات تُختار حسب حاجتك', 'Modules you pick, not buy')}
            description={t(
              'كل وظيفة أدناه تُبنى وتُسلَّم وتُجرَّب وقت الطلب — لا نثبّت في نظامك إلا ما يحتاجه نشاطك فعلًا.',
              'Each capability below is built, delivered and accepted on request — only what your business actually needs is installed.',
            )}
          />
        </Reveal>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, titleEn, body, bodyEn }, i) => (
            <Reveal key={titleEn} delay={Math.min(i * 0.05, 0.25)} className="h-full">
              <div className="bg-elevated shadow-app card-lift hover-ring group flex h-full flex-col gap-3 rounded-2xl border border-app p-5">
                <span className="bg-accent-soft text-accent grid size-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-app text-[15px] font-bold">{t(title, titleEn)}</h3>
                  <p className="text-muted mt-1.5 text-[13px] leading-relaxed">{t(body, bodyEn)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Flow — how an order actually works. */}
      <section className="flex flex-col gap-5">
        <Reveal>
          <SectionHeading
            eyebrow={t('كيف نعمل', 'How it works')}
            title={t('من الجلسة الأولى إلى التسليم', 'From first call to handover')}
          />
        </Reveal>
        <div className="grid gap-3.5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, titleEn, body, bodyEn }, i) => (
            <Reveal key={titleEn} delay={Math.min(i * 0.06, 0.2)} className="h-full">
              <div className="border-app bg-elevated shadow-app relative h-full rounded-2xl border p-5">
                <span className="text-subtle absolute end-4 top-4 font-mono text-[11px] font-bold" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="bg-accent-soft text-accent grid size-11 place-items-center rounded-2xl">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-app mt-3 text-[15px] font-bold">{t(title, titleEn)}</h3>
                <p className="text-muted mt-1.5 text-[13px] leading-relaxed">{t(body, bodyEn)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The one differentiator worth a band: the Telegram link. */}
      <Reveal>
        <section
          className="relative overflow-hidden rounded-panel p-7 text-white sm:p-9"
          style={{ background: 'linear-gradient(135deg, #0f1023, #2a2366)' }}
        >
          <span
            aria-hidden="true"
            className="absolute -top-10 -start-10 size-40 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #6d5cff, transparent)' }}
          />
          <span
            aria-hidden="true"
            className="absolute -end-8 -bottom-12 size-40 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #00c9a7, transparent)' }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-xl font-black sm:text-2xl">
                {t('فواتيرك… على تيليجرام', 'Your books… on Telegram')}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
                {t(
                  'خيار لا يقدّمه معظم من يبنون الأنظمة: بوت يرسل لك تقرير اليوم مساءً كل يوم، ويجيب عن كشف حساب أي عميل بمجرد السؤال عنه.',
                  'An option most builders do not offer: a bot that sends you the day-end report every evening, and answers any customer statement the moment you ask for it.',
                )}
              </p>
            </div>
            <Link
              to="/shop"
              className="press shadow-app-accent bg-accent text-accent-fg inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-black"
            >
              {t('شاهد البوتات الجاهزة', 'See the ready bots')}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #6d5cff, transparent)' }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </section>
      </Reveal>

      {/* Honest note — staged payment, and what is NOT promised. */}
      <Reveal>
        <aside className="bg-sunken rounded-2xl border border-app p-5">
          <p className="text-muted text-[13px] leading-relaxed">
            <span className="text-app font-bold">{t('ملاحظة صريحة: ', 'Fair warning: ')}</span>
            {t(
              'تسعير النظام يعتمد على حجم النشاط وطبيعته. الدفع على مراحل مربوطة بتسليم كل مرحلة — لا دفعة مسبقة كاملة ولا وعود بـ«نفّذناه خلال أسبوع» — فكل مرحلة تُجرَّب قبل الانتقال إلى التي بعدها.',
              'Pricing depends on the size and nature of the business. Payment is staged against the delivery of each stage — no full prepayment, no “done in a week” promises — every stage is tested before we move to the next.',
            )}
          </p>
        </aside>
      </Reveal>
    </div>
  )
}
