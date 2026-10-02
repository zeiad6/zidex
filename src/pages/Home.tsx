import { useEffect, useState } from 'react'
import { ShineBorder } from '@/components/ui/Decor'
import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Check, Download, FileText, LayoutGrid, Package, UserPlus, type LucideIcon } from 'lucide-react'
import { allPosts, categories, categoryLabel, postsFor, type Category } from '@/data/posts'
import { primaryDownload as primaryOf, programs } from '@/data/programs'
import { site, tiktok } from '@/lib/site'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'
import { PostCard } from '@/components/blog/PostCard'
import { ProgramCard } from '@/components/programs/ProgramCard'

/* ------------------------------------------------------------------ *
 * Home dashboard, after the "Bloggo" Dribbble shot: serif greeting, a
 * stepped "spotlight" card, three quick actions, then the content grids.
 * ------------------------------------------------------------------ */

function Illustration({ glyph, image }: { glyph: GlyphName; image?: string }) {
  const reduce = useReducedMotion()
  if (image) {
    return (
      <motion.div
        key={image}
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden="true"
        className="relative h-44 overflow-hidden rounded-2xl sm:h-48"
      >
        <img src={image} alt="" className="size-full object-cover" loading="lazy" />
      </motion.div>
    )
  }
  return (
    <div aria-hidden="true" className="bg-ghost-400 relative h-44 overflow-hidden rounded-2xl sm:h-48">
      <div className="dark:bg-ink-800 absolute start-[12%] top-0 w-[58%] rounded-b-xl bg-white p-3 shadow-lg">
        {[72, 56, 64].map((w) => (
          <div key={w} className="flex items-center gap-2 py-1">
            <span className="grid size-4 shrink-0 place-items-center rounded bg-emerald-500 text-white">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span className="bg-ink-200 dark:bg-ink-600 h-1.5 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
      <motion.div
        key={glyph}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="ring-ghost-300/70 dark:bg-ink-800 absolute end-[9%] bottom-[11%] w-[64%] rounded-xl bg-white p-3 shadow-xl ring-4"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="h-2 w-2/5 rounded-full bg-amber-400" />
          <Glyph name={glyph} size={22} className="text-tiktok-600" />
        </div>
        <div className="bg-ink-200 dark:bg-ink-600 mt-2.5 h-1.5 w-4/5 rounded-full" />
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <span key={i} className="bg-ink-200 dark:bg-ink-600 h-1.5 w-1/4 rounded-full" />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

type Spot = {
  step: string
  title: string
  body: string
  glyph: GlyphName
  cta: string
  href: string
  external?: boolean
}

function Spotlight() {
  const { lang, t } = useI18n()
  const latest = postsFor(lang)[0]
  const program = programs[0]

  const spots: Spot[] = [
    {
      step: t('اقرأ أحدث مقال', 'Read the latest article'),
      title: latest.title,
      body: latest.excerpt,
      glyph: latest.cover as GlyphName,
      cta: t('اقرأ المقال', 'Read article'),
      href: `/blog/${latest.slug}`,
    },
    ...(program
      ? [
          {
            step: t('حمّل برنامجاً مجانياً', 'Download a free program'),
            title: t(program.name, program.nameEn),
            body: t(program.tagline, program.taglineEn),
            glyph: program.glyph,
            cta: t(`تحميل · ${primaryOf(program).size}`, `Download · ${primaryOf(program).size}`),
            href: primaryOf(program).href,
            external: true,
          },
        ]
      : []),
    {
      step: t('كل الروابط في مكان واحد', 'Every link in one place'),
      title: t('صفحة الروابط', 'The links page'),
      body: t(
        'حساباتي، البث المباشر، المدونة، وطرق التواصل — في شبكة واحدة مع نسخ ومشاركة بنقرة.',
        'My accounts, live streams, the blog, and ways to reach me — one grid, with one-tap copy and share.',
      ),
      glyph: 'compass',
      cta: t('افتح الروابط', 'Open links'),
      href: '/links',
    },
    {
      step: t('تابعني على تيك توك', 'Follow me on TikTok'),
      title: site.handle,
      body: t(
        'كل فيديو جديد ينزل هناك أولاً — والمقالات هنا هي نسخته المكتوبة.',
        'Every new video lands there first — the articles here are the written version.',
      ),
      glyph: 'tiktok',
      cta: t('افتح تيك توك', 'Open TikTok'),
      href: tiktok.profile,
      external: true,
    },
  ]

  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]))
  const spot = spots[active]!

  const select = (i: number) => {
    setActive(i)
    setSeen((s) => new Set(s).add(i))
  }

  return (
    <ShineBorder className="rounded-2xl border border-app">
      <section aria-label={t('ابدأ من هنا', 'Start here')}>
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]">
        <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1 p-3 sm:p-4">
          {spots.map((s, i) => {
            const on = i === active
            const done = seen.has(i) && !on
            return (
              <button
                key={s.step}
                type="button"
                role="tab"
                id={`spot-tab-${i}`}
                aria-selected={on}
                aria-controls="spot-panel"
                onClick={() => select(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-start text-[15px] transition-colors',
                  on ? 'bg-accent-soft text-app font-semibold' : 'text-muted hover:bg-sunken/70',
                )}
              >
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border text-sm font-medium',
                    on ? 'border-accent text-accent' : done ? 'border-ghost-300 text-accent' : 'border-app text-subtle',
                  )}
                >
                  {done ? <Glyph name="check" size={14} strokeWidth={2.6} aria-hidden="true" /> : i + 1}
                </span>
                {s.step}
              </button>
            )
          })}
        </div>

        <div
          id="spot-panel"
          role="tabpanel"
          aria-labelledby={`spot-tab-${active}`}
          className="bg-ink-50 grid items-center gap-6 border-t border-app p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:p-7 lg:border-t-0 lg:border-s dark:bg-white/[0.02]"
        >
          <Illustration glyph={spot.glyph} />
          <div className="min-w-0">
            <h2 className="text-app line-clamp-2 text-lg leading-snug font-semibold sm:text-xl">{spot.title}</h2>
            <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{spot.body}</p>
            {spot.external ? (
              <a href={spot.href} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-primary mt-5 h-10 cursor-pointer px-5">
                {spot.href.includes('mediafire') ? <Download className="size-4" aria-hidden="true" /> : null}
                {spot.cta}
              </a>
            ) : (
              <Link to={spot.href} className="btn btn-primary mt-5 h-10 cursor-pointer px-5">
                {spot.cta}
              </Link>
            )}
          </div>
        </div>
      </div>
      </section>
    </ShineBorder>
  )
}

