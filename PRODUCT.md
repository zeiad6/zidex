# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: small merchants and creators in the Arabic market (Yemen-first) who want
a ready-made Telegram bot to run a business — a digital storefront, group
management, customer support, bookings, or paid subscriptions — without building
one. Secondary: a general Arabic/English technical audience who arrive from the
owner's TikTok (@ghost.7784) for the free Windows/Android programs and the
how-to articles, and convert into bot customers.

[Inferred from repository evidence (Kuraimi rail, Arabic-first bilingual copy,
Telegram-bot catalog, TikTok funnel); not confirmed in a product interview.]

## Product Purpose

ZeidexSoft (zeidexsoft.com) sells ready-made Telegram bots and small software to
businesses, and publishes free programs and technical articles that feed the same
audience. Success = a visitor understands ZeidexSoft builds working Telegram bots,
starts the free trial on their own bot, or browses the catalog.

## Positioning

Full-featured Telegram bots a buyer can try for 7 days on their own bot token
before paying, settled in Telegram Stars or via Kuraimi (a local Yemeni payment
rail most competitors do not support). The try-on-your-own-token trial plus local
payment is the combination a neighboring product cannot truthfully copy.

## Operating Context

- Bilingual Arabic (RTL, default) + English (LTR); Arabic is the primary voice.
- Catalog, trials, licensing, orders, and payments run through Telegram and
  Cloudflare Workers (`worker/`: bots.ts, license.ts, orders.ts, kuraimi.ts).
- A store section ships 7 sellable storefront themes (durra, oud-amber,
  smart-zone, aman, bot-bazaar, chrono, mahfazah).
- Free programs are real Windows/Android downloads documented by their own
  articles; a blog in both languages; a links hub; a Telegram search mini app.

## Capabilities and Constraints

- React 19 + Vite 6 + Tailwind v4, deployed to Cloudflare (Workers + Pages) and
  Netlify. Strict CSP (`script-src 'self'`), full security-header suite.
- Fonts load from Google Fonts (CSP allows fonts.googleapis.com / gstatic.com):
  currently Plus Jakarta Sans + IBM Plex Sans Arabic + JetBrains Mono.
- Semantic design tokens in `src/index.css` (`--bg`, `--fg`, `--accent`, `--line`,
  …) drive light + dark; the theme follows the OS until the visitor toggles.
- All figures on the site are read from real data (post counts, program counts,
  follower count, catalog bot-type count); no invented balances, testimonials,
  prices, or benchmarks — a constraint future work must preserve.

## Brand Commitments

- Name: ZeidexSoft. Domain: zeidexsoft.com. TikTok handle @ghost.7784.
- Brand accent: violet #6D5CFF (with teal #00C9A7 as the historical partner hue).
- Bilingual parity (Arabic-first) is non-negotiable; Arabic must never read as a
  translation afterthought.

## Evidence on Hand

- Real content: `src/data/posts*.ts` (articles AR+EN), `src/data/programs.ts`
  (real downloads + sizes), `src/lib/site.ts` (handle, follower stat, links),
  live catalog via `useCatalog`.
- No testimonials, customer logos, pricing claims, or benchmarks exist; future
  work must not fabricate them.

## Product Principles

1. Every number on the page is real or it does not appear.
2. Arabic is the primary voice; English is a true peer, never a port.
3. The product is proven by showing the bot/program doing its job, not by claims.
4. Content (articles, free programs, TikTok) is the funnel; the bot catalog is
   the business — the home must serve both without burying the offer.
