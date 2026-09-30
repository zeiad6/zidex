import { Link } from 'react-router-dom'
import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import { categoryLabel, type PostMeta } from '@/data/posts'
import { categoryStyle } from './categoryStyle'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'
import { SpotlightCard } from '@/components/ui/Interactive'

/**
 * Article card: glyph, category, title, excerpt, then the date line.
 *
 * This used to render a second, shrunken copy of the title and excerpt at
 * 7px inside a fake page frame, stacked above the real ones. At that size
 * the text was texture, not content, and it made each card roughly 300px
 * tall. One readable card beats a decorative one.
 */
export function PostCard({ post, index = 0 }: { post: PostMeta; index?: number }) {
  const { lang, t } = useI18n()
  const style = categoryStyle[post.category]
  const icon = style.icon

  return (
    <Reveal as="article" delay={Math.min(index * 0.05, 0.25)} className="h-full">
      <SpotlightCard className="h-full shadow-app-md hover:shadow-app-lg">
      <Link
        to={`/blog/${post.slug}`}
        className="border-app bg-elevated group flex h-full flex-col rounded-card border p-4"
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100',
              post.coverFrom,
              post.coverTo,
            )}
          >
            <Glyph name={post.cover as GlyphName} size={16} />
          </span>
          <span className={cn('flex items-center gap-1 text-[11px] font-medium', style.text)}>
            <Glyph name={icon} size={12} aria-hidden="true" />
            {categoryLabel(post.category, lang)}
          </span>
        </div>

        <h3 className="text-app group-hover:text-accent mt-3 line-clamp-2 text-sm leading-snug font-bold transition-colors">
          {post.title}
        </h3>
        <p className="text-muted mt-1.5 line-clamp-3 text-xs leading-relaxed">{post.excerpt}</p>

        <p className="text-subtle mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[11px]">
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
      </SpotlightCard>
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
