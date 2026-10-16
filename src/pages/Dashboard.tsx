import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Compass,
  Download,
  Gauge,
  GraduationCap,
  Layers,
  LayoutGrid,
  Library,
  Link2,
  Monitor,
  Moon,
  Package,
  PlayCircle,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Terminal,
  TrendingUp,
  UserPlus,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Reveal, CountUp } from '@/components/ui/Reveal'
import { HoverCard, CountPop, useShake, Shake, LiveDot, ArrowNudge } from '@/components/ui/Motion'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useTikTokProfile } from '@/hooks/useTikTokProfile'
import { downloadCountsFor } from '@/lib/downloads'
import { cn, compactNumber, formatDate } from '@/lib/utils'
import { site } from '@/lib/site'
import { useI18n } from '@/lib/i18n'
import { allPosts, categories, categoryLabel } from '@/data/posts'
import { programs, type Program } from '@/data/programs'

/* ================================================================== *
 * Dashboard — a bento of what this site can actually measure. One
 * grid: a hero band, four KPI tiles, then mixed cells (downloads
 * histogram, per-programme leaderboard, a Windows/Android donut, the
 * latest release, blog categories, the TikTok snapshot and the
 * license checker). Every figure comes from a real source —
 * server-counted downloads, a dated TikTok snapshot, and the
 * programme/article catalogues. A metric the site does not collect
 * shows a dash and says so, rather than inventing a number to fill a
 * tile.
 * ================================================================== */

/** Grouped Latin digits for an exact figure (site convention: Latin numerals). */
function exactNum(n: number): string {
  return n.toLocaleString('en-US')
}

/** Under 1000 the raw digits pop via CountPop; above that, the compact form. */
function MiniNum({ value, lang, className }: { value: number; lang: 'ar' | 'en'; className?: string }) {
  if (value >= 1000) return <span className={cn('tabular-nums', className)}>{compactNumber(value, lang)}</span>
  return <CountPop value={value} className={className} />
}

