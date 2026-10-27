import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Send, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { site } from '@/lib/site'

/**
 * Organism: a Telegram bot button pinned above the bottom bar, alongside the WhatsApp one.
 * Same rhythm as FloatingWhatsApp — it arrives after the visitor has read for a few seconds
 * (not on paint), opens a one-line prompt once, and remembers a dismissal for the session.
 * It opens the store bot so visitors can browse products and pay with Stars in-app.
 *
 * The prompt shares FloatingWhatsApp's `floating-hint` key and fires later, so the two
 * never stack: on a phone the pair covered a whole section of the page.
 */
const HINT_KEY = 'floating-hint'

export function FloatingTelegram() {
  const { t } = useI18n()
  const reduce = useReducedMotion() ?? false
  const [shown, setShown] = useState(false)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    const a = window.setTimeout(() => setShown(true), 2000)
    const b = window.setTimeout(() => {
      try {
        if (!sessionStorage.getItem(HINT_KEY)) {
          sessionStorage.setItem(HINT_KEY, '1')
          setHint(true)
        }
      } catch {
        setHint(true)
      }
    }, 12000)
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
          className="fixed end-4 bottom-[10.5rem] z-40 flex items-end gap-2 lg:bottom-[5.25rem]"
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
                {t('جرّب البوت مباشرة على تيليجرام — تسوّق وادفع بالنجوم فوراً.', 'Try the bot on Telegram — browse and pay with Stars instantly.')}
              </motion.div>
            )}
          </AnimatePresence>
          <a
            href={site.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('افتح بوت تيليجرام', 'Open the Telegram bot')}
            onClick={dismiss}
            className="group relative grid size-14 place-items-center rounded-full bg-[#2AABEE] text-white shadow-[0_12px_28px_-6px_rgb(42_171_238/0.6)] transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#2AABEE] opacity-40 motion-safe:animate-ping" style={{ animationDuration: '2.8s' }} />
            <Send className="relative size-6 -translate-x-px" aria-hidden="true" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
