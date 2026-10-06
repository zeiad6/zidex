import { useEffect, useState } from 'react'
import { ArrowLeft, BarChart2, BookOpen, Download, Package, Star, Users, Video, Key, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { programs } from '@/data/programs'
import { allPosts } from '@/data/posts'
import { tiktok } from '@/lib/site'
import { useTikTokProfile } from '@/hooks/useTikTokProfile'
import { compactNumber } from '@/lib/utils'
import { LiveDot } from '@/components/ui/Motion'
import { Reveal } from '@/components/ui/Reveal'
import { Stat } from '@/components/ui/Stat'
import { downloadCountsFor } from '@/lib/downloads'

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
  return raw.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V')
}

function looksLikeKey(s: string): boolean {
  const n = normaliseKey(s)
  if (!new RegExp(`^[0-9A-HJKMNP-TV-Z]{${KEY_CHARS}}[0-9A-HJKMNP-TV-Z]{2}$`).test(n)) return false
  return n.slice(KEY_CHARS) === checksum(n.slice(0, KEY_CHARS))
}

export default function Dashboard() {
  const { t, lang } = useI18n()
  const { state, avatar, handle } = useTikTokProfile()
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [licenseInput, setLicenseInput] = useState('')
  const [licenseStatus, setLicenseStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')

  const handleCheckLicense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!licenseInput.trim()) return
    const valid = looksLikeKey(licenseInput)
    setLicenseStatus(valid ? 'valid' : 'invalid')
  }

  usePageMeta(
    `${t('لوحة التحكم', 'Dashboard')} — ZeidexSoft`,
    t('أرقام المنصة الفعلية: المتابعون، التنزيلات، البرامج والمقالات.', 'The platform in real numbers: followers, downloads, programs and articles.'),
    '/dashboard',
  )

  useEffect(() => {
    let alive = true
    downloadCountsFor(programs.map((p) => p.slug)).then((c) => alive && setCounts(c))
    return () => {
      alive = false
    }
  }, [])

  const downloads = counts
    ? Object.values(counts).reduce((a, b) => a + b, 0)
    : null
  const topProgram = counts
    ? [...programs].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0))[0]
    : null
  const latestPost = allPosts[0]

  return (
    <div className="container-app flex flex-col gap-8 py-6 lg:py-8">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-app text-2xl font-black">{t('أرقام المنصة', 'Platform numbers')}</h1>
            <p className="text-subtle mt-1 max-w-[62ch] text-[14px] leading-relaxed">
              {t(
                'كل رقم هنا مقيس أو مشتق من بيانات الموقع. ما لا نقيسه لا يظهر كرقم.',
                'Every figure here is measured or derived from the site’s own data. What is not measured is not shown as a number.',
              )}
            </p>
          </div>
          <span className="chip bg-accent-soft text-accent">
            <LiveDot tone={state === 'live' ? 'ok' : 'warn'} />
            {state === 'live'
              ? t('الهوية متحققة من تيك توك', 'Identity verified via TikTok')
              : t('لقطة بتاريخ', 'Dated snapshot')}
          </span>
        </div>
      </Reveal>

      {/* ── TikTok: the identity is live, the counters are a snapshot ─────── */}
      <Reveal delay={0.05}>
        <section aria-labelledby="dash-social" className="border-app bg-elevated shadow-app-md rounded-panel border p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <img src={avatar} alt="" width={56} height={56} className="size-14 rounded-2xl object-cover" />
            <div className="min-w-0">
              <h2 id="dash-social" className="text-app text-lg font-black" dir="ltr">
                {handle}
              </h2>
              <p className="text-subtle text-[13px]">{t('على تيك توك', 'On TikTok')}</p>
            </div>
            <p className="text-subtle ms-auto text-[12px]">
              {t('أرقام الحساب كما سُجّلت في', 'Account figures as recorded on')}{' '}
              <time dateTime={tiktok.updatedAt}>{tiktok.updatedAt}</time>
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Users} label={t('متابع', 'Followers')} value={compactNumber(tiktok.stats.followers, lang)} />
            <Stat icon={Video} label={t('فيديو', 'Videos')} value={compactNumber(tiktok.stats.videos, lang)} />
            <Stat icon={Star} label={t('إعجاب', 'Likes')} value={compactNumber(tiktok.stats.likes, lang)} />
            <Stat icon={Users} label={t('يتابع', 'Following')} value={compactNumber(tiktok.stats.following, lang)} />
          </dl>

          <p className="text-subtle mt-4 text-[12px] leading-relaxed">
            {t(
              'واجهة oEmbed العامة من تيك توك لا تكشف أعداد المتابعين، لذا هذه لقطة موثّقة بتاريخها بدل رقم يدّعي أنه لحظي.',
              'TikTok’s public oEmbed endpoint exposes no follower counts, so these are a dated snapshot rather than a figure pretending to be live.',
            )}
          </p>
        </section>
      </Reveal>

      {/* ── What the site can actually measure ───────────────────────────── */}
      <Reveal delay={0.08}>
        <section aria-labelledby="dash-site">
          <h2 id="dash-site" className="text-app text-xl font-black">
            {t('ما يقيسه الموقع فعلياً', 'What the site actually measures')}
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={Download}
              label={t('تنزيلات البرامج', 'Program downloads')}
              value={downloads === null ? '…' : compactNumber(downloads, lang)}
              note={t('محسوبة على الخادم ومنتشرة لكل الزوار', 'Counted server-side, identical for every visitor')}
            />
            <Stat
              icon={Package}
              label={t('برنامج منشور', 'Programs published')}
              value={compactNumber(programs.length, lang)}
              note={t('من مستودع واحد', 'From one catalogue')}
            />
            <Stat
              icon={BookOpen}
              label={t('مقال', 'Articles')}
              value={compactNumber(allPosts.length, lang)}
              note={t('أرشيف المدونة', 'Blog archive')}
            />
            <Stat
              icon={BarChart2}
              label={t('متوسط مشاهدات الفيديو', 'Avg video views')}
              value="—"
              note={t('لا نجمع بيانات المشاهدة، فلا نعرضها', 'We collect no view data, so we show none')}
            />
          </dl>
        </section>
      </Reveal>

      {/* ── Programs by real download count ───────────────────────────────── */}
      <Reveal delay={0.1}>
        <section aria-labelledby="dash-programs" className="border-app bg-elevated shadow-app-md rounded-panel border p-5 sm:p-6">
          <h2 id="dash-programs" className="text-app text-lg font-black">
            {t('البرامج والتنزيلات', 'Programs and downloads')}
          </h2>
          {!counts ? (
            <p className="text-subtle mt-4 text-[13px]">{t('جارٍ التحميل…', 'Loading…')}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-start">
                <thead>
                  <tr className="border-app text-subtle border-b text-[12px]">
                    <th className="pb-2 text-start font-semibold">{t('البرنامج', 'Program')}</th>
                    <th className="pb-2 text-start font-semibold">{t('المنصة', 'Platform')}</th>
                    <th className="pb-2 text-start font-semibold">{t('الإصدار', 'Version')}</th>
                    <th className="pb-2 text-end font-semibold">{t('التنزيلات', 'Downloads')}</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {programs.map((p) => (
                    <tr key={p.slug} className="hover:bg-sunken border-app border-b transition-colors last:border-0">
                      <td className="py-2.5 pe-3 font-semibold">{t(p.name, p.nameEn)}</td>
                      <td className="py-2.5 pe-3 text-subtle">{p.platform}</td>
                      <td className="py-2.5 pe-3 font-mono text-[12px]" dir="ltr">
                        v{p.version}
                      </td>
                      <td className="py-2.5 text-end font-black tabular-nums">
                        {compactNumber(counts[p.slug] ?? 0, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {counts && topProgram && (counts[topProgram.slug] ?? 0) > 0 ? (
            <p className="text-subtle mt-4 text-[12.5px]">
              {t('الأكثر تنزيلاً:', 'Most downloaded:')}{' '}
              <strong className="text-app font-bold">{t(topProgram.name, topProgram.nameEn)}</strong>{' '}
              <span className="text-accent inline-flex items-center gap-1 font-bold">
                {compactNumber(counts[topProgram.slug], lang)}
                <ArrowLeft className="size-3" aria-hidden="true" />
              </span>
            </p>
          ) : null}
        </section>
      </Reveal>
      {/* ── Bot Solutions & Digital Licensing Hub ─────────────────────────── */}
      <Reveal delay={0.11}>
        <section aria-labelledby="dash-licensing" className="border-app bg-elevated shadow-app-md rounded-panel border p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-accent-soft text-accent p-2.5 rounded-xl">
                <Key className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="dash-licensing" className="text-app text-lg font-black">
                  {t('بوابة فحص التراخيص والحلول البرمجية', 'Digital Licensing & Solutions Hub')}
                </h2>
                <p className="text-subtle text-[13px]">
                  {t('تحقق من صحة مفتاح الترخيص الخاص بك (Crockford Base32 + Ed25519) وتابع حلول البوتات.', 'Verify your license key integrity (Crockford Base32 + Ed25519) and track bot solutions.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip bg-accent-soft text-accent text-[12px] font-bold">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {t('حماية عتادية مشفرة', 'Hardware-backed')}
              </span>
            </div>
          </div>

          <form onSubmit={handleCheckLicense} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="lic-input" className="sr-only">
                {t('مفتاح الترخيص', 'License Key')}
              </label>
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
                className="border-app bg-sunken text-app w-full rounded-xl border px-3.5 py-2.5 font-mono text-[13.5px] tracking-wider placeholder:text-subtle focus:border-accent focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-accent text-on-accent inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition-opacity hover:opacity-90 cursor-pointer"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t('فحص المفتاح', 'Verify Key')}
            </button>
          </form>

          {licenseStatus === 'valid' && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-[13px] text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {t('مفتاح الترخيص سليم وموثق هندسياً!', 'License key format and checksum verified!')}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed opacity-90">
                {t(
                  'المفتاح يطابق صيغة التشفير الرسمية (20 محرفاً + 2 تحقق). صالح للاستخدام مع تطبيقات أندرويد وويندوز وبوتات المنصة.',
                  'Key conforms to standard cryptographic specifications (20 chars + 2 checksum). Valid for Android, Windows, and platform bots.',
                )}
              </p>
            </div>
          )}

          {licenseStatus === 'invalid' && (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-[13px] text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                {t('مفتاح الترخيص غير صالح أو به خطأ في الكتابة.', 'Invalid license key or typographical error.')}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed opacity-90">
                {t(
                  'تأكد من إدخال الـ 22 محرفاً بدقة. لا تحتوي المفاتيح الصالحة على أحرف I أو L أو O أو U.',
                  'Ensure all 22 characters are typed accurately. Valid keys never contain letters I, L, O, or U.',
                )}
              </p>
            </div>
          )}
        </section>
      </Reveal>

      {/* ── Recent publishing ─────────────────────────────────────────────── */}
      <Reveal delay={0.12}>
        <section aria-labelledby="dash-recent" className="grid gap-3 sm:grid-cols-2">
          <div className="border-app bg-elevated shadow-app-md rounded-panel border p-5">
            <h2 id="dash-recent" className="text-app text-[15px] font-black">
              {t('آخر مقال', 'Latest article')}
            </h2>
            {latestPost ? (
              <>
                <p className="text-app mt-2 text-[14px] leading-snug font-bold">{latestPost.title}</p>
                <p className="text-subtle mt-1 text-[12px]">
                  <time dateTime={latestPost.date}>{latestPost.date}</time>
                </p>
              </>
            ) : null}
          </div>
          <div className="border-app bg-elevated shadow-app-md rounded-panel border p-5">
            <h2 className="text-app text-[15px] font-black">{t('أحدث نسخة', 'Newest build')}</h2>
            <p className="text-app mt-2 text-[14px] leading-snug font-bold">
              {[...programs].sort((a, b) => b.date.localeCompare(a.date))[0]?.name}
            </p>
            <p className="text-subtle mt-1 text-[12px]">
              <time dateTime={[...programs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date}>
                {[...programs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date}
              </time>
            </p>
          </div>
        </section>
      </Reveal>

      <p className="text-subtle text-[12px] leading-relaxed">
        {t(
          'هذه لوحة المنصة، وتعرض أرقامها هي لا بيانات زائر.',
          'This dashboard is for you, not for us. It shows the platform’s own figures, never a visitor’s data.',
        )}
      </p>
    </div>
  )
}