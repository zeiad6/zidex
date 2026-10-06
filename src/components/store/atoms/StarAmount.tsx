import { Star } from 'lucide-react'
import { formatStars } from '@/lib/store'
import { cn } from '@/lib/utils'

/** Atom: the Stars glyph plus an amount. Every Stars figure on the site renders through it. */
export function StarAmount({ value, className, iconClassName }: { value: number; className?: string; iconClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-black tabular-nums', className)} dir="ltr">
      <Star className={cn('size-3.5 shrink-0 fill-amber-400 text-amber-400', iconClassName)} aria-hidden="true" />
      {formatStars(value)}
    </span>
  )
}
