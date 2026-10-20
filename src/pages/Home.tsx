import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Gift, ShoppingBag } from 'lucide-react'
import { allPosts, categories, categoryLabel, postsFor, type Category } from '@/data/posts'
import { primaryDownload as primaryOf, programs } from '@/data/programs'
import { hubLinks, site, tiktok } from '@/lib/site'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'
import { SplitAccent } from '@/components/ui/SplitReveal'
import { Marquee } from '@/components/ui/Marquee'
import { PostCard } from '@/components/blog/PostCard'
import { ProgramCard } from '@/components/programs/ProgramCard'
import { StoreTeaser } from '@/components/store/organisms/StoreTeaser'
import { OpeningOffer } from '@/components/store/organisms/OpeningOffer'
import { useCatalog } from '@/lib/store'
import { InteractiveStudioVisualizer } from '@/components/home/InteractiveStudioVisualizer'
import { Magnetic } from '@/components/ui/Interactive'

/* ------------------------------------------------------------------ *
 * Home — Swiss International Typographic Style (phase 1 redesign).
 *
 * A typographic index of a software studio, not a dashboard. Hierarchy
 * is carried by an Archivo grotesque at real scale, a strict column
 * grid, and 1px hairline rules — never by cards, glass, or gradients.
 * One flat violet accent. All figures are read from real data.
 * ------------------------------------------------------------------ */

