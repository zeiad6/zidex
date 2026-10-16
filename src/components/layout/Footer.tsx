import { socials, site } from '@/lib/site'
import { useI18n } from '@/lib/i18n'

/** One line at the bottom of the main column: the sidebar already carries
    navigation. The hairline is a violet fade rather than a flat grey rule,
    so the footer closes the page with the same voice the sidebar opens it. */
export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="relative mt-16 pt-6 pb-6">
      <span
        aria-hidden="true"
        className="from-ghost-500/50 via-ghost-400/20 pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-l to-transparent ltr:bg-linear-to-r"
      />
      <div className="container-app">
        <div className="text-subtle flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name} — {t('صُنع بعناية 🤍', 'Made with care 🤍')}
          </p>
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <li>
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-app transition-colors">
                {t('واتساب', 'WhatsApp')}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="link-underline hover:text-app transition-colors" dir="ltr">
                {site.email}
              </a>
            </li>
            {socials.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noopener noreferrer nofollow" className="link-underline hover:text-app transition-colors">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
