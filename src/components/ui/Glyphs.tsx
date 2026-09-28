import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * A hand-picked glyph set drawn on one 24px grid with a 2px stroke, so the
 * whole site speaks with a single voice.
 *
 * Two reasons this exists instead of pulling in an icon package:
 *
 *  1. The pages were carrying emoji (🎵 🗄️ 🐳) as if they were interface
 *     icons. Emoji are rendered by the platform, so they look different on
 *     Android, iOS and Windows, cannot be sized or coloured, and carry
 *     colourful full-colour glyphs that fight a monochrome design.
 *  2. lucide covers the utility needs but not the brand ones. A TikTok mark,
 *     an archive box, a terminal prompt — the things that carry meaning here
 *     — were being approximated with generic shapes.
 *
 * Everything is a plain <svg> path: no runtime, no font, no colour baked in,
 * so `currentColor` and `stroke-width` are the only knobs.
 */

export type GlyphProps = SVGProps<SVGSVGElement> & {
  /** Defaults to 1em so a glyph matches the line it sits in. */
  size?: number
  /** Hollow variants trade fill for stroke, for outlined contexts. */
  variant?: 'solid' | 'outline'
}

function Svg({
  size = 20,
  variant = 'solid',
  className,
  children,
  ...rest
}: GlyphProps) {
  const solid = variant === 'solid'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke={solid ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ---------------------------------------------------------------- *
 * Brand
 * ---------------------------------------------------------------- */

/** TikTok's note, drawn rather than borrowed — the glyph is trademarked. */
export function GlyphTikTok(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M14.2 3v10.9a3.2 3.2 0 1 1-2.6-3.14" />
      <path d="M14.2 3c.5 2.2 2 3.5 4.3 3.7" />
    </Svg>
  )
}

export function GlyphZidex(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M3 7V4.5h9.4" />
      <path d="M3.6 4.9 11 12.4V20" />
      <path d="M21 17v2.5h-9.4" />
      <path d="M20.4 19.1 13 11.6V4" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- *
 * Blog & archive
 * ---------------------------------------------------------------- */

export function GlyphArticle(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 12.5h7M9 16h5" />
    </Svg>
  )
}

/** A stacked box: a filing cabinet seen from the front. */
export function GlyphArchive(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M3.5 6.5h17v4h-17z" />
      <path d="M5 10.5v9h14v-9" />
      <path d="M10 14.5h4" />
    </Svg>
  )
}

export function GlyphLayers(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M12 3.2 3.2 8 12 12.8 20.8 8z" />
      <path d="m3.2 13 8.8 4.8L20.8 13" />
      <path d="m3.2 18 8.8 4.8L20.8 18" />
    </Svg>
  )
}

export function GlyphLink(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M10.2 13.8a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
      <path d="M13.8 10.2a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </Svg>
  )
}

export function GlyphTerminal(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <rect x="2.8" y="4" width="18.4" height="16" rx="2.4" />
      <path d="m7 10 2.6 2.4L7 14.8" />
      <path d="M12.6 15.2h4.4" />
    </Svg>
  )
}

export function GlyphSearch(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.2 4.2" />
    </Svg>
  )
}

export function GlyphClock(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.4V12l3.1 1.9" />
    </Svg>
  )
}

export function GlyphTag(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M11 3.5H4.5a1 1 0 0 0-1 1V11l9 9 8-8z" />
      <circle cx="8" cy="8" r="1.4" />
    </Svg>
  )
}

export function GlyphFilter(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M3.5 5.5h17l-6.4 7.4v6l-4.2-2.4v-3.6z" />
    </Svg>
  )
}

export function GlyphGrid(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </Svg>
  )
}

export function GlyphDownload(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M12 3.8v10.4" />
      <path d="m7.8 10.4 4.2 4.2 4.2-4.2" />
      <path d="M4.5 17.2v2.1h15v-2.1" />
    </Svg>
  )
}

