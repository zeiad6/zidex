import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'zeidex-theme'

type ThemeValue = {
  mode: ThemeMode
  resolved: ResolvedTheme
  setMode: (next: ThemeMode) => void
  /** light → dark → system → light … */
  cycle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

const LIGHT_QUERY = '(prefers-color-scheme: light)'

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark'
}

function readStoredMode(): ThemeMode {
  if (typeof document === 'undefined') return 'system'
  const attr = document.documentElement.dataset.themeMode
  if (attr === 'light' || attr === 'dark' || attr === 'system') return attr
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* private mode */
  }
  return 'system'
}

function apply(mode: ThemeMode): ResolvedTheme {
  const resolved: ResolvedTheme = mode === 'system' ? systemTheme() : mode
  const root = document.documentElement
  root.dataset.theme = resolved
  root.dataset.themeMode = mode
  root.style.colorScheme = resolved

  // The browser chrome follows the page, not the other way round.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = resolved === 'light' ? '#f5f7f3' : '#06080d'

  return resolved
}

/**
 * Theme — three modes, one attribute.
 *
 * `system` is not a third palette: it resolves to light or dark and then
 * keeps listening, so a laptop that switches at sunset switches the page
 * with it. The attribute on <html> is the only state the CSS sees; React
 * never passes a colour down to a component.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    typeof document === 'undefined' ? 'dark' : (document.documentElement.dataset.theme as ResolvedTheme) || 'dark',
  )

  useEffect(() => {
    setResolved(apply(mode))
  }, [mode])

  // A system-mode page must react to the OS switching mid-session.
  useEffect(() => {
    if (mode !== 'system') return
    const media = window.matchMedia(LIGHT_QUERY)
    const onChange = () => setResolved(apply('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode */
    }
    setModeState(next)
  }, [])

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      resolved,
      setMode,
      cycle: () => setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'),
    }),
    [mode, resolved, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
