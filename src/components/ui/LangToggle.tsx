import { useI18n } from '@/lib/i18n'

/** Arabic ⇄ English. Shows the language you would switch *to*, in that language. */
export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n()
  const next = lang === 'ar' ? 'en' : 'ar'

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      lang={next}
      aria-label={next === 'en' ? 'Switch to English' : 'التبديل إلى العربية'}
      title={next === 'en' ? 'English' : 'العربية'}
      className={`bg-sunken text-muted hover:border-accent hover:text-accent grid h-10 min-w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-app px-2 text-xs font-black transition-colors ${className}`}
    >
      {next === 'en' ? 'EN' : 'ع'}
    </button>
  )
}