export function GlyphShield(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M12 3.2 5 5.8v5.4c0 4.2 2.8 8 7 9.6 4.2-1.6 7-5.4 7-9.6V5.8z" />
      <path d="m9.2 12 2 2 3.6-3.9" />
    </Svg>
  )
}

export function GlyphSpark(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M12 3.4 13.7 9l5.6 1.7-5.6 1.7L12 18l-1.7-5.6L4.7 10.7 10.3 9z" />
    </Svg>
  )
}

export function GlyphCompass(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="12" cy="12" r="8.4" />
      <path d="m15.4 8.6-1.8 5-5 1.8 1.8-5z" />
    </Svg>
  )
}

export function GlyphBook(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M4 4.5h6a3 3 0 0 1 3 3v12a2.4 2.4 0 0 0-2.4-2.4H4z" />
      <path d="M20 4.5h-6a3 3 0 0 0-3 3v12a2.4 2.4 0 0 1 2.4-2.4H20z" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- *
 * Interface
 * ---------------------------------------------------------------- */

export function GlyphSun(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5 17 7M7 17l-1.5 1.5M18.5 18.5 17 17M7 7 5.5 5.5" />
    </Svg>
  )
}

export function GlyphMoon(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a8.6 8.6 0 1 0 10.6 10.6Z" />
    </Svg>
  )
}

export function GlyphMenu(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Svg>
  )
}

export function GlyphClose(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />
    </Svg>
  )
}

export function GlyphArrowStart(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M20 12H4.4" />
      <path d="m10.6 5.8-6.2 6.2 6.2 6.2" />
    </Svg>
  )
}

export function GlyphArrowEnd(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M4 12h15.6" />
      <path d="m13.4 5.8 6.2 6.2-6.2 6.2" />
    </Svg>
  )
}

export function GlyphShare(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="17.6" cy="6.4" r="2.4" />
      <circle cx="6.4" cy="12" r="2.4" />
      <circle cx="17.6" cy="17.6" r="2.4" />
      <path d="m8.6 10.8 6.8-3.2M8.6 13.2l6.8 3.2" />
    </Svg>
  )
}

export function GlyphExternal(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M14 4.5h5.5V10" />
      <path d="m19.5 4.5-8 8" />
      <path d="M18.5 14v4.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7A1.5 1.5 0 0 1 5.5 5.5H10" />
    </Svg>
  )
}

export function GlyphCheck(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="m5 12.6 4.6 4.6L19 6.8" />
    </Svg>
  )
}

export function GlyphWarning(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M10.6 4.2 2.9 17.4a1.7 1.7 0 0 0 1.5 2.6h15.2a1.7 1.7 0 0 0 1.5-2.6L13.4 4.2a1.7 1.7 0 0 0-2.8 0Z" />
      <path d="M12 9.4v4.2M12 16.6h.01" />
    </Svg>
  )
}

export function GlyphInfo(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11v5.2M12 7.9h.01" />
    </Svg>
  )
}

export function GlyphBulb(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M9 17.2a6 6 0 1 1 6 0v1.6a1.6 1.6 0 0 1-1.6 1.6h-2.8a1.6 1.6 0 0 1-1.6-1.6z" />
      <path d="M9.4 17.4h5.2" />
    </Svg>
  )
}

export function GlyphHash(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M5 9.2h14M4.4 14.8h14M10 4.2 8.4 19.8M16 4.2l-1.6 15.6" />
    </Svg>
  )
}

export function GlyphPackage(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M20.5 8.2v7.6a1.6 1.6 0 0 1-.9 1.4l-6.8 3.4a1.6 1.6 0 0 1-1.6 0l-6.8-3.4a1.6 1.6 0 0 1-.9-1.4V8.2" />
      <path d="m3.5 7.6 8.5-4.2 8.5 4.2-8.5 4.2z" />
      <path d="M12 11.8v8.6" />
    </Svg>
  )
}

