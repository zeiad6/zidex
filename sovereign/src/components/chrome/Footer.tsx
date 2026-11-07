import { Link } from 'react-router-dom'
import { ArrowUp, Send } from 'lucide-react'
import { site } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { Logo } from './Logo'

/**
 * Footer — the last instrument reading.
 *
 * No newsletter box, no four-column sitemap of pages that do not exist.
 * Two short columns of real destinations, one status line, and the mark
 * repeated large enough to close the page.
 */
export function Footer() {
  const { c } = useLang()

  return (
    <footer className="relative mt-8 border-t border-hair-soft pb-10 pt-14">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-[11px] border border-hair bg-wash text-ink">
                <Logo size={20} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-mono text-[13px] font-bold tracking-[0.16em] text-ink" dir="ltr">
                  {site.wordmark}
                </span>
                <span className="mt-1 font-mono text-[8.5px] tracking-[0.28em] text-subtle" dir="ltr">
                  SOFT · 2026
                </span>
              </span>
            </Link>

            <p className="mt-4 max-w-[36ch] text-[12.5px] leading-[1.9] text-muted">{c.footer.tagline}</p>

            <a
              href={site.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-tg/25 bg-tg/[0.07] px-3.5 py-2.5 text-[12px] font-medium text-tg-2 transition-colors hover:border-tg/45"
            >
              <Send className="size-3.5" aria-hidden="true" />
              <span className="font-mono text-[11px]" dir="ltr">
                {site.botHandle}
              </span>
            </a>
          </div>

          {c.footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
              <p className="mono-label text-[8.5px]">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => {
                  const internal = link.href.startsWith('/')
                  return (
                    <li key={link.label}>
                      {internal ? (
                        <Link
                          to={link.href}
                          className="text-[12.5px] text-muted transition-colors hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12.5px] text-muted transition-colors hover:text-ink"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
          ))}

          <div className="lg:col-span-3">
            <p className="mono-label text-[8.5px]">{c.footer.status}</p>
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2 text-[12px] text-muted">
                <span className="relative grid size-1.5 place-items-center">
                  <span className="size-1.5 rounded-full bg-jade-2" />
                  <span className="absolute inset-0 pulse-ring rounded-full bg-jade-2/70" />
                </span>
                {c.footer.allSystems}
              </p>
              <p className="font-mono text-[9px] leading-relaxed text-subtle/70">
                EDGE · TLS 1.3
                <br />
                LEDGER · SHA-256
                <br />
                SYNC · OFFLINE-FIRST
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-hair px-2.5 py-1.5 text-[10.5px] text-subtle transition-colors hover:border-hair-2 hover:text-ink"
            >
              <ArrowUp className="size-3" aria-hidden="true" />
              {c.footer.backToTop}
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hair-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[9.5px] tracking-[0.12em] text-subtle/70">
            © 2026 ZEIDEXSOFT · {site.version}
          </p>
          <p className="text-[10.5px] text-subtle/70">{c.footer.rights}</p>
        </div>

        <p
          aria-hidden="true"
          className="pointer-events-none mt-8 select-none text-center font-mono text-[clamp(2rem,8vw,5.5rem)] font-bold leading-none tracking-[0.18em] text-seal-2 [mask-image:linear-gradient(to_bottom,black_8%,transparent_94%)]"
        >
          ZEIDEXSOFT
        </p>
      </div>
    </footer>
  )
}
