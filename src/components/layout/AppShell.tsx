import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AmbientField } from '@/components/ui/AmbientField'
import { Glyph } from '@/components/ui/Glyphs'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Compass,
  House,
  Info,
  LifeBuoy,
  Lock,
  Menu,
  Package,
  Search,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { allPosts, categories, categoryLabel, postsFor, searchPosts } from '@/data/posts'
import { programs } from '@/data/programs'
import { site, tiktok } from '@/lib/site'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LangToggle } from '@/components/ui/LangToggle'
import { categoryStyle } from '@/components/blog/categoryStyle'

/* ------------------------------------------------------------------ *
 * Dashboard shell (after the "Bloggo" Dribbble shot): sticky top bar,
 * a sidebar with sections and categories on desktop, the same sidebar
 * as a drawer on phones, and a ⌘K / "/" search over posts and programs.
 * ------------------------------------------------------------------ */

type NavItem = { to: string; icon: LucideIcon; label: string; labelEn: string; badge?: 'posts' | 'new' }

const primaryNav: NavItem[] = [
  { to: '/', icon: House, label: 'الرئيسية', labelEn: 'Home' },
  { to: '/blog', icon: BookOpen, label: 'المقالات', labelEn: 'Articles', badge: 'posts' },
  { to: '/programs', icon: Package, label: 'البرامج', labelEn: 'Programs', badge: 'new' },
  { to: '/links', icon: Compass, label: 'الروابط', labelEn: 'Links' },
  { to: '/about', icon: Info, label: 'عن المنصة', labelEn: 'About' },
]

