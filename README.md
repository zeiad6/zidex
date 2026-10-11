# Ghost 778 — Tiktokweb

بوابة ويب لحساب **[@ghost.7784](https://www.tiktok.com/@ghost.7784)** على تيك توك: مشغّل فيديو مدمج،
صفحة روابط تفاعلية، ومدونة بتصميم نهاري/ليلي.

## Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript + Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| Motion | Framer Motion |
| Routing | React Router 7 (lazy-loaded routes) |
| Hosting | Netlify (`netlify.toml` + `public/_redirects` SPA fallback) |

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # tsc -b && vite build  →  dist/
npm run preview    # serve dist/ locally
npm run lint       # eslint
npm run sync-meta  # verify the index (readMinutes, headings) matches the bodies
```

### Post metadata is generated, not hand-maintained

`readMinutes` and the table-of-contents `headings` live in the light index
(`posts.ts`, `posts.en.ts`) because the article bodies sit in lazily-loaded
chunks. Those two fields can therefore drift from the articles they describe.
`npm run build` runs the check and fails on drift:

```bash
npm run sync-meta         # report
npm run sync-meta:write   # repair
```

## Documentation

| File | Purpose |
|---|---|
| `README.md` | This file — architecture, structure, theming, TikTok integration |
| `OPENCODE-SETUP.md` | Arabic guide to every OpenCode agent, skill and MCP server used, with install steps and the gotchas that cost time |

## Design source

The interactive pieces are rebuilt from 21st.dev community patterns (MIT):

- **SonarGrid** — `n1m4mz/sonar-grid`: canvas dot-grid where taps launch expanding
  rings, ambient pings keep it alive, colour read from `--accent` so it follows the
  theme, and `prefers-reduced-motion` renders a single static frame.
  → `src/components/ui/SonarGrid.tsx`
- **Magnetic / TiltCard** — cursor-magnet and 3D tilt with a pointer-tracked specular
  highlight. → `src/components/ui/Interactive.tsx`
- **AuroraBackdrop** — CSS-only mesh-gradient field, no canvas cost on mobile.
  → `src/components/ui/AuroraBackdrop.tsx`
- **Home hero + header** — Tailark "Hero Section" (`meschacirung/hero-section-*`, MIT):
  split layout, announcement pill with sliding arrow, inner-ring primary button, framed
  panel on a skewed backplate (holds the latest posts), and a header that shrinks into a
  framed bar on scroll. → `src/pages/Home.tsx`, `src/components/layout/Navbar.tsx`

## Structure

```
src/
├── components/
│   ├── ui/         design primitives (SonarGrid, Aurora, Magnetic, Reveal, toggle)
│   ├── layout/     Navbar, Footer
│   ├── tiktok/     profile card (avatar, live stats, follow/share)
│   ├── links/      link hub cards (tilt, copy, share)
│   └── blog/       post cards, prose renderer, TOC, reading progress
├── data/posts.ts   posts as a typed block AST (headings feed the TOC)
├── hooks/          useTikTokProfile (oEmbed, no API key)
├── lib/            site config, theme provider, utils
└── pages/          Home, Links, Blog, BlogPost, About, NotFound
```

## The bot platform (the bigger half)

This repo also runs the ZeidexSoft bot store: a Cloudflare Worker hosts every
customer's Telegram shop, sells 20 products in Stars, and ships two Mini Apps.
Nothing here needs a server of its own — `worker/` + the assets in `dist/`.

```
worker/        the Worker: webhook, menu, /admin, licensing, /api/dash (one API)
bot-suite/     the bot-interfaces Mini App (own repo, zero deps, tsc → build/)
panel/         the control-panel Mini App (React + Tailwind, vite.panel.config.ts)
store-sites/   the three store templates, each its own repo
scripts/stage-*.mjs   copy each sub-build into public/ so `npm run build` stages it
```

| Route | What it is |
|---|---|
| `/` `/shop` | the storefront (bilingual, Telegram Mini App for buying) |
| `/bot-suite/` | an interactive interface for every bot on sale, plus a unified panel |
| `/panel/#id=<botId>` | the owner's control panel — **opens inside Telegram** |
| `/templates/<slug>/` | each store template's live demo |
| `/api/dash/<id>/…` | the one dashboard API: `/web` link token, Mini App `initData` |

The panel authenticates with Telegram's own recipe (`secret = HMAC(WebAppData,
bot_token)`) and exchanges the signature for the same 7-day code the `/web`
link mints — one auth to reason about. Owner-side commands: `/admin`,
`/panel`, `/tma` (installs the panel as the chat menu button), `/mybots`,
`/wa`.

```bash
npm run build:panel   # dist/panel/ only
npm run test:tma      # panel API checks (session, ban, inbox, broadcast, menu)
node scripts/test-tma-app.mjs   # the built bundle, rendered in jsdom
```

## Theming

Colours are **semantic tokens**, not raw values, so both themes share one source of
truth (`src/index.css`):

```css
:root  { --bg: …; --fg: …; --accent: …; --line: … }
.dark  { --bg: #05060a; --fg: #f4f5f8; --accent: …; }
```

A synchronous script in `index.html <head>` applies the theme **before first paint**,
so there is no white flash. **Light is the default** — the OS preference is not
consulted at all; only an explicit toggle, stored in `localStorage('ghost-theme')`,
switches to dark.

Dark mode deliberately avoids `#000000` and `#FFFFFF` — pure black on pure white
reaches ~21:1 contrast and causes halation. See the article
`/blog/dark-mode-that-works`.

## Editing content

| What | Where |
|---|---|
| Handle, links, socials, accent tokens | `src/lib/site.ts` |
| Blog posts (Arabic) | `src/data/posts.ts` |
| Blog posts (English) | `src/data/posts.en.ts` — keyed by slug, same heading ids |
| Colours, radii, prose styles | `src/index.css` |

`readMinutes` is derived from the body text at module load — it cannot drift.

## Languages

Arabic (RTL, default) and English (LTR), switched by the `EN` / `ع` button in the header.

- `src/lib/i18n.tsx` — `useI18n()` returns `{ lang, setLang, t }`; strings are inline pairs,
  `t('نص', 'text')`, so each one sits next to its translation. No i18n library.
- The choice is stored in `localStorage('ghost-lang')` and applied to `<html lang dir>` by the
  pre-paint script in `index.html`, so an English visitor never sees an RTL frame first.
- Layout uses logical utilities (`ms-*`, `ps-*`, `start-*`, `border-s`); direction-bearing
  Lucide arrows are mirrored once in `index.css` for `[dir=ltr]`.
- A post missing from `posts.en.ts` falls back to the Arabic original.

## TikTok integration

- `https://www.tiktok.com/oembed?url=…` — public, no API key. Used to confirm the
  account is live and read the display name and avatar.
- Follower/like/video counts come from a dated snapshot in `site.ts` (oEmbed does
  not expose them). The card labels which of the two it is showing.

**No embedded player.** `tiktok.com/embed` was tried and removed: inside the frame
TikTok serves its own "video unavailable" page, which rendered as a dead 500px
block on the home page. Every video CTA now hands off to TikTok directly.

## Performance

- Route-level code splitting: only the home page is in the entry bundle.
- No raster images — covers are CSS gradients + glyphs, so CLS stays at 0.
- Canvas grid and TikTok iframe both deferred until needed.
