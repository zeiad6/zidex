import type { ReactNode } from 'react'

/** Template: a store section — heading, one line of context, optional action, content. */
export function StoreSection({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="border-t border-app pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-app text-2xl font-black text-balance">
            {title}
          </h2>
          {subtitle ? <p className="text-subtle mt-1.5 max-w-[62ch] text-[14px]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
