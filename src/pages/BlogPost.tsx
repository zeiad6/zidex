import { useEffect, useMemo, useState } from 'react'
import { useReadingFont } from '@/hooks/useReadingFont'
import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calendar, Clock, Home, Share2, Tag } from 'lucide-react'
import {
  categoryLabel,
  getAdjacentPosts,
  getPost,
  getPostReadMinutes,
  loadBodies,
  postsFor,
  type Block,
} from '@/data/posts'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'
import { site, tiktok } from '@/lib/site'
import { cn, formatDate, nativeShare } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'
import { Prose } from '@/components/blog/Prose'
import { ReadingProgress, TableOfContents } from '@/components/blog/BlogChrome'
import { PostCard, TagPill } from '@/components/blog/PostCard'
import { CopyButton, Toast } from '@/components/ui/Primitives'
import NotFound from './NotFound'

export default function BlogPost() {
  const { slug = '' } = useParams()
  const { lang, t } = useI18n()
  const post = getPost(slug, lang)
  const [toast, setToast] = useState<string | null>(null)
  // Article text lives in its own chunk, so it arrives after first paint.
  const [body, setBody] = useState<Block[] | null>(null)

  // Only an open article needs the reading serif.
  useReadingFont()

  useEffect(() => {
    if (!post) {
      setBody(null)
      return
    }
    let live = true
    setBody(null)
    loadBodies(post.slug, lang).then((b) => {
      if (live) setBody(b ?? [])
    })
    return () => {
      live = false
    }
  }, [post, lang])

  // Canonical, og:url and title/description all follow the article here, not
  // the homepage — without this every shared article previewed and indexed
  // as the homepage, since the static HTML's head only describes "/".
  usePageMeta(
    post ? `${post.title} — ${site.name}` : t(site.title, site.titleEn),
    post ? post.excerpt : t(site.description, site.descriptionEn),
    post ? `/blog/${post.slug}` : '/blog',
  )

  // One dismissal path for both the share and the copy toast. Previously the
  // copy path set state with no timer, so the pill stayed for the session.
  // This hook must stay above the `if (!post)` early return below.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const minutes = useMemo(() => (post ? getPostReadMinutes(post) : 0), [post])
  const { prev, next } = useMemo(() => getAdjacentPosts(slug, lang), [slug, lang])

  if (!post) return <NotFound />

  const share = async () => {
    const ok = await nativeShare({
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    })
    setToast(ok ? t('تمت المشاركة', 'Shared') : t('تم نسخ رابط المقال', 'Post link copied'))
  }

  return (
    <>
      <ReadingProgress />

      <article className="pt-24 sm:pt-28">
        {/* Header */}
        <header className="container-app">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div>
              <nav aria-label={t('مسار التنقل', 'Breadcrumb')} className="mb-6 flex items-center gap-2 text-xs">
                <Link to="/" className="text-subtle hover:text-app flex items-center gap-1 transition-colors">
                  <Home className="size-3" aria-hidden="true" />
                  {t('الرئيسية', 'Home')}
                </Link>
                <span className="text-subtle" aria-hidden="true">
                  /
                </span>
                <Link to="/blog" className="text-subtle hover:text-app transition-colors">
                  {t('المدونة', 'Blog')}
                </Link>
                <span className="text-subtle" aria-hidden="true">
                  /
                </span>
                <span className="text-accent line-clamp-1">{categoryLabel(post.category, lang)}</span>
              </nav>

              <Reveal>
                <h1 className="text-3xl leading-[1.2] font-extrabold tracking-tight sm:text-4xl lg:text-[3.25rem]">
                  {post.title}
                </h1>
              </Reveal>

              <Reveal delay={0.08}>
                <p className="text-muted mt-5 max-w-2xl text-lg leading-relaxed">{post.excerpt}</p>
              </Reveal>

              <Reveal delay={0.12}>
                <div className="border-app text-subtle mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-5 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" aria-hidden="true" />
                    <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {t(`${minutes} دقائق قراءة`, `${minutes} min read`)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5" aria-hidden="true" />
                    {categoryLabel(post.category, lang)}
                  </span>
                </div>
              </Reveal>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <Reveal delay={0.14}>
                <TableOfContents post={post} />
              </Reveal>
            </div>
          </div>
        </header>

        {/* Cover — hidden when the body already opens with an image */}
        {!(body && body.length > 0 && body[0].type === 'image') && (
          <div className="container-app mt-8">
            <Reveal y={24}>
              <div
                className={cn(
                  'relative flex h-52 items-center justify-center overflow-hidden rounded-4xl sm:h-64',
                  'bg-gradient-to-br',
                  post.coverFrom,
                  post.coverTo,
                )}
              >
                <span className="dot-grid absolute inset-0 opacity-25" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgb(0_0_0/0.3),transparent_60%)]"
                />
                <span className="animate-float-slow text-7xl drop-shadow-2xl sm:text-8xl" aria-hidden="true">
                  <Glyph name={post.cover as GlyphName} size={72} className="text-white drop-shadow-2xl" />
                </span>
              </div>
            </Reveal>
          </div>
        )}

        {/* Body */}
        <div className="container-app mt-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="min-w-0">
              {body === null ? (
                <BodySkeleton />
              ) : body.length === 0 ? (
                <p className="text-subtle">—</p>
              ) : (
                <Prose blocks={body} />
              )}

              {/* Tags + actions */}
              <div className="border-app mt-14 flex flex-col gap-5 border-t pt-8">
                <div className="flex flex-wrap items-center gap-2">
                  {post.tags.map((t) => (
                    <TagPill key={t}>{t}</TagPill>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={share}
                    className="btn btn-primary h-10 cursor-pointer px-5 text-sm"
                  >
                    <Share2 className="size-3.5" aria-hidden="true" />
                    {t('مشاركة المقال', 'Share post')}
                  </button>
                  <CopyButton
                    value={typeof window === 'undefined' ? '' : window.location.href}
                    label={t('نسخ الرابط', 'Copy link')}
                    className="h-10 text-sm"
                    onCopied={() => setToast(t('تم نسخ رابط المقال', 'Post link copied'))}
                  />
                  <Link to="/blog" className="btn btn-ghost h-10 cursor-pointer px-5 text-sm">
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                    {t('كل المقالات', 'All posts')}
                  </Link>
                </div>
              </div>

              {/* Author / account nudge */}
              <div className="shadow-app-lg mt-10 flex flex-col items-start gap-5 rounded-3xl border border-app bg-elevated p-6 sm:flex-row sm:items-center">
                <span className="tiktok-gradient grid size-14 shrink-0 place-items-center rounded-2xl text-2xl">
                  🎵
                </span>
                <div className="flex-1">
                  <h3 className="text-app font-bold">
                    {t(`تابع ${site.handle} لمحتوى جديد`, `Follow ${site.handle} for new content`)}
                  </h3>
                  <p className="text-muted mt-1 text-sm">
                    {t(
                      'المقالات هنا نسخة مكتوبة — الفيديو الأصلي على تيك توك.',
                      'Posts here are the written version — the original video is on TikTok.',
                    )}
                  </p>
                </div>
                <a
                  href={tiktok.profile}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn tiktok-gradient h-11 shrink-0 cursor-pointer px-5 text-white"
                >
                  {t('افتح تيك توك', 'Open TikTok')}
                </a>
              </div>

              {/* Prev / next */}
              <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label={t('مقالات مجاورة', 'Adjacent posts')}>
                {prev ? (
                  <Link
                    to={`/blog/${prev.slug}`}
                    className="border-app hover:border-strong group flex flex-col gap-1.5 rounded-2xl border p-5 transition-colors"
                  >
                    <span className="text-subtle flex items-center gap-1.5 text-[11px]">
                      <ArrowRight className="size-3" aria-hidden="true" />
                      {t('الأحدث', 'Newer')}
                    </span>
                    <span className="text-app line-clamp-2 text-sm font-semibold transition-colors group-hover:text-accent">
                      {prev.title}
                    </span>
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
                {next ? (
                  <Link
                    to={`/blog/${next.slug}`}
                    className="border-app hover:border-strong group flex flex-col items-end gap-1.5 rounded-2xl border p-5 text-end transition-colors"
                  >
                    <span className="text-subtle flex items-center gap-1.5 text-[11px]">
                      {t('الأقدم', 'Older')}
                      <ArrowLeft className="size-3 ltr:rotate-180" aria-hidden="true" />
                    </span>
                    <span className="text-app line-clamp-2 text-sm font-semibold transition-colors group-hover:text-accent">
                      {next.title}
                    </span>
                  </Link>
                ) : null}
              </nav>
            </div>

            <div className="hidden lg:block" aria-hidden="true" />
          </div>
        </div>
      </article>

      {/* More posts */}
      <section className="container-app mt-14 sm:mt-16">
        <div className="border-app flex items-center justify-between border-t pt-10">
          <h2 className="text-2xl font-bold tracking-tight">{t('مقالات أخرى', 'More posts')}</h2>
          <Link to="/blog" className="text-accent flex items-center gap-1.5 text-sm font-medium">
            {t('عرض الكل', 'View all')}
            <ArrowLeft className="size-3.5 ltr:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {postsFor(lang)
            .filter((p) => p.slug !== post.slug)
            .slice(0, 3)
            .map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
        </div>
      </section>

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  )
}

/**
 * Shown while the article chunk is in flight. Reserves the shape of a real
 * article so the page does not jump when the text lands.
 */
function BodySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="جارٍ تحميل المقال">
      {[92, 78, 86, 64].map((w, i) => (
        <div
          key={i}
          className="bg-sunken h-4 animate-pulse rounded-full"
          style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
        />
      ))}
      <div className="bg-sunken mt-6 h-40 w-full animate-pulse rounded-2xl" />
      <span className="sr-only">جارٍ تحميل نص المقال</span>
    </div>
  )
}
