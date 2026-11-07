import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLang } from '@/lib/i18n'

type Props = {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  className?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Modal — one shell for every dialog.
 *
 * Transitions.dev rules applied: the backdrop blurs and fades on a plain
 * opacity tween; the panel arrives on a spring with a slight scale and
 * lift, so it reads as a physical object rather than a fade. Focus is
 * trapped, Escape closes, the page behind cannot scroll, and focus returns
 * to whatever opened it. Under reduced motion the spring is skipped and
 * only opacity remains.
 */
export function Modal({ open, onClose, labelledBy, children, className }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion()
  const { c } = useLang()

  useEffect(() => {
    if (!open) return
    restoreTo.current = document.activeElement as HTMLElement | null

    const body = document.body
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingInlineEnd
    const gap = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingInlineEnd = `${gap}px`

    const focusTimer = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel.current)?.focus()
    }, 40)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel.current) return
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
      body.style.overflow = previousOverflow
      body.style.paddingInlineEnd = previousPadding
      restoreTo.current?.focus?.()
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="presentation">
          <motion.div
            className="absolute inset-0 bg-[#03050A]/72 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.955, y: 26 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 14 }}
            transition={
              reduce
                ? { duration: 0.18 }
                : { type: 'spring', stiffness: 330, damping: 30, mass: 0.9 }
            }
            className={cn(
              'relative z-10 max-h-[92svh] w-full overflow-y-auto rounded-t-panel border border-hair',
              'bg-panel shadow-[0_-1px_0_0_rgb(255_255_255/0.06)_inset,0_60px_140px_-40px_rgb(0_0_0/0.95)]',
              'sm:max-w-[34rem] sm:rounded-panel',
              className,
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-hair-2 to-transparent"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={c.ui.close}
              className="absolute end-4 top-4 z-20 grid size-9 cursor-pointer place-items-center rounded-lg border border-hair bg-wash-2 text-muted transition-colors hover:border-hair-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
