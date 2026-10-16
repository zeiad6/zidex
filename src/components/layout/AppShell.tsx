import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { FloatingWhatsApp } from '@/components/store/organisms/FloatingWhatsApp'
import { FloatingTelegram } from '@/components/store/organisms/FloatingTelegram'
import { AmbientField } from '@/components/ui/AmbientField'
import { Glyph } from '@/components/ui/Glyphs'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Calculator,
  ChevronRight,
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
import { setScrollPane } from '@/lib/scroll'
import { cn } from '@/lib/utils'
import { CountPop } from '@/components/ui/Motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LangToggle } from '@/components/ui/LangToggle'
import { GlyphTikTok } from '@/components/ui/Glyphs'
import { BorderBeam, ShineBorder } from '@/components/ui/Decor'
import { categoryStyle } from '@/components/blog/categoryStyle'

/* ------------------------------------------------------------------ *
 * Dashboard shell after the Zidex template: a full-height white sidebar
 * (brand, search, labelled sections, a dark call-to-action card, profile
 * row), a top bar with breadcrumb + section title, a bottom tab bar on
 * phones, and a ⌘K / "/" search over posts and programs.
 *
 * The sidebar is a permanent surface in both of its states: collapsed, it
 * keeps EVERY part of the site reachable (search, the full nav, the blog
 * categories as coloured tiles, the store stack, WhatsApp, TikTok and the
 * profile) through animated tooltips instead of hiding them; expanded, it
 * is the same full menu it always was. On phones the bottom bar carries
 * all nine sections in a scrollable strip, so the menu is never more than
 * one tap away in either state.
 * ------------------------------------------------------------------ */

type NavItem = { to: string; icon: LucideIcon; label: string; labelEn: string; badge?: 'posts' | 'new'; /** bundle outside the SPA — real navigation */ external?: boolean }

/**
 * The information architecture, grouped the way a visitor reasons about the
 * site: here (Home), to read (Content), to buy (Market), to do things
 * (Tools). One flat source of items — `primaryNav` is the flattened list —
 * so the collapsed rail, the phone strip and the breadcrumb title all keep
 * the same order, while the expanded menu renders the groups with labels.
 */
const navGroups: { id: string; label: string; labelEn: string; items: NavItem[] }[] = [
  {
    id: 'here',
    label: 'البداية',
    labelEn: 'START',
    items: [{ to: '/', icon: House, label: 'الرئيسية', labelEn: 'Home' }],
  },
  {
    id: 'market',
    label: 'المتجر والخدمات',
    labelEn: 'MARKET',
    items: [
      { to: '/shop', icon: ShoppingBag, label: 'المتجر', labelEn: 'Store', badge: 'new' },
      { to: '/templates', icon: LayoutTemplate, label: 'قوالب المتاجر', labelEn: 'Store templates', badge: 'new' },
      { to: '/programs', icon: Package, label: 'البرامج', labelEn: 'Programs' },
      { to: '/accounting', icon: Calculator, label: 'أنظمة محاسبية', labelEn: 'Accounting systems', badge: 'new' },
    ],
  },
  {
    id: 'content',
    label: 'المحتوى',
    labelEn: 'CONTENT',
    items: [{ to: '/blog', icon: BookOpen, label: 'المقالات', labelEn: 'Articles', badge: 'posts' }],
  },
  {
    id: 'tools',
    label: 'أدوات وحساب',
    labelEn: 'TOOLS',
    items: [
      { to: '/search', icon: Search, label: 'البحث', labelEn: 'Search', badge: 'new' },
      { to: '/dashboard', icon: LayoutGrid, label: 'لوحة التحكم', labelEn: 'Dashboard' },
      { to: '/links', icon: Compass, label: 'الروابط', labelEn: 'Links' },
      { to: '/about', icon: Info, label: 'عن المنصة', labelEn: 'About' },
    ],
  },
]

// '/bot-suite/' (واجهات البوتات) hidden from nav per request; the bundle stays
// shipped and is still reached from each product page's live preview.
const primaryNav: NavItem[] = navGroups.flatMap((g) => g.items)

