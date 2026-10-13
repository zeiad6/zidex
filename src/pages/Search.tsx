import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Search as SearchIcon,
  X,
  TrendingUp,
  Users,
  Star,
  Sparkles,
  Bot,
  ChevronLeft,
  Clock,
  Radio,
  Home,
  Settings,
  BadgeCheck,
  ChevronDown,
  ArrowUpRight,
  Hash,
  ExternalLink,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

interface Channel {
  id: number
  username: string
  title: string
  titleAr: string
  members: number
  category: string
  categoryAr: string
  verified: boolean
  lastActive: string
  lastActiveAr: string
  subscribers: number
  description: string
  descriptionAr: string
  avatar: string
  tags: string[]
}

interface SearchResult {
  channels: Channel[]
  total: number
  took: number
}

interface AdvancedFilters {
  minSubscribers: number | null
  verifiedOnly: boolean
  category: string | null
}

interface Suggestion {
  text: string
  type: 'trending' | 'recent' | 'tag' | 'channel'
  icon?: string
}

/* ------------------------------------------------------------------ *
 * Mock channel database
 * ------------------------------------------------------------------ */

const MOCK_CHANNELS: Channel[] = [
  {
    id: 1,
    username: 'techpills_ar',
    title: 'Tech Pills عربي',
    titleAr: 'حبة تقنية',
    members: 48520,
    category: 'Technology',
    categoryAr: 'تقنية',
    verified: true,
    lastActive: 'now',
    lastActiveAr: 'الآن',
    subscribers: 48520,
    description: 'أخبار التقنية والذكاء الاصطناعي أولاً بأول',
    descriptionAr: 'أخبار التقنية والذكاء الاصطناعي أولاً بأول',
    avatar: '🚀',
    tags: ['tech', 'ai', 'أخبار', 'تقنية'],
  },
  {
    id: 2,
    username: 'crypto_bulletin_ar',
    title: 'Crypto Bulletin',
    titleAr: 'النشرة الرقمية',
    members: 32100,
    category: 'Crypto',
    categoryAr: 'عملات رقمية',
    verified: true,
    lastActive: '2min',
    lastActiveAr: 'منذ دقيقتين',
    subscribers: 32100,
    description: 'تحليلات واسعار العملات الرقمية على مدار الساعة',
    descriptionAr: 'تحليلات واسعار العملات الرقمية على مدار الساعة',
    avatar: '₿',
    tags: ['crypto', 'bitcoin', 'بيتكوين', 'تداول'],
  },
  {
    id: 3,
    username: 'design_daily_ar',
    title: 'Design Daily',
    titleAr: 'تصميم يومي',
    members: 18750,
    category: 'Design',
    categoryAr: 'تصميم',
    verified: false,
    lastActive: '5min',
    lastActiveAr: 'منذ 5 دقائق',
    subscribers: 18750,
    description: 'إلهام يومي للمصممين العرب',
    descriptionAr: 'إلهام يومي للمصممين العرب',
    avatar: '🎨',
    tags: ['design', 'ui', 'ux', 'تصميم'],
  },
  {
    id: 4,
    username: 'saudi_startups',
    title: 'Saudi Startups',
    titleAr: 'الشركات الناشئة',
    members: 25400,
    category: 'Business',
    categoryAr: 'أعمال',
    verified: true,
    lastActive: 'now',
    lastActiveAr: 'الآن',
    subscribers: 25400,
    description: 'أخبار ورواد الأعمال والشركات الناشئة في السعودية',
    descriptionAr: 'أخبار ورواد الأعمال والشركات الناشئة في السعودية',
    avatar: '🇸🇦',
    tags: ['startup', 'saudi', 'أعمال', 'شركات'],
  },
  {
    id: 5,
    username: 'flutter_ar',
    title: 'Flutter بالعربية',
    titleAr: 'فلاتر عربي',
    members: 15800,
    category: 'Programming',
    categoryAr: 'برمجة',
    verified: false,
    lastActive: '10min',
    lastActiveAr: 'منذ 10 دقائق',
    subscribers: 15800,
    description: 'كل ما يخص Flutter و Dart بالعربية',
    descriptionAr: 'كل ما يخص Flutter و Dart بالعربية',
    avatar: '📱',
    tags: ['flutter', 'dart', 'برمجة', 'تطبيقات'],
  },
  {
    id: 6,
    username: 'football_ksa',
    title: 'كرة القدم السعودية',
    titleAr: 'كرة القدم السعودية',
    members: 67300,
    category: 'Sports',
    categoryAr: 'رياضة',
    verified: true,
    lastActive: 'now',
    lastActiveAr: 'الآن',
    subscribers: 67300,
    description: 'أخبار الدوريات والمنتخب والكرة السعودية',
    descriptionAr: 'أخبار الدوريات والمنتخب والكرة السعودية',
    avatar: '⚽',
    tags: ['football', 'saudi', 'رياضة', 'كرة'],
  },
  {
    id: 7,
    username: 'medical_ar',
    title: 'طبيب الأسرة',
    titleAr: 'طبيب الأسرة',
    members: 92400,
    category: 'Health',
    categoryAr: 'صحة',
    verified: true,
    lastActive: 'now',
    lastActiveAr: 'الآن',
    subscribers: 92400,
    description: 'نصائح طبية موثوقة ومعلومات صحية',
    descriptionAr: 'نصائح طبية موثوقة ومعلومات صحية',
    avatar: '🏥',
    tags: ['medical', 'health', 'صحة', 'طب'],
  },
  {
    id: 8,
    username: 'nft_arab',
    title: 'NFT العرب',
    titleAr: 'إن إف تي العرب',
    members: 12300,
    category: 'Crypto',
    categoryAr: 'عملات رقمية',
    verified: false,
    lastActive: '30min',
    lastActiveAr: 'منذ 30 دقيقة',
    subscribers: 12300,
    description: 'عالم الـ NFT و Web3 بالعربية',
    descriptionAr: 'عالم الـ NFT و Web3 بالعربية',
    avatar: '🖼️',
    tags: ['nft', 'web3', 'فن', 'رقمي'],
  },
  {
    id: 9,
    username: 'learn_english_ar',
    title: 'تعلم الإنجليزية',
    titleAr: 'تعلم الإنجليزية',
    members: 55800,
    category: 'Education',
    categoryAr: 'تعليم',
    verified: true,
    lastActive: 'now',
    lastActiveAr: 'الآن',
    subscribers: 55800,
    description: 'دروس إنجليزية يومية للمتعلمين العرب',
    descriptionAr: 'دروس إنجليزية يومية للمتعلمين العرب',
    avatar: '🇬🇧',
    tags: ['english', 'تعليم', 'لغة', 'إنجليزي'],
  },
  {
    id: 10,
    username: 'quran_daily',
    title: 'ورد القرآن',
    titleAr: 'ورد القرآن',
    members: 89500,
    category: 'Religious',
    categoryAr: 'ديني',
    verified: true,
    lastActive: 'now',
    lastActiveAr: 'الآن',
    subscribers: 89500,
    description: 'ورد يومي وتدبر وتلاوات هادئة',
    descriptionAr: 'ورد يومي وتدبر وتلاوات هادئة',
    avatar: '📖',
    tags: ['quran', 'islam', 'قرآن', 'ديني'],
  },
]

