# Component & Framework Skill — ZeidexSoft

Rules for building and reverse-engineering clean, reusable UI. Pair with ShadCN
/ Skill-UI patterns and `pdfcn` where a registry component fits — but this repo
is **React 19 + Vite 6 + Tailwind v4 (no shadcn runtime)**. Mirror the existing
patterns before adding anything new.

## Reuse before you build (the ladder)

1. **Does it need to exist?** Speculative = skip.
2. **Already in `src/components/`?** A primitive, card, or util that lives here →
   reuse it. Look before writing; re-implementing what is a few files over is the
   most common waste.
3. **A token or utility in `src/index.css`?** Use it (`btn-swiss*`, `container-app`,
   `rounded-card`, `shadow-app*`, semantic colors).
4. Only then: the minimum new component.

## Patterns to follow

- **Semantic tokens, not raw hex.** Colors bind to meaning (`--accent`, `--fg`,
  `--line`) so light/dark swap for free.
- **Scope, don't globalize blindly.** Swiss utilities live under `.swiss`; a page
  opts in with `className="swiss …"`. Shared cards (`PostCard`, `ProgramCard`,
  `LinkCard`, `PackageCard`) avoid scope-dependent `swiss-*` classes and use plain
  Tailwind + the global `--font-display` (Archivo) so they render anywhere.
- **i18n is mandatory.** Every string via `useI18n().t(ar, en)`. Arabic first.
- **Accessibility:** real `<button>`/`<a>`, `aria-*`, keyboard focus, `dir`-aware
  layout (`ms-`/`me-`, `rtl:`/`ltr:` variants), direction-bearing icons mirrored.
- **Cards:** square (`rounded-none` or `border`), hairline borders, hover =
  `hover:border-strong` + a crisp transition, not a shadow lift.

## Reverse-engineering a reference (e.g. a Dribbble shot)

When replicating an external design as a new template or component:
- Study the still (colors, type scale, layout, motion intent), then **rebuild in
  this repo's architecture** — never paste foreign markup.
- Recreate imagery as **code-drawn SVG** (CSP `img-src 'self'`, zero deps). No
  copied photos.
- Change the name/brand; keep only the visual language. See `store-sites/turbo/`
  (built from the "AutoForge" shot) as the worked example: `config.js`,
  `i18n.js` (bilingual, key-parity enforced by `scripts/check.mjs`), `products.js`,
  `art.js` (SVG marks + `heroArt()`), `styles.css` (`:root` tokens), `index.html`.
- Register a new store template in `src/data/templates.ts` and it stages into
  `/templates/<slug>/` via `scripts/stage-templates.mjs`.
