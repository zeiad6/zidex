import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpLeft, Menu, Send, X } from 'lucide-react'
import { site } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { primaryRoutes, routes } from '@/lib/routes'
import { cn } from '@/lib/cn'
import { Logo } from './Logo'
import { ThemeSwitch } from './ThemeSwitch'
import { LangSwitch } from './LangSwitch'

/**
 * Navbar — one floating glass bar, one active route.
 *
 * With a page per section the active state is just the pathname: no
 * geometry, no IntersectionObserver, no flicker. The only scroll listener
 * left is the reading progress hairline welded to the pill's lower edge.
 */
export function Navbar() {
  const { pathname } = useLocation()
  const { c, lang } = useLang()
  const [open, setOpen] = useState(false)
  const progress = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progress.current) {
        progress.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  // A route change must never leave the mobile sheet hanging over the page.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <header className="fixed inset-x-0 top-9 z-50">
        <div className="shell">
          <nav
            aria-label={c.meta.mainNav}
            className={cn(
              'relative mx-auto flex h-[3.65rem] max-w-[70rem] items-center gap-1.5 rounded-2xl border border-hair px-2.5',
              'nav-shell',
              'backdrop-blur-2xl backdrop-saturate-150',
            )}
          >
            <Link
              to="/"
              className="group flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-1.5"
              aria-label={`${site.name} — ${routes[0].label[lang]}`}
            >
              <span className="relative grid size-9 place-items-center rounded-[11px] border border-hair bg-wash text-ink transition-colors group-hover:border-jade/35">
                <Logo size={20} />
                <span
                  className="absolute inset-0 rounded-[11px] bg-jade/10 opacity-0 blur-md transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-mono text-[13px] font-bold tracking-[0.16em] text-ink" dir="ltr">
                  {site.wordmark}
                </span>
                <span className="mt-1 hidden font-mono text-[8.5px] tracking-[0.28em] text-subtle sm:block">
                  SOFT · 2026
                </span>
              </span>
            </Link>

            <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-hair lg:block" />

            <div className="hidden items-center gap-0.5 lg:flex">
              {primaryRoutes.map((route) => {
                const active = pathname === route.path
                return (
                  <Link
                    key={route.id}
                    to={route.path}
                    data-active={active}
                    aria-current={active ? 'page' : undefined}
                    className="nav-link"
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 rounded-[10px] border border-hair bg-wash-2"
                        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    {route.short[lang]}
                  </Link>
                )
              })}
            </div>

            <span className="flex-1" />

            <LangSwitch className="size-10 !px-0 justify-center" />

            <ThemeSwitch />

            <Link
              to="/trial"
              className="btn btn-primary hidden !h-10 !rounded-xl !px-4 !text-[12.5px] lg:inline-flex"
            >
              {lang === 'ar' ? 'ابدأ التجربة' : 'Start free'}
              <ArrowUpLeft className="arrow-rtl size-3.5" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? c.meta.closeMenu : c.meta.openMenu}
              className="grid size-10 cursor-pointer place-items-center rounded-xl border border-hair text-muted transition-colors hover:text-ink lg:hidden"
            >
              {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>

            <span className="pointer-events-none absolute inset-x-3 bottom-0 h-px overflow-hidden" aria-hidden="true">
              <span
                ref={progress}
                className="block h-full origin-right scale-x-0 bg-gradient-to-l from-jade via-tg to-aurum opacity-70 rtl:origin-right ltr:origin-left"
              />
            </span>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
            transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 360, damping: 32 }}
            className="fixed inset-x-0 top-[7.35rem] z-40 px-4 lg:hidden"
          >
            <div className="mx-auto max-h-[calc(100svh-9rem)] max-w-[70rem] overflow-y-auto rounded-2xl border border-hair bg-glass-2 p-2 shadow-[0_40px_90px_-40px_rgb(0_0_0/0.7)] backdrop-blur-2xl">
              {routes.map((route) => {
                const active = pathname === route.path
                return (
                  <Link
                    key={route.id}
                    to={route.path}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-4 py-3 text-[14.5px] font-medium transition-colors',
                      active ? 'bg-wash-2 text-ink' : 'text-muted hover:bg-wash hover:text-ink',
                    )}
                  >
                    {route.label[lang]}
                    <span className="mono-label text-[9px]">{route.index}</span>
                  </Link>
                )
              })}

              <div className="mt-2 border-t border-hair pt-2">
                <ThemeSwitch inline />
              </div>

              <Link
                to="/trial"
                className="mt-2 flex items-center justify-between rounded-xl border border-aurum/30 bg-aurum/[0.09] px-4 py-3 text-[13.5px] font-semibold text-aurum-2"
              >
                {lang === 'ar' ? 'ابدأ التجربة المجانية' : 'Start the free trial'}
                <ArrowUpLeft className="arrow-rtl size-4" aria-hidden="true" />
              </Link>

              <a
                href={site.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center justify-between rounded-xl border border-tg/25 bg-tg/[0.08] px-4 py-3 text-[13.5px] font-semibold text-tg-2"
              >
                <span className="flex items-center gap-2">
                  <Send className="size-4" aria-hidden="true" />
                  {lang === 'ar' ? 'افتح بوت المتجر' : 'Open the store bot'}
                </span>
                <span className="font-mono text-[10px]" dir="ltr">
                  {site.botHandle}
                </span>
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
