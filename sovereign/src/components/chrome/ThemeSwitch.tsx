import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/lib/theme'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/cn'

/**
 * ThemeSwitch — three modes, never a two-state toggle.
 *
 * A sun/moon switch silently overrides the operating system, and the user
 * has no way back to "follow the system" without clearing storage. The
 * popover keeps all three states visible, and the trigger shows the one
 * that is actually active.
 */
export function ThemeSwitch({ inline = false }: { inline?: boolean }) {
  const { mode, resolved, setMode } = useTheme()
  const { c } = useLang()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const options: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: c.meta.light, icon: Sun },
    { id: 'dark', label: c.meta.dark, icon: Moon },
    { id: 'system', label: c.meta.auto, icon: Monitor },
  ]

  if (inline) {
    return (
      <div role="group" aria-label={c.meta.theme} className="grid grid-cols-3 gap-1 rounded-xl border border-hair bg-wash p-1">
        {options.map((option) => {
          const Icon = option.icon
          const active = mode === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              aria-pressed={active}
              className={cn(
                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11.5px] font-medium transition-colors',
                active ? 'bg-panel-2 text-ink shadow-sm' : 'text-subtle hover:text-ink',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  const Trigger = resolved === 'light' ? Sun : Moon

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={c.meta.theme}
        title={`${c.meta.theme}: ${mode === 'system' ? c.meta.auto : mode === 'light' ? c.meta.light : c.meta.dark}`}
        className={cn(
          'relative grid size-10 cursor-pointer place-items-center rounded-xl border transition-colors',
          open ? 'border-hair-2 bg-wash-2 text-ink' : 'border-hair text-muted hover:border-hair-2 hover:text-ink',
        )}
      >
        <Trigger className="size-4" aria-hidden="true" />
        {mode === 'system' ? (
          <span className="absolute end-1.5 top-1.5 size-1 rounded-full bg-jade-2" aria-hidden="true" />
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label={c.meta.theme}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={reduce ? { duration: 0.12 } : { type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute end-0 top-12 z-50 w-44 overflow-hidden rounded-xl border border-hair bg-glass-2 p-1 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.6)] backdrop-blur-2xl"
          >
            <p className="mono-label px-2.5 pb-1.5 pt-1.5 text-[8px]">{c.meta.theme}</p>
            {options.map((option) => {
              const Icon = option.icon
              const active = mode === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setMode(option.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors',
                    active ? 'bg-wash-2 text-ink' : 'text-muted hover:bg-wash hover:text-ink',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span className="flex-1 text-start">{option.label}</span>
                  {active ? <Check className="size-3 text-jade-2" aria-hidden="true" /> : null}
                </button>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
