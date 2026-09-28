/* ------------------------------------------------------------------ *
 * Downloadable programs. Add an entry here and it shows up on the home
 * dashboard, the /programs page, and in search — nothing else to wire.
 * ------------------------------------------------------------------ */
import type { GlyphName } from '@/components/ui/Glyphs'

export type Program = {
  slug: string
  name: string
  nameEn: string
  tagline: string
  taglineEn: string
  version: string
  platform: string
  size: string
  file: string
  /** Where the download button points. */
  href: string
  /** Host shown next to the file name, e.g. "MediaFire". */
  host: string
  /** Slug of the blog post that documents it, if any. */
  post?: string
  /** Key into the Glyphs registry — a drawn mark, not an emoji. */
  glyph: GlyphName
  date: string
}

export const programs: Program[] = [
  {
    slug: 'edms-archive-pro',
    name: 'أرشيف برو EDMS',
    nameEn: 'Archive Pro EDMS',
    tagline: 'نظام إدارة وثائق إلكترونية: بحث نصي كامل، إصدارات غير قابلة للاستبدال، سير عمل، وتوقيع رقمي.',
    taglineEn: 'Electronic document management: full-text search, immutable versions, workflows, and digital signatures.',
    version: '1.0.0',
    platform: 'Windows x64',
    size: '227.78 MB',
    file: 'EDMS-Archive-1.0.0-Setup-x64.exe',
    href: 'https://www.mediafire.com/file/v2w2hffyxwobykq/EDMS-Archive-1.0.0-Setup-x64.exe/file',
    host: 'MediaFire',
    post: 'edms-archive-pro',
    glyph: 'archive',
    date: '2026-09-27',
  },
]

export function getProgram(slug: string) {
  return programs.find((p) => p.slug === slug)
}
