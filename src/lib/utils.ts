import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Arabic-friendly relative dates, with a deterministic fallback for SSR/prerender. */
export function formatDate(iso: string, locale: 'ar' | 'en' = 'ar') {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
    // Post dates are plain calendar days. Without this the visitor's timezone
    // decides the day, so anyone west of UTC saw every post one day early.
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/** Arabic digits → Latin, for a consistent numeric read in both themes. */
export function toLatinDigits(value: string | number) {
  const arabic = '٠١٢٣٤٥٦٧٨٩'
  const persian = '۰۱۲۳۴۵۶۷۸۹'
  return String(value).replace(/[٠-٩۰-۹]/g, (d) => {
    const idx = arabic.indexOf(d)
    if (idx > -1) return String(idx)
    return String(persian.indexOf(d))
  })
}

export function compactNumber(n: number, locale: 'ar' | 'en' = 'ar') {
  if (locale === 'ar') {
    if (n < 1000) return toLatinDigits(n)
    if (n < 1_000_000) return `${toLatinDigits((n / 1000).toFixed(n < 10_000 ? 1 : 0))} ألف`
    return `${toLatinDigits((n / 1_000_000).toFixed(1))} مليون`
  }
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function readingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 190))
}

export async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path below */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/**
 * Resolves `true` only when the share actually happened.
 * `navigator.share` resolves with `undefined`, so the old `.catch(() => false)`
 * form reported failure after every *successful* share — the site told the
 * visitor "sharing failed" on the success path.
 */
export async function nativeShare(data: { title: string; text?: string; url: string }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data)
      return true
    } catch {
      // AbortError (the user dismissed the sheet) is not a failure of the site,
      // but there is nothing left to do either way.
      return false
    }
  }
  return copyText(data.url)
}
