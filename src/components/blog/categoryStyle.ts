import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import type { Category } from '@/data/posts'

/* ------------------------------------------------------------------ *
 * One colour per category: the card's category label, the article header
 * band, and the sidebar tile. Literal class strings so Tailwind can see
 * them. `icon` is a glyph name, not a component, so the same table serves
 * a card label and a sidebar tile without importing two icon sets.
 * ------------------------------------------------------------------ */

export const categoryStyle: Record<
  Category,
  { icon: GlyphName; text: string; pill: string; edge: string; tile: string }
> = {
  تقنية: {
    icon: 'terminal',
    text: 'text-violet-700 dark:text-violet-300',
    pill: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
    edge: 'border-violet-300 dark:border-violet-400/40',
    tile: 'bg-violet-500',
  },
  تصميم: {
    icon: 'grid',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    pill: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-300',
    edge: 'border-fuchsia-300 dark:border-fuchsia-400/40',
    tile: 'bg-fuchsia-500',
  },
  'صناعة المحتوى': {
    icon: 'video',
    text: 'text-yellow-800 dark:text-yellow-300',
    pill: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300',
    edge: 'border-yellow-300 dark:border-yellow-400/40',
    tile: 'bg-amber-500',
  },
  'تيك توك': {
    icon: 'spark',
    text: 'text-rose-700 dark:text-rose-300',
    pill: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
    edge: 'border-rose-300 dark:border-rose-400/40',
    tile: 'bg-rose-500',
  },
  نمو: {
    icon: 'compass',
    text: 'text-emerald-700 dark:text-emerald-300',
    pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    edge: 'border-emerald-300 dark:border-emerald-400/40',
    tile: 'bg-emerald-500',
  },
}

export { Glyph }