/** A rule that draws across in the reading direction, origin at the start edge. */
function DrawRule({ delay = 0, className }: { delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      aria-hidden="true"
      className={cn('swiss-rule h-px w-full origin-[left] rtl:origin-[right]', className)}
      style={{ background: 'var(--line-strong)' }}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}

/** Shared section head: hairline, a tracked label, the display heading, and an
 *  optional directory link — the Swiss rhythm that opens every block. */
function SectionHead({
  label,
  title,
  sub,
  to,
  linkText,
}: {
  label: string
  title: string
  sub?: string
  to?: string
  linkText?: string
}) {
  return (
    <div className="mb-8">
      <DrawRule />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <span className="swiss-label text-subtle block">{label}</span>
          <h2 className="swiss-display text-app mt-2 text-2xl leading-[1.05] sm:text-3xl">{title}</h2>
          {sub ? <p className="text-muted mt-2 max-w-[48ch] text-sm leading-relaxed">{sub}</p> : null}
        </div>
        {to && linkText ? (
          <Link
            to={to}
            className="swiss-label text-app group hover:text-accent inline-flex shrink-0 items-center gap-2 pb-1 transition-colors"
          >
            {linkText}
            <ArrowLeft className="size-3.5 transition-transform duration-200 ltr:rotate-180 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Masthead — the first viewport. A nameplate bar, one very large
 * typographic statement of the offer, two flat actions, and a Swiss
 * data index of the four real figures opposite the headline.
 * ------------------------------------------------------------------ */

type IndexEntry = { label: string; value: ReactNode; to: string; external?: boolean }

/** A figure that ticks up from zero when it scrolls into view — the index's
 *  one interactive flourish. Non-numeric values (a placeholder dash) render
 *  as-is, and reduced-motion jumps straight to the final number. */
function CountUp({ to }: { to: number }) {
  const reduce = useReducedMotion()
  // Seed with the final value so the figure is always correct even if the
  // animation never runs (reduced motion, JS slow, off-screen capture); the
  // tick-up plays on mount rather than on scroll, so it is never stuck at 0.
  const [val, setVal] = useState(to)

  useEffect(() => {
    if (reduce) {
      setVal(to)
      return
    }
    const controls = animate(0, to, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    })
    return () => controls.stop()
  }, [to, reduce])

  return <span>{val.toLocaleString('en-US')}</span>
}

function DataIndex({ entries }: { entries: IndexEntry[] }) {
  const reduce = useReducedMotion()
  return (
    <ul className="w-full">
      {entries.map((e, i) => {
        const inner = (
          <>
            <span className="swiss-label text-subtle">{e.label}</span>
            <span className="swiss-figure text-app text-4xl leading-none sm:text-5xl" dir="auto">
              {typeof e.value === 'number' ? <CountUp to={e.value} /> : e.value}
            </span>
          </>
        )
        const rowCls =
          'swiss-index-row flex items-end justify-between gap-4 py-4 text-app hover:text-accent'
        return (
          <motion.li
            key={i}
            className="border-t border-app last:border-b"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {e.external ? (
              <a href={e.to} target="_blank" rel="noopener noreferrer nofollow" className={rowCls}>
                {inner}
              </a>
            ) : (
              <Link to={e.to} className={rowCls}>
                {inner}
              </Link>
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}

function Masthead() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const { catalog } = useCatalog()
  const botCount = catalog?.products.filter(
    (p) => p.category === 'types' || (p.category === 'bots' && !p.monthly),
  ).length
  const trialLink = catalog ? `https://t.me/${catalog.bot}?start=trial` : '/shop'

  const entries: IndexEntry[] = [
    { label: t('أنواع بوتات جاهزة', 'Ready bot types'), value: botCount ?? '—', to: '/shop' },
    { label: t('برامج منشورة', 'Published apps'), value: programs.length, to: '/programs' },
    { label: t('مقالات تقنية', 'Technical articles'), value: allPosts.length, to: '/blog' },
    {
      label: t('متابع على تيك توك', 'TikTok followers'),
      value: tiktok.stats.followers,
      to: tiktok.profile,
      external: true,
    },
  ]

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
        }

  return (
    <section aria-labelledby="hero-title" className="relative isolate">
      {/* Nameplate bar. */}
      <DrawRule />
      <motion.div
        className="flex items-center justify-between gap-4 py-3"
        initial={reduce ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span className="swiss-label text-app inline-flex items-center gap-2.5 rounded-full border border-app bg-elevated/80 px-3 py-1 shadow-xs backdrop-blur-md">
          <span className="relative flex size-2">
            <span
              className="absolute inline-flex size-full animate-ping rounded-full opacity-70 motion-reduce:animate-none"
              style={{ background: 'var(--swiss-accent)' }}
            />
            <span className="relative inline-flex size-2 rounded-full" style={{ background: 'var(--swiss-accent)' }} />
          </span>
          <span className="font-bold tracking-wider">ZEIDEXSOFT</span>
          <span className="text-subtle text-[10px]">·</span>
          <span className="text-subtle text-[10px] font-normal">{t('المنصة الرسمية', 'official platform')}</span>
        </span>
        <span className="swiss-label text-subtle text-[11px] font-mono tracking-wider">{t('إصدار 2026', 'V2026')}</span>
      </motion.div>
      <DrawRule delay={0.08} />

      {/* Headline + index. */}
      <div className="grid items-start gap-x-10 gap-y-10 pt-8 lg:grid-cols-12 lg:pt-10">
        <div className="lg:col-span-7">
          <motion.p className="swiss-label text-subtle flex items-center gap-2.5" {...rise(0.2)}>
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: 'var(--swiss-accent)' }}
              aria-hidden="true"
            />
            {t('استوديو برمجة', 'Software studio')}
          </motion.p>
          <SplitAccent
            as="h1"
            id="hero-title"
            className="swiss-headline swiss-display text-app"
            lead={t('نبني بوتات تيليجرام وبرمجيات ', 'We build Telegram bots & software ')}
            accent={t('تُشغِّل عملك.', 'that run your business.')}
            accentClassName="swiss-accent-text"
          />

          <motion.p className="text-muted mt-7 max-w-[50ch] text-base leading-relaxed sm:text-lg" {...rise(0.3)}>
            {t(
              'متاجر رقمية، إدارة مجموعات، خدمة عملاء، حجوزات واشتراكات — بدفع بالنجوم أو الكريمي. جرّب بوتك الكامل بكل المميزات قبل أن تدفع.',
              'Digital stores, group management, support, bookings and subscriptions — paid in Stars or via Kuraimi. Try your full bot, every feature, before you pay.',
            )}
          </motion.p>

          <motion.div className="mt-9 flex flex-wrap gap-3" {...rise(0.4)}>
            <Magnetic strength={0.2}>
              <Link to="/shop" className="btn btn-primary group h-11 px-6 shadow-app-sm hover:shadow-app-md transition-shadow">
                <ShoppingBag className="size-4 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span>{t('تصفح البوتات', 'Browse bots')}</span>
              </Link>
            </Magnetic>
            <Magnetic strength={0.15}>
              <a href={trialLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost group h-11 px-6">
                <Gift className="size-4 transition-transform group-hover:rotate-12" aria-hidden="true" />
                <span>{t('بوت متجر مجاني لمدة شهر', 'A free store bot for a month')}</span>
              </a>
            </Magnetic>
          </motion.div>

          <motion.div className="mt-8 flex flex-wrap items-center gap-3 text-xs" {...rise(0.48)}>
            <a
              href={tiktok.profile}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-full border border-app bg-elevated/90 px-3.5 py-1.5 font-medium transition-all duration-200 hover:border-accent hover:shadow-xs hover:text-app"
            >
              <span className="size-2 rounded-full bg-[#fe2c55] animate-pulse" />
              <span className="text-muted">{t('تيك توك الرسمي', 'Official TikTok')}:</span>
              <span className="font-mono font-bold text-app" dir="ltr">{site.handle}</span>
            </a>
            <Link
              to="/links"
              className="inline-flex items-center gap-1.5 rounded-full border border-app bg-elevated/90 px-3.5 py-1.5 font-medium transition-all duration-200 hover:border-accent hover:shadow-xs hover:text-app"
            >
              <span className="text-accent">🔗</span>
              <span className="text-app font-semibold">{t('مركز الروابط والبايو', 'Link Hub & Bio')}</span>
              <span className="font-mono text-muted text-[11px]">({hubLinks.length} {t('روابط', 'links')})</span>
            </Link>
          </motion.div>
        </div>

        <div className="lg:col-span-5 lg:ps-10 lg:border-s lg:border-app flex flex-col gap-8">
          <InteractiveStudioVisualizer />
          <div>
            <span className="swiss-label text-subtle mb-1 block">{t('الفهرس', 'The index')}</span>
            <DataIndex entries={entries} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Start here — a numbered directory of the four things a first visitor
 * should do, re-formed from the old tabbed "spotlight". The step
 * numbers carry the sequence; the detail sits in one typographic panel,
 * not a glass card.
 * ------------------------------------------------------------------ */

type Step = { kicker: string; title: string; body: string; cta: string; href: string; external?: boolean }

function StartHere() {
  const { lang, t } = useI18n()
  const latest = postsFor(lang)[0]
  const program = programs[0]

  const steps: Step[] = [
    {
      kicker: t('اقرأ أحدث مقال', 'Read the latest article'),
      title: latest.title,
      body: latest.excerpt,
      cta: t('اقرأ المقال', 'Read article'),
      href: `/blog/${latest.slug}`,
    },
    ...(program
      ? [
          {
            kicker: t('حمّل برنامجاً مجانياً', 'Download a free program'),
            title: t(program.name, program.nameEn),
            body: t(program.tagline, program.taglineEn),
            cta: t(`تحميل · ${primaryOf(program).size}`, `Download · ${primaryOf(program).size}`),
            href: primaryOf(program).href,
            external: true,
          },
        ]
      : []),
    {
      kicker: t('كل الروابط في مكان واحد', 'Every link in one place'),
      title: t('صفحة الروابط', 'The links page'),
      body: t(
        'حساباتي، البث المباشر، المدونة، وطرق التواصل — في شبكة واحدة مع نسخ ومشاركة بنقرة.',
        'My accounts, live streams, the blog, and ways to reach me — one grid, with one-tap copy and share.',
      ),
      cta: t('افتح الروابط', 'Open links'),
      href: '/links',
    },
    {
      kicker: t('تابعني على تيك توك', 'Follow me on TikTok'),
      title: site.handle,
      body: t(
        'كل فيديو جديد ينزل هناك أولاً — والمقالات هنا هي نسخته المكتوبة.',
        'Every new video lands there first — the articles here are the written version.',
      ),
      cta: t('افتح تيك توك', 'Open TikTok'),
      href: tiktok.profile,
      external: true,
    },
  ]

  const [active, setActive] = useState(0)
  const step = steps[active]!

  return (
    <section aria-labelledby="start-here">
      <SectionHead
        label={t('ابدأ من هنا', 'Start here')}
        title={t('أربع خطوات، بالترتيب', 'Four moves, in order')}
      />
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
        {/* The numbered list of steps. */}
        <ul role="tablist" aria-orientation="vertical" className="lg:col-span-5">
          {steps.map((s, i) => {
            const on = i === active
            return (
              <li key={s.kicker} className="border-t border-app last:border-b">
                <button
                  type="button"
                  role="tab"
                  id={`step-tab-${i}`}
                  aria-selected={on}
                  aria-controls="step-panel"
                  onClick={() => setActive(i)}
                  className={cn(
                    'swiss-index-row flex w-full cursor-pointer items-baseline gap-4 py-4 text-start transition-all duration-200',
                    on ? 'text-app ps-2 border-s-2 border-accent' : 'text-muted hover:text-app hover:ps-1',
                  )}
                >
                  <span
                    className={cn(
                      'swiss-figure w-8 shrink-0 text-xl tabular-nums transition-colors',
                      on ? 'text-accent' : 'text-subtle',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[15px] leading-snug font-semibold">{s.kicker}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* The detail panel. */}
        <div
          id="step-panel"
          role="tabpanel"
          aria-labelledby={`step-tab-${active}`}
          className="lg:col-span-7 lg:ps-10 lg:border-s lg:border-app"
        >
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="swiss-figure text-subtle block text-6xl leading-none sm:text-7xl">
              {String(active + 1).padStart(2, '0')}
            </span>
            <h3 className="swiss-display text-app mt-5 text-xl leading-snug font-bold sm:text-2xl" dir="auto">
              {step.title}
            </h3>
            <p className="text-muted mt-3 max-w-[56ch] text-sm leading-relaxed sm:text-base">{step.body}</p>
            {step.external ? (
              <a
                href={step.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-app hover:text-accent group mt-6 inline-flex items-center gap-2 text-sm font-bold"
              >
                {step.cta}
                <ArrowLeft className="size-4 transition-transform duration-200 ltr:rotate-180 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
              </a>
            ) : (
              <Link
                to={step.href}
                className="text-app hover:text-accent group mt-6 inline-flex items-center gap-2 text-sm font-bold"
              >
                {step.cta}
                <ArrowLeft className="size-4 transition-transform duration-200 ltr:rotate-180 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Articles() {
  const { lang, t } = useI18n()
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const list = postsFor(lang)
    .filter((p) => filter === 'all' || p.category === filter)
    .slice(0, 6)

  return (
    <section aria-labelledby="home-articles">
      <div className="mb-8">
        <DrawRule />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <span className="swiss-label text-subtle block">{t('المدونة', 'The blog')}</span>
            <h2 id="home-articles" className="swiss-display text-app mt-2 text-2xl leading-[1.05] sm:text-3xl">
              {t('المقالات', 'Articles')}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <label className="text-muted relative flex items-center text-sm">
              <span className="sr-only">{t('تصفية حسب القسم', 'Filter by category')}</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Category | 'all')}
                className="hover:text-app swiss-label cursor-pointer appearance-none bg-transparent pe-5 outline-none"
              >
                <option value="all">{t('الأحدث', 'Latest')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c, lang)}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute end-0 size-4" fill="none" aria-hidden="true">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
            <Link
              to="/blog"
              className="swiss-label text-app group hover:text-accent inline-flex shrink-0 items-center gap-2 transition-colors"
            >
              {t('عرض الكل', 'View all')}
              <ArrowLeft className="size-3.5 transition-transform duration-200 ltr:rotate-180 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {list.length ? (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-muted border-app rounded-card border border-dashed py-12 text-center text-sm">
          {t('لا مقالات في هذا القسم بعد.', 'No articles in this category yet.')}
        </p>
      )}
    </section>
  )
}

export default function Home() {
  const { t } = useI18n()

  useEffect(() => {
    document.title = t(site.title, site.titleEn)
  }, [t])

  return (
    <div className="swiss container-app flex flex-col gap-14 py-8 sm:gap-16 lg:gap-20 lg:py-10">
      <OpeningOffer />
      <Masthead />

      {/* Marquee ticker of platform strengths inspired by Landing.love */}
      <div className="py-2">
        <DrawRule />
        <Marquee speed={34} className="py-2.5" gap="1rem">
          <span className="flex items-center gap-2 rounded-full border border-app bg-elevated/70 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xs backdrop-blur-md transition-colors hover:border-accent/40">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-xs animate-pulse motion-reduce:animate-none" />
            <span className="text-app font-bold">{t('تسليم فوري وتلقائي', 'Instant Delivery')}</span>
            <span className="text-subtle">·</span>
            <span className="text-muted">{t('بالنجوم والكريمي', 'Stars & Kuraimi')}</span>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-app bg-elevated/70 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xs backdrop-blur-md transition-colors hover:border-accent/40">
            <span className="size-1.5 rounded-full bg-violet-500 shadow-xs" />
            <span className="text-app font-bold">{t('صفر تبعيات تشغيلية', 'Zero Dependencies')}</span>
            <span className="text-subtle">·</span>
            <span className="text-muted">{t('أداء خاطف واستضافة سحابية', 'Blazing speed & cloud hosting')}</span>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-app bg-elevated/70 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xs backdrop-blur-md transition-colors hover:border-accent/40">
            <span className="size-1.5 rounded-full bg-cyan-500 shadow-xs" />
            <span className="text-app font-bold">{t('تجربة مجانية كاملة', 'Full 7-Day Free Trial')}</span>
            <span className="text-subtle">·</span>
            <span className="text-muted">{t('لكل باقات المتاجر', 'For all store packages')}</span>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-app bg-elevated/70 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xs backdrop-blur-md transition-colors hover:border-accent/40">
            <span className="size-1.5 rounded-full bg-rose-500 shadow-xs" />
            <span className="text-app font-bold">{t('8 قوالب متاجر حية', '8 Live Store Templates')}</span>
            <span className="text-subtle">·</span>
            <span className="text-muted">{t('معاينة فورية قبل الشراء', 'Live preview before purchase')}</span>
          </span>
          <span className="flex items-center gap-2 rounded-full border border-app bg-elevated/70 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shadow-xs backdrop-blur-md transition-colors hover:border-accent/40">
            <span className="size-1.5 rounded-full bg-amber-500 shadow-xs" />
            <span className="text-app font-bold">{t('لوحة تحكم TMA متكاملة', 'TMA Dashboard')}</span>
            <span className="text-subtle">·</span>
            <span className="text-muted">{t('إدارة مركزية للبوتات والعملاء', 'Central management')}</span>
          </span>
        </Marquee>
        <DrawRule delay={0.06} />
      </div>

      <Reveal delay={0.06}>
        <section aria-label={t('المتجر', 'The store')}>
          <SectionHead
            label={t('المتجر', 'The store')}
            title={t('اختر بوتك، جاهز للتشغيل', 'Pick your bot, ready to run')}
            to="/shop"
            linkText={t('كل البوتات', 'All bots')}
          />
          <StoreTeaser />
        </section>
      </Reveal>

      <StartHere />

      <Articles />

      {programs.length ? (
        <section aria-labelledby="home-programs">
          <SectionHead
            label={t('التحميلات', 'Downloads')}
            title={t('البرامج', 'Programs')}
            sub={t('كل برنامج موثّق بمقال مستقل.', 'Every program documented in its own article.')}
            to="/programs"
            linkText={t('كل البرامج', 'All programs')}
          />
          <div className="grid gap-3">
            {programs.slice(0, 3).map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.06}>
                <ProgramCard program={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