/* ------------------------------------------------------------------ *
 * Semantic search engine
 * ------------------------------------------------------------------ */

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .toLowerCase()
    .trim()
}

function scoreChannel(channel: Channel, query: string): number {
  const q = normalizeArabic(query)
  let score = 0

  if (normalizeArabic(channel.title).includes(q)) score += 100
  if (normalizeArabic(channel.titleAr).includes(q)) score += 100
  if (channel.username.toLowerCase().includes(query.toLowerCase())) score += 80

  for (const tag of channel.tags) {
    if (normalizeArabic(tag).includes(q) || q.includes(normalizeArabic(tag))) {
      score += 60
    }
  }

  if (normalizeArabic(channel.description).includes(q)) score += 40
  if (normalizeArabic(channel.category).includes(q)) score += 50
  if (normalizeArabic(channel.categoryAr).includes(q)) score += 50

  if (channel.members > 50000) score += 20
  else if (channel.members > 20000) score += 15
  else if (channel.members > 10000) score += 10

  if (channel.verified) score += 15

  return score
}

function searchChannels(query: string): SearchResult {
  const startTime = performance.now()

  if (!query.trim()) {
    return { channels: [], total: 0, took: 0 }
  }

  const scored = MOCK_CHANNELS
    .map((c) => ({ channel: c, score: scoreChannel(c, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const took = Math.round(performance.now() - startTime)

  return {
    channels: scored.map((s) => s.channel),
    total: scored.length,
    took,
  }
}

/* ------------------------------------------------------------------ *
 * Utilities
 * ------------------------------------------------------------------ */

function formatMembers(n: number, lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    if (n >= 1000) return `${(n / 1000).toFixed(1)} ألف`
    return n.toString()
  }
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

const TRENDING = [
  { ar: 'ذكاء اصطناعي', en: 'AI', icon: '🤖' },
  { ar: 'عملات رقمية', en: 'Crypto', icon: '₿' },
  { ar: 'تصميم', en: 'Design', icon: '🎨' },
  { ar: 'برمجة', en: 'Programming', icon: '💻' },
  { ar: 'رياضة', en: 'Sports', icon: '⚽' },
  { ar: 'صحة', en: 'Health', icon: '🏥' },
]

const SUBSCRIBER_RANGES = [
  { value: null, labelAr: 'الكل', labelEn: 'All' },
  { value: 10000, labelAr: '+10 ألف', labelEn: '10K+' },
  { value: 50000, labelAr: '+50 ألف', labelEn: '50K+' },
  { value: 100000, labelAr: '+100 ألف', labelEn: '100K+' },
]

const EMOJI_SUGGESTIONS = [
  { emoji: '🚀', labelAr: 'تقنية', labelEn: 'Tech' },
  { emoji: '💰', labelAr: 'مال', labelEn: 'Finance' },
  { emoji: '🎮', labelAr: 'ألعاب', labelEn: 'Gaming' },
  { emoji: '🎵', labelAr: 'موسيقى', labelEn: 'Music' },
  { emoji: '📚', labelAr: 'كتب', labelEn: 'Books' },
  { emoji: '🍕', labelAr: 'طعام', labelEn: 'Food' },
  { emoji: '✈️', labelAr: 'سفر', labelEn: 'Travel' },
  { emoji: '💪', labelAr: 'رياضة', labelEn: 'Fitness' },
]

/* ------------------------------------------------------------------ *
 * Welcome Message
 * ------------------------------------------------------------------ */

const WelcomeMessage = memo(function WelcomeMessage({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card relative overflow-hidden rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="bg-accent-soft flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Sparkles className="text-accent size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-app text-sm font-bold">{t('مرحباً بك!', 'Welcome!')}</h3>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            {t(
              'ابحث في ملايين القنوات العربية والعالمية. استخدم الفلاتر المتقدمة لتضييق النتائج.',
              'Search millions of Arabic and global channels. Use advanced filters to narrow results.',
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted hover:text-app shrink-0 rounded-lg p-1 transition-colors"
          aria-label={t('إغلاق', 'Close')}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  )
})

/* ------------------------------------------------------------------ *
 * Bottom Navigation Bar
 * ------------------------------------------------------------------ */

const BottomNav = memo(function BottomNav() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const items = [
    { icon: Home, label: t('الرئيسية', 'Home'), path: '/' },
    { icon: SearchIcon, label: t('البحث', 'Search'), path: '/search' },
    { icon: Bot, label: t('البوت', 'Bot'), path: '/search', external: 'https://t.me/Zendaya2233_bot' },
    { icon: Settings, label: t('الإعدادات', 'Settings'), path: '/search' },
  ]

  return (
    <nav
      aria-label={t('التنقل السريع', 'Quick navigation')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-app bg-(--bg-elevated)/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-2">
        {items.map((item, i) => {
          const isActive = item.path === '/search' && i === 1
          const Icon = item.icon

          const handleClick = () => {
            if (item.external) {
              window.open(item.external, '_blank', 'noopener,noreferrer')
            } else if (item.path === '/search' && i === 3) {
              document.getElementById('advanced-filters')?.scrollIntoView({ behavior: 'smooth' })
            } else {
              navigate(item.path)
            }
          }

          return (
            <motion.button
              key={i}
              type="button"
              onClick={handleClick}
              whileTap={reduce ? undefined : { scale: 0.9 }}
              className={cn(
                'relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors',
                isActive ? 'text-accent' : 'text-subtle hover:text-app',
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="bg-accent-soft absolute inset-0 -z-10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="size-5" aria-hidden="true" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
})

/* ------------------------------------------------------------------ *
 * Advanced Filters Panel
 * ------------------------------------------------------------------ */

const AdvancedFiltersPanel = memo(function AdvancedFiltersPanel({
  filters,
  onChange,
  categories,
  lang,
}: {
  filters: AdvancedFilters
  onChange: (f: AdvancedFilters) => void
  categories: string[]
  lang: 'ar' | 'en'
}) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const reduce = useReducedMotion()

  const hasActiveFilters = filters.minSubscribers !== null || filters.verifiedOnly || filters.category !== null

  return (
    <div id="advanced-filters" className="glass-card rounded-2xl">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-3"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="text-accent size-4" aria-hidden="true" />
          {t('فلاتر متقدمة', 'Advanced Filters')}
          {hasActiveFilters && (
            <span className="bg-accent text-accent-fg flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
              {(filters.minSubscribers !== null ? 1 : 0) + (filters.verifiedOnly ? 1 : 0) + (filters.category !== null ? 1 : 0)}
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="text-muted size-4" aria-hidden="true" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduce ? undefined : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-app p-3">
              {/* Subscriber count filter */}
              <div>
                <label className="text-muted mb-1.5 block text-xs font-semibold">
                  {t('عدد المشتركين', 'Subscriber count')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBSCRIBER_RANGES.map((range) => (
                    <button
                      key={range.value ?? 'all'}
                      type="button"
                      onClick={() => onChange({ ...filters, minSubscribers: range.value })}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95',
                        filters.minSubscribers === range.value
                          ? 'border-accent bg-accent text-accent-fg shadow-app-accent'
                          : 'border-app bg-sunken text-muted hover:text-app hover:border-[var(--line-strong)]',
                      )}
                    >
                      {lang === 'ar' ? range.labelAr : range.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified filter */}
              <div>
                <label className="text-muted mb-1.5 block text-xs font-semibold">
                  {t('التوثيق', 'Verification')}
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95',
                    filters.verifiedOnly
                      ? 'border-accent bg-accent text-accent-fg shadow-app-accent'
                      : 'border-app bg-sunken text-muted hover:text-app hover:border-[var(--line-strong)]',
                  )}
                >
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  {t('القنوات الموثقة فقط', 'Verified channels only')}
                </button>
              </div>

              {/* Category filter */}
              <div>
                <label className="text-muted mb-1.5 block text-xs font-semibold">
                  {t('التصنيف', 'Category')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, category: null })}
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95',
                      filters.category === null
                        ? 'border-accent bg-accent text-accent-fg shadow-app-accent'
                        : 'border-app bg-sunken text-muted hover:text-app hover:border-[var(--line-strong)]',
                    )}
                  >
                    {t('الكل', 'All')}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onChange({ ...filters, category: filters.category === cat ? null : cat })}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95',
                        filters.category === cat
                          ? 'border-accent bg-accent text-accent-fg shadow-app-accent'
                          : 'border-app bg-sunken text-muted hover:text-app hover:border-[var(--line-strong)]',
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => onChange({ minSubscribers: null, verifiedOnly: false, category: null })}
                  className="text-accent text-xs font-semibold hover:underline"
                >
                  {t('إعادة تعيين الفلاتر', 'Reset filters')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

/* ------------------------------------------------------------------ *
 * Channel Details Modal
 * ------------------------------------------------------------------ */

const ChannelDetails = memo(function ChannelDetails({
  channel,
  lang,
  onClose,
}: {
  channel: Channel
  lang: 'ar' | 'en'
  onClose: () => void
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'ar' ? channel.titleAr : channel.title}
    >
      <motion.div
        initial={reduce ? undefined : { y: 100, opacity: 0, scale: 0.95 }}
        animate={reduce ? undefined : { y: 0, opacity: 1, scale: 1 }}
        exit={reduce ? undefined : { y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-card max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="bg-sunken flex size-16 shrink-0 items-center justify-center rounded-2xl text-3xl">
              <span aria-hidden="true">{channel.avatar}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-app truncate text-lg font-bold">
                  {lang === 'ar' ? channel.titleAr : channel.title}
                </h2>
                {channel.verified && (
                  <BadgeCheck className="text-blue-500 size-5 shrink-0" aria-label={t('موثق', 'Verified')} />
                )}
              </div>
              <p className="text-muted mt-0.5 text-sm" dir="ltr">@{channel.username}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-app shrink-0 rounded-lg p-1.5 transition-colors"
              aria-label={t('إغلاق', 'Close')}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          <div className="bg-sunken rounded-xl p-3 text-center">
            <Users className="text-accent mx-auto mb-1 size-4" aria-hidden="true" />
            <p className="text-app text-sm font-bold">{formatMembers(channel.members, lang)}</p>
            <p className="text-subtle text-[10px]">{t('مشترك', 'Members')}</p>
          </div>
          <div className="bg-sunken rounded-xl p-3 text-center">
            <Radio className="text-accent mx-auto mb-1 size-4" aria-hidden="true" />
            <p className="text-app text-sm font-bold">{lang === 'ar' ? channel.lastActiveAr : channel.lastActive}</p>
            <p className="text-subtle text-[10px]">{t('آخر نشاط', 'Last active')}</p>
          </div>
          <div className="bg-sunken rounded-xl p-3 text-center">
            <Hash className="text-accent mx-auto mb-1 size-4" aria-hidden="true" />
            <p className="text-app text-sm font-bold">{channel.categoryAr}</p>
            <p className="text-subtle text-[10px]">{t('التصنيف', 'Category')}</p>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 pb-4">
          <p className="text-muted text-sm leading-relaxed">
            {lang === 'ar' ? channel.descriptionAr : channel.description}
          </p>
        </div>

        {/* Tags */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {channel.tags.map((tag) => (
              <span key={tag} className="bg-sunken text-muted rounded-lg px-2.5 py-1 text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-app p-4">
          <a
            href={`https://t.me/${channel.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-accent-fg flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('انضم للقناة', 'Join Channel')}
            <ExternalLink className="size-4 rtl:rotate-180" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="bg-sunken text-muted hover:text-app flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {t('إغلاق', 'Close')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
})

/* ------------------------------------------------------------------ *
 * Channel Card
 * ------------------------------------------------------------------ */

const ChannelCard = memo(function ChannelCard({
  channel,
  lang,
  onSearch,
  onSelect,
  index,
}: {
  channel: Channel
  lang: 'ar' | 'en'
  onSearch: (q: string) => void
  onSelect: (c: Channel) => void
  index: number
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <motion.article
      layout
      initial={reduce ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className="glass-card card-lift hover-ring group relative cursor-pointer overflow-hidden rounded-2xl"
      onClick={() => onSelect(channel)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(channel)
        }
      }}
      aria-label={`${lang === 'ar' ? channel.titleAr : channel.title} - ${formatMembers(channel.members, lang)} ${t('مشترك', 'members')}`}
    >
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="bg-sunken relative flex size-10 shrink-0 items-center justify-center rounded-xl text-lg">
            <span aria-hidden="true">{channel.avatar}</span>
            {channel.verified && (
              <div className="absolute -bottom-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-blue-500">
                <Star className="text-white size-2.5 fill-white" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-app truncate text-sm font-semibold">
                {lang === 'ar' ? channel.titleAr : channel.title}
              </h3>
              {channel.verified && (
                <BadgeCheck className="text-blue-500 size-3.5 shrink-0" aria-label={t('موثق', 'Verified')} />
              )}
            </div>
            <div className="text-muted flex items-center gap-1.5 text-[11px]">
              <span className="truncate" dir="ltr">@{channel.username}</span>
              <span className="shrink-0" aria-hidden="true">·</span>
              <span className="flex shrink-0 items-center gap-0.5">
                <Users className="size-3" aria-hidden="true" />
                {formatMembers(channel.members, lang)}
              </span>
            </div>
          </div>

          {/* Join button */}
          <a
            href={`https://t.me/${channel.username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-accent hover:bg-accent-soft flex shrink-0 items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {t('انضم', 'Join')}
            <ArrowUpRight className="size-3 rtl:-rotate-90" aria-hidden="true" />
          </a>
        </div>

        {/* Description */}
        <p className="text-muted mt-2 line-clamp-1 text-xs">
          {lang === 'ar' ? channel.descriptionAr : channel.description}
        </p>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {channel.tags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSearch(tag)
              }}
              className="bg-sunken hover:bg-accent-soft text-muted hover:text-accent rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full" aria-hidden="true" />
    </motion.article>
  )
})

/* ------------------------------------------------------------------ *
 * Search Suggestions Component
 * ------------------------------------------------------------------ */

const SearchSuggestions = memo(function SearchSuggestions({
  query: _query,
  suggestions,
  onSelect,
}: {
  query: string
  suggestions: Suggestion[]
  onSelect: (s: Suggestion) => void
  onClose: () => void
  lang: 'ar' | 'en'
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  if (suggestions.length === 0) return null

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="glass-card absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl"
      role="listbox"
      aria-label={t('اقتراحات البحث', 'Search suggestions')}
    >
      <div className="max-h-64 overflow-y-auto p-2">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={`${suggestion.type}-${suggestion.text}`}
            type="button"
            initial={reduce ? undefined : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(suggestion)}
            className="hover:bg-sunken flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors"
            role="option"
            aria-selected="false"
          >
            <span className="text-muted shrink-0">
              {suggestion.type === 'trending' && <TrendingUp className="size-4" />}
              {suggestion.type === 'recent' && <Clock className="size-4" />}
              {suggestion.type === 'tag' && <Hash className="size-4" />}
              {suggestion.type === 'channel' && <SearchIcon className="size-4" />}
            </span>
            <span className="text-app min-w-0 flex-1 truncate text-sm">{suggestion.text}</span>
            {suggestion.icon && <span aria-hidden="true">{suggestion.icon}</span>}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
})

/* ------------------------------------------------------------------ *
 * Emoji Quick Picker
 * ------------------------------------------------------------------ */

const EmojiPicker = memo(function EmojiPicker({
  onSelect,
  lang,
}: {
  onSelect: (emoji: string, label: string) => void
  lang: 'ar' | 'en'
}) {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-3"
    >
      <div className="text-muted mb-2 flex items-center gap-1.5 text-xs font-semibold">
        <Zap className="size-3.5 text-amber-500" aria-hidden="true" />
        {t('بحث سريع بـ emoji', 'Quick emoji search')}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {EMOJI_SUGGESTIONS.map((item) => (
          <motion.button
            key={item.emoji}
            type="button"
            whileHover={reduce ? undefined : { scale: 1.1 }}
            whileTap={reduce ? undefined : { scale: 0.9 }}
            onClick={() => onSelect(item.emoji, lang === 'ar' ? item.labelAr : item.labelEn)}
            className="bg-sunken hover:bg-accent-soft flex flex-col items-center gap-1 rounded-xl p-2 transition-colors"
            aria-label={lang === 'ar' ? item.labelAr : item.labelEn}
          >
            <span className="text-xl" aria-hidden="true">{item.emoji}</span>
            <span className="text-subtle text-[10px]">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
})

/* ------------------------------------------------------------------ *
 * Loading Progress Bar
 * ------------------------------------------------------------------ */

const SearchProgressBar = memo(function SearchProgressBar({ isVisible }: { isVisible: boolean }) {
  const reduce = useReducedMotion()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden rounded-full"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={reduce ? { duration: 0.3 } : { duration: 0.8, ease: 'easeInOut' }}
            className="bg-accent h-full w-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
})

/* ------------------------------------------------------------------ *
 * Skeleton Card
 * ------------------------------------------------------------------ */

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse rounded-2xl p-3" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="bg-sunken size-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="bg-sunken h-3 w-1/3 rounded" />
          <div className="bg-sunken h-2 w-2/3 rounded" />
        </div>
      </div>
      <div className="bg-sunken mt-3 h-2 w-full rounded" />
      <div className="mt-2 flex gap-1">
        <div className="bg-sunken h-4 w-12 rounded" />
        <div className="bg-sunken h-4 w-12 rounded" />
        <div className="bg-sunken h-4 w-12 rounded" />
      </div>
    </div>
  )
})

/* ------------------------------------------------------------------ *
 * Main Search Component
 * ------------------------------------------------------------------ */

export default function Search() {
  const { lang, t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ channels: [], total: 0, took: 0 })
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showWelcome, setShowWelcome] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [filters, setFilters] = useState<AdvancedFilters>({
    minSubscribers: null,
    verifiedOnly: false,
    category: null,
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const reduce = useReducedMotion()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load recent searches and welcome state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('search-recent')
      if (saved) setRecentSearches(JSON.parse(saved))
      const welcomeSeen = localStorage.getItem('search-welcome-seen')
      if (!welcomeSeen) setShowWelcome(true)
    } catch {
      // ignore
    }
  }, [])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Generate suggestions based on query
  const generateSuggestions = useCallback(
    (q: string): Suggestion[] => {
      if (!q.trim()) return []

      const normalizedQ = normalizeArabic(q)
      const suggs: Suggestion[] = []

      // Add matching channels
      const matchingChannels = MOCK_CHANNELS.filter(
        (c) =>
          normalizeArabic(c.title).includes(normalizedQ) ||
          normalizeArabic(c.titleAr).includes(normalizedQ) ||
          c.username.toLowerCase().includes(q.toLowerCase()),
      ).slice(0, 3)

      matchingChannels.forEach((c) => {
        suggs.push({
          text: lang === 'ar' ? c.titleAr : c.title,
          type: 'channel',
          icon: c.avatar,
        })
      })

      // Add matching tags
      const allTags = [...new Set(MOCK_CHANNELS.flatMap((c) => c.tags))]
      const matchingTags = allTags
        .filter((tag) => normalizeArabic(tag).includes(normalizedQ))
        .slice(0, 3)

      matchingTags.forEach((tag) => {
        suggs.push({ text: `#${tag}`, type: 'tag' })
      })

      // Add recent searches that match
      const matchingRecent = recentSearches
        .filter((s) => normalizeArabic(s).includes(normalizedQ) && s !== q)
        .slice(0, 2)

      matchingRecent.forEach((s) => {
        suggs.push({ text: s, type: 'recent' })
      })

      // Add trending if query is short
      if (q.length <= 2) {
        TRENDING.forEach((item) => {
          suggs.push({
            text: lang === 'ar' ? item.ar : item.en,
            type: 'trending',
            icon: item.icon,
          })
        })
      }

      return suggs.slice(0, 8)
    },
    [lang, recentSearches],
  )

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ channels: [], total: 0, took: 0 })
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    setShowSuggestions(true)
    setSuggestions(generateSuggestions(query))

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const result = searchChannels(query)
      setResults(result)
      setIsSearching(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, generateSuggestions])

  const saveRecentSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return
      const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5)
      setRecentSearches(updated)
      try {
        localStorage.setItem('search-recent', JSON.stringify(updated))
      } catch {
        // ignore
      }
    },
    [recentSearches],
  )

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q)
      saveRecentSearch(q)
      setShowSuggestions(false)
    },
    [saveRecentSearch],
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [])

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false)
    try {
      localStorage.setItem('search-welcome-seen', 'true')
    } catch {
      // ignore
    }
  }, [])

  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      const searchText = suggestion.text.replace(/^#/, '')
      handleSearch(searchText)
      inputRef.current?.focus()
    },
    [handleSearch],
  )

  const handleEmojiSelect = useCallback(
    (_emoji: string, label: string) => {
      handleSearch(label)
    },
    [handleSearch],
  )

  // Categories from mock data
  const categories = useMemo(
    () => Array.from(new Set(MOCK_CHANNELS.map((c) => (lang === 'ar' ? c.categoryAr : c.category)))),
    [lang],
  )

  // Apply advanced filters
  const filteredResults = useMemo(() => {
    let channels = results.channels

    if (filters.minSubscribers !== null) {
      channels = channels.filter((c) => c.members >= filters.minSubscribers!)
    }

    if (filters.verifiedOnly) {
      channels = channels.filter((c) => c.verified)
    }

    if (filters.category) {
      channels = channels.filter(
        (c) => (lang === 'ar' ? c.categoryAr : c.category) === filters.category,
      )
    }

    if (selectedCategory) {
      channels = channels.filter(
        (c) => (lang === 'ar' ? c.categoryAr : c.category) === selectedCategory,
      )
    }

    return { ...results, channels }
  }, [results, filters, selectedCategory, lang])

  const isEmpty = query.trim() && !isSearching && filteredResults.channels.length === 0

  return (
    <div className="bg-app min-h-[100svh] pb-24 lg:pb-0">
      <div className="container-app max-w-2xl">
        {/* Compact Header */}
        <div className="sticky top-0 z-30 -mx-5 bg-app/80 px-5 pt-4 pb-3 backdrop-blur-xl lg:-mx-8 lg:px-8">
          <SearchProgressBar isVisible={isSearching} />

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-app text-lg font-bold">{t('بحث القنوات', 'Channel Search')}</h1>
              <p className="text-muted mt-0.5 text-xs">
                {t('ابحث في ملايين القنوات بالعربية أو الإنجليزية', 'Search millions of channels in Arabic or English')}
              </p>
            </div>
            <a
              href="https://t.me/Zendaya2233_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-accent-fg flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:scale-105 active:scale-95"
            >
              <Bot className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('البوت', 'Bot')}</span>
            </a>
          </div>

          {/* Search Input */}
          <div className="relative mt-3">
            <div className="glass-card flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-[var(--ring)]">
              <SearchIcon className="text-muted size-4 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    saveRecentSearch(query)
                    setShowSuggestions(false)
                  }
                }}
                placeholder={t('ابحث عن قناة…', 'Search for a channel…')}
                className="text-app min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-subtle)]"
                aria-label={t('بحث', 'Search')}
                aria-expanded={showSuggestions}
                aria-controls="search-suggestions"
                role="combobox"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-muted hover:text-app flex items-center justify-center rounded-full p-0.5 transition-colors"
                  aria-label={t('مسح', 'Clear')}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
              <div className="text-muted hidden items-center gap-1 text-[10px] sm:flex">
                <kbd className="bg-elevated border-app rounded-md border px-1.5 py-0.5 font-mono">/</kbd>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <div id="search-suggestions">
                  <SearchSuggestions
                    query={query}
                    suggestions={suggestions}
                    onSelect={handleSuggestionSelect}
                    onClose={() => setShowSuggestions(false)}
                    lang={lang}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Category pills - compact scrollable */}
          <div className="scrollbar-hide -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:-mx-8 lg:px-8">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 active:scale-95',
                !selectedCategory
                  ? 'border-accent bg-accent text-accent-fg shadow-app-accent'
                  : 'border-app bg-elevated text-muted hover:text-app hover:border-[var(--line-strong)]',
              )}
            >
              {t('الكل', 'All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 active:scale-95',
                  selectedCategory === cat
                    ? 'border-accent bg-accent text-accent-fg shadow-app-accent'
                    : 'border-app bg-elevated text-muted hover:text-app hover:border-[var(--line-strong)]',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Welcome message for new users */}
          <AnimatePresence>
            {showWelcome && <WelcomeMessage onDismiss={dismissWelcome} />}
          </AnimatePresence>

          {/* Emoji Quick Picker */}
          {!query && <EmojiPicker onSelect={handleEmojiSelect} lang={lang} />}

          {/* Advanced Filters */}
          <AdvancedFiltersPanel
            filters={filters}
            onChange={setFilters}
            categories={categories}
            lang={lang}
          />

          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <motion.div initial={reduce ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-muted mb-2 flex items-center gap-1.5 text-xs font-semibold">
                <Clock className="size-3.5" aria-hidden="true" />
                {t('عمليات بحث سابقة', 'Recent searches')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSearch(s)}
                    className="bg-elevated border-app rounded-full border px-3 py-1 text-xs text-muted transition-all duration-200 hover:text-app hover:border-[var(--line-strong)] hover:scale-105 active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Trending searches */}
          {!query && (
            <motion.div initial={reduce ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="text-muted mb-2 flex items-center gap-1.5 text-xs font-semibold">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                {t('رائج الآن', 'Trending now')}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TRENDING.map((item) => (
                  <button
                    key={item.en}
                    type="button"
                    onClick={() => handleSearch(lang === 'ar' ? item.ar : item.en)}
                    className="glass-card flex items-center gap-2 rounded-xl px-3 py-2 text-start transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-base" aria-hidden="true">{item.icon}</span>
                    <span className="text-app truncate text-xs font-medium">{lang === 'ar' ? item.ar : item.en}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Searching skeleton */}
          {isSearching && (
            <div className="space-y-2" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Results */}
          {!isSearching && filteredResults.channels.length > 0 && (
            <div>
              <div className="text-muted mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="bg-accent-soft text-accent rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {filteredResults.total}
                  </span>
                  {t(
                    `Found ${filteredResults.total} channels in ${filteredResults.took}ms`,
                    `تم العثور على ${filteredResults.total} قناة في ${filteredResults.took} مللي ثانية`,
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-500" aria-hidden="true" />
                  {t('Semantic', 'دلالي')}
                </span>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredResults.channels.map((channel, index) => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      lang={lang}
                      onSearch={handleSearch}
                      onSelect={setSelectedChannel}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isSearching && isEmpty && (
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-12 text-center"
            >
              <div className="glass-card mb-4 flex size-16 items-center justify-center rounded-2xl">
                <SearchIcon className="text-muted size-7" aria-hidden="true" />
              </div>
              <h3 className="text-app text-base font-semibold">
                {t('لم نجد نتائج', 'No results found')}
              </h3>
              <p className="text-muted mt-1 max-w-xs text-sm">
                {t(
                  'جرب كلمات مختلفة أو تصفح القنوات الرائجة',
                  'Try different keywords or browse trending channels',
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSelectedCategory(null)
                  setFilters({ minSubscribers: null, verifiedOnly: false, category: null })
                }}
                className="text-accent mt-4 text-sm font-semibold hover:underline"
              >
                {t('مسح البحث', 'Clear search')}
              </button>
            </motion.div>
          )}

          {/* Bot CTA */}
          <motion.div
            initial={reduce ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card mt-6 overflow-hidden rounded-2xl"
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-accent-soft flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Bot className="text-accent size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-app text-sm font-semibold">{t('جرب البوت', 'Try the Bot')}</h3>
                  <p className="text-muted mt-0.5 text-xs">
                    {t(
                      'بحث أسرع مع نتائج أكثر على تيليجرام',
                      'Faster search with more results on Telegram',
                    )}
                  </p>
                </div>
                <a
                  href="https://t.me/Zendaya2233_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent text-accent-fg flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-transform hover:scale-105 active:scale-95"
                >
                  {t('فتح البوت', 'Open Bot')}
                  <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Channel Details Modal */}
      <AnimatePresence>
        {selectedChannel && (
          <ChannelDetails
            channel={selectedChannel}
            lang={lang}
            onClose={() => setSelectedChannel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
