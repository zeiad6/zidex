import { useMemo, useState } from 'react'
import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import { Link } from 'react-router-dom'
import { allPosts, categories, categoryLabel, postsFor, searchPosts, type Category } from '@/data/posts'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'
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

  usePageMeta(
    `${t('المدونة', 'Blog')} — ${site.name}`,
    t(site.description, site.descriptionEn),
    '/blog',
  )

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>([['all', allPosts.length]])
    for (const p of allPosts) map.set(p.category, (map.get(p.category) ?? 0) + 1)
    return map
  }, [])

  const showHero = category === 'all' && !query

  return (
    <>
      {/* Header */}
      <section className="swiss relative pt-10 pb-8 sm:pt-12">
        <div className="container-app relative">
          <div className="h-px w-full" style={{ background: 'var(--line-strong)' }} />
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="swiss-label text-app font-semibold">{t('المدونة', 'Blog')}</span>
            <span className="swiss-label text-subtle">{t(`${allPosts.length} مقالات`, `${allPosts.length} articles`)}</span>
          </div>
          <div className="h-px w-full" style={{ background: 'var(--line-strong)' }} />
          <div className="flex flex-col items-start justify-between gap-8 pt-10 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Reveal delay={0.06}>
                <h1 className="swiss-headline swiss-display text-app">{t('المدونة.', 'The blog.')}</h1>
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
                  'focus-visible:ring-accent cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  category === 'all'
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-app text-muted hover:border-strong hover:text-app',
                )}
              >
                {t('الكل', 'All')} <span className="ms-1.5 font-mono text-[10px] tabular-nums opacity-70">{categoryCounts.get('all')}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cn(
                    'focus-visible:ring-accent cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    category === c
                      ? 'border-accent bg-accent text-accent-fg'
                      : 'border-app text-muted hover:border-strong hover:text-app',
                  )}
                >
                  {categoryLabel(c, lang)} <span className="ms-1.5 font-mono text-[10px] tabular-nums opacity-70">{categoryCounts.get(c) ?? 0}</span>
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
            <article className="border-app bg-elevated card-lift group relative overflow-hidden rounded-2xl border shadow-app hover:border-accent/40 hover:shadow-app-md focus-within:border-accent">
              <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:p-10">
                <span
                  className="text-accent shrink-0 transition-transform duration-500 group-hover:-translate-y-1"
                  aria-hidden="true"
                >
                  <Glyph name={featured.cover as GlyphName} size={72} strokeWidth={1.4} />
                </span>
                <div className="flex-1">
                  <span className="text-accent font-mono text-[11px] tracking-widest uppercase">
                    {t('المقال الأبرز', 'Featured post')}
                  </span>
                  {/* <Link>, not <a>: a raw anchor re-downloads every chunk and
                      flashes the Suspense fallback on the slowest-first path. */}
                  <h2 className="text-app mt-3 text-2xl leading-tight font-extrabold sm:text-4xl">
                    <Link
                      to={`/blog/${featured.slug}`}
                      className="hover:text-accent transition-colors after:absolute after:inset-0"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="text-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
                    {featured.excerpt}
                  </p>
                  <p className="text-subtle mt-4 font-mono text-[11px]">
                    {categoryLabel(featured.category, lang)} · {t(`${featured.readMinutes} دقائق قراءة`, `${featured.readMinutes} min read`)}
                  </p>
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
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
