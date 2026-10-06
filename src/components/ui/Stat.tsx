import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * One figure with its label. The whole point of this component is the `note`
 * slot: a number without a stated source reads as a measurement, and a
 * measurement nobody took is a claim. Wherever a figure is a dated snapshot
 * rather than a live count, the note says so, so the number never has to be
 * believed on trust.
 */
export function Stat({
  icon: Icon,
  label,
  value,
  note,
  className,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  value: string
  /** Where the number came from, or why there is not one. */
  note?: string
  className?: string
  tone?: 'default' | 'muted'
}) {
  return (
    <div
      className={cn(
        'border-app bg-elevated shadow-app-md rounded-card border p-4',
        className,
      )}
    >
      <dt className="text-subtle flex items-center gap-2 text-[12px] font-semibold">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd
        className={cn(
          'mt-2 text-2xl font-black tabular-nums',
          tone === 'muted' && 'text-subtle',
        )}
      >
        {value}
      </dd>
      {note ? <p className="text-subtle mt-1.5 text-[11.5px] leading-relaxed">{note}</p> : null}
    </div>
  )
}