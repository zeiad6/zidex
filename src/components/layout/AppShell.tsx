import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { FloatingWhatsApp } from '@/components/store/organisms/FloatingWhatsApp'
import { FloatingTelegram } from '@/components/store/organisms/FloatingTelegram'
import { AmbientField } from '@/components/ui/AmbientField'
import { Glyph } from '@/components/ui/Glyphs'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Compass,
  House,
  Info,
  Lock,
  Menu,
  Package,
  MessageCircle,
  Search,
  ShoppingBag,
  Star,
  LayoutGrid,
  LayoutTemplate,
  X,
  type LucideIcon,
} from 'lucide-react'
import { allPosts, categories, categoryLabel, postsFor, searchPosts } from '@/data/posts'
import { programs } from '@/data/programs'
import { site, tiktok } from '@/lib/site'
import { formatStars, searchProducts, useCatalog } from '@/lib/store'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { CountPop } from '@/components/ui/Motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LangToggle } from '@/components/ui/LangToggle'
import { categoryStyle } from '@/components/blog/categoryStyle'

/* ------------------------------------------------------------------ *
 * Dashboard shell after the Zidex template: a full-height white sidebar
 * (brand, search, labelled sections, a dark call-to-action card, profile
 * row), a top bar with breadcrumb + section title, a bottom tab bar on
 * phones, and a ⌘K / "/" search over posts and programs.
 * ------------------------------------------------------------------ */

type NavItem = { to: string; icon: LucideIcon; label: string; labelEn: string; badge?: 'posts' | 'new'; /** bundle outside the SPA — real navigation */ external?: boolean }

const primaryNav: NavItem[] = [
  { to: '/', icon: House, label: 'الرئيسية', labelEn: 'Home' },
  { to: '/blog', icon: BookOpen, label: 'المقالات', labelEn: 'Articles', badge: 'posts' },
  { to: '/shop', icon: ShoppingBag, label: 'المتجر', labelEn: 'Store', badge: 'new' },
  { to: '/search', icon: Search, label: 'البحث', labelEn: 'Search', badge: 'new' },
  { to: '/programs', icon: Package, label: 'البرامج', labelEn: 'Programs' },
  { to: '/templates', icon: LayoutTemplate, label: 'قوالب المتاجر', labelEn: 'Store templates', badge: 'new' },
  // '/bot-suite/' (واجهات البوتات) hidden from nav per request; the bundle stays
  // shipped and is still reached from each product page's live preview.
  { to: '/dashboard', icon: LayoutGrid, label: 'لوحة التحكم', labelEn: 'Dashboard' },
  { to: '/links', icon: Compass, label: 'الروابط', labelEn: 'Links' },
  { to: '/about', icon: Info, label: 'عن المنصة', labelEn: 'About' },
]

/** Section title shown in the top bar, from the current route. */
function useSection() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const hit = primaryNav.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  return hit ? t(hit.label, hit.labelEn) : t('الصفحة', 'Page')
}

