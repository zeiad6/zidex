import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Copy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLang } from '@/lib/i18n'

type Props = {
  value: string
  label: string
  successLabel?: string
  className?: string
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

/**
 * CopyButton — the state change is the feedback, not a toast.
 *
 * The label cross-fades in place (the container keeps the width of the
 * longer string, so nothing around it moves) and the tick draws itself.
 * `aria-live` carries the result to a screen reader.
 */
export function CopyButton({ value, label, successLabel, className }: Props) {
  const { c } = useLang()
  const success = successLabel ?? c.ui.copied
  const [done, setDone] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const reduce = useReducedMotion()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    const ok = await writeClipboard(value)
    if (!ok) return
    setDone(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 2400)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? success : label}
      className={cn(
        'group/copy relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 text-[13px] font-semibold transition-colors duration-300',
        done
          ? 'border-jade/45 bg-jade/12 text-jade-2'
          : 'border-hair bg-wash text-ink hover:border-hair-2 hover:bg-wash-2',
        className,
      )}
    >
      <span className="relative grid size-4 place-items-center" aria-hidden="true">
        <AnimatePresence initial={false} mode="wait">
          {done ? (
            <motion.svg
              key="check"
              viewBox="0 0 24 24"
              fill="none"
              className="size-4"
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            >
              <motion.path
                d="M4 12.5 9.5 18 20 6.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.svg>
          ) : (
            <motion.span
              key="copy"
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Copy className="size-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <span className="relative grid">
        <span className={cn('col-start-1 row-start-1 transition-opacity duration-200', done ? 'opacity-0' : 'opacity-100')}>
          {label}
        </span>
        <span
          className={cn(
            'col-start-1 row-start-1 text-center transition-opacity duration-200',
            done ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
        >
          {success}
        </span>
      </span>

      <span className="sr-only" role="status" aria-live="polite">
        {done ? success : ''}
      </span>
    </button>
  )
}
