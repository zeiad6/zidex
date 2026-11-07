import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { copy, type Copy } from './copy'

export type Lang = 'ar' | 'en'

const STORAGE_KEY = 'zeidex-lang'

type LangValue = {
  lang: Lang
  dir: 'rtl' | 'ltr'
  /** Picks the value for the active language: `t('مرحباً', 'Hello')`. */
  t: <T,>(ar: T, en: T) => T
  /** The whole copy tree for the active language. */
  c: Copy
  setLang: (next: Lang) => void
  toggle: () => void
}

const LangContext = createContext<LangValue | null>(null)

/**
 * The pre-paint script in index.html already set <html lang> from storage,
 * so React reads the decision instead of making a second one. That is what
 * keeps the first frame from flashing the wrong direction.
 */
function readInitial(): Lang {
  if (typeof document === 'undefined') return 'ar'
  return document.documentElement.lang === 'en' ? 'en' : 'ar'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial)

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode — the choice just won't survive a reload */
    }
    setLangState(next)
  }, [])

  const value = useMemo<LangValue>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      t: (ar, en) => (lang === 'ar' ? ar : en),
      c: copy[lang],
      setLang,
      toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}

/** Convenience: `const c = useCopy()` for the active language's prose. */
export function useCopy(): Copy {
  return useLang().c
}