function Sidebar() {
  const { lang, t } = useI18n()
  const { pathname, search } = useLocation()
  const activeCategory = pathname === '/blog' ? new URLSearchParams(search).get('c') : null

  const rowClass = (active: boolean) =>
    cn(
      'group/nav flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] font-semibold transition-[background-color,color,box-shadow,transform] duration-300',
      active
        ? 'tiktok-gradient-none bg-accent text-accent-fg shadow-app-accent'
        : 'text-muted hover:bg-accent-soft hover:text-accent hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
    )

  return (
    <nav className="flex h-full flex-col gap-7 p-4" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
      <ul className="flex flex-col gap-1">
        {primaryNav.map(({ to, icon: Icon, label, labelEn, badge }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => rowClass(isActive && !(to === '/blog' && activeCategory))}
            >
              <Icon className="size-[1.15rem] shrink-0" aria-hidden="true" />
              {t(label, labelEn)}
              {badge === 'posts' ? (
                <span className="bg-sunken text-subtle ms-auto rounded-md px-1.5 py-0.5 font-mono text-[10px]">
                  {allPosts.length}
                </span>
              ) : badge === 'new' ? (
                <span className="ms-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {t('جديد', 'New')}
                </span>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>

      <div>
        <p className="text-subtle px-3.5 pt-1 pb-1.5 text-[11px] font-bold tracking-widest uppercase">
          {t('الأقسام', 'Sections')} ({categories.length})
        </p>
        <ul className="mt-2 flex flex-col gap-0.5">
          {categories.map((c) => {
            const { icon, tile } = categoryStyle[c]
            const count = allPosts.filter((p) => p.category === c).length
            return (
              <li key={c}>
                <Link
                  to={`/blog?c=${encodeURIComponent(c)}`}
                  className={rowClass(activeCategory === c)}
                  aria-current={activeCategory === c ? 'page' : undefined}
                >
                  <span className={cn('grid size-6 shrink-0 place-items-center rounded-md text-white', tile)}>
                    <Glyph name={icon} size={14} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 truncate">{categoryLabel(c, lang)}</span>
                  <span className="text-subtle ms-auto font-mono text-[10px]">{count}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <ul className="mt-auto flex flex-col gap-0.5 border-t border-app pt-4">
        <li>
          <a href={tiktok.profile} target="_blank" rel="noopener noreferrer nofollow" className={rowClass(false)}>
            <LifeBuoy className="size-[1.15rem] shrink-0" aria-hidden="true" />
            {t('تواصل ودعم', 'Help & contact')}
          </a>
        </li>
        <li>
          <Link to="/about#privacy" className={rowClass(false)}>
            <Lock className="size-[1.15rem] shrink-0" aria-hidden="true" />
            {t('الخصوصية', 'Privacy')}
          </Link>
        </li>
      </ul>
    </nav>
  )
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const { lang, t } = useI18n()

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

  const row = 'hover:bg-sunken focus-visible:bg-sunken flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none'

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
          placeholder={t('ابحث في المقالات والبرامج…', 'Search posts and programs…')}
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

        {posts.length > 0 ? (
          <>
            <p className="text-subtle px-3 pt-3 pb-1 text-[11px] font-medium tracking-wider uppercase">
              {q ? t('المقالات', 'Articles') : t('أحدث المقالات', 'Latest articles')}
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

        {posts.length === 0 && progs.length === 0 ? (
          <p className="text-muted px-3 py-10 text-center text-sm">
            {t(`لا نتائج لـ «${query}»`, `No results for “${query}”`)}
          </p>
        ) : null}
      </div>
    </dialog>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const [searching, setSearching] = useState(false)
  const { pathname, search } = useLocation()
  const { t } = useI18n()

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

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const iconButton = 'text-muted hover:text-app hover:bg-sunken grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl transition-colors'

  return (
    <>
      {/* Decorative only, and inert: aria-hidden + pointer-events-none. */}
      <AmbientField />

      <header
        className={cn(
          'sticky top-0 z-40 border-b border-app bg-(--bg)/92 backdrop-blur-md transition-shadow duration-300',
          scrolled ? 'shadow-app-md' : 'shadow-none',
        )}
      >
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={t('فتح القائمة', 'Open menu')}
            aria-expanded={drawer}
            className={cn(iconButton, 'lg:hidden')}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label={site.name}>
            <span className="tiktok-gradient grid size-10 shrink-0 place-items-center rounded-2xl text-white shadow-app-accent">
              <span className="text-lg font-black leading-none">Z</span>
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="text-app text-[17px] font-black tracking-tight" dir="ltr">
                {site.name}
              </span>
              <span className="text-subtle mt-1 hidden truncate text-[11px] sm:block">
                {t('مقالات وبرامج وروابط', 'Articles, programs, links')}
              </span>
            </span>
          </Link>
          <span className="bg-line mx-1 hidden h-6 w-px sm:block" aria-hidden="true" />
          <span className="hidden rounded-full bg-accent-soft text-accent px-3 py-1 text-[11px] font-bold sm:inline-flex">
            {t('كل شيء مجاني', 'All free')}
          </span>

          <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
            <a
              href={tiktok.profile}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="border-ghost-300 text-accent hover:bg-accent-soft dark:border-ghost-400/40 me-1 hidden h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold tracking-wide uppercase shadow-sm transition-colors md:inline-flex"
            >
              <Zap className="size-3.5 fill-current text-amber-500" aria-hidden="true" />
              {t('تابعني على تيك توك', 'Follow on TikTok')}
            </a>
            <span className="bg-line me-1 hidden h-6 w-px md:block" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setSearching(true)}
              aria-label={t('بحث', 'Search')}
              title={t('بحث (⌘K)', 'Search (⌘K)')}
              className={iconButton}
            >
              <Search className="size-5" aria-hidden="true" />
            </button>
            <LangToggle />
            <ThemeToggle />
            <Link
              to="/about"
              aria-label={t('عن المنصة', 'About')}
              className="tiktok-gradient ms-1 hidden size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white sm:grid"
            >
              G
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[90rem]">
        <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-64 shrink-0 overflow-y-auto lg:block">
          <Sidebar />
        </aside>
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      {/* Phone / tablet drawer: the same sidebar, sliding in from the inline-start edge. */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', drawer ? 'visible' : 'invisible')} inert={!drawer}>
        <div
          className={cn('absolute inset-0 bg-black/40 transition-opacity duration-300', drawer ? 'opacity-100' : 'opacity-0')}
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('القائمة', 'Menu')}
          className={cn(
            'bg-app absolute inset-y-0 start-0 flex w-[min(20rem,85vw)] flex-col shadow-app-xl transition-transform duration-300 ease-out',
            drawer ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full',
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-app px-4">
            <span className="font-display text-app text-lg font-bold" dir="ltr">
              {site.name}
            </span>
            <button type="button" onClick={() => setDrawer(false)} aria-label={t('إغلاق القائمة', 'Close menu')} className={iconButton}>
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </div>
      </div>

      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </>
  )
}
