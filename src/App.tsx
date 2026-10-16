import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
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
const Templates = lazy(() => import('@/pages/Templates'))
const TemplatePreview = lazy(() => import('@/pages/TemplatePreview'))
const Store = lazy(() => import('@/pages/Store'))
const StoreProduct = lazy(() => import('@/pages/StoreProduct'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Search = lazy(() => import('@/pages/Search'))
const Accounting = lazy(() => import('@/pages/Accounting'))

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

/** Fades + lifts each page in on route change; a no-op under reduced motion. */
function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
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
            <PageTransition>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/links" element={<Links />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/templates/:slug" element={<TemplatePreview />} />
                <Route path="/shop" element={<Store />} />
                <Route path="/shop/:sku" element={<StoreProduct />} />
                <Route path="/search" element={<Search />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/accounting" element={<Accounting />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </ErrorBoundary>
        <Footer />
      </AppShell>
    </div>
  )
}
