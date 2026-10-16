import { useMemo, useState } from 'react'
import { Glyph } from '@/components/ui/Glyphs'
import { ArrowLeft } from 'lucide-react'
import { hubLinks, site, tiktok, type HubLink } from '@/lib/site'
import { cn, copyText } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Primitives'
import { LinkCard } from '@/components/links/LinkCard'
import { TikTokProfileCard } from '@/components/tiktok/TikTokProfileCard'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'

const FILTERS = [
  { id: 'all', label: 'الكل', labelEn: 'All' },
  { id: 'primary', label: 'أساسي', labelEn: 'Main' },
  { id: 'social', label: 'تواصل', labelEn: 'Social' },
  { id: 'tool', label: 'أدوات', labelEn: 'Tools' },
  { id: 'resource', label: 'مصادر', labelEn: 'Resources' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

export default function Links() {
  const [filter, setFilter] = useState<FilterId>('all')
  const [toast, setToast] = useState<string | null>(null)
  const { t } = useI18n()

  usePageMeta(
    `${t('الروابط', 'Links')} — ${site.name}`,
    t('كل الروابط المهمة لـ ZeidexSoft في مكان واحد.', 'Every important ZeidexSoft link in one place.'),
    '/links',
  )

  const filtered = useMemo(
    () => (filter === 'all' ? hubLinks : hubLinks.filter((l: HubLink) => l.kind === filter)),
    [filter],
  )

  const counts = useMemo(() => {
    const map = new Map<FilterId, number>([['all', hubLinks.length]])
    for (const l of hubLinks) map.set(l.kind, (map.get(l.kind) ?? 0) + 1)
    return map
  }, [])

  const copyAll = async () => {
    // Internal links must be absolute: pasting "/blog" into a message or a
    // DM is a dead path for the recipient.
    const list = filtered
      .map((l) => `• ${t(l.title, l.titleEn)} — ${new URL(l.href, window.location.origin).toString()}`)
      .join('\n')
    if (await copyText(list)) setToast(t(`تم نسخ ${filtered.length} رابط`, `Copied ${filtered.length} links`))
  }

  return (
    <div className="swiss">
      {/* Page header */}
      <section className="container-app pt-8 pb-8 sm:pt-10">
        <div className="h-px w-full" style={{ background: 'var(--line-strong)' }} />
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="swiss-label text-app font-semibold">{t('مركز الروابط', 'Link hub')}</span>
          <span className="swiss-label text-subtle">{t(`${hubLinks.length} وجهة`, `${hubLinks.length} destinations`)}</span>
        </div>
        <div className="h-px w-full" style={{ background: 'var(--line-strong)' }} />
        <div className="pt-10">
          <Reveal delay={0.06}>
            <h1 className="swiss-headline swiss-display text-app max-w-[18ch]">
              {t(
                <>
                  كل <span style={{ color: 'var(--swiss-accent)' }}>الروابط</span> في شبكة واحدة
                </>,
                <>
                  All <span style={{ color: 'var(--swiss-accent)' }}>links</span> in one grid
                </>,
              )}
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-muted mt-6 max-w-2xl text-lg leading-relaxed">
              {t(
                `${hubLinks.length} وجهة مرتّبة حسب الأولوية. اضغط أي بطاقة للانتقال، أو انسخ الرابط مباشرة دون مغادرة الصفحة.`,
                `${hubLinks.length} destinations, ordered by priority. Tap any card to go there, or copy the link without leaving the page.`,
              )}
            </p>
          </Reveal>

          {/* Filters */}
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    aria-pressed={active}
                    className={cn(
                      'focus-visible:ring-accent cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none',
                      active
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-app text-muted hover:border-strong hover:text-app',
                    )}
                  >
                    {t(f.label, f.labelEn)}
                    <span
                      className={cn(
                        'ms-1.5 font-mono text-[10px]',
                        active ? 'opacity-80' : 'text-subtle',
                      )}
                    >
                      {counts.get(f.id) ?? 0}
                    </span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={copyAll}
                className="btn btn-ghost ms-auto h-9 cursor-pointer px-4 text-xs"
              >
                {t('نسخ كل الروابط', 'Copy all links')}
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Grid + sticky profile rail */}
      <section className="container-app pb-14 sm:pb-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            {filtered.length === 0 ? (
              <div className="border-app text-muted flex flex-col items-center gap-3 rounded-panel border border-dashed py-20 text-center">
                <Glyph name="search" size={32} className="text-subtle" aria-hidden="true" />
                <p className="text-app font-semibold">{t('لا توجد روابط في هذا التصنيف', 'No links in this category')}</p>
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="btn btn-primary h-9 cursor-pointer px-4 text-xs"
                >
                  {t('عرض الكل', 'Show all')}
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((link, i) => (
                  <Reveal key={link.id} delay={Math.min(i * 0.05, 0.3)}>
                    <LinkCard link={link} onToast={setToast} />
                  </Reveal>
                ))}
              </div>
            )}

            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-col items-start gap-4 border-t border-b border-app py-6 sm:flex-row sm:items-center">
                <span className="text-app grid size-12 shrink-0 place-items-center rounded-xl border border-app">
                  <Glyph name="tiktok" size={22} aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <h3 className="swiss-display text-app text-lg font-bold">
                    {t(`الوجهة الأهم: حساب ${site.handle}`, `Top destination: ${site.handle}`)}
                  </h3>
                  <p className="text-muted mt-1 text-sm">
                    {t(
                      'كل الفيديوهات الجديدة تنزل هناك أولاً. تابعه ليصلك الجديد قبل غيرك.',
                      'Every new video lands there first. Follow to see it before anyone else.',
                    )}
                  </p>
                </div>
                <a
                  href={tiktok.profile}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn btn-primary h-11 shrink-0 px-5"
                >
                  {t('انتقال', 'Go')}
                  <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden="true" />
                </a>
              </div>
            </Reveal>
          </div>

          {/* Rail */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Reveal delay={0.1}>
              <TikTokProfileCard />
            </Reveal>
            <Reveal delay={0.16}>
              <div className="bg-elevated mt-4 rounded-panel border border-app p-5">
                <h3 className="text-app text-sm font-semibold">{t('ملاحظة سريعة', 'Quick notes')}</h3>
                <ul className="text-muted mt-3 flex flex-col gap-2.5 text-[13px] leading-relaxed">
                  {t(
                    [
                      'الروابط الخارجية تفتح في تبويب جديد، فتبقى الصفحة هنا.',
                      'زر «نسخ الرابط» لا يفتح شيئاً — الصق الرابط مباشرة أينما شئت.',
                      'على الجوال، اضغط مطوّلاً على الرابط لنسخه من قائمة النظام.',
                    ],
                    [
                      'External links open in a new tab, so this page stays put.',
                      '“Copy link” opens nothing — paste it wherever you like.',
                      'On a phone, long-press a link to copy it from the system menu.',
                    ],
                  ).map((note) => (
                    <li key={note} className="flex gap-2">
                      <span className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