export function GlyphHome(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="m3.6 10.4 8.4-6.6 8.4 6.6" />
      <path d="M6 9.2v10.4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.2" />
    </Svg>
  )
}

export function GlyphUsers(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="9.4" cy="8.4" r="3.4" />
      <path d="M3.4 19.4a6 6 0 0 1 12 0" />
      <path d="M16 5.4a3.4 3.4 0 0 1 0 6.6M17.4 14.4a6 6 0 0 1 3.2 5" />
    </Svg>
  )
}

export function GlyphHeart(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M12 20.2S3.6 15.4 3.6 9.8a4.4 4.4 0 0 1 8.4-1.8 4.4 4.4 0 0 1 8.4 1.8c0 5.6-8.4 10.4-8.4 10.4Z" />
    </Svg>
  )
}

export function GlyphVideo(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <rect x="2.8" y="6.4" width="12.4" height="11.2" rx="2" />
      <path d="m15.2 11 5-2.8v7.6l-5-2.8z" />
    </Svg>
  )
}

export function GlyphUserPlus(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="9.6" cy="8" r="3.6" />
      <path d="M3.4 19.4a6.2 6.2 0 0 1 12.4 0" />
      <path d="M18.6 8.4v5.2M21.2 11h-5.2" />
    </Svg>
  )
}

export function GlyphDoc(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <path d="M13.4 3.5H6.5v17h11V7.6z" />
      <path d="M13.4 3.5v4.1h4.1" />
      <path d="M9.4 12.6h5.2M9.4 16h3.4" />
    </Svg>
  )
}

export function GlyphDots(props: GlyphProps) {
  return (
    <Svg {...props} variant="outline">
      <circle cx="5.5" cy="12" r="1.1" />
      <circle cx="12" cy="12" r="1.1" />
      <circle cx="18.5" cy="12" r="1.1" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- *
 * A registry so a page can pick a glyph by name without importing
 * twenty components. Falls back to a neutral dot rather than throwing.
 * ---------------------------------------------------------------- */

// A name→component map plus a lookup function live here alongside the
// components they map to, which is the same shape as lib/i18n.tsx and
// lib/theme.tsx. Fast refresh degrades for this file only.
// eslint-disable-next-line react-refresh/only-export-components
export const glyphs = {
  tiktok: GlyphTikTok,
  zidex: GlyphZidex,
  article: GlyphArticle,
  archive: GlyphArchive,
  layers: GlyphLayers,
  link: GlyphLink,
  terminal: GlyphTerminal,
  search: GlyphSearch,
  clock: GlyphClock,
  tag: GlyphTag,
  filter: GlyphFilter,
  grid: GlyphGrid,
  download: GlyphDownload,
  shield: GlyphShield,
  spark: GlyphSpark,
  compass: GlyphCompass,
  book: GlyphBook,
  sun: GlyphSun,
  moon: GlyphMoon,
  menu: GlyphMenu,
  close: GlyphClose,
  arrowStart: GlyphArrowStart,
  arrowEnd: GlyphArrowEnd,
  share: GlyphShare,
  external: GlyphExternal,
  check: GlyphCheck,
  warning: GlyphWarning,
  info: GlyphInfo,
  bulb: GlyphBulb,
  hash: GlyphHash,
  package: GlyphPackage,
  home: GlyphHome,
  users: GlyphUsers,
  heart: GlyphHeart,
  video: GlyphVideo,
  userPlus: GlyphUserPlus,
  doc: GlyphDoc,
  dots: GlyphDots,
} as const

export type GlyphName = keyof typeof glyphs

/** Lookup by name, for when a page would otherwise import twenty symbols. */
export function Glyph({ name, ...rest }: GlyphProps & { name: GlyphName }) {
  const Cmp = glyphs[name] ?? GlyphDots
  return <Cmp {...rest} />
}
