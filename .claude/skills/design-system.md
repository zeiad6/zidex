# Design System Skill — ZeidexSoft

**Load before any UI/CSS work in this repo.** Pair with the installed skills:
`impeccable` (primary), Anthropic `frontend-design`, `taste-skill:*`, `hallmark`,
`web-design-guidelines`, `modern-web-guidance`. Invoke the real skill when the
task matches; this file is the repo-specific contract they operate under.

## The shipped identity: Swiss International Typographic Style

The main React site (`src/`) is built in a **Swiss / International Typographic**
direction. Honor it; do not drift back to the old "Zidex" SaaS-template look
(gradient hero, aurora blobs, KPI cards, glass, pill buttons).

- **Type:** Latin → **Archivo** (grotesque); display statements → **Archivo
  Expanded** (reserve for page `<h1>` / `.swiss-headline` / `.swiss-display`
  only). Arabic → **IBM Plex Sans Arabic** (a grotesque peer; Arabic is the
  primary voice, never a translation afterthought). Data/labels → **JetBrains
  Mono**, small and tracked. Fonts load from Google Fonts in `index.html`.
- **Color:** restrained. Near-black ink on light ground / paper on near-black in
  dark. **One** signal accent — brand violet `#6D5CFF` (`--accent`), used flat.
  Tokens live in `src/index.css` (`--bg`, `--fg`, `--line`, `--accent`, …);
  light + dark share one semantic source. Never hardcode a hex where a token
  exists.
- **Structure:** 1px hairline rules (`--line-strong`) are the structural device,
  not cards + shadows. Square corners (`rounded-none`), flat fills, no glow, no
  gradient text, no glass-as-decoration. The `.swiss` scope class carries the
  utilities (`swiss-headline`, `swiss-label`, `swiss-figure`, `btn-swiss`,
  `btn-swiss-primary`, `btn-swiss-line`).

## Anti-slop rules (enforced)

Reach for one of these only when the brief's own words earn it; landing on one
with a free axis means the self-check failed:

- No gradient text, no aurora/blur backdrops, no KPI/metric card rows as page
  structure, no kicker/eyebrow above a heading, no same-size icon+heading+text
  card grids as the whole page.
- No emoji or Unicode glyphs standing in for an icon — draw icons (lucide or
  authored SVG), one stroke weight.
- No colored `border-left` > 1px, no zero-blur block shadows, no decorative
  grid-line backgrounds.
- Theme browser surfaces too: selection, caret, scrollbars, focus rings,
  tabular numerals — they ship with the palette, not browser defaults.

## Store templates are the exception

`store-sites/<slug>/` are standalone static storefronts with **deliberately
distinct identities** (durra = warm bento, bot-bazaar = dark neon, oud-amber =
luxury gold, turbo = dark indigo automotive). Do **not** Swiss-ify them — their
variety is the product. Keep each self-consistent in its own world; zero runtime
dependencies, strict CSP, code-drawn SVG art (no external images).

## Verify, don't assume

Contrast ≥4.5:1 body / ≥3:1 large. One authored motion moment, not scattered
effects (see `animations.md`). Run the real copy at every breakpoint. Confirm on
the rendered result, not from memory (see `testing.md`).