/** Section title shown in the top bar, from the current route. */
function useSection() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const hit = primaryNav.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  return hit ? t(hit.label, hit.labelEn) : t('الصفحة', 'Page')
}

/* ------------------------------------------------------------------ *
 * Sidebar rail: the desktop sidebar collapses to an icon strip and
 * the choice sticks across visits. Persisted because a visitor who
 * always works collapsed should not re-collapse it on every page.
 * ------------------------------------------------------------------ */
const RAIL_KEY = 'ghost-rail'

function useRail() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(RAIL_KEY) === '1'
    } catch {
      return false
    }
  })
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(RAIL_KEY, c ? '0' : '1')
      } catch {
        /* private mode — the choice just won't survive a reload */
      }
      return !c
    })
  return { collapsed, toggle }
}

/* A hairline that separates the groups inside the collapsed rail. */
const railDivider = 'bg-line my-2 h-px w-9 shrink-0'

/**
 * A tooltip for the collapsed rail. It is positioned against the viewport
 * (`position: fixed`) rather than the anchor element on purpose: the rail
 * scrolls, so an absolutely positioned tooltip would be clipped by the
 * aside's `overflow-y-auto` the moment it pokes past the column — and a
 * clipped tooltip is an invisible tooltip. Measured on hover/focus, so it
 * tracks the scrolled position for free. The native `title` on the anchor
 * is dropped in favour of this, which can be styled and animated.
 */
function RailTip({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null)
  const [xy, setXY] = useState<{ top: number; left: number } | null>(null)
  const { lang } = useI18n()

  const place = () => {
    const r = anchor.current?.getBoundingClientRect()
    if (r) setXY({ top: r.top + r.height / 2, left: lang === 'en' ? r.right + 12 : r.left - 12 })
  }
  const hide = () => setXY(null)

  return (
    <>
      {/* `flex` (not `contents`): a display:contents box has no rect to measure. */}
      <span
        ref={anchor}
        onMouseEnter={place}
        onMouseLeave={hide}
        onFocus={place}
        onBlur={hide}
        className="flex"
      >
        {children}
      </span>
      {xy && (
        <span
          role="tooltip"
          aria-hidden="true"
          style={{
            top: xy.top,
            left: xy.left,
            // Grows from the anchor's content-side edge, per direction.
            transform: lang === 'en' ? 'translate(0, -50%)' : 'translate(-100%, -50%)',
          }}
          className="pointer-events-none fixed z-[70] select-none"
        >
          <span className="tip-in bg-ink-950/95 dark:bg-ink-900/95 shadow-app-lg flex flex-col items-start gap-0.5 rounded-xl border border-white/10 px-3 py-2 text-white backdrop-blur-md">
            <span className="text-[12px] font-bold whitespace-nowrap">{label}</span>
            {sub ? <span className="text-[10px] font-medium whitespace-nowrap text-white/55">{sub}</span> : null}
          </span>
        </span>
      )}
    </>
  )
}

/**
 * The collapsed desktop sidebar: an icon rail that still carries every
 * section of the site — primary nav, blog categories, the store, the
 * socials and the profile — each answered by a `RailTip` tooltip. It
 * expands back through the edge toggle on the aside's border, not a pin
 * inside the column.
 */
