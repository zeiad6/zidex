# Animation Skill — ZeidexSoft

Motion must feel authored and restrained, never scattered. Pair with a GSAP
skill for complex scroll/timeline work, but note the toolchain already here.

## What is installed

- **Motion (Framer Motion) v11** — primary for React (`src/`). Already a
  dependency. Use for entrance reveals, count-ups, hover shifts, orchestrated
  sequences.
- **Pure CSS** — for the static store templates (`store-sites/<slug>/`), which
  carry zero runtime deps. Keyframes + transitions only (see oud-amber's
  `floaty` / `rise-wisp` incense motion for the bar to match).
- **GSAP** — add only when a timeline/scroll-scrub genuinely exceeds Motion.
  Install per-surface, do not bloat the static templates.

## Rules (match the shipped feel)

- **One authored moment per surface**, not an effect on every element. The Swiss
  home masthead: headline clip-reveal → hairline rules draw in (`scaleX`) →
  data-index figures count up → staggered reveals. That is the ceiling, not a
  floor to pile onto.
- **Easing:** exponential ease-out from an already-visible default —
  `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out-expo`). **No** bounce/elastic
  easing (`--ease-spring` is legacy; do not spread it).
- **Durations:** hover 150–200ms, state feedback 200–300ms, scroll reveals
  400–600ms. If the user notices waiting, it is too long.
- **Performance:** animate `transform`/`opacity`/`clip-path`/`filter`, never
  layout props (`width`/`height`/`padding`/`margin` → thrash). Use
  `IntersectionObserver` / Motion `useInView`, not scroll listeners.
- **Reach past transform+opacity** for signature moments: `clip-path`, `mask`,
  `backdrop-filter`, blur, shadow — when they stay smooth.
- **Respect `prefers-reduced-motion`** everywhere: `useReducedMotion()` in React,
  `motion-reduce:` in Tailwind, `@media (prefers-reduced-motion)` in template CSS.
  A figure/count must show its final value when motion is off (seed state with
  the target, animate only as enhancement — see `Home.tsx` `CountUp`).
