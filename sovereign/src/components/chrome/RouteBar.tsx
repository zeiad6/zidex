import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/**
 * RouteBar — where am I, and how big is this page.
 *
 * A site with nine routes needs one honest locator on every inner page.
 * This is that locator and nothing else: breadcrumb on the reading edge,
 * the section's ordinal on the other. No page title here — the page owns
 * its own headline a few hundred pixels below.
 */
export function RouteBar() {
  const { pathname } = useLocation()
  const { lang, c } = useLang()
  const route = routes.find((item) => item.path === pathname)
  if (!route || route.id === 'home') return null


  return (
    <div className="border-b border-hair-soft">
      <div className="shell flex h-11 items-center justify-between gap-4">
        <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-2">
          <Link
            to="/"
            className="mono-label text-[8.5px] text-subtle transition-colors hover:text-ink"
          >
            {lang === 'ar' ? 'الرئيسية' : 'HOME'}
          </Link>
          <ChevronLeft className="arrow-rtl size-3 text-subtle/40" aria-hidden="true" />
          <span aria-current="page" className="mono-label truncate text-[8.5px] text-ink/80">
            {route.label[lang]}
          </span>
        </nav>

        <div className="flex shrink-0 items-center gap-2.5">
          <span className="mono-label text-[8.5px] text-subtle/70">
            {c.ui.section} <bdi dir="ltr">{route.index} / {String(routes.length - 1).padStart(2, '0')}</bdi>
          </span>
          <span className="hidden h-3 w-px bg-hair sm:block" aria-hidden="true" />
          <span className="mono-label hidden text-[8.5px] text-jade/70 sm:block">
            {route.short.en.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}
