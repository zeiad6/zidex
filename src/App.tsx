import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Footer } from '@/components/layout/Footer'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import Home from '@/pages/Home'
import { useI18n } from '@/lib/i18n'

/* The home page ships in the initial bundle; everything else is fetched on
   demand, which keeps the entry chunk small on a slow mobile connection. */
const Links = lazy(() => import('@/pages/Links'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const About = lazy(() => import('@/pages/About'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Programs = lazy(() => import('@/pages/Programs'))

/** Every navigation starts at the top — except a deep link with a hash. */
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }
    const target = hash.slice(1)
    // /about and /blog/:slug are lazy chunks, so on a cold deep link the
    // anchor does not exist yet when the first frame runs. Retry until it
    // shows up, then stop.
    let tries = 0
    let id = 0
    const tick = () => {
      const el = document.getElementById(target)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      if (tries++ < 90) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [pathname, hash])

  return null
}

/** Matches the page background so a route change never flashes white. */
function RouteFallback() {
  const { t } = useI18n()
  return (
    <div className="container-app grid min-h-[60svh] place-items-center" aria-busy="true">
      <span className="border-app border-t-accent size-9 animate-spin rounded-full border-2" />
      <span className="sr-only">{t('جارٍ التحميل', 'Loading')}</span>
    </div>
  )
}

export default function App() {
  const { t } = useI18n()
  return (
    <div className="bg-app text-app relative min-h-[100svh]">
      <ScrollManager />

      <a
        href="#main"
        className="bg-accent text-accent-fg focus:ring-accent sr-only rounded-full px-5 py-2.5 text-sm font-medium focus:not-sr-only focus:absolute focus:inset-x-0 focus:top-3 focus:z-100 focus:mx-auto focus:w-fit focus:ring-2"
      >
        {t('تخطَّ إلى المحتوى', 'Skip to content')}
      </a>

      <AppShell>
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/links" element={<Links />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Footer />
      </AppShell>
    </div>
  )
}
