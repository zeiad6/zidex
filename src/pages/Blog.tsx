import { useEffect, useMemo, useState } from 'react'
import { Glyph } from '@/components/ui/Glyphs'
import { Link } from 'react-router-dom'
import { allPosts, categories, categoryLabel, postsFor, searchPosts, type Category } from '@/data/posts'
import { useI18n } from '@/lib/i18n'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'
import { AuroraBackdrop } from '@/components/ui/AuroraBackdrop'
import { Reveal } from '@/components/ui/Reveal'
import { PostCard } from '@/components/blog/PostCard'
import { BlogSearch } from '@/components/blog/BlogChrome'

export default function Blog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const { lang, t } = useI18n()

  // Search runs against a small dataset, so no debounce is needed — but the
  // memo keeps it off the render path of the cards themselves.
  const results = useMemo(() => searchPosts(query, lang), [query, lang])

  const filtered = useMemo(
    () => (category === 'all' ? results : results.filter((p) => p.category === category)),
    [results, category],
  )

  const posts = postsFor(lang)
  const featured = posts.find((p) => p.featured) ?? posts[0]

  useEffect(() => {
    document.title = `${t('المدونة', 'Blog')} — ${site.name}`
    return () => {
      document.title = t(site.title, site.titleEn)
    }
  }, [t])

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>([['all', allPosts.length]])
    for (const p of allPosts) map.set(p.category, (map.get(p.category) ?? 0) + 1)
    return map
  }, [])

  const showHero = category === 'all' && !query

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden pt-24 pb-8 sm:pt-28">
        <AuroraBackdrop intensity="md" className="opacity-40" />
        <div className="container-app relative">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Reveal>
                <span className="chip bg-accent-soft text-accent mb-5 w-fit">
                  <Glyph name="book" size={13} aria-hidden="true" />
                  {t(`${allPosts.length} مقالات`, `${allPosts.length} articles`)}
                </span>
              </Reveal>
              <Reveal delay={0.06}>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  <span className="gradient-text">{t('المدونة', 'Blog')}</span>
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">
                  {t(
                    'ملاحظات عملية عن صناعة المحتوى، خوارزمية تيك توك، تصميم الواجهات، والأداء على الجوال — بلا حشو.',
                    'Practical notes on content creation, the TikTok algorithm, interface design, and mobile performance — no filler.',
                  )}
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.16}>
              <BlogSearch value={query} onChange={setQuery} resultCount={filtered.length} />
            </Reveal>
          </div>

          {/* Category chips */}
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={t('تصفية حسب التصنيف', 'Filter by category')}>
              <button
                type="button"
                onClick={() => setCategory('all')}
                aria-pressed={category === 'all'}
                className={cn(
                  'focus-visible:ring-accent cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:outline-none',
                  category === 'all'
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-app text-muted hover:border-strong hover:text-app',
                )}
              >
                {t('الكل', 'All')} <span className="ms-1.5 font-mono text-[10px] opacity-70">{categoryCounts.get('all')}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cn(
                    'focus-visible:ring-accent cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:outline-none',
                    category === c
                      ? 'border-accent bg-accent text-accent-fg'
                      : 'border-app text-muted hover:border-strong hover:text-app',
                  )}
                >
                  {categoryLabel(c, lang)} <span className="ms-1.5 font-mono text-[10px] opacity-70">{categoryCounts.get(c) ?? 0}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured post — editorial "lead" slot, only on the unfiltered view. */}
      {showHero ? (
        <section className="container-app pb-2">
          <Reveal>
            <article className="group relative overflow-hidden rounded-4xl border border-app focus-within:border-accent">
              <div
                className={cn(
                  'relative bg-gradient-to-br',
                  featured.coverFrom,
                  featured.coverTo,
                )}
              >
                <span className="dot-grid absolute inset-0 opacity-25" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_85%_15%,rgb(0_0_0/0.35),transparent_60%)]"
                />
                <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-end sm:p-10">
                  <span
                    className="text-7xl drop-shadow-2xl transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6 sm:text-8xl"
                    aria-hidden="true"
                  >
                    {featured.cover}
                  </span>
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      <Glyph name="spark" size={13} aria-hidden="true" />
                      {t('المقال الأبرز', 'Featured post')}
                    </span>
                    <h2 className="mt-3 text-2xl leading-tight font-extrabold text-white sm:text-3xl">
                      {/* <Link>, not <a>: a raw anchor re-downloads every chunk
                          and flashes the Suspense fallback on the site's
                          slowest-first path. */}
                      <Link to={`/blog/${featured.slug}`} className="after:absolute after:inset-0">
                        {featured.title}
                      </Link>
                    </h2>
                    <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                      {featured.excerpt}
                    </p>
                    <p className="mt-4 font-mono text-[11px] text-white/70">
                      {categoryLabel(featured.category, lang)} · {t(`${featured.readMinutes} دقائق قراءة`, `${featured.readMinutes} min read`)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        </section>
      ) : null}

      {/* Grid */}
      <section className="container-app pb-14 pt-6 sm:pb-16">
        {filtered.length === 0 ? (
          <div className="border-app text-muted flex flex-col items-center gap-3 rounded-3xl border border-dashed py-20 text-center">
            <Glyph name="search" size={36} className="text-subtle" aria-hidden="true" />
            <p className="text-app text-lg font-semibold">{t('لا توجد نتائج', 'No results')}</p>
            <p className="max-w-sm text-sm">
              {t(
                `لم نعثر على مقال يطابق «${query || category}». جرّب كلمة أخرى أو أزل التصفية.`,
                `No post matches “${query || (category === 'all' ? '' : categoryLabel(category, lang))}”. Try another word or clear the filter.`,
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
              className="btn btn-primary mt-2 h-10 cursor-pointer px-5"
            >
              {t('إعادة الضبط', 'Reset')}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
