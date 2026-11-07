import { posts, type Post } from './posts'

/**
 * The modal only needs a summary and a few scannable points; the article
 * index already carries both (excerpt + precomputed headings), so this is
 * an adapter, not a second copy of the blog. The whole Post travels with
 * the modal so a language switch mid-dialog re-renders correctly.
 */
export type Article = { post: Post }

export function toArticle(post: Post): Article {
  return { post }
}

export function articleFor(slug: string | undefined): Article | null {
  if (!slug) return null
  const post = posts.find((item) => item.slug === slug)
  return post ? { post } : null
}
