import { Languages } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/cn'

/**
 * LangSwitch — one button, always showing the language you would get.
 *
 * "EN" while reading Arabic, "ع" while reading English. A button labelled
 * with the current language is the classic i18n trap: it reads as a status,
 * not as an action.
 */
export function LangSwitch({ className }: { className?: string }) {
  const { lang, toggle, c } = useLang()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${c.meta.language}: ${lang === 'ar' ? 'English' : 'العربية'}`}
      title={lang === 'ar' ? 'English' : 'العربية'}
      className={cn(
        'group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-hair px-2.5 text-muted transition-colors hover:border-hair-2 hover:text-ink',
        className,
      )}
    >
      <Languages className="size-3.5 opacity-70" aria-hidden="true" />
      <span className={cn('font-semibold leading-none', lang === 'ar' ? 'font-mono text-[11px] tracking-[0.08em]' : 'text-[13px]')}>
        {lang === 'ar' ? 'EN' : 'ع'}
      </span>
    </button>
  )
}
