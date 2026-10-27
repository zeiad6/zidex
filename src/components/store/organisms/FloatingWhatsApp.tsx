import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { site } from '@/lib/site'

/**
 * Organism: a WhatsApp contact button pinned above the bottom bar. It arrives after the
 * visitor has read for a few seconds (not on paint), opens a one-line prompt once, and
 * remembers a dismissal for the session — the Telegram button beside it shares the same
 * `floating-hint` key, so a visitor is never covered by two prompts at once.
 */
const HINT_KEY = 'floating-hint'

export function FloatingWhatsApp() {
  const { t } = useI18n()
  const reduce = useReducedMotion() ?? false
  const [shown, setShown] = useState(false)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    const a = window.setTimeout(() => setShown(true), 2500)
    const b = window.setTimeout(() => {
      try {
        if (!sessionStorage.getItem(HINT_KEY)) {
          sessionStorage.setItem(HINT_KEY, '1')
          setHint(true)
        }
      } catch {
        setHint(true)
      }
    }, 7000)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [])

  const dismiss = () => {
    setHint(false)
    try {
      sessionStorage.setItem(HINT_KEY, '1')
    } catch {
      // private mode: the hint simply returns next visit
    }
  }

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          className="fixed end-4 bottom-24 z-40 flex items-end gap-2 lg:bottom-6"
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence>
            {hint && (
              <motion.div
                initial={reduce ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="bg-elevated border-app shadow-app-lg text-app relative mb-1 max-w-[15rem] rounded-2xl border px-4 py-3 text-[13px] leading-relaxed"
              >
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label={t('إغلاق', 'Close')}
                  className="text-subtle hover:text-app absolute -top-2 -start-2 grid size-6 cursor-pointer place-items-center rounded-full border border-app bg-(--bg-elevated)"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
                {t('تحتاج بوتاً لمشروعك؟ راسلنا على واتساب ونرد عليك بسرعة.', 'Need a bot for your business? Message us on WhatsApp.')}
              </motion.div>
            )}
          </AnimatePresence>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('تواصل عبر واتساب', 'Chat on WhatsApp')}
            onClick={dismiss}
            className="group relative grid size-14 place-items-center rounded-full bg-[#1fa855] text-white shadow-[0_12px_28px_-6px_rgb(31_168_85/0.6)] transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#1fa855] opacity-40 motion-safe:animate-ping" style={{ animationDuration: '2.4s' }} />
            <MessageCircle className="relative size-7" aria-hidden="true" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
