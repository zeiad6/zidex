import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Molecule: what a package includes, one checked line each. */
export function FeatureList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('grid gap-2.5', className)}>
      {items.map((f) => (
        <li key={f} className="text-muted flex items-start gap-2.5 text-[14px] leading-relaxed">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
          {f}
        </li>
      ))}
    </ul>
  )
}
