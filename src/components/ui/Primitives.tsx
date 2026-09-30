import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn, copyText } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

/** Copy-to-clipboard button with a two-second confirmation state. */
export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
  onCopied,
}: {
  value: string
  label?: string
  copiedLabel?: string
  className?: string
  onCopied?: () => void
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const handle = async () => {
    const ok = await copyText(value)
    if (!ok) return
    setCopied(true)
    onCopied?.()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handle}
      className={cn(
        'btn btn-ghost h-9 cursor-pointer px-3.5 text-xs',
        copied && 'border-emerald-500/50 text-emerald-500',
        className,
      )}
      aria-live="polite"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden="true">
          <path d="m4.5 12.5 4.5 4.5L19.5 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A1.5 1.5 0 0 0 5.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      {copied ? (copiedLabel ?? t('تم النسخ', 'Copied')) : (label ?? t('نسخ', 'Copy'))}
    </button>
  )
}

/** Lightweight toast that self-dismisses; used for share/copy feedback. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  // onDone is a fresh arrow on every parent render, so it is deliberately
  // excluded from the deps: keying the timer on it would restart the
  // dismissal whenever anything above re-rendered.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => onDoneRef.current(), 2400)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-100 lg:bottom-6 flex justify-center px-4"
    >
      <div className="animate-caret glass shadow-app-lg rounded-full border border-app px-4 py-2.5 text-sm font-medium text-app">
        {message}
      </div>
    </div>
  )
}

/** Section heading used across pages so vertical rhythm stays consistent. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'start',
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'start' | 'center'
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
      )}
    >
      {eyebrow ? (
        <span className="chip w-fit bg-accent-soft text-accent">
          <span className="size-1.5 rounded-full bg-accent" />
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-muted text-base leading-relaxed sm:text-lg">{description}</p>
      ) : null}
      {children}
    </div>
  )
}
