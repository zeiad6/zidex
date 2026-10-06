/**
 * Single source of truth for the whole site.
 * Every place that needs the TikTok handle, a link, or a stat reads from here.
 */

export const site = {
  name: 'ZeidexSoft',
  /** Default document title; pages that set their own restore this on unmount. */
  title: 'ZeidexSoft — بوتات تيليجرام وبرمجيات احترافية',
  titleEn: 'ZeidexSoft — Telegram bots & professional software',
  handle: '@ghost.7784',
  handleBare: 'ghost.7784',
  tagline: 'الموقع الرسمي',
  description:
    'نبني بوتات تيليجرام ومتاجر رقمية وبرمجيات احترافية: دفع بالنجوم والكريمي، تجربة مجانية 3 أيام، وحماية من الدرجة الأولى.',
  descriptionEn:
    'We build Telegram bots, digital stores and professional software: Stars and Kuraimi payments, a free 3-day trial, and security first.',
  /** Company inbox, routed by Cloudflare Email Routing to the owner's mailbox. */
  email: 'info@zeidexsoft.com',
  whatsapp: 'https://wa.me/qr/2EZCWPVVO3DUE1?s=v',
  locale: 'ar' as const,
  dir: 'rtl' as const,
} as const

export const tiktok = {
  profile: 'https://www.tiktok.com/@ghost.7784',
  /** Live figures pulled from the public profile on 2026-09-27. */
  stats: {
    followers: 12,
    following: 172,
    likes: 19,
    videos: 5,
  },
  /** Shown when the public API is unreachable (no auth, CORS-restricted). */
  updatedAt: '2026-09-27',
  avatar:
    'https://p16-common-sign.tiktokcdn-eu.com/tos-no1a-avt-0068c001-no~f5202aff71489aaadb4641652593b9d8~tplv-tiktokx-cropcenter:1080:1080.jpeg',
} as const

export const nav = [
  { to: '/', label: 'الرئيسية', labelEn: 'Home', short: 'home' },
  { to: '/links', label: 'الروابط', labelEn: 'Links', short: 'links' },
  { to: '/blog', label: 'المقالات', labelEn: 'Articles', short: 'blog' },
  { to: '/programs', label: 'البرامج', labelEn: 'Programs', short: 'programs' },
  { to: '/about', label: 'عن المنصة', labelEn: 'About', short: 'about' },
] as const

export type NavItem = (typeof nav)[number]

/* ------------------------------------------------------------------ *
 * Link hub — edit here, the /links page rebuilds itself automatically.
 * ------------------------------------------------------------------ */

export type LinkKind = 'primary' | 'social' | 'tool' | 'resource'

export type HubLink = {
  id: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  href: string
  kind: LinkKind
  emoji: string
  /** Tailwind-ish token for the per-card accent glow. */
  accent: 'ghost' | 'veil' | 'tiktok' | 'mint' | 'amber' | 'rose'
  badge?: string
  badgeEn?: string
  /** Featured links get the large card in the bento grid. */
  featured?: boolean
}

