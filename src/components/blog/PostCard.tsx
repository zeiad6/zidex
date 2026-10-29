import { Link } from 'react-router-dom'
import { Glyph, type GlyphName } from '@/components/ui/Glyphs'
import { categoryLabel, type PostMeta } from '@/data/posts'
import { programForPost } from '@/data/programs'
import { categoryStyle } from './categoryStyle'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'
import { Smartphone, Monitor } from 'lucide-react'

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
  const prog = programForPost(post.slug)

  return (
    <Reveal as="article" delay={Math.min(index * 0.05, 0.25)} className="h-full">
      <Link
        to={`/blog/${post.slug}`}
        className="border-app bg-elevated group flex h-full flex-col rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-app-md"
      >
        <div className="flex items-center gap-2.5">
          <span className="relative shrink-0">
            <span className={cn('grid size-9 place-items-center rounded-lg border border-app transition-transform duration-300 group-hover:scale-105', style.text)}>
              <Glyph name={post.cover as GlyphName} size={16} />
            </span>
            {prog?.kind === 'android' ? (
              <span className="absolute -end-1 -bottom-1 grid size-4 place-items-center rounded-full bg-emerald-500 text-white">
                <Smartphone className="size-2.5" />
              </span>
            ) : prog ? (
              <span className="absolute -end-1 -bottom-1 grid size-4 place-items-center rounded-full bg-blue-500 text-white">
                <Monitor className="size-2.5" />
              </span>
            ) : null}
          </span>
          <span className={cn('flex items-center gap-1 text-[11px] font-semibold tracking-wide', style.text)}>
            <Glyph name={icon} size={12} aria-hidden="true" />
            {categoryLabel(post.category, lang)}
          </span>
        </div>

        <h3 className="text-app group-hover:text-accent mt-4 line-clamp-2 text-base leading-snug font-bold transition-colors">
          {post.title}
        </h3>
        <p className="text-muted mt-2 line-clamp-3 text-sm leading-relaxed">{post.excerpt}</p>

        <p className="text-subtle mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-[11px]">
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
