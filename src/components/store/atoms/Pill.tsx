import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Atom: a small rounded label ("Most popular", "Monthly"). */
export function Pill({ children, tone = 'accent', className }: { children: ReactNode; tone?: 'accent' | 'muted' | 'success'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
        tone === 'accent' && 'bg-ghost-500 text-white',
        tone === 'muted' && 'bg-sunken text-subtle',
        tone === 'success' && 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        className,
      )}
    >
      {children}
    </span>
  )
}
