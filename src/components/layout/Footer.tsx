import { socials, site } from '@/lib/site'
import { useI18n } from '@/lib/i18n'

/** One line at the bottom of the main column: the sidebar already carries navigation. */
export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="container-app mt-16 border-t border-app py-6">
      <div className="text-subtle flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
        <p>
          © {new Date().getFullYear()} {site.name} — {t('صُنع بعناية 🤍', 'Made with care 🤍')}
        </p>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {socials.map((s) => (
            <li key={s.name}>
              <a href={s.href} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-app transition-colors">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
