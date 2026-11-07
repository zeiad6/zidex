import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme'
import { LangProvider, useLang } from '@/lib/i18n'
import { OverlayProvider } from '@/lib/overlays'
import { ScrollTrigger } from '@/lib/motion'
import { useSpotlight } from '@/components/ui/Spotlight'
import { routes } from '@/lib/routes'
import { GridField } from '@/components/ui/GridField'
import { StatusBar } from '@/components/chrome/StatusBar'
import { Navbar } from '@/components/chrome/Navbar'
import { RouteBar } from '@/components/chrome/RouteBar'
import { ScrollRail } from '@/components/chrome/ScrollRail'
import { Footer } from '@/components/chrome/Footer'
import Home from '@/pages/Home'
import Solutions from '@/pages/Solutions'
import Programs from '@/pages/Programs'
import Store from '@/pages/Store'
import Accounting from '@/pages/Accounting'
import Trial from '@/pages/Trial'
import Journal from '@/pages/Journal'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import NotFound from '@/pages/NotFound'

/** A route change is a new page: start at the top, and re-measure pins. */
function RouteEffects() {
  const { pathname } = useLocation()
  const { lang, c } = useLang()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 80)
    return () => window.clearTimeout(id)
  }, [pathname])

  useEffect(() => {
    const route = routes.find((item) => item.path === pathname)
    document.title = route
      ? `${route.label[lang]} — ZeidexSoft`
      : `${c.ui.notFoundTitle} — ZeidexSoft`
  }, [pathname, lang, c])

  return null
}

function Shell() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const reduce = useReducedMotion()

  return (
    <>
      <RouteEffects />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-jade focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-void"
      >
        Skip to content
      </a>
      <GridField />
      <div className="grain" aria-hidden="true" />
      <StatusBar />
      <ScrollRail />
      <Navbar />
      {/* Route arrival: a hairline of light crosses the top while the page
          fades in. The page itself never translates — a transformed ancestor
          would break the pinned timeline on /trial. */}
      <motion.span
        key={`sweep-${pathname}`}
        aria-hidden="true"
        initial={reduce ? { opacity: 0 } : { scaleX: 0, opacity: 0.9 }}
        animate={reduce ? { opacity: 0 } : { scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-px origin-left bg-[linear-gradient(90deg,transparent,var(--c-jade),var(--c-tg),transparent)]"
      />

      <main id="main" className={isHome ? 'relative' : 'relative pt-[5.75rem]'}>
        <div key={pathname} className="page-enter">
        <RouteBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/store" element={<Store />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/trial" element={<Trial />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  useSpotlight()

  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh()
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <ThemeProvider>
      <LangProvider>
        <HashRouter>
          <OverlayProvider>
            <Shell />
          </OverlayProvider>
        </HashRouter>
      </LangProvider>
    </ThemeProvider>
  )
}
