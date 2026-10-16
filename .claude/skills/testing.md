# Visual Testing Skill — ZeidexSoft

Never certify a UI change from memory. Confirm on the **rendered result**.

## The host constraint (important)

Headless Chromium does **not** run on this host (arm64/Termux):
`chrome-headless-shell` exits code 1 (dbus + `/proc/bus/pci` errors). So local
Playwright screenshots fail here. Two working paths instead:

### 1. Verify the deployed site (preferred here)

The site deploys to Cloudflare (`npm run build` → `npx wrangler deploy`,
Version-pinned). After a deploy, screenshot the **live URL** with a remote
renderer (Firecrawl `firecrawl_scrape` with `formats: ["screenshot"]`,
`maxAge: 0`, `screenshotOptions: {fullPage: true}`), download the PNG, and read
it. This is how every Swiss redesign in this repo was verified. Cache-bust with
`maxAge: 0`; CDN may serve the previous version briefly.

### 2. Playwright CLI (when a browser is available)

On a host where Chromium runs, the project already ships `playwright` (dev dep)
and test scripts (`scripts/test-*.mjs`). Pattern:

```js
import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.goto(url, { waitUntil: 'load', timeout: 20000 })
await p.waitForTimeout(1500)            // settle fonts + entrance motion
await p.screenshot({ path: 'out.png', fullPage: true })
await b.close()
```

Toggle theme with `document.documentElement.classList.toggle('dark', true)`.
Template demos must be hit at `…/templates/<slug>/index.html` (explicit
`index.html` — a trailing-slash dir request falls through to the SPA shell in
`vite dev`).

## What to check every round (batch, don't loop)

- Desktop (1440) **and** mobile (390); light **and** dark.
- Real copy at each breakpoint — Arabic (RTL) and English (LTR).
- Contrast, overflow, loading/empty states, the `<br>`/HTML-in-i18n rendering.
- Run `impeccable detect --json <changed files>` on changed React/CSS for the
  mechanical slop checks the design hook would catch.

Settle or disable entrance motion before capturing, or an element hidden by
timing reads as missing and gets "fixed" into a regression.
