import { socials, site } from '@/lib/site'
import { useI18n } from '@/lib/i18n'

/** One line at the bottom of the main column: the sidebar already carries
    navigation. The hairline is a violet fade rather than a flat grey rule,
    so the footer closes the page with the same voice the sidebar opens it. */
export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="relative mt-16 pt-8 pb-8">
      <span
        aria-hidden="true"
        className="from-ghost-500/50 via-ghost-400/20 pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-l to-transparent ltr:bg-linear-to-r"
      />
      <div className="container-app">
        <div className="flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img src="/zeidex-mark.png" alt={site.name} width={22} height={22} className="size-5.5 rounded-md object-cover" />
            <p className="text-muted">
              © {new Date().getFullYear()} <span className="font-bold text-app">{site.name}</span> — {t('صُنع باحترافية وإتقان 🤍', 'Crafted with precision 🤍')}
            </p>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-muted">
            <li>
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-accent transition-colors">
                {t('واتساب', 'WhatsApp')}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="link-underline hover:text-accent transition-colors" dir="ltr">
                {site.email}
              </a>
            </li>
            {socials.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noopener noreferrer nofollow" className="link-underline hover:text-accent transition-colors">
                  {s.name} ({site.handle})
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
