import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/lib/theme'
import { useI18n } from '@/lib/i18n'

/** Sun / moon toggle. The knob morphs between both glyphs and a small ray burst. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  const isDark = theme === 'dark'
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t('التبديل إلى الوضع النهاري', 'Switch to light mode') : t('التبديل إلى الوضع الليلي', 'Switch to dark mode')}
      title={isDark ? t('الوضع النهاري', 'Light mode') : t('الوضع الليلي', 'Dark mode')}
      className={`group bg-sunken text-muted hover:border-accent hover:text-accent relative grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-app transition-colors ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-soft),transparent_68%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {!mounted ? (
        <span className="size-5 rounded-full bg-[color:var(--line-strong)]" />
      ) : (
        <span className="relative grid size-5 place-items-center">
          <motion.span
            key="sun"
            aria-hidden="true"
            initial={false}
            animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? -90 : 0, scale: isDark ? 0.5 : 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6 17 17M7 7 5.4 5.4" />
              </g>
            </svg>
          </motion.span>
          <motion.span
            key="moon"
            aria-hidden="true"
            initial={false}
            animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : 90, scale: isDark ? 1 : 0.5 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <path
                d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a8.6 8.6 0 1 0 10.6 10.6Z"
                fill="currentColor"
              />
            </svg>
          </motion.span>
        </span>
      )}
    </button>
  )
}