function Sidebar({ onSearch }: { onSearch: () => void }) {
  const { lang, t } = useI18n()
  // The sidebar renders twice (desktop + drawer); a per-instance id keeps their pills apart.
  const pillId = `nav-pill-${useId()}`
  const { pathname, search } = useLocation()
  const activeCategory = pathname === '/blog' ? new URLSearchParams(search).get('c') : null

  // Zidex nav item: 14px semibold, 14px radius; active is a violet gradient with a glow.
  // The sweep underline carries the hover for the rows that have no sliding pill of
  // their own — the category rows — so a hover always answers with a moving line.
  const rowClass = (active: boolean) =>
    cn(
      'group/nav link-underline flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold transition-colors duration-200',
      active
        ? 'bg-linear-to-l from-ghost-500 to-ghost-400 text-white shadow-[0_10px_24px_rgb(109_92_255/0.35)] ltr:bg-linear-to-r'
        : 'text-muted hover:bg-accent-soft hover:text-accent',
    )
  const label = 'text-subtle px-3.5 pt-2 pb-1 text-[11px] font-bold tracking-widest'

  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 p-5" aria-label={site.name}>
        <img src="/icon-192.png" alt="" width={44} height={44} className="size-11 shrink-0 rounded-2xl shadow-[0_8px_20px_rgb(109_92_255/0.4)]" />
        <span className="min-w-0 flex-1">
          <span className="text-app flex items-center gap-2 text-[17px] leading-none font-black tracking-tight" dir="ltr">
            {site.name.toUpperCase()}
            <span className="bg-accent-soft text-accent rounded-full px-2 py-0.5 text-[11px] font-bold">{t('رسمي', 'OFFICIAL')}</span>
          </span>
          <span className="text-subtle mt-1 block truncate text-[12px] font-medium">
            {t('بوتات • برامج • مقالات', 'Bots • Software • Articles')}
          </span>
        </span>
      </Link>

      <div className="px-5">
        <button
          type="button"
          onClick={onSearch}
          className="bg-sunken text-subtle hover:border-accent flex w-full cursor-pointer items-center gap-2 rounded-xl border border-app px-3 py-2.5 text-[13px] transition-colors"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1 text-start">{t('ابحث عن أي شيء…', 'Search anything…')}</span>
          <kbd className="bg-elevated rounded-md border border-app px-1.5 py-0.5 text-[10px] font-bold">⌘K</kbd>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
        <p className={label}>{t('القائمة الرئيسية', 'MAIN MENU')}</p>
        {primaryNav.map(({ to, icon: Icon, label: ar, labelEn, badge, external }) => {
          // A static bundle outside the SPA (bot-suite) is a real navigation, not a
          // client route — otherwise React Router would try to route /bot-suite itself.
          if (external) {
            return (
              <a key={to} href={to} className="text-muted hover:bg-accent-soft hover:text-accent group relative isolate flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold transition-colors duration-200">
                <Icon className="size-[1.15rem] shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                <span className="flex-1">{t(ar, labelEn)}</span>
                {badge === 'new' ? (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:bg-orange-400/15 dark:text-orange-300">
                    {t('جديد', 'New')}
                  </span>
                ) : null}
              </a>
            )
          }
          return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative isolate flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold transition-colors duration-200',
                isActive && !(to === '/blog' && activeCategory) ? 'text-white' : 'text-muted hover:bg-accent-soft hover:text-accent',
              )
            }
          >
            {({ isActive }) => {
              const on = isActive && !(to === '/blog' && activeCategory)
              return (
                <>
                  {/* One pill that slides between items instead of each item lighting up. */}
                  {on && (
                    <motion.span
                      layoutId={pillId}
                      aria-hidden="true"
                      className="from-ghost-500 to-ghost-400 absolute inset-0 -z-10 rounded-[14px] bg-linear-to-l shadow-[0_10px_24px_rgb(109_92_255/0.35)] ltr:bg-linear-to-r"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="size-[1.15rem] shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <span className="flex-1">{t(ar, labelEn)}</span>
                  {badge === 'posts' ? (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-black',
                        on ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
                      )}
                    >
                      {allPosts.length}
                    </span>
                  ) : badge === 'new' ? (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-black',
                        on ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300',
                      )}
                    >
                      {t('جديد', 'New')}
                    </span>
                  ) : null}
                </>
              )
            }}
          </NavLink>
          )
        })}

        <p className={cn(label, 'pt-4')}>{t('الأقسام', 'SECTIONS')}</p>
        {categories.map((c) => {
          const { icon, tile } = categoryStyle[c]
          const count = allPosts.filter((p) => p.category === c).length
          const on = activeCategory === c
          return (
            <Link
              key={c}
              to={`/blog?c=${encodeURIComponent(c)}`}
              className={rowClass(on)}
              aria-current={on ? 'page' : undefined}
            >
              <span className={cn('grid size-6 shrink-0 place-items-center rounded-lg text-white', tile)}>
                <Glyph name={icon} size={14} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate">{categoryLabel(c, lang)}</span>
              <span className={cn('font-mono text-[10px] transition-transform duration-300 group-hover/nav:scale-110', on ? 'text-white/80' : 'text-subtle')}>
                <CountPop value={count} />
              </span>
            </Link>
          )
        })}

        {/* Store card: the products, one tap away from every page. */}
        <Link
          to="/shop"
          className="group border-app bg-elevated hover:border-ghost-400/50 relative mt-4 block overflow-hidden rounded-2xl border p-4 transition-colors"
        >
          <div className="flex -space-x-3 rtl:space-x-reverse" aria-hidden="true">
            {['store-bot-pro', 'group-bot', 'booking-bot', 'ai-bot'].map((sku, i) => (
              <img
                key={sku}
                src={`/store/img/products/${sku}.webp`}
                alt=""
                width={34}
                height={34}
                loading="lazy"
                className="ring-(--bg-elevated) size-[34px] rounded-[22%] ring-2 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1"
                style={{ transitionDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
          <p className="text-app mt-3 text-[13px] font-black">{t('بوتات تيليجرام جاهزة', 'Ready-made Telegram bots')}</p>
          <p className="text-subtle mt-0.5 text-[11px] leading-relaxed">
            {t('متجر، مجموعات، حجوزات، اشتراكات… جرّبها مجاناً.', 'Store, groups, bookings, subscriptions… try them free.')}
          </p>
          <span className="text-accent mt-2 inline-flex items-center gap-1 text-[12px] font-bold">
            {t('ادخل المتجر', 'Visit the store')}
            <ShoppingBag className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
        </Link>
        <a
          href={site.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#1fa855]/10 py-2.5 text-[13px] font-bold text-[#167a3e] transition-colors hover:bg-[#1fa855]/20 dark:text-[#3ddc84]"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t('تواصل عبر واتساب', 'Chat on WhatsApp')}
        </a>

        {/* Zidex upgrade card, repurposed: the one call to action worth a card. */}
        <div
          className="relative mt-4 overflow-hidden rounded-2xl p-4 text-white"
          style={{ background: 'linear-gradient(135deg, #0f1023, #2a2366)' }}
        >
          <span className="absolute -top-8 -left-8 size-28 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #6d5cff, transparent)' }} aria-hidden="true" />
          <span className="absolute -right-6 -bottom-10 size-28 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #00c9a7, transparent)' }} aria-hidden="true" />
          <div className="relative">
            <p className="text-[13px] font-black">{t('تابعني على تيك توك', 'Follow me on TikTok')}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">
              {t('كل فيديو جديد ينزل هناك أولاً — والمقالات هنا نسخته المكتوبة.', 'Every new video lands there first — the articles here are the written version.')}
            </p>
            <a
              href={tiktok.profile}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-ink-900 hover:bg-ghost-500 mt-3 block w-full rounded-xl bg-white py-2.5 text-center text-[13px] font-black transition-colors hover:text-white"
            >
              {site.handle}
            </a>
          </div>
        </div>
      </nav>

      <div className="border-t border-app p-4">
        <div className="flex items-center gap-3">
          <span className="brand-gradient ring-ghost-500/20 grid size-10 shrink-0 place-items-center rounded-xl font-black text-white ring-2">G</span>
          <div className="min-w-0 flex-1">
            <p className="text-app truncate text-[13px] font-black" dir="ltr">{site.handle}</p>
            <p className="text-subtle text-[11px]">{t('الحساب الرسمي • نشط', 'Official account • active')}</p>
          </div>
          <Link
            to="/about#privacy"
            aria-label={t('الخصوصية', 'Privacy')}
            className="bg-sunken text-subtle hover:text-accent grid size-8 place-items-center rounded-lg"
          >
            <Lock className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const { lang, t } = useI18n()
  // The catalogue is only fetched once the dialog is actually opened — this
  // shell is on every route, and the store JSON has no business loading on
  // an article page.
  const { catalog } = useCatalog(open)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setQuery('')
      d.showModal()
    } else if (!open && d.open) d.close()
  }, [open])

  const q = query.trim().toLowerCase()
  const posts = (q ? searchPosts(query, lang) : postsFor(lang)).slice(0, q ? 8 : 4)
  const progs = programs.filter(
    (p) => !q || [p.name, p.nameEn, p.tagline, p.taglineEn].join(' ').toLowerCase().includes(q),
  )
  // Word-OR matching over the shop, so "بوت متجر" finds "بوت المتجر الذكي"
  // — the same rule the Telegram bot applies to /search.
  const goods = q && catalog ? searchProducts(catalog.products, query, lang).slice(0, 5) : []

  const row = 'hover:bg-sunken focus-visible:bg-sunken flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none'
  const sectionLabel = 'text-subtle px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider uppercase'
  const hitCount = (n: number) => (
    <span className="text-subtle ms-auto shrink-0 font-mono text-[10px]" aria-hidden="true">
      <CountPop value={n} />
    </span>
  )

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the ::backdrop lands on the <dialog> element itself.
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={t('بحث', 'Search')}
      className="bg-elevated text-app shadow-app-xl m-auto mt-[12vh] w-[min(38rem,calc(100%-2rem))] max-w-none rounded-2xl border border-app p-0 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-app px-4">
        <Search className="text-subtle size-5 shrink-0" aria-hidden="true" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('ابحث في المقالات والبرامج ومنتجات المتجر…', 'Search posts, programs and store products…')}
          className="placeholder:text-subtle h-14 min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="text-subtle hidden rounded-md border border-app px-1.5 py-0.5 font-mono text-[10px] sm:block">Esc</kbd>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-2">
        {progs.length > 0 ? (
          <>
            <p className="text-subtle px-3 pt-2 pb-1 text-[11px] font-medium tracking-wider uppercase">
              {t('البرامج', 'Programs')}
            </p>
            {progs.map((p) => (
              <Link key={p.slug} to="/programs" onClick={onClose} className={row}>
                <span className="bg-sunken grid size-9 shrink-0 place-items-center rounded-lg text-lg" aria-hidden="true">
                  <Glyph name={p.glyph} size={18} className="text-accent" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t(p.name, p.nameEn)}</span>
                  <span className="text-subtle block font-mono text-[11px]" dir="ltr">
                    v{p.version} · {p.platform}
                  </span>
                </span>
              </Link>
            ))}
          </>
        ) : null}

        {goods.length > 0 ? (
          <>
            <p className={cn(sectionLabel, 'flex items-center gap-2')}>
              {t('منتجات المتجر', 'Store products')}
              {hitCount(goods.length)}
            </p>
            {goods.map((p) => (
              <Link key={p.sku} to={`/shop/${p.sku}`} onClick={onClose} className={row}>
                <span className="bg-sunken grid size-9 shrink-0 place-items-center rounded-lg" aria-hidden="true">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t(p.title, p.title_en)}</span>
                  <span className="text-subtle block font-mono text-[11px]" dir="ltr">
                    ⭐️ {formatStars(p.stars)}
                    {p.usd ? ` · $${p.usd}` : ''}
                  </span>
                </span>
              </Link>
            ))}
          </>
        ) : null}

        {posts.length > 0 ? (
          <>
            <p className={cn(sectionLabel, 'pt-3 flex items-center gap-2')}>
              {q ? t('المقالات', 'Articles') : t('أحدث المقالات', 'Latest articles')}
              {hitCount(posts.length)}
            </p>
            {posts.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} onClick={onClose} className={row}>
                <span
                  className={cn('grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-lg', p.coverFrom, p.coverTo)}
                  aria-hidden="true"
                >
                  {p.cover}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="text-subtle block text-[11px]">{categoryLabel(p.category, lang)}</span>
                </span>
              </Link>
            ))}
          </>
        ) : null}

        {posts.length === 0 && progs.length === 0 && goods.length === 0 ? (
          <p className="text-muted px-3 py-10 text-center text-sm">
            {t(`لا نتائج لـ «${query}»`, `No results for “${query}”`)}
          </p>
        ) : null}
      </div>
    </dialog>
  )
}

