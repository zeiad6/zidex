import { Link } from 'react-router-dom'
import { ArrowUpLeft } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { routes } from '@/lib/routes'

export default function NotFound() {
  const { c, lang } = useLang()

  return (
    <section className="relative pb-28 pt-16 sm:pt-20">
      <div className="shell">
        <p className="mono-label text-[9px] text-aurum/80">ERROR · 404</p>
        <h1 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-semibold text-ink">{c.ui.notFoundTitle}</h1>
        <p className="mt-3 max-w-[54ch] text-[14px] leading-[1.9] text-muted">{c.ui.notFoundLead}</p>
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          {routes.filter((route) => route.id !== 'home').map((route) => (
            <Link
              key={route.id}
              to={route.path}
              className="flex items-center justify-between rounded-xl border border-hair-soft bg-panel/60 px-4 py-3 text-[13px] text-muted transition-colors hover:border-hair hover:text-ink"
            >
              {route.label[lang]}
              <span className="mono-label text-[8.5px]">{route.index}</span>
            </Link>
          ))}
        </div>
        <Link to="/" className="btn btn-primary mt-8 w-full sm:w-auto">
          {c.ui.notFoundCta}
          <ArrowUpLeft className="arrow-rtl size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
