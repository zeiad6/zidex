/* ------------------------------------------------------------------ *
 * Content — every number, link and claim below is taken from the live
 * ZeidexSoft site. Nothing here is invented: the interface may be new,
 * the facts are the site's own. Prose lives in `copy.ts`; this file is
 * only the facts that do not change with the language.
 * ------------------------------------------------------------------ */

export const site = {
  name: 'ZeidexSoft',
  wordmark: 'ZEIDEX',
  version: 'v2026.11',
  bot: 'https://t.me/ZeidexStoreBot',
  botHandle: '@ZeidexStoreBot',
  whatsapp: 'https://wa.me/qr/2EZCWPVVO3DUE1?s=v',
  github: 'https://github.com/zeiad6',
  blog: 'https://zeidexsoft.com/blog.html',
  trialKey: 'ZX-TRIAL-3DAY-PRO',
  founded: '2024',
} as const

export const stats = [
  { key: 'community', value: 80000, prefix: '+', suffix: '' },
  { key: 'offline', value: 100, prefix: '', suffix: '%' },
  { key: 'edge', value: 50, prefix: '<', suffix: 'ms' },
] as const

export const terminal = {
  title: 'zeidex-cloud-engine',
  flag: '--v2026',
  command: 'zeidex-cloud-engine --v2026',
  output: [
    { text: '› region=global · mode=sovereign · booting edge runtime…', tone: 'muted' as const },
    { text: '✔ Cloudflare Workers: ACTIVE', tone: 'jade' as const, check: true },
    { text: '✔ Ledger Integrity: SHA-256 Chain Verified', tone: 'jade' as const, check: true },
    { text: '✔ Offline-First Sync: 0 pending operations', tone: 'jade' as const, check: true },
    { text: '› edge nodes 310 · tls 1.3 · p50 42ms', tone: 'muted' as const },
  ],
} as const

/* — Solutions matrix ————————————————————————————————————————— */

export type OrderTarget = {
  id: string
  name: { ar: string; en: string }
  priceStars: string
  priceUsd: string
  note: { ar: string; en: string }
}

export const storeBot = {
  id: 'store-bot-pro',
  stars: '3,750',
  usd: '~ $49.5',
} as const

export const yusr = {
  version: 'v0.2.1',
  downloads: '18,470+',
  stack: [
    ['LEDGER', 'SHA-256 Chain'],
    ['DATABASE', 'PostgreSQL 18'],
    ['AI ADVISOR', 'On-Device'],
    ['SYNC', 'LAN · Offline'],
  ] as const,
  files: [
    {
      label: '.msi',
      meta: 'Windows x64 · 255 MB',
      href: 'https://github.com/zeiad6/yusr/releases/download/v0.2.1/Yusr-Lite_0.2.1_x64_en-US.msi',
    },
    {
      label: '.deb',
      meta: 'Linux amd64 · 7.2 MB',
      href: 'https://github.com/zeiad6/yusr/releases/download/v0.2.1/Yusr_0.2.1_amd64.deb',
    },
  ],
} as const

export const bank = {
  name: { ar: 'بنك الكريمي', en: 'Al-Kuraimi Bank' },
  account: '30432981',
  display: '3043 2981',
  currencies: ['YER', 'USD', 'SAR'],
  holder: 'ZEIDEXSOFT',
} as const

export const verity = {
  version: 'v0.4.0',
  apk: 'https://www.mediafire.com/file/38z57gqtgndpioy/VerityScope-v0.4.0-universal.apk/file',
  facts: [
    ['MODELS', '5 · On-Device'],
    ['UPLOADED', '0 bytes'],
    ['SOURCE CHECK', 'C2PA + EXIF'],
  ] as const,
} as const

export const trialStepKeys = ['choose', 'activate', 'operate'] as const

export const accountingChain = [
  { n: '0001', hash: '9f2c…c41a' },
  { n: '0002', hash: '7b81…4de0' },
  { n: '0003', hash: 'e30a…91f7' },
  { n: '0004', hash: '1c6d…02b8' },
] as const