export const hubLinks: HubLink[] = [
  {
    id: 'tiktok-profile',
    title: 'حسابي على تيك توك',
    titleEn: 'My TikTok account',
    description: 'أحدث الفيديوهات والمقاطع — تابعني مباشرة',
    descriptionEn: 'The latest videos and clips — follow me directly',
    href: tiktok.profile,
    kind: 'primary',
    emoji: '🎵',
    accent: 'tiktok',
    badge: 'الرئيسي',
    badgeEn: 'Main',
    featured: true,
  },
  {
    id: 'tiktok-live',
    title: 'البث المباشر',
    titleEn: 'Live',
    description: 'الدخول السريع إلى غرف البث',
    descriptionEn: 'Jump straight into live rooms',
    href: 'https://www.tiktok.com/live',
    kind: 'social',
    emoji: '📡',
    accent: 'rose',
  },
  {
    id: 'videos',
    title: 'كل الفيديوهات',
    titleEn: 'All videos',
    description: 'تصفّح مكتبة الفيديوهات كاملة',
    descriptionEn: 'Browse the full video library',
    href: `${tiktok.profile}/video`,
    kind: 'social',
    emoji: '📼',
    accent: 'ghost',
  },
  {
    id: 'saves',
    title: 'المحفوظات',
    titleEn: 'Saved',
    description: 'الفيديوهات التي حفظتها',
    descriptionEn: 'Videos I have saved',
    href: `${tiktok.profile}/saved`,
    kind: 'resource',
    emoji: '🔖',
    accent: 'veil',
  },
  {
    id: 'blog',
    title: 'المدونة',
    titleEn: 'Blog',
    description: 'مقالات مكتوبة عن صناعة المحتوى والفيديو القصير',
    descriptionEn: 'Written articles on content creation and short-form video',
    href: '/blog',
    kind: 'tool',
    emoji: '📓',
    accent: 'mint',
    featured: true,
  },
  {
    id: 'store',
    title: 'المتجر',
    titleEn: 'Store',
    description: 'منتجات رقمية تُدفع بنجوم تيليجرام',
    descriptionEn: 'Digital goods paid with Telegram Stars',
    // Absolute on purpose: /store is a static Mini App page, not a React route.
    href: 'https://zeidexsoft.com/store/',
    kind: 'tool',
    emoji: '🛍️',
    accent: 'veil',
  },
  {
    id: 'links-page',
    title: 'صفحة الروابط',
    titleEn: 'Links page',
    description: 'كل الوجهات في شبكة واحدة',
    descriptionEn: 'Every destination in one grid',
    href: '/links',
    kind: 'tool',
    emoji: '🧭',
    accent: 'amber',
  },
  {
    id: 'contact',
    title: 'للتواصل والتعاون',
    titleEn: 'Contact & collabs',
    description: 'DM مباشر عبر تيك توك',
    descriptionEn: 'Direct DM on TikTok',
    href: `${tiktok.profile}?lang=ar`,
    kind: 'social',
    emoji: '✉️',
    accent: 'ghost',
  },
  {
    id: 'privacy',
    title: 'سياسة الخصوصية',
    titleEn: 'Privacy policy',
    description: 'كيف تُستخدم بياناتك هنا',
    descriptionEn: 'How your data is used here',
    href: '/about#privacy',
    kind: 'resource',
    emoji: '🔐',
    accent: 'mint',
  },
]

export const socials = [
  { name: 'TikTok', href: tiktok.profile, emoji: '🎵', accent: 'tiktok' as const },
  // Only accounts that were verified to exist are listed. Adding a guess here
  // ships a dead link to every visitor and to search engines.
]

/* ------------------------------------------------------------------ *
 * Accent token map — one place to retune every glow in the app.
 * ------------------------------------------------------------------ */

/**
 * One RGB triple per accent, used inline by LinkCard for both the icon tile
 * and the hover wash. Kept as raw numbers (not class names) on purpose: a
 * class assembled at runtime is invisible to Tailwind's scanner.
 */
export const accentTokens: Record<HubLink['accent'], { rgb: string }> = {
  ghost: { rgb: '91 141 252' },
  veil: { rgb: '168 85 247' },
  tiktok: { rgb: '254 44 85' },
  mint: { rgb: '45 212 191' },
  amber: { rgb: '245 158 11' },
  rose: { rgb: '244 63 94' },
}

/* ------------------------------------------------------------------ *
 * TikTok embed helpers
 * ------------------------------------------------------------------ */

/** Official oEmbed endpoint — no API key required. */
export const tiktokEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktok.profile)}`

export function tiktokProfileUrl(opts: { lang?: string } = {}) {
  return `${tiktok.profile}?_r=1&_t=ZN-9A4XwA4rP9i${opts.lang ? `&lang=${opts.lang}` : ''}`
}

export function tiktokVideoUrl(id: string) {
  return `https://www.tiktok.com/@${site.handleBare}/video/${id}`
}