// Home, Store, Articles, Search; the rest live behind the More drawer.
const mobileNav = primaryNav.slice(0, 4)

export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const [searching, setSearching] = useState(false)
  const { pathname, search } = useLocation()
  const { t } = useI18n()
  const section = useSection()

  // Close the drawer on navigation; lock page scroll while it is open.
  useEffect(() => setDrawer(false), [pathname, search])
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  // ⌘K / Ctrl+K anywhere, "/" when not typing, Escape closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearching(true)
      } else if (e.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const boxButton =
    'bg-sunken text-muted hover:border-accent hover:text-accent grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-app transition-colors'

  return (
    <>
      {/* Decorative only, and inert: aria-hidden + pointer-events-none. */}
      <AmbientField />

      <div className="relative flex min-h-svh">
        <aside className="bg-elevated sticky top-0 hidden h-svh w-[17.5rem] shrink-0 overflow-y-auto border-e border-app lg:block">
          <Sidebar onSearch={() => setSearching(true)} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-app bg-(--bg-elevated)/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[90rem] items-center gap-2.5 px-4 py-3 sm:gap-3 lg:px-8 lg:py-3.5">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label={t('فتح القائمة', 'Open menu')}
                aria-expanded={drawer}
                className={cn(boxButton, 'lg:hidden')}
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>

              <div className="min-w-0">
                <p className="text-subtle flex items-center gap-2 text-[11px] font-medium">
                  <Link to="/" dir="ltr" className="hover:text-accent">
                    {site.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                  <span className="text-accent font-bold">{section}</span>
                </p>
                <p className="text-app truncate text-lg font-black tracking-tight lg:text-2xl">{section}</p>
              </div>

              <div className="flex-1" />

              <button
                type="button"
                onClick={() => setSearching(true)}
                className="bg-sunken text-subtle hover:border-accent hidden w-64 cursor-pointer items-center gap-2 rounded-xl border border-app px-4 py-2.5 text-[13px] transition-colors md:flex"
              >
                <Search className="size-4" aria-hidden="true" />
                <span className="flex-1 text-start">{t('بحث سريع…', 'Quick search…')}</span>
                <kbd className="bg-elevated rounded border border-app px-1.5 text-[10px] font-bold">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => setSearching(true)}
                aria-label={t('بحث', 'Search')}
                className={cn(boxButton, 'md:hidden')}
              >
                <Search className="size-[1.1rem]" aria-hidden="true" />
              </button>
              <LangToggle />
              <ThemeToggle />
              <a
                href={tiktok.profile}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn btn-primary hidden h-10 cursor-pointer rounded-xl px-5 text-[13px] font-black sm:inline-flex"
              >
                <span className="text-lg leading-none">+</span>
                {t('تابعني', 'Follow')}
              </a>
            </div>
          </header>

          <main id="main" className="pb-24 lg:pb-0">
            {children}
          </main>
        </div>
      </div>

      <FloatingTelegram />
      <FloatingWhatsApp />

      {/* Phone bottom nav, as in the template: four sections plus the full menu. */}
      <nav
        aria-label={t('التنقل السريع', 'Quick navigation')}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 border-t border-app bg-(--bg-elevated)/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
      >
        {mobileNav.map(({ to, icon: Icon, label, labelEn }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group/tab flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors',
                isActive ? 'text-accent' : 'text-subtle hover:text-app',
              )
            }
          >
            <Icon className="size-5 transition-transform duration-300 group-hover/tab:-translate-y-0.5" aria-hidden="true" />
            <span className="link-underline text-[10px] font-black">{t(label, labelEn)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="text-subtle hover:text-app flex cursor-pointer flex-col items-center gap-0.5 rounded-xl py-1.5"
        >
          <Menu className="size-5" aria-hidden="true" />
          <span className="text-[10px] font-black">{t('المزيد', 'More')}</span>
        </button>
      </nav>

      {/* Phone / tablet drawer: the same sidebar, sliding in from the inline-start edge. */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', drawer ? 'visible' : 'invisible')} inert={!drawer}>
        <div
          className={cn('absolute inset-0 bg-[#0f1023]/55 backdrop-blur-sm transition-opacity duration-300', drawer ? 'opacity-100' : 'opacity-0')}
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('القائمة', 'Menu')}
          className={cn(
            'bg-elevated absolute inset-y-0 start-0 flex w-[min(17.5rem,85vw)] flex-col overflow-y-auto shadow-app-xl transition-transform duration-300 ease-out',
            drawer ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full',
          )}
        >
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label={t('إغلاق القائمة', 'Close menu')}
            className="bg-sunken text-muted absolute end-4 top-6 z-10 grid size-8 cursor-pointer place-items-center rounded-lg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <Sidebar
            onSearch={() => {
              setDrawer(false)
              setSearching(true)
            }}
          />
        </div>
      </div>

      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </>
  )
}
