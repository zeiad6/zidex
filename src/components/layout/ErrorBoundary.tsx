import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { error: Error | null }

/* A class component cannot read the i18n context through a hook, and the
   fallback must render even if the provider is what threw. <html lang> is
   kept in sync by the provider, so it is read directly instead. */
const t = (ar: string, en: string) => (document.documentElement.lang === 'en' ? en : ar)

/**
 * Catches render-time throws and failed lazy-chunk fetches.
 *
 * Without this, one failed chunk fetch unmounts the whole tree — the Navbar
 * and Footer sit outside <Suspense>, so a flaky mobile connection would
 * white-screen the entire site with no way back.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced in the console only — nothing is sent anywhere.
    console.error('Unhandled UI error:', error.message, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const networkFailure = /dynamically imported module|ChunkLoadError|Loading chunk/i.test(
      error.message,
    )
    const message = networkFailure
      ? t(
          'تعذّر تحميل جزء من الصفحة. غالباً بسبب انقطاع مؤقت في الشبكة.',
          'Part of the page failed to load, most likely a brief network drop.',
        )
      : t('حدث خطأ غير متوقع أثناء عرض هذه الصفحة.', 'Something unexpected broke while rendering this page.')

    return (
      <div className="container-app grid min-h-[80svh] place-items-center py-24 text-center">
        <div className="flex max-w-md flex-col items-center gap-5">
          <span className="bg-accent-soft text-accent grid size-16 place-items-center rounded-3xl">
            <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden="true">
              <path
                d="M12 8.5v4.2M12 16.4h.01M10.3 3.9 2.7 17.2a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <h1 className="text-2xl font-bold tracking-tight">{t('تعطّلت الصفحة', 'This page crashed')}</h1>
          <p className="text-muted text-sm leading-relaxed">{message}</p>

          <div className="flex flex-wrap justify-center gap-2.5">
            <button type="button" onClick={this.handleRetry} className="btn btn-primary h-10 cursor-pointer px-5">
              {t('إعادة المحاولة', 'Try again')}
            </button>
            <button type="button" onClick={this.handleReload} className="btn btn-ghost h-10 cursor-pointer px-5">
              {t('تحديث الصفحة', 'Reload page')}
            </button>
            <a href="/" className="btn btn-ghost h-10 cursor-pointer px-5">
              {t('العودة للرئيسية', 'Back to home')}
            </a>
          </div>

          {/* The raw message is useful for a visitor filing a bug report. */}
          <details className="w-full text-start">
            <summary className="text-subtle cursor-pointer text-xs">{t('تفاصيل تقنية', 'Technical details')}</summary>
            <pre className="text-subtle mt-2 overflow-x-auto text-[11px] whitespace-pre-wrap" dir="ltr">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
