/* ------------------------------------------------------------------ *
 * The shop catalogue. The source of truth is the bot (bot/shop.py);
 * `python -m bot.storefront public/store/catalog.json` writes this file
 * with one reusable Telegram invoice link per product. The site reads it
 * at runtime, the same file the Telegram Mini App at /store/ reads.
 * ------------------------------------------------------------------ */
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'

export type StoreProduct = {
  sku: string
  title: string
  title_en: string
  description: string
  description_en: string
  stars: number
  /** Price before the opening offer; absent or equal when nothing is discounted. */
  stars_full?: number
  category: 'bots' | 'channel' | string
  monthly: boolean
  featured: boolean
  features: string[]
  features_en: string[]
  /** Price on the website for methods other than Stars. */
  usd: number
  usd_full?: number
  /** The product's own mark (scripts/product-marks.py). */
  image?: string
  /** /demo key in the bot ("store", "group", …); empty when there is no demo. */
  demo?: string
  invoice: string
}

/** Website-only methods; each key exists only when the operator configured it. */
export type Payments = {
  stars: true
  ton?: { wallet: string; usdt_master: string }
  paypal?: string
  card?: Record<string, string>
  /** Bank transfer to the owner's Kuraimi accounts, by currency. Website only. */
  kuraimi_transfer?: { accounts: Partial<Record<'USD' | 'YER' | 'SAR', string>>; name?: string }
}

export type Offer = { pct: number; ends: string }

export type Catalog = {
  bot: string
  currency: string
  payments?: Payments
  whatsapp?: string
  offer?: Offer | null
  products: StoreProduct[]
}

export const STORE_LOGO = '/store/img/zeidex-bot.webp'
export const STORE_SHOT = '/store/img/storefront-ar.webp'
/** The Telegram Mini App version of the shop (opens inside Telegram). */
export const MINI_APP_PATH = '/store/'
/** Fragment sells Stars for TON, roughly 30% under the in-app price. */
export const FRAGMENT_STARS = 'https://fragment.com/stars/buy'

export const productImage = (p: Pick<StoreProduct, 'sku' | 'image'>) => p.image ?? `/store/img/products/${p.sku}.webp`
export const buyLink = (c: Catalog, sku: string) => `https://t.me/${c.bot}?start=buy_${encodeURIComponent(sku)}`
export const botLink = (c: Catalog) => `https://t.me/${c.bot}`
export const demoLink = (c: Catalog, key: string) => `https://t.me/${c.bot}?start=demo_${key}`
export const starsLink = (c: Catalog) => `https://t.me/${c.bot}?start=buystars`
export const formatStars = (n: number) => n.toLocaleString('en-US')

// One request per page load, shared by every component that asks.
let pending: Promise<Catalog> | null = null
function loadCatalog() {
  pending ??= fetch('/store/catalog.json', { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json() as Promise<Catalog>
  })
  pending.catch(() => {
    pending = null
  })
  return pending
}

/**
 * Loads the catalogue once per page load and shares the promise.
 *
 * `enabled` exists for the surfaces that render everywhere but need the
 * catalogue only on demand — the ⌘K dialog lives in the app shell, so a
 * plain `useCatalog()` there would fetch 15 KB of JSON on the blog for a
 * search box that may never be opened.
 */
export function useCatalog(enabled = true) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    loadCatalog()
      .then((c) => alive && setCatalog(c))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [enabled])
  return { catalog, failed }
}

/**
 * Product text search, matched the same way the Telegram bot matches:
 * any word of the query appearing anywhere in the title or description
 * counts. An exact-phrase-only search hides products from buyers who type
 * two of the five words in the name they are looking for.
 */
export function searchProducts(products: StoreProduct[], query: string, lang: 'ar' | 'en' = 'ar') {
  const q = norm(query)
  if (!q) return []
  const words = q.split(' ').filter(Boolean)
  return products.filter((p) => {
    const hay = norm(`${lang === 'en' ? p.title_en : p.title} ${lang === 'en' ? p.description_en : p.description} ${p.sku}`)
    return hay.includes(q) || words.some((w) => hay.includes(w))
  })
}

/**
 * Folds Arabic and Latin into one comparable form, mirroring `norm()` in
 * worker/bots.ts: harakat, tatweel, Arabic-Indic digits, the alef/ya/ha
 * spellings and every punctuation mark come out, so a buyer who types
 * "الدفع" finds a product titled "الدَّفع".
 */
function norm(input: string) {
  return input
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Localised product copy in one place, so every surface reads the same fields. */
export function useProductCopy() {
  const { lang } = useI18n()
  const en = lang === 'en'
  return (p: StoreProduct) => ({
    title: en ? p.title_en : p.title,
    description: en ? p.description_en : p.description,
    features: (en ? p.features_en : p.features) ?? [],
  })
}

