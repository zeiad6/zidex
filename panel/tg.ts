/* لوحة التحكم المصغّرة — طبقة تيليجرام: مصادقة initData، ثيم العميل، أزرار أصلية.
   كل دالة تتحقق من وجود الـSDK فترجع بهدوء في وضع المتصفح. */

export interface TgWebApp {
  readonly initData: string
  readonly initDataUnsafe: { readonly user?: { readonly language_code?: string; readonly first_name?: string } }
  readonly colorScheme: 'light' | 'dark'
  readonly version: string
  ready(): void
  expand(): void
  onEvent(event: string, cb: () => void): void
  setHeaderColor?(color: string): void
  setBackgroundColor?(color: string): void
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void }
  HapticFeedback?: { impactOccurred(style: 'light' | 'medium' | 'heavy'): void; notificationOccurred(type: 'error' | 'success' | 'warning'): void }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp }
  }
}

export const webapp = (): TgWebApp | undefined => {
  try {
    return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
  } catch {
    return undefined
  }
}

export const initData = (): string => webapp()?.initData ?? ''

export const inTelegram = (): boolean => (webapp()?.initData ?? '').length > 0

export const telegramLang = (): 'ar' | 'en' => {
  const code = webapp()?.initDataUnsafe?.user?.language_code ?? ''
  return code.startsWith('en') ? 'en' : 'ar'
}

export const ready = (): void => {
  const wa = webapp()
  if (!wa) return
  try {
    wa.ready()
    wa.expand()
    wa.setHeaderColor?.('secondary_bg_color')
    wa.setBackgroundColor?.('bg_color')
  } catch {
    /* إصدار قديم — لا يهم */
  }
}

export const haptic = (kind: 'tap' | 'done' | 'warn' = 'tap'): void => {
  const h = webapp()?.HapticFeedback
  if (!h) return
  try {
    if (kind === 'done') h.notificationOccurred('success')
    else if (kind === 'warn') h.notificationOccurred('warning')
    else h.impactOccurred('light')
  } catch {
    /* لا شيء */
  }
}

/** ثيم العميل داخل تيليجرام — المصدر الوحيد للثيم هناك. */
export const telegramScheme = (): 'light' | 'dark' | undefined => webapp()?.colorScheme

export const onThemeChange = (cb: () => void): void => {
  try {
    webapp()?.onEvent('themeChanged', cb)
  } catch {
    /* لا شيء */
  }
}

/** الهوية من hash الرابط: /panel/#id=<botId> — تيليجرام يحفظ الهاش كما هو. */
export const routeFromHash = (): { id: string; code: string } => {
  const h = new URLSearchParams(location.hash.replace(/^#\/?/, ''))
  return { id: (h.get('id') ?? '').trim(), code: (h.get('k') ?? '').trim() }
}
