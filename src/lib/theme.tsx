import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ghost-theme'

type ThemeContextValue = {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Light is the default; the pre-paint script in index.html already applied it. */
function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)

  // Side effects only. Persistence lives in the setters below, so a visitor
  // who never touches the toggle is not recorded as having made a choice and
  // keeps following the OS preference.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme

    // Keep the browser chrome (address bar, notch area) in step with the
    // theme. The <meta> tags in index.html can only key off the OS preference,
    // and the site no longer follows it, so the value is set imperatively.
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = theme === 'dark' ? '#0b0f17' : '#ffffff'
  }, [theme])

  const persist = (t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* private mode — the theme just won't survive a reload */
    }
    setThemeState(t)
  }

  const setTheme = useCallback((t: Theme) => persist(t), [])
  // `setThemeState` is wrapped so the explicit-choice flag is written only
  // from a real user action.
  const toggle = useCallback(() => {
    setThemeState((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
