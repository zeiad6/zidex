import { useEffect, useState } from 'react'
import { ShineBorder } from '@/components/ui/Decor'
import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Check, Download, FileText, Link2, Package, type LucideIcon } from 'lucide-react'
import { allPosts, categories, categoryLabel, postsFor, type Category } from '@/data/posts'
import { programs } from '@/data/programs'
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

/** Decorative scene from the reference: a checklist sheet and a card on an indigo panel. */
function Illustration({ glyph }: { glyph: GlyphName }) {
  const reduce = useReducedMotion()
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
            cta: t(`تحميل · ${program.size}`, `Download · ${program.size}`),
            href: program.href,
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

function QuickActions() {
  const { t } = useI18n()
  const actions: { to: string; icon: LucideIcon; tone: string; title: string; sub: string }[] = [
    {
      to: '/blog',
      icon: FileText,
      tone: 'bg-orange-50 text-orange-500 dark:bg-orange-400/10',
      title: t('تصفّح المقالات', 'Browse articles'),
      sub: t(`${allPosts.length} مقالاً عملياً`, `${allPosts.length} hands-on articles`),
    },
    {
      to: '/programs',
      icon: Package,
      tone: 'bg-ghost-50 text-ghost-600 dark:bg-ghost-400/10 dark:text-ghost-300',
      title: t('حمّل البرامج', 'Get the programs'),
      sub: t('برامج مجانية جاهزة للتثبيت', 'Free, ready-to-install software'),
    },
    {
      to: '/links',
      icon: Link2,
      tone: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
      title: t('كل الروابط', 'All links'),
      sub: t('حساباتي وطرق التواصل', 'My accounts and contacts'),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map(({ to, icon: Icon, tone, title, sub }) => (
        <Link
          key={to}
          to={to}
          className="bg-elevated hover:border-strong group flex items-center gap-4 rounded-2xl border border-app p-4 transition-colors"
        >
          <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tone)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="text-app block font-semibold">{title}</span>
            <span className="text-subtle block truncate text-[13px]">{sub}</span>
          </span>
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
        <h2 id="home-articles" className="text-app text-xl font-semibold">
          {t('المقالات', 'Articles')}
        </h2>
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

export default function Home() {
  const { t } = useI18n()

  useEffect(() => {
    document.title = t(site.title, site.titleEn)
  }, [t])

  const accentLink = 'text-accent font-semibold underline decoration-2 underline-offset-4'

  return (
    <div className="container-app flex flex-col gap-10 py-8 sm:py-10">
      <Reveal>
        <h1 className="font-display text-app text-3xl leading-tight font-bold sm:text-4xl">
          {t('أهلاً بك في', 'Welcome to')} <span dir="ltr">{site.name}</span> 👋
        </h1>
        <p className="text-muted mt-2.5 text-[15px] leading-relaxed">
          {t(
            <>
              كل ما أنشره في مكان واحد: <Link to="/blog" className={accentLink}>{allPosts.length} مقالاً</Link> عملياً و
              <Link to="/programs" className={accentLink}>{programs.length} برنامج</Link> مجاني، وروابط حساباتي.
            </>,
            <>
              Everything I publish, in one place: <Link to="/blog" className={accentLink}>{allPosts.length} hands-on articles</Link>,{' '}
              <Link to="/programs" className={accentLink}>{programs.length} free program</Link>, and all my links.
            </>,
          )}
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <Spotlight />
      </Reveal>

      <Reveal delay={0.1}>
        <QuickActions />
      </Reveal>

      <Articles />

      {programs.length ? (
        <section aria-labelledby="home-programs">
          <div className="mb-6 flex items-center gap-4">
            <h2 id="home-programs" className="text-app text-xl font-semibold">
              {t('البرامج', 'Programs')}
            </h2>
            <Link to="/programs" className="text-accent group ms-auto flex items-center gap-1 text-sm font-medium">
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
