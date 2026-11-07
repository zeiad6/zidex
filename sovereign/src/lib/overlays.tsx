import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { OrderModal } from '@/components/modals/OrderModal'
import { ArticleModal } from '@/components/modals/ArticleModal'
import { ProgramModal } from '@/components/programs/ProgramModal'
import { articleFor, toArticle, type Article } from './articles'
import type { Post } from './posts'
import type { Program } from './programs'
import type { OrderTarget } from './content'

/** The order dialog's exit takes 300ms; opening the next one under it
    would show two backdrops mid-spring. */
const HANDOFF = 300

type OverlayApi = {
  openOrder: (target: OrderTarget) => void
  openArticle: (post: Post) => void
  openProgram: (program: Program) => void
  closeAll: () => void
}

const OverlayContext = createContext<OverlayApi | null>(null)

/**
 * Overlays — the three dialogs every page can reach.
 *
 * They live above the router, not inside a page: opening a program from
 * /programs and then its article must not depend on which component owns
 * the state, and a route change should close whatever was open.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<OrderTarget | null>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [program, setProgram] = useState<Program | null>(null)

  const openOrder = useCallback((target: OrderTarget) => setOrder(target), [])
  const openArticle = useCallback((post: Post) => setArticle(toArticle(post)), [])

  const openProgram = useCallback((next: Program) => setProgram(next), [])

  const readProgramArticle = useCallback((slug: string) => {
    const next = articleFor(slug)
    setProgram(null)
    if (next) window.setTimeout(() => setArticle(next), HANDOFF)
  }, [])

  const closeAll = useCallback(() => {
    setOrder(null)
    setArticle(null)
    setProgram(null)
  }, [])

  const value = useMemo<OverlayApi>(
    () => ({ openOrder, openArticle, openProgram, closeAll }),
    [openOrder, openArticle, openProgram, closeAll],
  )

  return (
    <OverlayContext.Provider value={value}>
      {children}
      <OrderModal target={order} onClose={() => setOrder(null)} />
      <ArticleModal article={article} onClose={() => setArticle(null)} />
      <ProgramModal
        program={program}
        onClose={() => setProgram(null)}
        onReadArticle={readProgramArticle}
      />
    </OverlayContext.Provider>
  )
}

export function useOverlays(): OverlayApi {
  const ctx = useContext(OverlayContext)
  if (!ctx) throw new Error('useOverlays must be used inside <OverlayProvider>')
  return ctx
}
