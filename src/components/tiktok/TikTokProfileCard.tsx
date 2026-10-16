import { useEffect, useState } from 'react'
import { Glyph } from '@/components/ui/Glyphs'
import { motion, useReducedMotion } from 'framer-motion'
import { site, tiktok } from '@/lib/site'
import { nativeShare } from '@/lib/utils'
import { CountUp } from '@/components/ui/Reveal'
import { useTikTokProfile } from '@/hooks/useTikTokProfile'
import { useI18n } from '@/lib/i18n'

/* ------------------------------------------------------------------ *
 * Profile card — the hero's anchor.
 * ------------------------------------------------------------------ */

export function TikTokProfileCard() {
  const { stats, state, handle, avatar } = useTikTokProfile()
  const [toast, setToast] = useState<string | null>(null)
  const [imgOk, setImgOk] = useState(true)
  const reduce = useReducedMotion()
  const { t } = useI18n()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const share = async () => {
    const ok = await nativeShare({
      title: t(`${site.name} على تيك توك`, `${site.name} on TikTok`),
      text: t(`تابع ${site.handle} على تيك توك`, `Follow ${site.handle} on TikTok`),
      url: tiktok.profile,
    })
    setToast(
      ok
        ? t('تمت المشاركة — شكراً لك 🤍', 'Shared — thank you 🤍')
        : t('تعذرت المشاركة، انسخ الرابط بدلاً من ذلك', 'Could not share — copy the link instead'),
    )
  }

  const items = [
    { glyph: 'userPlus' as const, label: t('متابع', 'Followers'), value: stats.followers, accent: 'text-tiktok-500' },
    { glyph: 'heart' as const, label: t('إعجاب', 'Likes'), value: stats.likes, accent: 'text-rose-500' },
    { glyph: 'video' as const, label: t('فيديو', 'Videos'), value: stats.videos, accent: 'text-ghost-400' },
  ]

  return (
    /*
     * The glow is a 64px-blurred layer, so it paints far outside its own box.
     * The wrapper is grown by the same amount (-m-6 / p-6) and clips there, so
     * the crop happens well away from the card's visible edge. Clipping at the
     * card's own radius instead turned the halo into a hard rounded rectangle.
     */
    <div className="relative mx-auto w-full max-w-md">
      <div className="bg-elevated relative rounded-panel border border-app p-5 sm:p-6">
        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <span
              aria-hidden="true"
              className="tiktok-gradient animate-pulse-ring absolute inset-0 rounded-full"
            />
            {imgOk ? (
              <img
                src={avatar}
                alt={t(`صورة حساب ${site.handle} على تيك توك`, `${site.handle} TikTok profile picture`)}
                width={88}
                height={88}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgOk(false)}
                className="relative size-[5.5rem] rounded-full border border-app object-cover"
              />
            ) : (
              <span
                className="bg-accent relative grid size-[5.5rem] place-items-center rounded-full text-3xl font-bold text-white"
                role="img"
                aria-label={t(`صورة حساب ${site.handle}`, `${site.handle} profile picture`)}
              >
                G
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">{handle}</h2>
            <span
              className="bg-accent-soft text-accent grid size-5 place-items-center rounded-full"
              title={t('حساب موثّق', 'Verified account')}
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-3" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.22" />
                <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="m8.8 12.2 2.2 2.2 4-4.4"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>

          <p className="text-subtle mt-1 font-mono text-sm">{site.handle}</p>

          <dl className="mt-4 grid w-full grid-cols-3 gap-2">
            {items.map(({ glyph, label, value, accent }, i) => (
              <motion.div
                key={label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="bg-sunken flex flex-col items-center gap-0.5 rounded-xl border border-app px-2 py-2.5"
              >
                <dt className="text-subtle flex items-center gap-1 text-[11px]">
                  <Glyph name={glyph} size={12} className={accent} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="text-app text-base font-bold tabular-nums">
                  <CountUp value={value} />
                </dd>
              </motion.div>
            ))}
          </dl>

          <div className="mt-4 flex w-full gap-2">
            <a
              href={tiktok.profile}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn btn-primary min-w-0 flex-1"
            >
              <Glyph name="spark" size={16} aria-hidden="true" />
              {t('تابع على تيك توك', 'Follow on TikTok')}
            </a>
            <button
              type="button"
              onClick={share}
              aria-label={t('مشاركة الحساب', 'Share account')}
              className="btn btn-ghost size-12 shrink-0 cursor-pointer"
            >
              <Glyph name="share" size={16} aria-hidden="true" />
            </button>
          </div>

          <p className="text-subtle mt-2.5 text-[11px]">
            {state === 'loading'
              ? t('○ جارٍ التحقق من الحساب', '○ Checking the account')
              : state === 'live'
                ? t('● الحساب موثّق على تيك توك', '● Account verified on TikTok')
                : t(`○ آخر تحديث للأرقام ${tiktok.updatedAt}`, `○ Figures last updated ${tiktok.updatedAt}`)}
          </p>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {toast}
      </p>
      {toast ? (
        <p className="text-muted mt-4 text-center text-xs" aria-hidden="true">
          {toast}
        </p>
      ) : null}
    </div>
  )
}
