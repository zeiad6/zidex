import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'ar' | 'en'

const STORAGE_KEY = 'ghost-lang'

type I18nContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  /** Picks the value for the active language: `t('مرحباً', 'Hello')`. Works for JSX too. */
  t: <T,>(ar: T, en: T) => T
}

const I18nContext = createContext<I18nContextValue | null>(null)

/** Arabic is the default; the pre-paint script in index.html already applied any stored choice. */
function readInitialLang(): Lang {
  if (typeof document === 'undefined') return 'ar'
  return document.documentElement.lang === 'en' ? 'en' : 'ar'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang)

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* private mode — the choice just won't survive a reload */
    }
    setLangState(l)
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: (ar, en) => (lang === 'ar' ? ar : en) }),
    [lang, setLang],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
