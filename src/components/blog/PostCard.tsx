import { Link } from 'react-router-dom'
import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import { categoryLabel, type PostMeta } from '@/data/posts'
import { categoryStyle } from './categoryStyle'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Article card from the dashboard grid: a gray stage with the category
 * hanging from its top edge like a tab, and a miniature of the article
 * page (real title and excerpt, decorative) rising out of it.
 */
export function PostCard({ post, index = 0 }: { post: PostMeta; index?: number }) {
  const { lang, t } = useI18n()
  const style = categoryStyle[post.category]
  const Icon = style.icon

  return (
    <Reveal as="article" delay={Math.min(index * 0.05, 0.25)} className="group h-full">
      <Link to={`/blog/${post.slug}`} className="flex h-full flex-col rounded-2xl">
        <div className={cn('bg-sunken relative overflow-hidden rounded-2xl border-t-2 px-6 pt-11 sm:px-8', style.edge)}>
          <span
            className={cn(
              'absolute top-0 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-b-lg px-3 py-1 text-xs font-medium whitespace-nowrap',
              style.pill,
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {categoryLabel(post.category, lang)}
          </span>

          {/* Miniature page. Decorative: the real title is below. */}
          <div
            aria-hidden="true"
            className="bg-elevated ring-line h-36 overflow-hidden rounded-t-lg p-3.5 shadow-sm ring-1 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0"
          >
            <div
              className={cn(
                'mb-2.5 grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-105',
                post.coverFrom,
                post.coverTo,
              )}
            >
              <Glyph name={post.cover as GlyphName} size={18} />
            </div>
            <p className="text-app line-clamp-2 text-[10px] leading-snug font-bold">{post.title}</p>
            <p className="text-subtle mt-1.5 line-clamp-5 text-[7px] leading-[1.6]">{post.excerpt}</p>
          </div>
        </div>

        <h3 className="text-app group-hover:text-accent mt-4 line-clamp-2 text-[15px] leading-snug font-semibold transition-colors">
          {post.title}
        </h3>
        <p className="text-subtle mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
          <span aria-hidden="true">·</span>
          <span>{t(`${post.readMinutes} دقائق قراءة`, `${post.readMinutes} min read`)}</span>
          {post.featured ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-accent font-medium">{t('مميّز', 'Featured')}</span>
            </>
          ) : null}
        </p>
      </Link>
    </Reveal>
  )
}

export function TagPill({ children }: { children: string }) {
  return (
    <span className="chip text-subtle">
      <Glyph name="hash" size={10} aria-hidden="true" />
      {children}
    </span>
  )
}