/** One KPI tile. `tone` colours the delta chip, `note` states the source. */
function KpiTile({
  icon: Icon,
  label,
  value,
  delta,
  tone = 'up',
  note,
}: {
  icon: LucideIcon
  label: string
  value: string
  delta?: string
  tone?: 'up' | 'down' | 'flat'
  note?: string
}) {
  const chip =
    tone === 'up'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300'
      : tone === 'down'
        ? 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300'
        : 'bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-400'
  return (
    <HoverCard className="border-app bg-elevated shadow-app-md rounded-card border p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="bg-accent-soft text-accent grid size-9 shrink-0 place-items-center rounded-xl" aria-hidden="true">
          <Icon className="size-4" />
        </span>
        {delta ? (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${chip}`}>
            <TrendingUp className="size-3" aria-hidden="true" />
            {delta}
          </span>
        ) : null}
      </div>
      {/* The value pops into place when it changes, e.g. '…' → the real count. */}
      <p className={cn('mt-3.5 text-[28px] leading-none font-black tabular-nums sm:text-[30px]', value === '—' && 'text-subtle')}>
        <span key={value} className="animate-pop-number inline-block">
          {value}
        </span>
      </p>
      <p className="text-app mt-1.5 text-[12px] font-bold">{label}</p>
      {note ? <p className="text-subtle mt-1 text-[11.5px] leading-relaxed">{note}</p> : null}
    </HoverCard>
  )
}

/** Shared header inside a bento cell: icon tile + title + sub + trailing action. */
function PanelHead({
  icon: Icon,
  id,
  title,
  sub,
  action,
}: {
  icon: LucideIcon
  id?: string
  title: string
  sub?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="bg-accent-soft text-accent grid size-10 shrink-0 place-items-center rounded-xl" aria-hidden="true">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-app text-[15px] font-black">
            {title}
          </h2>
          {sub ? <p className="text-subtle text-[12px]">{sub}</p> : null}
        </div>
      </div>
      {action}
    </header>
  )
}

/**
 * A per-programme row of the leaderboard. The value is honest: it is the
 * share of total downloads that this programme accounts for, so the widest
 * bar is the most-downloaded one. Nothing here implies a course percentage.
 */
function ProgrammeRow({ program, count, total, rank }: { program: Program; count: number; total: number; rank: number }) {
  const { t } = useI18n()
  const share = total > 0 ? Math.round((count / total) * 100) : 0
  const rankChip =
    rank === 1
      ? 'brand-gradient text-white shadow-app-accent'
      : rank <= 3
        ? 'bg-accent-soft text-accent'
        : 'bg-sunken text-subtle'
  return (
    <li className="group/row flex items-center gap-3 py-2.5">
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-bold tabular-nums',
          rankChip,
        )}
      >
        {String(rank).padStart(2, '0')}
      </span>
      <span className="bg-accent-soft text-accent grid size-9 shrink-0 place-items-center rounded-xl" aria-hidden="true">
        {program.kind === 'windows' ? <Monitor className="size-4" /> : <Smartphone className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-app truncate text-[13.5px] font-bold">{t(program.name, program.nameEn)}</span>
          <span className="text-app shrink-0 text-[13px] font-black tabular-nums">
            {compactNumber(count)}
            <span className="text-subtle ms-1 text-[11px] font-semibold">{t('تنزيل', 'dl')}</span>
          </span>
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          {/* The track + fill animate width on mount so the ranking reads at a glance. */}
          <span className="bg-sunken block h-1.5 flex-1 overflow-hidden rounded-full">
            <motion.span
              className="block h-full rounded-full brand-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${share}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: rank * 0.06 }}
            />
          </span>
          <span className="text-subtle w-9 shrink-0 text-end text-[10.5px] font-bold tabular-nums">{share}%</span>
        </span>
      </span>
    </li>
  )
}

/** A vertical bar for the downloads histogram. Height is relative to the max. */
function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4
  return (
    <div className="group/bar relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
      {/* Hover popover with the exact (un-rounded) count. `title` covers touch
          and no-hover devices with the same figure natively. */}
      <span
        title={exactNum(value)}
        className="tip-in bg-elevated border-app text-app shadow-app-lg pointer-events-none absolute inset-x-0 bottom-full mx-auto mb-1 hidden w-max rounded-lg border px-2 py-1 text-[10.5px] font-bold tabular-nums group-hover/bar:block"
        aria-hidden="true"
      >
        {exactNum(value)}
      </span>
      <span className="text-app text-[10px] font-black tabular-nums">{compactNumber(value)}</span>
      <motion.div
        className="from-ghost-600 via-ghost-500 to-ghost-400 group-hover/bar:scale-x-105 group-hover/bar:brightness-110 w-full max-w-11 origin-bottom rounded-t-md bg-linear-to-t"
        initial={{ height: 0 }}
        animate={{ height: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="text-subtle w-full truncate text-center text-[10px] leading-tight font-semibold">{label}</span>
    </div>
  )
}

/**
 * Cover glyphs are stored as names in the data and the blog renders them
 * from the project's drawn set. Here they map onto lucide so the row keeps
 * the site's icon voice without adding a second icon dependency.
 */
const GLYPH_ICON: Record<string, LucideIcon> = {
  layers: Layers,
  archive: Archive,
  terminal: Terminal,
  compass: Compass,
  package: Package,
  shield: Shield,
  spark: Sparkles,
  video: Video,
  download: Download,
  link: Link2,
  moon: Moon,
  grid: LayoutGrid,
}

function CoverGlyph({ name }: { name: string }) {
  const Icon = GLYPH_ICON[name] ?? BookOpen
  return <Icon className="size-5 text-white drop-shadow-md" aria-hidden="true" />
}

/** Windows vs Android split, hand-built with SVG strokes. */
function PlatformDonut({ win, android }: { win: number; android: number }) {
  const { t } = useI18n()
  const total = win + android
  const winShare = total ? Math.round((win / total) * 100) : 0
  const androidShare = 100 - winShare
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="size-36 sm:size-40" aria-hidden="true">
          <g transform="rotate(-90 50 50)">
            {/* Track */}
            <circle cx="50" cy="50" r="40" fill="none" strokeWidth="11" className="stroke-strong" />
            {/* Windows arc — the brand sweep. */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--color-ghost-500)"
              strokeWidth="11"
              strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: 0 }}
              animate={{ pathLength: winShare / 100, pathOffset: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Android arc — picks up where Windows ends. */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--color-veil-500)"
              strokeWidth="11"
              strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: winShare / 100 }}
              animate={{ pathLength: androidShare / 100, pathOffset: winShare / 100 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-app text-3xl leading-none font-black tabular-nums">
              <CountUp value={total} />
            </p>
            <p className="text-subtle mt-1 text-[11px] font-semibold">{t('إجمالي البرامج', 'Total programs')}</p>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid w-full gap-2">
        <div className="bg-sunken border-app flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
          <dt className="flex min-w-0 items-center gap-2">
            <span className="bg-ghost-500 size-2.5 shrink-0 rounded-full" aria-hidden="true" />
            <span className="text-app truncate text-[12.5px] font-bold">{t('برامج ويندوز', 'Windows programs')}</span>
          </dt>
          <dd className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-app text-[15px] font-black tabular-nums">
              <CountPop value={win} />
            </span>
            <span className="text-subtle text-[10.5px] font-bold tabular-nums">{winShare}%</span>
          </dd>
        </div>
        <div className="bg-sunken border-app flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
          <dt className="flex min-w-0 items-center gap-2">
            <span className="bg-veil-500 size-2.5 shrink-0 rounded-full" aria-hidden="true" />
            <span className="text-app truncate text-[12.5px] font-bold">{t('تطبيقات أندرويد', 'Android apps')}</span>
          </dt>
          <dd className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-app text-[15px] font-black tabular-nums">
              <CountPop value={android} />
            </span>
            <span className="text-subtle text-[10.5px] font-bold tabular-nums">{androidShare}%</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** Short label for the histogram x-axis. */
function shortName(p: Program, lang: 'ar' | 'en') {
  return lang === 'en' ? p.nameEn.split('—')[0].trim() : p.name.split('—')[0].trim()
}

/* ------------------------------------------------------------------ *
 * License key shape check — Crockford Base32 body + a 2-char checksum.
 * This validates *format and integrity only*; it is the same client-side
 * check the desktop/mobile apps run before contacting the server. A
 * "valid" result here means the key is well-formed, not that it is
 * entitled to anything, so the copy says exactly that.
 * ------------------------------------------------------------------ */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const KEY_CHARS = 20

function checksum(body: string): string {
  let h = 0x811c9dc5
  for (const ch of body) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return ALPHABET[h & 31] + ALPHABET[(h >>> 8) & 31]
}

function normaliseKey(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V')
}

function looksLikeKey(s: string): boolean {
  const n = normaliseKey(s)
  if (!new RegExp(`^[0-9A-HJKMNP-TV-Z]{${KEY_CHARS}}[0-9A-HJKMNP-TV-Z]{2}$`).test(n)) return false
  return n.slice(KEY_CHARS) === checksum(n.slice(0, KEY_CHARS))
}

export default function Dashboard() {
  const { lang, t } = useI18n()
  usePageMeta(
    t('لوحة التحكم — ZeidexSoft', 'Dashboard — ZeidexSoft'),
    t(
      'لوحة تشغيل تعرض ما يقيسه الموقع فعلياً: التنزيلات المحسوبة على الخادم، والبرامج، والمقالات.',
      'An operations dashboard of what the site actually measures: server-counted downloads, programs and articles.',
    ),
    '/dashboard',
  )

  const { state: ttState, avatar, stats } = useTikTokProfile()
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [licenseInput, setLicenseInput] = useState('')
  const [licenseStatus, setLicenseStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const { shake, shakeKey } = useShake()

  const handleCheckLicense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!licenseInput.trim()) return
    const ok = looksLikeKey(licenseInput)
    setLicenseStatus(ok ? 'valid' : 'invalid')
    // A refusal shakes the field so the failure is felt, not just read.
    if (!ok) shake()
  }

  // One request for the whole catalogue, mirroring what the /programs page pays per row.
  const slugs = programs.map((p) => p.slug).join(',')
  const loadCounts = useCallback(async () => {
    const res = await downloadCountsFor(slugs.split(','))
    setCounts(res)
  }, [slugs])
  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  const totalDownloads = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null
  const ranked = counts ? [...programs].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0)) : programs
  const maxDownloads = counts ? Math.max(1, ...Object.values(counts)) : 1

  // Platform split, derived from the catalogue — real counts, no estimates.
  const winCount = programs.filter((p) => p.kind === 'windows').length
  const androidCount = programs.filter((p) => p.kind === 'android').length
  const newest = [...programs].sort((a, b) => b.date.localeCompare(a.date))[0]
  // Honest category counts: one chip per published category plus its post count.
  const catCounts = categories.map((c) => ({
    key: c,
    label: categoryLabel(c, lang),
    count: allPosts.filter((p) => p.category === c).length,
  }))

  const statusChip =
    'chip ms-auto shrink-0 ' +
    (ttState === 'live'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300'
      : 'bg-ink-100 text-ink-500 dark:bg-white/5 dark:text-ink-400')

  const tikStats = [
    { icon: Users, label: t('متابع', 'Followers'), value: stats.followers },
    { icon: Video, label: t('فيديو', 'Videos'), value: stats.videos },
    { icon: Star, label: t('إعجاب', 'Likes'), value: stats.likes },
    { icon: UserPlus, label: t('يتابع', 'Following'), value: stats.following },
  ]

  return (
    <div className="container-app mx-auto max-w-[85rem] py-6 sm:py-8">
      {/* ── Hero band — greeting + the one live status, on a quiet brand wash ── */}
      <Reveal delay={0}>
        <header className="border-app bg-elevated shadow-app-lg rounded-panel relative isolate mb-6 overflow-hidden border p-6 sm:p-8">
          <span aria-hidden="true" className="dot-grid mask-fade-b pointer-events-none absolute inset-0 opacity-70" />
          <span
            aria-hidden="true"
            className="from-ghost-500/15 to-veil-500/10 pointer-events-none absolute -end-28 -top-28 size-72 rounded-full bg-linear-to-br blur-3xl"
          />
          <span aria-hidden="true" className="brand-gradient absolute inset-x-0 top-0 h-px opacity-80" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="chip border-app bg-accent-soft text-accent text-[11.5px] font-bold">
                <GraduationCap className="size-3.5" aria-hidden="true" />
                {t('لوحة التشغيل', 'Operations')}
              </p>
              <h1 className="text-app mt-3 text-2xl font-black tracking-tight sm:text-4xl">
                {t('أهلاً بك في لوحة التشغيل', 'Welcome to the operations dashboard')}
              </h1>
              <p className="text-subtle mt-1.5 max-w-xl text-[13px] leading-relaxed">
                {t(
                  'نظرة حيّة على ما يقيسه الموقع فعلياً: تنزيلات محسوبة على الخادم، وكتالوج البرامج والمقالات. لا نعرض رقماً لا نملك مصدره.',
                  'A live look at what the site actually measures: server-counted downloads and the program & article catalogues. We never show a number we cannot source.',
                )}
              </p>
            </div>
            <span className={statusChip}>
              <LiveDot tone={ttState === 'live' ? 'ok' : 'accent'} />
              {ttState === 'live'
                ? t('الهوية متحقّقة من تيك توك', 'Identity verified via TikTok')
                : t('بيانات لقطة موثّقة بتاريخها', 'Dated snapshot data')}
            </span>
          </div>
        </header>
      </Reveal>

      {/* ── KPI row ─────────────────────────────────────────────────── */}
      <Reveal delay={0.05} className="mb-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile
            icon={Download}
            label={t('إجمالي التنزيلات', 'Total downloads')}
            value={totalDownloads === null ? '…' : compactNumber(totalDownloads, lang)}
            delta={t('محسوبة', 'Counted')}
            tone="flat"
            note={t('على الخادم، موحّدة لكل الزوار', 'Server-side, identical for every visitor')}
          />
          <KpiTile
            icon={Package}
            label={t('البرامج المنشورة', 'Programs published')}
            value={compactNumber(programs.length, lang)}
            delta={`${winCount}+${androidCount}`}
            tone="flat"
            note={t('ويندوز + أندرويد', 'Windows + Android')}
          />
          <KpiTile
            icon={BookOpen}
            label={t('المقالات', 'Articles')}
            value={compactNumber(allPosts.length, lang)}
            delta={String(categories.length)}
            tone="flat"
            note={t('أقسام في المدونة', 'Blog categories')}
          />
          <KpiTile
            icon={Gauge}
            label={t('متوسط المشاهدات', 'Avg views')}
            value="—"
            note={t('لا نجمع بيانات المشاهدة، فلا نعرضها', 'We collect no view data, so we show none')}
          />
        </div>
      </Reveal>

      {/* ── Bento grid ─────────────────────────────────────────────────
         xl: histogram (2) + donut | leaderboard + latest + categories |
         tiktok + docs (2) | license (3). md: everything pairs in twos. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Downloads by programme — animated gradient bars, exact counts on hover. */}
        <Reveal delay={0.08} className="h-full md:col-span-2">
          <section
            aria-labelledby="dash-hist"
            className="border-app bg-elevated shadow-app-md hover-ring rounded-panel flex h-full flex-col border p-5 sm:p-6"
          >
            <PanelHead
              icon={Download}
              id="dash-hist"
              title={t('التنزيلات حسب البرنامج', 'Downloads by program')}
              sub={t('ارتفاع كل عمود نسبةً إلى الأكثر تنزيلاً.', 'Each bar’s height is relative to the most-downloaded.')}
              action={
                <span className="chip bg-accent-soft text-accent text-[11px] font-bold">
                  <Download className="size-3.5" aria-hidden="true" />
                  {totalDownloads === null ? t('…', '…') : compactNumber(totalDownloads, lang)}
                </span>
              }
            />
            <div className="mt-auto flex h-44 items-end gap-2 sm:gap-3">
              {ranked.map((p) => (
                <Bar key={p.slug} value={counts?.[p.slug] ?? 0} max={maxDownloads} label={shortName(p, lang)} />
              ))}
            </div>
          </section>
        </Reveal>

        {/* Platform split — hand-built SVG donut from catalogue counts. */}
        <Reveal delay={0.1} className="h-full">
          <section
            aria-labelledby="dash-catalogue"
            className="border-app bg-elevated shadow-app-md hover-ring rounded-panel flex h-full flex-col border p-5 sm:p-6"
          >
            <PanelHead
              icon={Library}
              id="dash-catalogue"
              title={t('كتالوج البرامج', 'Program catalogue')}
              sub={t('كل برنامج مرة واحدة، بحسب منصته', 'Counted once, by platform')}
            />
            <div className="flex flex-1 flex-col justify-center">
              <PlatformDonut win={winCount} android={androidCount} />
            </div>
            <Link to="/programs" className="btn btn-ghost group mt-4 w-full py-2.5">
              {t('كل البرامج', 'All programs')}
              <ArrowNudge>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </ArrowNudge>
            </Link>
          </section>
        </Reveal>

        {/* Most-downloaded leaderboard — rank chips + animated share bars. */}
        <Reveal delay={0.12} className="h-full">
          <section
            aria-labelledby="dash-ranked"
            className="border-app bg-elevated shadow-app-md hover-ring rounded-panel flex h-full flex-col border p-5 sm:p-6"
          >
            <PanelHead
              icon={TrendingUp}
              id="dash-ranked"
              title={t('الأكثر تنزيلاً', 'Most downloaded')}
              sub={t('نصيب كل برنامج من الإجمالي.', 'Each program’s share of the total.')}
            />
            <ol className="-my-1">
              {ranked.slice(0, 6).map((p, i) => (
                <ProgrammeRow key={p.slug} program={p} rank={i + 1} count={counts?.[p.slug] ?? 0} total={totalDownloads ?? 0} />
              ))}
            </ol>
          </section>
        </Reveal>

        {/* Latest release mini-card — one row of the catalogue, fully linked. */}
        <Reveal delay={0.14} className="h-full">
          {newest ? (
            <Link
              to="/programs"
              className="group card-lift press hover-ring border-app bg-elevated shadow-app-md rounded-panel flex h-full flex-col border p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className="bg-accent-soft text-accent grid size-10 shrink-0 place-items-center rounded-xl" aria-hidden="true">
                  {newest.kind === 'windows' ? <Monitor className="size-5" /> : <Smartphone className="size-5" />}
                </span>
                <div className="min-w-0">
                  <h2 className="text-app text-[15px] font-black">{t('أحدث إصدار', 'Latest release')}</h2>
                  <p className="text-subtle text-[12px]">{t('حسب تاريخ النشر', 'By release date')}</p>
                </div>
                <ArrowNudge>
                  <ArrowUpRight
                    className="text-subtle group-hover:text-accent size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </ArrowNudge>
              </div>
              <div className="mt-4 flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                <p className="text-app truncate text-[16px] font-black">{t(newest.name, newest.nameEn).split('—')[0].trim()}</p>
                <p className="text-subtle line-clamp-2 min-w-0 text-[12px] leading-relaxed">{t(newest.tagline, newest.taglineEn)}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                  <span className="chip bg-accent-soft text-accent text-[11px] font-bold">v{newest.version}</span>
                  <span className="text-subtle text-[11.5px] font-semibold">{formatDate(newest.date, lang)}</span>
                </div>
              </div>
            </Link>
          ) : null}
        </Reveal>

        {/* Article categories — real counts per published category. */}
        <Reveal delay={0.16} className="h-full">
          <section
            aria-labelledby="dash-cats"
            className="border-app bg-elevated shadow-app-md hover-ring rounded-panel flex h-full flex-col border p-5 sm:p-6"
          >
            <PanelHead
              icon={BookOpen}
              id="dash-cats"
              title={t('أقسام في المدونة', 'Blog categories')}
              action={
                <span className="chip bg-accent-soft text-accent text-[11px] font-bold tabular-nums">
                  {compactNumber(allPosts.length, lang)}
                </span>
              }
            />
            <ul className="flex flex-wrap content-center gap-2">
              {catCounts.map((c, i) => (
                <Reveal as="li" key={c.key} delay={0.2 + i * 0.05} y={8}>
                  <span className="chip bg-sunken hover-ring press text-app text-[12.5px] font-bold">
                    {c.label}
                    <span className="text-accent shrink-0 tabular-nums">{c.count}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* TikTok identity card — live identity, dated counters. */}
        <Reveal delay={0.18} className="h-full md:col-span-2">
          <section
            aria-labelledby="dash-social"
            className="border-app bg-elevated shadow-app-md hover-ring rounded-panel flex h-full flex-col border p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <img
                src={avatar}
                alt=""
                width={52}
                height={52}
                className="ring-accent-soft size-13 shrink-0 rounded-2xl object-cover ring-2"
              />
              <div className="min-w-0">
                <h2 id="dash-social" className="text-app truncate text-base font-black" dir="ltr">
                  {site.handle}
                </h2>
                <p className="text-subtle text-[12px]">{t('على تيك توك', 'On TikTok')}</p>
              </div>
              <span className={statusChip}>
                <LiveDot tone={ttState === 'live' ? 'ok' : 'accent'} />
                {ttState === 'live' ? t('لحظي', 'Live') : t('لقطة', 'Snapshot')}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {tikStats.map((s) => (
                <div
                  key={s.label}
                  className="bg-sunken border-app flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center"
                >
                  <dt className="text-subtle flex items-center gap-1.5 text-[11.5px] font-semibold">
                    <s.icon className="size-3.5 shrink-0" aria-hidden="true" />
                    {s.label}
                  </dt>
                  <dd className="text-app text-xl font-black tabular-nums">
                    <MiniNum value={s.value} lang={lang} />
                  </dd>
                </div>
              ))}
            </dl>

            <p className="text-subtle mt-3.5 text-[11.5px] leading-relaxed">
              {t(
                'oEmbed لا تكشف أعداد المتابعين، فهذه لقطة بتاريخها بدل رقم يدّعي أنه لحظي.',
                'oEmbed exposes no follower counts, so these are a dated snapshot, not a live figure.',
              )}
            </p>
          </section>
        </Reveal>

        {/* Articles — the catalogue rows that document the programs. */}
        <Reveal delay={0.2} className="h-full md:col-span-2">
          <section
            aria-labelledby="dash-docs"
            className="border-app bg-elevated shadow-app-md hover-ring rounded-panel flex h-full flex-col border p-5 sm:p-6"
          >
            <PanelHead
              icon={GraduationCap}
              id="dash-docs"
              title={t('تابع التعلّم', 'Continue learning')}
              sub={t('المقالات والأدلة التي توثّق البرامج.', 'The articles and guides that document the programs.')}
              action={
                <Link to="/blog" className="btn btn-ghost group px-3 py-1.5 text-[12.5px]">
                  {t('كل المقالات', 'All articles')}
                  <ArrowNudge>
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </ArrowNudge>
                </Link>
              }
            />
            <ul className="mt-auto grid gap-2.5">
              {allPosts.slice(0, 4).map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="group/row border-app bg-sunken press hover:border-accent-soft hover:bg-accent-soft/40 flex items-center gap-3 rounded-xl border p-3 transition-colors"
                  >
                    <span
                      className={cn('grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br', p.coverFrom, p.coverTo)}
                      aria-hidden="true"
                    >
                      <CoverGlyph name={p.cover} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-app block truncate text-[13.5px] font-bold">{p.title}</span>
                      <span className="text-subtle flex items-center gap-2 text-[11.5px]">
                        <PlayCircle className="size-3.5" aria-hidden="true" />
                        {categoryLabel(p.category, lang)}
                        <span className="text-subtle/70 flex items-center gap-1">
                          <Clock className="size-3" aria-hidden="true" />
                          {compactNumber(p.readMinutes, lang)} {t('د', 'min')}
                        </span>
                      </span>
                    </span>
                    <ArrowLeft
                      className="text-subtle group-hover/row:text-accent size-4 shrink-0 transition-colors duration-200 ltr:rotate-180 ltr:group-hover/row:translate-x-1 rtl:group-hover/row:-translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* License verification — format + integrity, stated as such. */}
        <Reveal delay={0.22} className="h-full md:col-span-2 xl:col-span-3">
          <section
            aria-labelledby="dash-license"
            className="border-app bg-elevated shadow-app-md hover-ring rounded-panel border p-5 sm:p-6"
          >
            <div className="grid items-center gap-5 lg:grid-cols-[1fr_minmax(0,1.15fr)] lg:gap-10">
              <div className="flex items-start gap-3">
                <span className="bg-accent-soft text-accent grid size-10 shrink-0 place-items-center rounded-xl" aria-hidden="true">
                  <ShieldCheck className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 id="dash-license" className="text-app text-[15px] font-black">
                    {t('فحص مفتاح الترخيص', 'License key check')}
                  </h2>
                  <p className="text-subtle text-[12px]">{t('سليم الصياغة، على جهازك', 'Well-formed, on-device')}</p>
                  <p className="text-subtle mt-2 text-[11.5px] leading-relaxed">
                    {t(
                      'الفحص للصياغة والتوقيع فقط، ويجري على جهازك — المتابعة مع الخادم تجري داخل التطبيقات.',
                      'Format and checksum only, checked on your device — server validation happens inside the apps.',
                    )}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCheckLicense} className="grid gap-2.5 sm:flex sm:flex-row sm:items-start">
                <Shake shakeKey={shakeKey} className="min-w-0 flex-1">
                  <input
                    id="lic-input"
                    type="text"
                    dir="ltr"
                    value={licenseInput}
                    onChange={(e) => {
                      setLicenseInput(e.target.value)
                      setLicenseStatus('idle')
                    }}
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XX"
                    aria-label={t('مفتاح الترخيص', 'License key')}
                    className="border-app bg-sunken text-app focus:border-accent focus:ring-accent/20 w-full rounded-xl border px-3.5 py-2.5 font-mono text-[13px] tracking-wider transition-colors placeholder:text-subtle focus:outline-none focus:ring-2"
                  />
                </Shake>
                <button type="submit" className="btn btn-primary shrink-0 px-5 py-2.5">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {t('فحص المفتاح', 'Verify key')}
                </button>
              </form>
            </div>

            {licenseStatus !== 'idle' ? (
              <p
                key={licenseStatus}
                role="status"
                className={
                  'mt-3 flex items-center gap-2 text-[12.5px] font-bold ' +
                  (licenseStatus === 'valid' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')
                }
              >
                {licenseStatus === 'valid' ? (
                  <>
                    <span
                      className="animate-pop-check bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300 grid size-6 shrink-0 place-items-center rounded-full"
                      aria-hidden="true"
                    >
                      <Check className="size-4" />
                    </span>
                    {t('المفتاح سليم الصياغة — وهذا لا يعني أنه مرخّص.', 'The key is well-formed — which does not mean it is entitled.')}
                  </>
                ) : (
                  <>
                    <span
                      className="animate-pop-check bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300 grid size-6 shrink-0 place-items-center rounded-full"
                      aria-hidden="true"
                    >
                      <X className="size-4" />
                    </span>
                    {t('غير صحيح — راجع الحروف أو راسل الدعم.', 'Not valid — recheck it or contact support.')}
                  </>
                )}
              </p>
            ) : null}
          </section>
        </Reveal>
      </div>
    </div>
  )
}
