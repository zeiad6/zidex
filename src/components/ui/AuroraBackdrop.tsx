import { cn } from '@/lib/utils'

/**
 * Aurora / mesh-gradient field. Pure CSS layers, no canvas, so it costs
 * nothing on a mid-range phone. Colours are declared as Tailwind tokens so
 * the same element reads correctly in both themes.
 */
export function AuroraBackdrop({
  className,
  intensity = 'md',
}: {
  className?: string
  intensity?: 'sm' | 'md' | 'lg'
}) {
  const scale =
    intensity === 'sm'
      ? 'h-64 opacity-60 blur-3xl'
      : intensity === 'lg'
        ? 'h-[34rem] opacity-80 blur-[110px]'
        : 'h-80 opacity-70 blur-[90px]'

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className={cn('animate-aurora absolute -top-1/3 right-1/4 rounded-full dark:mix-blend-screen', scale)}>
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,var(--color-ghost-500),transparent_62%)] dark:opacity-70" />
      </div>
      <div
        className={cn(
          'animate-aurora absolute bottom-[-15%] left-[8%] rounded-full opacity-0 mix-blend-screen dark:opacity-70',
          scale,
        )}
        style={{ animationDelay: '-9s' }}
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,var(--color-veil-500),transparent_62%)] dark:opacity-60" />
      </div>
      <div
        className={cn(
          'animate-aurora absolute right-[-10%] bottom-[10%] rounded-full opacity-0 mix-blend-screen dark:opacity-50',
          scale,
        )}
        style={{ animationDelay: '-17s' }}
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,var(--color-tiktok-600),transparent_64%)] dark:opacity-50" />
      </div>
      {/*
        `mix-blend-screen` was applied in both themes, but screen() can only
        lighten: over a near-white page every colour resolves to white, which
        is why the light-mode headers rendered blank. Light mode now uses plain
        normal blending (screen is applied only under `.dark`).
      */}
      {/*
        Light mode wants a structure to read against white, not a colour.
        A dot field at 4% is enough to give the header depth and it survives
        a screenshot; an aurora does not.
      */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--grid-dot)_1px,transparent_1px)] bg-[length:24px_24px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent_78%)] opacity-60 dark:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,transparent,var(--bg)_85%)] dark:hidden" />
    </div>
  )
}
