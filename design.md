# ZeidexSoft — Design Identity

The single visual reference for the site. Derived from the shipped system
(`src/index.css`, `index.html`). Update this when the identity changes; code
reads tokens, this file explains them.

> The main React site follows a **Swiss / International Typographic** direction:
> type + grid + hairline rules carry hierarchy; one flat accent; square corners;
> no gradient/glass/aurora. Store templates under `store-sites/` each keep their
> own distinct world (see the bottom section).

## Typography

| Role | Family | Notes |
|---|---|---|
| Latin text / UI | **Archivo** (grotesque) | `--font-sans` |
| Latin display | **Archivo Expanded** | page `<h1>` / `.swiss-headline` / `.swiss-display` only |
| Arabic (primary) | **IBM Plex Sans Arabic** | Arabic is first-class, never a port |
| Data / labels | **JetBrains Mono** | small, tracked, tabular numerals |
| Long-form reading | Source Serif 4 / Noto Naskh Arabic | article routes only |

Headings: `text-wrap: balance`. Latin tracking `-0.02em` on display; Arabic
keeps `0` (joins on the baseline, negative tracking collides descenders).
Loaded from Google Fonts in `index.html`.

## Color (semantic tokens — `src/index.css`)

One accent only. Everything binds to meaning so light/dark share one source.

**Light**
| Token | Value | Use |
|---|---|---|
| `--bg` | `#f3f4fa` | page ground |
| `--bg-elevated` | `#ffffff` | cards / surfaces |
| `--fg` | `#0f1023` | primary text |
| `--fg-muted` | `#5b5e81` | secondary text |
| `--fg-subtle` | `#767a9e` | tertiary / labels |
| `--line` | `#eceef7` | hairlines |
| `--line-strong` | `#dde0ee` | structural rules |
| `--accent` | `#6d5cff` (ghost-500) | the one signal — buttons, active, one accent word |
| `--accent-fg` | `#ffffff` | text on accent |

**Dark**
| Token | Value |
|---|---|
| `--bg` | `#0b0d1e` |
| `--bg-elevated` | `#151736` |
| `--fg` | `#e8eaf7` |
| `--line` | `#262952` · `--line-strong` `#3a3d6b` |
| `--accent` | `#9187ff` (ghost-400) · `--accent-fg` `#05060a` |

Brand hues: violet `#6D5CFF` (primary), teal `#00C9A7` (historical partner —
used sparingly). TikTok marks (`#25F4EE` / `#FE2C55`) reserved for TikTok only.

## Components

- **Buttons:** flat, single-colour. `.btn-primary` = solid `--accent`, crisp
  1px hover lift + tightened shadow, fast active press. Swiss surfaces use
  `.btn-swiss` / `-primary` / `-line` (square, flat).
- **Cards:** square (`rounded-none` / `border border-app`), hairline, no drop
  shadow; hover → `hover:border-strong`.
- **Rules:** 1px `--line-strong` hairlines as the structural device.
- **Icons:** drawn (lucide / authored SVG), one stroke weight. Never emoji.
- **Radius:** Swiss surfaces square. Legacy utilities `--r-*` remain for
  non-Swiss contexts.

## Motion

Exponential ease-out `cubic-bezier(0.16,1,0.3,1)` (`--ease-out-expo`). One
authored moment per surface. Respect `prefers-reduced-motion`. No bounce/elastic.
See `.claude/skills/animations.md`.

## Store template palettes (distinct by design — do NOT unify)

| Template | World | Accent |
|---|---|---|
| durra | warm bento / hospitality | desert gold `#c4562f` on cream |
| oud-amber | luxury perfume | gold `#d4a94e` on near-black |
| smart-zone | electronics | dark + cool blue |
| bot-bazaar | digital marketplace | dark + neon green/purple |
| aman | insurance "soft care" | light, warm-gradient welcome |
| mahfazah | fintech wallet | light, clean |
| chrono | luxury watches | navy + cobalt blue |
| turbo | automotive (tires/wheels) | dark `#0a0b16` + indigo `#6366f1` |

---

<!-- Fill / confirm below with the identity you want to lock. The values above
     reflect what is currently live; override any of them here and I will apply
     the change to src/index.css tokens and redeploy. -->

## Pending confirmation
- Primary accent to keep: violet `#6D5CFF` — confirm or replace.
- Any brand logo / wordmark asset to standardize? (currently text + "Z" mark).