function SidebarRail({ onSearch }: { onSearch: () => void }) {
  const { t, lang } = useI18n()
  const { pathname, search } = useLocation()
  const activeCategory = pathname === '/blog' ? new URLSearchParams(search).get('c') : null
  const pillId = `rail-pill-${useId()}`

  return (
    <div className="flex h-full flex-col items-center gap-1 py-4">
      <RailTip label={site.name} sub={t('بوتات • برامج • مقالات', 'Bots • Software • Articles')}>
        <Link
          to="/"
          aria-label={site.name}
          className="group/rail-logo relative mb-2 grid size-11 shrink-0 place-items-center"
        >
          <span
            aria-hidden="true"
            className="brand-gradient absolute -inset-1 rounded-[1.3rem] opacity-30 blur-[8px] transition-opacity duration-300 group-hover/rail-logo:opacity-60"
          />
          <img
            src="/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/rail-logo:scale-105 group-hover/rail-logo:-rotate-3"
          />
        </Link>
      </RailTip>

      <RailTip label={t('بحث', 'Search')} sub="⌘K">
        <button
          type="button"
          onClick={onSearch}
          aria-label={t('بحث', 'Search')}
          className="text-subtle hover:text-accent hover:bg-accent-soft mb-1 grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl transition-colors"
        >
          <Search className="size-[1.05rem]" aria-hidden="true" />
        </button>
      </RailTip>

      {/* The rail's scrollable middle: on a normal screen it fits and never
          shows a bar; on a short one only this middle pans while the logo,
          the search and the profile stay pinned — no scrollbar ever rides
          the sidebar's own border. */}
      <div className="app-scroll-fade flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto">
        <nav className="flex flex-col items-center gap-1" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
          {primaryNav.map(({ to, icon: Icon, label, labelEn, badge }, i) => (
            <RailTip key={to} label={t(label, labelEn)}>
              <NavLink
                to={to}
                end={to === '/'}
                aria-label={t(label, labelEn)}
                style={{ animationDelay: `${60 + i * 24}ms` }}
                className={({ isActive }) =>
                  cn(
                    'rail-in group/rail relative isolate grid size-10 place-items-center rounded-[13px] transition-colors duration-200',
                    isActive ? 'text-white' : 'text-muted hover:bg-accent-soft hover:text-accent',
                  )
                }
              >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId={pillId}
                      aria-hidden="true"
                      className="from-ghost-500 to-ghost-400 absolute inset-0 -z-10 rounded-[13px] bg-linear-to-l shadow-[0_10px_24px_rgb(109_92_255/0.35)] ltr:bg-linear-to-r"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="size-[1.1rem] transition-transform duration-300 group-hover/rail:scale-110" aria-hidden="true" />
                  {badge === 'new' ? (
                    <span aria-hidden="true" className="bg-tiktok-600 absolute -top-0.5 end-1 size-1.5 rounded-full shadow-[0_0_6px_rgb(254_44_85/0.7)]" />
                  ) : null}
                </>
              )}
            </NavLink>
          </RailTip>
        ))}
      </nav>

      <span className={railDivider} aria-hidden="true" />

      {/* Blog categories: the coloured tiles, live in the rail too. */}
      <div className="grid shrink-0 grid-cols-2 gap-1" role="group" aria-label={t('الأقسام', 'Sections')}>
        {categories.map((c, i) => {
          const { icon, tile } = categoryStyle[c]
          const count = allPosts.filter((p) => p.category === c).length
          const on = activeCategory === c
          return (
            <RailTip key={c} label={categoryLabel(c, lang)} sub={`${t('مقالات', 'articles')} · ${count}`}>
              <Link
                to={`/blog?c=${encodeURIComponent(c)}`}
                aria-label={categoryLabel(c, lang)}
                aria-current={on ? 'page' : undefined}
                style={{ animationDelay: `${280 + i * 30}ms` }}
                className={cn(
                  'rail-in grid size-9 place-items-center rounded-xl text-white transition-all duration-300',
                  tile,
                  on
                    ? 'ring-(--accent) shadow-app-accent scale-100 ring-2 ring-offset-2 ring-offset-(--bg-elevated)'
                    : 'opacity-85 hover:scale-110 hover:opacity-100',
                )}
              >
                <Glyph name={icon} size={15} aria-hidden="true" />
              </Link>
            </RailTip>
          )
        })}
      </div>

      <span className={railDivider} aria-hidden="true" />

      {/* Store stack: the products themselves, one hover away from every page. */}
      <RailTip label={t('بوتات تيليجرام جاهزة', 'Ready-made Telegram bots')} sub={t('ادخل المتجر', 'Visit the store')}>
        <Link
          to="/shop"
          aria-label={t('المتجر', 'Store')}
          style={{ animationDelay: '440ms' }}
          className="rail-in border-app bg-elevated hover:border-ghost-400/60 hover:shadow-app-md group/rail-store grid size-11 place-items-center rounded-2xl border transition-all duration-300"
        >
          <span className="flex -space-x-2.5 rtl:space-x-reverse" aria-hidden="true">
            {['store-bot-pro', 'group-bot', 'booking-bot', 'ai-bot'].map((sku, i) => (
              <img
                key={sku}
                src={`/store/img/products/${sku}.webp`}
                alt=""
                width={22}
                height={22}
                loading="lazy"
                className="ring-(--bg-elevated) size-[22px] rounded-full ring-2 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/rail-store:scale-110"
                style={{ transitionDelay: `${i * 40}ms` }}
              />
            ))}
          </span>
        </Link>
      </RailTip>

        {/* Socials, side by side to keep the rail compact. */}
        <span className="rail-in mt-2 flex items-center gap-1" style={{ animationDelay: '470ms' }}>
          <RailTip label="WhatsApp">
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid size-9 place-items-center rounded-xl bg-[#1fa855]/12 text-[#167a3e] transition-all duration-300 hover:scale-110 hover:bg-[#1fa855]/25 dark:text-[#3ddc84]"
            >
              <MessageCircle className="size-[1.05rem]" aria-hidden="true" />
            </a>
          </RailTip>
          <RailTip label={t('تابعني على تيك توك', 'Follow on TikTok')} sub={site.handle}>
            <a
              href={tiktok.profile}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={t('تيك توك', 'TikTok')}
              className="bg-ink-950 hover:shadow-app-lg grid size-9 place-items-center rounded-xl text-white transition-all duration-300 hover:scale-110 dark:bg-ink-900"
            >
              <GlyphTikTok size={16} aria-hidden="true" />
            </a>
          </RailTip>
        </span>
      </div>

      <span className={railDivider} aria-hidden="true" />

      <div className="rail-in shrink-0" style={{ animationDelay: '500ms' }}>
        <RailTip label={site.handle} sub={t('الحساب الرسمي • نشط', 'Official account • active')}>
          <Link
            to="/about#privacy"
            aria-label={t('عن المنصة والخصوصية', 'About & privacy')}
            className="brand-gradient ring-ghost-500/20 grid size-10 place-items-center rounded-xl font-black text-white ring-2 transition-transform duration-300 hover:scale-105"
          >
            G
          </Link>
        </RailTip>
      </div>
    </div>
  )
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
      {/* Top block: the brand and the search live together under one
          gradient hairline, so the head of the menu reads as one unit
          instead of a logo row and a search row drifting apart. */}
      <div className="relative px-4 pt-5 pb-4">
        <span
          aria-hidden="true"
          className="from-ghost-500/70 via-ghost-400/30 absolute inset-x-0 bottom-0 mx-4 h-px bg-linear-to-l to-transparent ltr:bg-linear-to-r"
        />

        <div className="flex items-center gap-3">
          <Link to="/" aria-label={site.name} className="group/brand relative shrink-0">
            <span
              aria-hidden="true"
              className="brand-gradient absolute -inset-1.5 rounded-[1.3rem] opacity-30 blur-[10px] transition-opacity duration-300 group-hover/brand:opacity-60"
            />
            <img
              src="/icon-192.png"
              alt=""
              width={56}
              height={56}
              className="ring-(--bg-elevated) relative size-14 rounded-2xl ring-2 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/brand:-rotate-3 group-hover/brand:scale-105"
            />
            {/* Live dot: the official account is online — the one green
                the sidebar's top earns by saying something true. */}
            <span aria-hidden="true" className="absolute -bottom-0.5 -end-0.5 grid place-items-center">
              <span className="bg-veil-500 ring-(--bg-elevated) size-3.5 rounded-full ring-2" />
              <span className="bg-veil-500 animate-ping-soft absolute size-3.5 rounded-full" />
            </span>
          </Link>

          <span className="min-w-0 flex-1">
            <span className="text-app flex items-center gap-2 text-[17px] leading-none font-black tracking-tight" dir="ltr">
              {site.name.toUpperCase()}
              <span className="bg-accent-soft text-accent rounded-full px-2 py-0.5 text-[11px] font-bold">{t('رسمي', 'OFFICIAL')}</span>
            </span>
            <span className="text-subtle mt-1.5 flex items-center gap-1.5 text-[12px] font-medium">
              <span aria-hidden="true" className="bg-veil-500/80 size-1.5 shrink-0 rounded-full" />
              {t('بوتات • برامج • مقالات', 'Bots • Software • Articles')}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="bg-sunken text-subtle hover:border-accent hover:shadow-app-md group mt-4 flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-app px-3.5 py-3 text-[13px] shadow-app transition-all duration-300"
        >
          <Search className="size-4 transition-colors group-hover:text-accent" aria-hidden="true" />
          <span className="flex-1 text-start">{t('ابحث عن أي شيء…', 'Search anything…')}</span>
          <kbd className="bg-elevated border-app group-hover:border-accent/40 group-hover:text-accent rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-colors">⌘K</kbd>
        </button>
      </div>

      {/* The menu itself is the only part of the expanded sidebar that
          pans on a short screen — brand, search and profile stay pinned.
          Rows render group by group with labelled headers; the tiny group
          number keeps the stagger continue across group boundaries. */}
      <nav className="app-scroll-fade flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
        {navGroups.map((group, gi) => (
          <div key={group.id}>
            <p className={cn(label, gi > 0 && 'pt-4')}>{t(group.label, group.labelEn)}</p>
            {group.items.map(({ to, icon: Icon, label: ar, labelEn, badge, external }, li) => {
              const i = () => gi * 10 + li
              // A static bundle outside the SPA (bot-suite) is a real navigation, not a
              // client route — otherwise React Router would try to route /bot-suite itself.
              if (external) {
                return (
                  <a
                    key={to}
                    href={to}
                    style={{ animationDelay: `${80 + i() * 22}ms` }}
                    className="rail-in text-muted hover:bg-accent-soft hover:text-accent group relative isolate flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold transition-colors duration-200"
                  >
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
                style={{ animationDelay: `${80 + i() * 22}ms` }}
                className={({ isActive }) =>
                  cn(
                    'rail-in group relative isolate flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-[14px] font-semibold transition-colors duration-200',
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
                    <>
                      <motion.span
                        layoutId={pillId}
                        aria-hidden="true"
                        className="from-ghost-500 to-ghost-400 absolute inset-0 -z-10 rounded-[14px] bg-linear-to-l shadow-[0_10px_24px_rgb(109_92_255/0.35)] ltr:bg-linear-to-r"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                      {/* A breathing dot on the reading edge of the active row. */}
                      <span aria-hidden="true" className="absolute start-2 top-1/2 z-10 -translate-y-1/2">
                        <span className="bg-white block size-1.5 rounded-full shadow-[0_0_8px_rgb(255_255_255/0.85)]" />
                        <span className="bg-white animate-ping-soft absolute inset-0 rounded-full" />
                      </span>
                    </>
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
          </div>
        ))}

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

        {/* Store card: the products, one tap away from every page. The shine
            border sweeps around the edge on hover — the one flourish worth
            spending on the card a visitor sees on every single route. */}
        <ShineBorder className="mt-4 rounded-2xl" width={1.5}>
          <Link
            to="/shop"
            className="group border-app bg-elevated hover:border-ghost-400/50 relative block overflow-hidden rounded-2xl border p-4 transition-colors"
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
        </ShineBorder>
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
          {/* A short beam of TikTok colours travelling the card's edge —
              the card is the one dark slab in a light sidebar, so the
              moving light keeps it from reading as a dead block. */}
          <BorderBeam size={70} duration={9} colorFrom="var(--color-tiktok-500)" colorTo="var(--color-tiktok-600)" />
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

// Every section, in the phone strip — not a "More" shortcut that hides
// half the site. The strip scrolls horizontally; the More button is the
// last chip and opens the full drawer (categories, store card, socials).
const mobileNav = primaryNav

/** A thin gradient reading-progress bar pinned to the bottom edge of the
    header. Reads the page column (`pane`), rAF-throttled; `scaleX` writes
    only, and `origin` flips per direction so it grows from the reading
    edge in both RTL and LTR. */
function ScrollProgress({ pane }: { pane: RefObject<HTMLDivElement | null> }) {
  const bar = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const set = () => {
      const el = pane.current
      if (!el || !bar.current) return
      const max = el.scrollHeight - el.clientHeight
      bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, el.scrollTop / max) : 0})`
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(set)
    }
    const target = pane.current
    set()
    target?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      target?.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [pane])

  return (
    <span
      ref={bar}
      aria-hidden="true"
      className="from-ghost-500 via-ghost-400 to-veil-400 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2.5px] origin-left scale-x-0 bg-linear-to-r rtl:origin-right ltr:bg-linear-to-r rtl:bg-linear-to-l"
    />
  )
}

/** True once the page column (the scroll pane, not the document) has
    scrolled past `offset` — drives the header's resting vs lifted state. */
function useScrolled(pane: RefObject<HTMLDivElement | null>, offset = 8) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = pane.current
    if (!el) return
    const h = () => setOn(el.scrollTop > offset)
    h()
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [pane, offset])
  return on
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const [searching, setSearching] = useState(false)
  const { collapsed: rail, toggle: toggleRail } = useRail()
  const { pathname, search } = useLocation()
  const { t, lang } = useI18n()
  const section = useSection()
  const strip = useRef<HTMLDivElement>(null)
  const pane = useRef<HTMLDivElement>(null)
  const scrolled = useScrolled(pane)
  const rtl = lang !== 'en'

  // Close the drawer on navigation and reset the page column's scroll —
  // the pane owns scrolling now, so "back to top" means its scrollTop,
  // not the window's (ScrollManager keeps anchoring hash deep links).
  // `instant`: the pane itself is smooth-scrolled, and a route change must
  // jump, not glide through the page it is leaving.
  useEffect(() => {
    setDrawer(false)
    pane.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, search])
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

  // Keep the active chip of the phone strip in view after a navigation:
  // `block: nearest` never moves the page vertically, only the strip itself.
  useEffect(() => {
    strip.current?.querySelector('[aria-current="page"]')?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    })
  }, [pathname, search])

  const boxButton =
    'bg-sunken text-muted hover:border-accent hover:text-accent grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-app transition-colors'

  return (
    <>
      {/* Decorative only, and inert: aria-hidden + pointer-events-none. */}
      <AmbientField />

      {/* Two viewport-tall columns: the sidebar never moves, and the page
          column is the scroll container — the document body never scrolls,
          so the scrollbar belongs to the page, between it and the sidebar. */}
      <div className="relative flex h-svh">
        <aside
          className={cn(
            'bg-elevated hidden h-svh shrink-0 flex-col overflow-hidden border-e border-app transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex',
            rail ? 'w-[4.75rem]' : 'w-[17.5rem]',
          )}
        >
          {rail ? (
            <SidebarRail onSearch={() => setSearching(true)} />
          ) : (
            <Sidebar onSearch={() => setSearching(true)} />
          )}
        </aside>

        {/* Edge toggle — the circular chevron button that rides the sidebar's
            inner border. `fixed` because the aside is sticky: viewport-anchored
            on both sides keeps them welded together at every scroll depth, and
            `inset-inline-start` tracks the animated width transition 1:1. */}
        <button
          type="button"
          onClick={toggleRail}
          aria-label={rail ? t('توسيع القائمة', 'Expand sidebar') : t('تصغير القائمة', 'Collapse sidebar')}
          title={rail ? t('توسيع القائمة', 'Expand sidebar') : t('تصغير القائمة', 'Collapse sidebar')}
          className={cn(
            'group/toggle text-subtle hover:border-accent hover:text-accent fixed top-[6.25rem] z-30 hidden size-7 cursor-pointer place-items-center rounded-full border border-app bg-(--bg-elevated) shadow-app-md transition-[inset-inline-start,color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:grid ltr:-translate-x-1/2 rtl:translate-x-1/2 hover:ring-4 active:scale-90',
            rail ? 'start-[4.75rem]' : 'start-[17.5rem]',
          )}
        >
          <ChevronRight
            aria-hidden="true"
            className={cn(
              'size-4 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/toggle:scale-110',
              rail !== rtl && 'rotate-180',
            )}
          />
        </button>

        {/* The scroll pane: every page lives in here, under a sticky header
            with its own scrollbar — the document body never scrolls. The
            ref callback (not an effect) publishes the pane: ref callbacks
            fire during commit, before any page widget's effect runs, so
            scroll-driven components always find it in place. */}
        <div
          ref={(el) => {
            pane.current = el
            setScrollPane(el)
          }}
          className="app-scroll min-w-0 flex-1 overflow-y-auto overflow-x-clip"
        >
          <header
            className={cn(
              'sticky top-0 z-40 border-b bg-(--bg-elevated)/85 backdrop-blur-xl transition-[box-shadow,border-color,background-color] duration-300',
              scrolled ? 'border-strong shadow-app-md bg-(--bg-elevated)/95' : 'border-app',
            )}
          >
            <ScrollProgress pane={pane} />
            <div className="mx-auto flex max-w-[90rem] items-center gap-2.5 px-4 py-3 sm:gap-3 lg:px-8 lg:py-3.5">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label={t('فتح القائمة', 'Open menu')}
                aria-expanded={drawer}
                className={cn(boxButton, 'md:hidden')}
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>

              <div className="min-w-0">
                <p className="text-subtle hidden items-center gap-2 text-[11px] font-medium sm:flex">
                  <Link to="/" dir="ltr" className="hover:text-accent">
                    {site.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                  <span className="text-accent font-bold">{section}</span>
                </p>
                <p className="text-app truncate text-[clamp(1.125rem,0.55vw+0.95rem,1.5rem)] leading-snug font-black tracking-tight">
                  {/* The title writes itself in on every section change —
                      one beat, matched to the page transition below it. */}
                  <motion.span
                    key={section}
                    initial={{ opacity: 0, y: 9 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                    className="block"
                  >
                    {section}
                  </motion.span>
                </p>
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

          {/* min-height stretches every route to at least a pane-viewport
              minus the header, so short pages still reach the footer and the
              pane's scrollbar always has somewhere to go — the page never
              "dies" partway down. */}
          <main id="main" className="min-h-[calc(100svh-4.6rem)] pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </div>

      <FloatingTelegram />
      <FloatingWhatsApp />

      {/* Phone bottom nav: every section in a scrollable strip, active chip
          marked by a short bar at its top edge, plus the More drawer. */}
      <nav
        aria-label={t('التنقل السريع', 'Quick navigation')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-app bg-(--bg-elevated)/95 px-1.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
      >
        <div ref={strip} className="no-scrollbar flex gap-1 overflow-x-auto">
          {mobileNav.map(({ to, icon: Icon, label, labelEn }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'press group/tab relative flex w-[4.6rem] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors',
                  isActive ? 'text-accent' : 'text-subtle hover:text-app',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden="true" className="from-ghost-500 to-veil-400 absolute top-0 h-0.5 w-7 rounded-full bg-linear-to-l ltr:bg-linear-to-r" />}
                  <Icon className="size-5 shrink-0 transition-transform duration-300 group-hover/tab:-translate-y-0.5" aria-hidden="true" />
                  <span className="w-full truncate text-center text-[10.5px] leading-tight font-black">{t(label, labelEn)}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="press text-subtle hover:text-app flex w-[4.6rem] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-1.5"
          >
            <Menu className="size-5 shrink-0" aria-hidden="true" />
            <span className="w-full truncate text-center text-[10.5px] leading-tight font-black">{t('المزيد', 'More')}</span>
          </button>
        </div>
      </nav>

      {/* Phone / small-tablet drawer: the same sidebar, sliding in from the
          inline-start edge. From md up the rail is permanently on screen,
          so the drawer is not needed. */}
      <div className={cn('fixed inset-0 z-50 md:hidden', drawer ? 'visible' : 'invisible')} inert={!drawer}>
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
