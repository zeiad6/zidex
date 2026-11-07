import { useLang } from '@/lib/i18n'

/**
 * CapabilityTicker — the machine facts, in motion.
 *
 * A single hairline band that runs one loop every 54 seconds. It is the
 * only continuously moving element on the landing page below the hero, so
 * the eye reads it as instrumentation rather than as an advert. The track
 * is duplicated end to end, which makes the loop seamless without JS; the
 * two copies are hidden from assistive tech and the real list is exposed
 * once, statically.
 */

const facts = [
  { ar: 'سلسلة SHA-256', en: 'SHA-256 CHAIN' },
  { ar: 'PostgreSQL 18 مدمجة', en: 'EMBEDDED POSTGRESQL 18' },
  { ar: 'TLS 1.3', en: 'TLS 1.3' },
  { ar: 'ZATCA · المرحلة الثانية', en: 'ZATCA PHASE 2' },
  { ar: 'يعمل دون إنترنت', en: 'OFFLINE-FIRST' },
  { ar: 'تحقق ثابت الزمن', en: 'HMAC CONSTANT-TIME' },
  { ar: '20 برنامجاً', en: '20 BUILDS' },
  { ar: '27.6 مليون تحميل', en: '27.6M DOWNLOADS' },
  { ar: '+80 ألف متابع', en: '+80K COMMUNITY' },
  { ar: 'مزامنة LAN', en: 'LAN SYNC' },
  { ar: 'C2PA · EXIF', en: 'C2PA · EXIF' },
] as const

export function CapabilityTicker() {
  const { lang } = useLang()

  return (
    <div className="relative mt-10 border-y border-hair-soft">
      <div className="ticker py-3.5">
        <div className="ticker-track gap-0" dir="ltr" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {facts.map((fact) => (
                <span key={`${copy}-${fact.en}`} className="flex shrink-0 items-center">
                  <span className="mono-label whitespace-nowrap px-6 text-[9.5px] text-subtle">
                    {lang === 'ar' ? fact.ar : fact.en}
                  </span>
                  <span aria-hidden="true" className="size-1 rotate-45 bg-jade/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <ul className="sr-only">
        {facts.map((fact) => (
          <li key={fact.en}>{lang === 'ar' ? fact.ar : fact.en}</li>
        ))}
      </ul>
    </div>
  )
}
