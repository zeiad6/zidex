import { useEffect, useRef, useState } from 'react'
import { Glyph } from '@/components/ui/Glyphs'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpLeft, Copy } from 'lucide-react'
import { accentTokens, type HubLink } from '@/lib/site'
import { cn, copyText, nativeShare } from '@/lib/utils'
import { TiltCard } from '@/components/ui/Interactive'
import { useI18n } from '@/lib/i18n'

type Props = {
  link: HubLink
  onToast: (msg: string) => void
}

function hostOf(href: string, fallback: string) {
  try {
    return new URL(href, window.location.origin).hostname.replace('www.', '')
  } catch {
    return fallback
  }
}

/**
 * One hub link.
 *
 * Structure note: the anchor and the two action buttons are siblings, not
 * descendants. Nesting a <button> inside an <a> is invalid HTML and makes
 * keyboard order unpredictable, so the card is a plain container with a
 * stretched-link overlay for the click target and real buttons beside it.
 */
export function LinkCard({ link, onToast }: Props) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accent = accentTokens[link.accent]
  const { t } = useI18n()
  const title = t(link.title, link.titleEn)
  const description = t(link.description, link.descriptionEn)

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )
  const isInternal = link.href.startsWith('/')
  const externalHref = isInternal ? null : link.href

  const resolveUrl = () =>
    externalHref ?? new URL(link.href, window.location.origin).toString()

  const doCopy = async () => {
    if (!(await copyText(resolveUrl()))) return
    setCopied(true)
    onToast(t(`تم نسخ رابط «${title}»`, `Copied link to “${title}”`))
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  const doShare = async () => {
    const ok = await nativeShare({
      title,
      text: description,
      url: resolveUrl(),
    })
    onToast(ok ? t('تمت المشاركة', 'Shared') : t('تم نسخ الرابط بدلاً من ذلك', 'Link copied instead'))
  }

  const main = (
    <span className="relative flex items-start gap-3.5">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-2xl border border-app text-xl"
        style={{ backgroundColor: `rgb(${accent.rgb} / 0.1)` }}
      >
        <span aria-hidden="true">{link.emoji}</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-app block truncate text-[15px] font-semibold">{title}</span>
          {link.badge ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: `rgb(${accent.rgb} / 0.16)`, color: `rgb(${accent.rgb})` }}
            >
              {t(link.badge, link.badgeEn ?? link.badge)}
            </span>
          ) : null}
        </span>
        <span className="text-muted mt-1 line-clamp-2 block text-[13px] leading-relaxed">
          {description}
        </span>
      </span>

      <span className="text-subtle mt-1 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5">
        {isInternal ? (
          <ArrowLeft className="size-4" aria-hidden="true" />
        ) : (
          <ArrowUpLeft className="size-4" aria-hidden="true" />
        )}
      </span>
    </span>
  )

  return (
    <TiltCard max={link.featured ? 4 : 6} className="group h-full">
      <div
        className={cn(
          'bg-elevated relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-app p-4.5 shadow-app-md transition-[box-shadow,border-color,transform] duration-300',
          'hover:border-strong hover:shadow-app-lg focus-within:border-accent',
        )}
      >
        {/* Accent wash, driven by the same token as the icon tile. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, rgb(${accent.rgb} / 0.14), transparent 62%)`,
          }}
        />

        {isInternal ? (
          <Link to={link.href} className="relative block rounded-2xl focus-visible:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {main}
          </Link>
        ) : (
          // Plain target=_blank: the earlier preventDefault + window.open pair
          // made a blocked popup a silent no-op, and broke ⌘-click.
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="relative block cursor-pointer rounded-2xl focus-visible:outline-none"
          >
            <span className="absolute inset-0" aria-hidden="true" />
            {main}
          </a>
        )}

        <div className="relative mt-4 flex items-center gap-1.5 border-t border-app pt-3.5">
          <button
            type="button"
            onClick={doCopy}
            className="text-subtle hover:text-app focus-visible:ring-accent flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {copied ? (
              <>
                <Glyph name="check" size={12} className="text-emerald-500" aria-hidden="true" />
                <span className="text-emerald-500">{t('تم النسخ', 'Copied')}</span>
              </>
            ) : (
              <>
                <Copy className="size-3" aria-hidden="true" />
                {t('نسخ الرابط', 'Copy link')}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={doShare}
            className="text-subtle hover:text-app focus-visible:ring-accent flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Glyph name="share" size={12} aria-hidden="true" />
            {t('مشاركة', 'Share')}
          </button>

          <span className="text-subtle ms-auto font-mono text-[10px]">
            {isInternal ? t('داخلي', 'internal') : hostOf(link.href, t('رابط', 'link'))}
          </span>
        </div>
      </div>
    </TiltCard>
  )
}