/**
 * Zidex KPI row: icon tile + badge on top, label, big figure, and a footer
 * (mini bars or a segment meter). Every number is read off the site's own
 * data — the template's balances and campaign counts have no equivalent here.
 */
function QuickActions() {
  const { lang, t } = useI18n()
  const perCategory = categories.map((c) => allPosts.filter((p) => p.category === c).length)
  const maxCat = Math.max(...perCategory, 1)
  const latest = postsFor(lang)[0]
  const windows = programs.filter((p) => p.kind === 'windows').length
  const android = programs.filter((p) => p.kind === 'android').length

  const cards: {
    to: string
    icon: LucideIcon
    tile: string
    badge: string
    badgeTone: string
    label: string
    value: number
    unit: string
    foot: React.ReactNode
  }[] = [
    {
      to: '/blog',
      icon: FileText,
      tile: 'bg-orange-50 text-orange-500 dark:bg-orange-400/10',
      badge: t('أحدثها', 'Latest'),
      badgeTone: 'bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300',
      label: t('مقالات منشورة', 'Published articles'),
      value: allPosts.length,
      unit: t('مقال', 'posts'),
      foot: <span className="text-subtle block truncate text-[11px] font-bold">{latest?.title}</span>,
    },
    {
      to: '/programs',
      icon: Package,
      tile: 'bg-ghost-50 text-ghost-500 dark:bg-ghost-400/10 dark:text-ghost-300',
      badge: t('مجاني', 'Free'),
      badgeTone: 'bg-ghost-50 text-ghost-600 dark:bg-ghost-400/10 dark:text-ghost-300',
      label: t('برامج جاهزة للتحميل', 'Programs to download'),
      value: programs.length,
      unit: t('برنامج', 'apps'),
      foot: (
        <span className="text-subtle block text-[11px] font-bold">
          {t(`ويندوز ${windows} · أندرويد ${android}`, `Windows ${windows} · Android ${android}`)}
        </span>
      ),
    },
    {
      to: '/blog',
      icon: LayoutGrid,
      tile: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-400/10',
      badge: t(`${categories.length} أقسام`, `${categories.length} sections`),
      badgeTone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
      label: t('توزيع المقالات', 'Articles by section'),
      value: categories.length,
      unit: t('قسم', 'sections'),
      foot: (
        <span className="flex h-6 items-end gap-[3px]" aria-hidden="true">
          {perCategory.map((n, i) => (
            <span
              key={i}
              className="from-ghost-500 to-veil-500 flex-1 rounded-sm bg-linear-to-t"
              style={{ height: `${Math.max(12, (n / maxCat) * 100)}%` }}
            />
          ))}
        </span>
      ),
    },
    {
      to: '/links',
      icon: UserPlus,
      tile: 'bg-sky-50 text-sky-500 dark:bg-sky-400/10',
      badge: site.handle,
      badgeTone: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300',
      label: t('متابع على تيك توك', 'TikTok followers'),
      value: tiktok.stats.followers,
      unit: t('متابع', 'followers'),
      foot: (
        <span className="flex gap-1.5" aria-hidden="true">
          {[1, 0.7, 0.4, 0.15].map((o) => (
            <span key={o} className="bg-ghost-500 h-2 flex-1 rounded-full" style={{ opacity: o }} />
          ))}
        </span>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ to, icon: Icon, tile, badge, badgeTone, label, value, unit, foot }, i) => (
        <Link
          key={i}
          to={to}
          className="border-app bg-elevated shadow-app hover:shadow-app-lg rounded-card flex flex-col border p-5 transition-shadow duration-300"
        >
          <span className="flex items-start justify-between gap-2">
            <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', tile)}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className={cn('truncate rounded-full px-2 py-1 text-[11px] font-black', badgeTone)} dir="auto">
              {badge}
            </span>
          </span>
          <span className="text-subtle mt-3 text-[12px] font-bold">{label}</span>
          <span className="text-app mt-0.5 text-2xl font-black">
            {value} <span className="text-subtle text-sm font-bold">{unit}</span>
          </span>
          <span className="mt-2">{foot}</span>
        </Link>
      ))}
    </div>
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
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div>
          <h2 id="home-articles" className="text-app text-[17px] font-black">
            {t('المقالات', 'Articles')}
          </h2>
          <p className="text-subtle mt-0.5 text-[12px]">
            {t('أدق التفاصيل، بلا حشو', 'The detail, without the filler')}
          </p>
        </div>
        <span className="bg-line h-5 w-px" aria-hidden="true" />
        <label className="text-muted relative flex items-center text-sm">
          <span className="sr-only">{t('تصفية حسب القسم', 'Filter by category')}</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Category | 'all')}
            className="hover:text-app cursor-pointer appearance-none bg-transparent pe-5 outline-none"
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
        <Link to="/blog" className="text-accent group ms-auto flex items-center gap-1 text-sm font-medium">
          {t('عرض الكل', 'View all')}
          <ArrowLeft className="size-3.5 transition-transform rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>

      {list.length ? (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-muted rounded-2xl border border-dashed border-app py-12 text-center text-sm">
          {t('لا مقالات في هذا القسم بعد.', 'No articles in this category yet.')}
        </p>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Hero. A dark gradient panel with a fine grid over it, two blurred
 * colour blobs, and a column of floating fact cards.
 *
 * The fact cards carry real figures only. The reference this is drawn
 * from filled its equivalents with a bank balance, a boarding pass and
 * a testimonial; a personal hub has none of those, and inventing them
 * would be the one thing the rest of the site never does.
 * ------------------------------------------------------------------ */

function HeroFact({
  label,
  value,
  sub,
  bars,
  delay,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  /** Relative weights for the mini bar. Lengths, not invented trends. */
  bars?: number[]
  delay: number
}) {
  const reduce = useReducedMotion()
  const max = bars?.length ? Math.max(...bars) : 1

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-3xl border p-4',
        'border-white/15 bg-white/10 backdrop-blur-xl',
        !reduce && 'motion-safe:animate-[floaty_6s_ease-in-out_infinite]',
      )}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      <p className="text-[11px] font-bold text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      {sub ? <p className="mt-1 text-[11px] leading-relaxed text-white/50">{sub}</p> : null}
      {bars?.length ? (
        <div className="mt-3 flex h-9 items-end gap-0.5" aria-hidden="true">
          {bars.map((b, i) => (
            <motion.span
              key={i}
              initial={reduce ? false : { height: 0 }}
              animate={{ height: `${Math.max(8, (b / max) * 100)}%` }}
              transition={{ duration: 0.6, delay: delay + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 rounded-full bg-gradient-to-t from-ghost-400 to-veil-500"
            />
          ))}
        </div>
      ) : null}
    </motion.div>
  )
}

function Hero() {
  const { lang, t } = useI18n()

  // Real distribution: how the articles actually split across the five
  // sections, read off the index rather than typed in.
  const spread = categories
    .map((c) => allPosts.filter((p) => p.category === c).length)
    .sort((a, b) => b - a)

  const longest = allPosts.reduce(
    (acc, p) => (p.readMinutes > acc ? p.readMinutes : acc),
    0,
  )

  return (
    <section
      aria-labelledby="hero-title"
      className="grid-bg relative overflow-hidden rounded-panel p-6 sm:p-9"
      style={{
        background: 'linear-gradient(135deg, #0f1023 0%, #1e1b4b 55%, #31247a 100%)',
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-24 left-1/4 size-96 rounded-full opacity-45 blur-[100px]"
        style={{ background: '#6d5cff' }}
      />
      <span
        aria-hidden="true"
        className="absolute -right-16 -bottom-24 size-72 rounded-full opacity-35 blur-[90px]"
        style={{ background: '#00c9a7' }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white/85">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-veil-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-veil-300" />
            </span>
            {t(`${site.handle} · الحساب الرسمي`, `${site.handle} · the official account`)}
          </span>

          <h1
            id="hero-title"
            className="mt-5 text-3xl leading-[1.25] font-black text-white lg:text-[2.75rem]"
          >
            {t('كل ما أنشره', 'Everything I publish')}{' '}
            <span
              className="gradient-text"
              style={{ WebkitTextFillColor: 'transparent' }}
            >
              {t('في مكان واحد', 'in one place')}
            </span>
          </h1>

          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/65">
            {t(
              `${allPosts.length} مقالاً عملياً مشروحاً، و${programs.length} برنامج مجاني جاهز، وحساباتي كلها — بمدونة تُقرأ على الجوال أولاً.`,
              `${allPosts.length} hands-on articles explained properly, ${programs.length} free programs ready to install, and all my accounts — with a blog built mobile-first.`,
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/blog"
              className="btn btn-primary tiktok-gradient-none bg-accent h-12 rounded-2xl px-6 text-[13px] font-black text-white"
            >
              <FileText className="size-4" aria-hidden="true" />
              {t('ابدأ بالمقالات', 'Start with the articles')}
            </Link>
            <Link
              to="/links"
              className="flex h-12 items-center rounded-2xl border border-white/20 bg-white/10 px-6 text-[13px] font-black text-white transition-colors hover:bg-white hover:text-ink"
            >
              {t('كل الروابط', 'All my links')}
              <ArrowLeft className="size-4 rtl:ms-2 ltr:ms-0" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <HeroFact
            label={t('متابع على تيك توك', 'TikTok followers')}
            value={<span dir="ltr">{tiktok.stats.followers}</span>}
            sub={t(
              `آخر تحديث ${tiktok.updatedAt}`,
              `updated ${tiktok.updatedAt}`,
            )}
            delay={0.1}
          />
          <HeroFact
            label={t('مقالات منشورة', 'Published articles')}
            value={allPosts.length}
            sub={t(
              `أطولها ${longest} دقائق`,
              `longest reads ${longest} min`,
            )}
            bars={spread}
            delay={0.2}
          />
          <HeroFact
            label={t('فيديو منشور', 'Videos posted')}
            value={<span dir="ltr">{tiktok.stats.videos}</span>}
            sub={t('بالإضافة إلى المقالات المكتوبة', 'on top of the written articles')}
            delay={0.3}
          />
          <HeroFact
            label={t('توزيع المقالات', 'How articles split')}
            value={categories.length}
            sub={categories
              .map((c) => `${categoryLabel(c, lang)} ${allPosts.filter((p) => p.category === c).length}`)
              .join(' · ')}
            delay={0.4}
          />
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { t } = useI18n()

  useEffect(() => {
    document.title = t(site.title, site.titleEn)
  }, [t])

  return (
    <div className="container-app flex flex-col gap-6 py-6 lg:gap-8 lg:py-8">
      <Hero />

      <Reveal delay={0.06}>
        <QuickActions />
      </Reveal>

      <Reveal delay={0.1}>
        <Spotlight />
      </Reveal>

      <Articles />

      {programs.length ? (
        <section aria-labelledby="home-programs">
          <div className="mb-6 flex items-center gap-4">
            <div>
              <h2 id="home-programs" className="text-app text-[17px] font-black">
                {t('البرامج', 'Programs')}
              </h2>
              <p className="text-subtle mt-0.5 text-[12px]">
                {t('كل برنامج موثّق بمقال مستقل', 'Every program documented in its own article')}
              </p>
            </div>
            <Link to="/programs" className="text-accent group ms-auto flex items-center gap-1.5 text-[13px] font-bold">
              {t('كل البرامج', 'All programs')}
              <ArrowLeft className="size-3.5 transition-transform rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3">
            {programs.slice(0, 3).map((p) => (
              <ProgramCard key={p.slug} program={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
