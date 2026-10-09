// Runs the real public/store/store.js against the real index.html in a DOM,
// with the real catalogue served from disk. This is the check that the Mini
// App is not a dead shell — before store.js existed the page rendered its four
// skeleton cards forever and every control in it did nothing.
//
//   node scripts/test-store-app.mjs
//
// A browser would be the better instrument, but this host has no working GPU
// process (Chromium aborts with "GPU process isn't usable"), so the logic is
// verified here and the pixels are left to a human with a device.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { JSDOM, VirtualConsole } from 'jsdom'

const here = dirname(fileURLToPath(import.meta.url))
const pub = join(here, '..', 'public', 'store')
const html = readFileSync(join(pub, 'index.html'), 'utf8')
const runtime = readFileSync(join(pub, 'store.js'), 'utf8')
const catalog = JSON.parse(readFileSync(join(pub, 'catalog.json'), 'utf8'))
const apps = JSON.parse(readFileSync(join(pub, 'apps.json'), 'utf8'))

let fails = 0
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
  if (!cond) fails++
}

/** A fresh page: jsdom, the real markup, the real script, the real catalogue. */
function boot({ storedTheme, storedLang, colorScheme = 'light', noApps = false, telegram = null } = {}) {
  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', (e) => errors.push(String(e)))
  vc.on('error', (...a) => errors.push(a.join(' ')))

  const store = new Map()
  if (storedTheme) store.set('zeidex-store-theme', storedTheme)
  if (storedLang) store.set('zeidex-store-lang', storedLang)

  const dom = new JSDOM(html, {
    url: 'https://zeidexsoft.com/store/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    // The head script reads localStorage while the document is parsing, so the
    // stub has to exist before that. `window.localStorage = …` cannot do it:
    // jsdom defines it as an accessor whose setter throws, which is why this
    // is a defineProperty and not an assignment.
    beforeParse(window) {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: {
          getItem: (k) => (store.has(k) ? store.get(k) : null),
          setItem: (k, v) => store.set(k, String(v)),
          removeItem: (k) => store.delete(k),
          clear: () => store.clear(),
          key: (i) => [...store.keys()][i] ?? null,
          get length() {
            return store.size
          },
        },
      })
      window.matchMedia = (q) => ({
        matches: q.includes('dark') ? colorScheme === 'dark' : false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      })
    },
  })
  const { window } = dom
  window.fetch = async (url) => {
    if (String(url).includes('catalog.json')) {
      return { ok: true, status: 200, json: async () => catalog }
    }
    if (String(url).includes('apps.json') && !noApps) {
      return { ok: true, status: 200, json: async () => apps }
    }
    throw new Error('unexpected fetch: ' + url)
  }
  window.open = () => ({ focus() {} })

  if (telegram) window.Telegram = { WebApp: telegram }
  // The head script has already run under jsdom; the runtime is what we test.
  window.eval(runtime)
  return { dom, window, doc: window.document, errors, ls: store }
}

/** The two globals the runtime touches, for pages built outside boot(). */
function stubEnv(window) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: { getItem: () => null, setItem() {}, removeItem() {}, clear() {}, key: () => null, length: 0 },
  })
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })
}

const tick = () => new Promise((r) => setTimeout(r, 60))

// ── 1. It renders ────────────────────────────────────────────────────────
console.log('\n1. render — the page that never rendered before')
{
  const { doc, errors, window } = boot()
  await tick()
  const cards = doc.querySelectorAll('#grid .card')
  const skeletons = doc.querySelectorAll('#grid .skeleton')
  ok('products rendered from the catalogue', cards.length === catalog.products.length, `${cards.length} cards`)
  ok('no skeleton left behind', skeletons.length === 0, `${skeletons.length} skeletons`)
  ok('count line filled', doc.querySelector('#count').textContent.trim().length > 0, doc.querySelector('#count').textContent)
  ok('featured banner revealed', doc.querySelector('#feature').hidden === false)
  // The filters are built from the catalogue's own categories, so the count is
  // derived, not hardcoded: a catalogue that adds a category gains a tab.
  const tabs = 1 + new Set(catalog.products.map((p) => p.category)).size
  const built = doc.querySelectorAll('#filters button').length
  ok('category filters built', built === tabs, `${built} tabs`)
  ok('first card carries a title', cards[0].querySelector('h3').textContent.length > 0, cards[0].querySelector('h3').textContent.slice(0, 40))
  ok('cards are keyboard-reachable', cards[0].getAttribute('tabindex') === '0' && cards[0].getAttribute('role') === 'button')
  ok('no runtime errors', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}

// ── 2. Search, with the Arabic fold ──────────────────────────────────────
console.log('\n2. search — folds Arabic exactly like worker/bots.ts does')
{
  const { doc, window } = boot()
  await tick()
  const input = doc.querySelector('#search')
  const type = (v) => {
    input.value = v
    input.dispatchEvent(new window.Event('input'))
  }
  const n = () => doc.querySelectorAll('#grid .card').length
  const norm = (v) => window.__store.norm(v)

  const all = n()
  type('متجر')
  await tick()
  ok('an Arabic word narrows the grid', n() > 0 && n() < all, `${n()}/${all}`)

  // These three are chosen to be LOAD-BEARING: each matches only because of
  // the fold it names. Verified by mutation — deleting the corresponding
  // line from store.js makes exactly this assertion fail.
  //
  //   استضافه ← استضافة   the ta marbuta written as a plain ha
  //   خدمه    ← خدمة      same fold, second product
  //   ٱسئله   ← أسئلة      the superscript alef written as a plain alef
  type('استضافه')
  await tick()
  ok('ta marbuta folds (استضافه ← استضافة)', n() > 0, `${n()} hits`)

  type('خدمه')
  await tick()
  ok('ta marbuta folds on a second product (خدمه ← خدمة)', n() > 0, `${n()} hits`)

  type('ٱسئله')
  await tick()
  ok('superscript alef folds (ٱسئله ← أسئلة)', n() > 0, `${n()} hits`)

  // Harakat: asserted on the echoed, normalised query rather than on the hit
  // count. A hit count cannot prove this — a shadda splits the word into
  // tokens, and a leading token is a prefix of the real word, so the product
  // matches either way. The echo shows the actual folded string.
  type('بوتّ المتجّر')
  await tick()
  ok('harakat still finds the product', n() > 0, `${n()} hits`)

  // Harakat and tatweel are asserted on the folded string itself, because a
  // hit count cannot prove them: a shadda splits the word into tokens and the
  // leading token is a prefix of the real word, so the product matches with or
  // without the rule. The fold has to be checked where it is observable.
  const folded = norm('بوتّ المتجّر')
  ok('the shadda and fatha are gone from the folded key', !/[ً-ْٰـ]/.test(folded), folded)
  ok('the folded key reads as the real title', folded.includes('المتجر'), folded)
  ok(
    'a tatweel is removed',
    norm('ٱلـمبيع') === norm('المبيع'),
    `${norm('ٱلـمبيع')} vs ${norm('المبيع')}`,
  )
  ok('Arabic-Indic digits fold to Latin', norm('١٢٣') === '123', norm('١٢٣'))
  ok('Persian digits fold to Latin', norm('۱۲۳') === '123', norm('۱۲۳'))
  ok('alef maqsura folds to ya', norm('حسابى') === norm('حسابي'), norm('حسابى'))
  ok('hamza alef folds to alef', norm('إدارة') === norm('اداره'), norm('إدارة'))
  ok('punctuation is removed', norm('a,b.c!') === 'a b c', norm('a,b.c!'))
  // Case folding. Asymmetric on purpose: the catalogue carries upper-case
  // Latin ("Smart Store Bot"), the customer types lower-case. Folding both
  // sides the same way would match even without the rule.
  const bot = catalog.products.find((p) => p.category === 'bots')
  ok('Latin case is folded', norm('SMARТ STORE'.replace('Т', 'T')) === 'smart store', norm('SMART STORE'))
  // "customer" occurs in exactly one place in the whole catalogue: the
  // title_en of support-bot. It is in no description, in no SKU, and in no
  // Arabic field. So it is findable only while lang === 'en' AND matches()
  // reads title_en — which is what makes it a real test of the language
  // branch rather than of the fold. Verified by mutation: forcing the ternary
  // to p.title makes this fail.
  const inEnglish = () => {
    doc.querySelector('#lang').dispatchEvent(new window.Event('click'))
    return tick()
  }
  type('customer')
  await tick()
  ok('the same word finds nothing in Arabic', n() === 0, `${n()} hits`)

  await inEnglish()
  type('customer')
  await tick()
  ok('an English title is searched in English, not Arabic', n() === 1, `${n()} hits`)
  ok(
    'and it is the right product',
    doc.querySelector('#grid .card h3').textContent.includes('Customer'),
    doc.querySelector('#grid .card h3').textContent,
  )

  // "captcha" is in exactly one field in the whole catalogue: the
  // description_en of group-bot. It is in no title (either language), no SKU,
  // no description_ar and no other description_en — so it is reachable only
  // through the description branch of matches(), with lang === 'en'.
  type('captcha')
  await tick()
  ok('an English description is searched, not just the title', n() === 1, `${n()} hits`)

  type('SMARTSTORE')
  await tick()
  ok('a joined spelling that is not a substring finds nothing', n() === 0, `${n()} hits`)

  doc.querySelector('#lang').dispatchEvent(new window.Event('click'))
  await tick()
  type('')
  await tick()

  type('group')
  await tick()
  ok('a Latin token matches too', n() > 0, `${n()} hits`)

  type('zzzznothing')
  await tick()
  ok('a miss reveals the empty note', doc.querySelector('#empty').hidden === false)
  ok('a miss shakes the grid', doc.querySelector('#grid').classList.contains('shake'))
  window.close()
}

// ── 3. Filters ───────────────────────────────────────────────────────────
console.log('\n3. filters')
{
  const { doc, window } = boot()
  await tick()
  const tabs = doc.querySelectorAll('#filters button')
  const before = doc.querySelectorAll('#grid .card').length
  // "الكل" is first; the second tab is a real category.
  tabs[1].dispatchEvent(new window.Event('click'))
  await tick()
  const after = doc.querySelectorAll('#grid .card').length
  ok('a filter narrows the grid', after > 0 && after < before, `${before} → ${after}`)
  ok('the chosen tab is marked selected', doc.querySelectorAll('#filters button[aria-selected="true"]').length === 1)
  ok('exactly one tab is selected', doc.querySelectorAll('#filters button[aria-selected="true"]').length === 1)
  ok('the filter label is localised, not a raw slug', !tabs[1].textContent.includes('_'))
  window.close()
}

// ── 4. Product sheet ─────────────────────────────────────────────────────
console.log('\n4. product sheet')
{
  const { doc, window } = boot()
  await tick()
  doc.querySelector('#grid .card').dispatchEvent(new window.Event('click'))
  await tick()
  ok('sheet opens', doc.querySelector('#sheet').hidden === false)
  ok('backdrop shows', doc.querySelector('#backdrop').hidden === false)
  ok('sheet has a title', doc.querySelector('#sheet-title').textContent.length > 0)
  ok('sheet has a description', doc.querySelector('#sheet-desc').textContent.length > 0)
  ok('price carries the Stars unit', doc.querySelector('#sheet-price').textContent.includes('⭐️'))
  ok('billing term is set', doc.querySelector('#sheet-billing').textContent.length > 0)
  ok('the bot link is built from the catalogue', doc.querySelector('#sheet-try').getAttribute('href').includes(catalog.bot))
  const buy = doc.querySelector('#sheet-buy')
  ok('buy button is labelled', buy.textContent.length > 0, buy.textContent)
  doc.querySelector('#sheet-close').dispatchEvent(new window.Event('click'))
  await tick()
  ok('sheet closes', doc.querySelector('#sheet').hidden === true && doc.querySelector('#backdrop').hidden === true)
  window.close()
}

// ── 5. Day/night theme ───────────────────────────────────────────────────
console.log('\n5. theme — the toggle that was wired to nothing')
{
  const { doc, window, ls } = boot()
  await tick()
  const start = doc.documentElement.getAttribute('data-theme')
  ok('a theme is applied at boot', start === 'light' || start === 'dark', start)
  ok('the theme button is wired', !!doc.querySelector('#theme'))

  doc.querySelector('#theme').dispatchEvent(new window.Event('click'))
  await tick()
  const after = doc.documentElement.getAttribute('data-theme')
  ok('clicking flips the theme', after !== start, `${start} → ${after}`)
  ok('the choice is persisted', ls.get('zeidex-store-theme') === after, String(ls.get('zeidex-store-theme')))
  ok('aria-pressed reflects the state', doc.querySelector('#theme').getAttribute('aria-pressed') === String(after === 'dark'))
  window.close()
}
{
  const { doc, window } = boot({ colorScheme: 'dark' })
  await tick()
  ok('a dark OS with no stored choice renders dark', doc.documentElement.getAttribute('data-theme') === 'dark')
  window.close()
}
{
  const { doc, window } = boot({ colorScheme: 'light' })
  await tick()
  ok('a light OS with no stored choice renders light', doc.documentElement.getAttribute('data-theme') === 'light')
  window.close()
}
{
  const { doc, window } = boot({ colorScheme: 'dark', storedTheme: 'light' })
  await tick()
  ok('a stored choice beats the OS', doc.documentElement.getAttribute('data-theme') === 'light')
  window.close()
}

// ── 6. Language ──────────────────────────────────────────────────────────
console.log('\n6. language')
{
  const { doc, window, errors } = boot()
  await tick()
  ok('starts in Arabic / RTL', doc.documentElement.dir === 'rtl')
  doc.querySelector('#lang').dispatchEvent(new window.Event('click'))
  await tick()
  ok('toggles to English / LTR', doc.documentElement.dir === 'ltr' && doc.documentElement.lang === 'en')
  ok('hero copy is translated', /store/i.test(doc.querySelector('[data-i18n="heroTitle"]').textContent))
  ok('the search placeholder is translated', doc.querySelector('#search').getAttribute('placeholder').length > 0)
  ok('cards are re-rendered in English', /bot|store/i.test(doc.querySelector('#grid .card h3').textContent), doc.querySelector('#grid .card h3').textContent)
  ok('no runtime errors', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}

// ── 7. Catalogue is not trusted with markup ──────────────────────────────
console.log('\n7. escaping')
{
  const hostile = JSON.parse(JSON.stringify(catalog))
  hostile.products[0].title = '<img src=x onerror=alert(1)>'
  hostile.products[0].description = '</h3><script>alert(2)</script>'
  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', (e) => errors.push(String(e)))
  const dom = new JSDOM(html, { url: 'https://zeidexsoft.com/store/', runScripts: 'dangerously', virtualConsole: vc, beforeParse: stubEnv })
  dom.window.fetch = async () => ({ ok: true, status: 200, json: async () => hostile })
  dom.window.open = () => ({ focus() {} })
  dom.window.eval(runtime)
  await tick()
  const card = dom.window.document.querySelector('#grid .card')
  ok('markup in a title stays text', card.querySelectorAll('img[src="x"]').length === 0)
  ok('the script tag is not parsed as a node', card.querySelectorAll('script').length === 0)
  ok('the raw text is still shown', card.querySelector('h3').textContent.includes('<img'))
  ok('no script executed', errors.length === 0, errors.join(' | ') || 'clean')
  dom.window.close()
}

// ── 8. A failing catalogue must not leave a blank page ───────────────────
console.log('\n8. resilience')
{
  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', (e) => errors.push(String(e)))
  const dom = new JSDOM(html, { url: 'https://zeidexsoft.com/store/', runScripts: 'dangerously', virtualConsole: vc, beforeParse: stubEnv })
  dom.window.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) })
  dom.window.eval(runtime)
  await tick()
  ok('a 500 leaves an explanatory message', /تعذّر/.test(dom.window.document.querySelector('#count').textContent))
  ok('the empty note is shown', dom.window.document.querySelector('#empty').hidden === false)
  ok('no unhandled rejection', errors.length === 0, errors.join(' | ') || 'clean')
  dom.window.close()
}

// ── 9. Paid / free sections ──────────────────────────────────────────────
console.log('\n9. sections — paid products and free apps')
{
  const { doc, window, errors } = boot()
  await tick()
  const seg = doc.querySelector('#segment')
  const tab = (name) => doc.querySelector(`#segment [data-section="${name}"]`)
  ok('the switch shows once the apps load', seg.hidden === false)
  ok('paid is the starting section', tab('paid').getAttribute('aria-selected') === 'true')
  tab('free').click()
  await tick()
  const cards = doc.querySelectorAll('#grid .card.app:not(.freebot)')
  ok('free shows every program', cards.length === apps.apps.length, `${cards.length}/${apps.apps.length}`)
  const fb = doc.querySelector('#grid .card.freebot a.get')
  ok('the store-bot trial leads the section', !!fb && fb.href === `https://t.me/${catalog.bot}?start=trial`)
  ok('category chips hide in free', doc.querySelector('#filters').hidden === true)
  ok('the title follows the section', doc.querySelector('#section-title').textContent === 'تطبيقات مجانية')
  const get = cards[0].querySelector('a.get')
  ok('each card carries a direct download', !!get && get.href.startsWith('https://') && get.target === '_blank')
  ok('details link to a real site section', cards[0].querySelector('a.go').href.includes('/programs#programs-'))
  ok('no paid product leaks into free', doc.querySelectorAll('#grid .card:not(.app)').length === 0)
  const input = doc.querySelector('#search')
  input.value = 'VerityScope'
  input.dispatchEvent(new window.Event('input'))
  await tick()
  ok('search works inside free', doc.querySelectorAll('#grid .card.app').length === 1)
  input.value = ''
  input.dispatchEvent(new window.Event('input'))
  tab('paid').click()
  await tick()
  ok('back to paid restores the products', doc.querySelectorAll('#grid .card:not(.app)').length === catalog.products.length)
  ok('no runtime errors', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}
{
  const { doc, window, errors } = boot({ noApps: true })
  await tick()
  ok('without apps.json the switch stays hidden', doc.querySelector('#segment').hidden === true)
  ok('and the products still render', doc.querySelectorAll('#grid .card').length === catalog.products.length)
  ok('a missing apps.json is not an error', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}

// ── 10. Theme choice beats the OS and Telegram ───────────────────────────
console.log('\n10. theme choice — marked so CSS lets it win')
{
  const { doc, window } = boot({ storedTheme: 'light', colorScheme: 'dark' })
  await tick()
  const r = doc.documentElement
  ok('a stored choice sets the forced marker', r.getAttribute('data-theme-forced') === '1')
  ok('and the stored scheme', r.getAttribute('data-theme') === 'light')
  window.close()
}
{
  const { doc, window } = boot()
  await tick()
  ok('no choice, no marker', !doc.documentElement.hasAttribute('data-theme-forced'))
  window.close()
}
{
  const opened = []
  const telegram = {
    initData: 'query_id=x', colorScheme: 'dark', onEvent() {}, ready() {}, expand() {},
    openLink: (u) => opened.push(u),
  }
  const { doc, window, errors } = boot({ telegram })
  await tick()
  const r = doc.documentElement
  ok('inside Telegram the client scheme is followed', r.getAttribute('data-theme') === 'dark' && r.hasAttribute('data-tg'))
  doc.querySelector('#theme').click()
  ok('and the toggle works there too', r.getAttribute('data-theme') === 'light' && r.getAttribute('data-theme-forced') === '1')
  doc.querySelector('#segment [data-section="free"]').click()
  await tick()
  doc.querySelector('#grid .card.app a.get').click()
  ok('downloads open in the browser, not over the Mini App', opened.length === 1 && opened[0].startsWith('https://'))
  ok('no runtime errors', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}

// ── 11. What happens after you pay; products not on sale yet ────────────
console.log('\n11. sheet details — after you pay, what you need, coming soon')
{
  const { doc, window, errors } = boot()
  const opened = []
  window.open = (url) => {
    opened.push(url)
    return { focus() {} }
  }
  await tick()
  const open = (sku) => doc.querySelector(`#grid .card[data-sku="${sku}"]`).dispatchEvent(new window.Event('click'))
  const basic = catalog.products.find((p) => p.sku === 'store-bot-basic')
  open('store-bot-basic')
  await tick()
  ok('the steps after paying are listed', doc.querySelectorAll('#sheet-after li').length === basic.after.length && doc.querySelector('#sheet-after-box').hidden === false)
  ok('what the buyer needs is listed', doc.querySelectorAll('#sheet-needs li').length === basic.needs.length)
  ok('how to get it running is listed', doc.querySelectorAll('#sheet-setup li').length === basic.setup.length && basic.setup.length > 0)
  ok('steps are the catalogue text, not markup', doc.querySelector('#sheet-after li').textContent === basic.after[0])

  const soon = catalog.products.find((p) => p.soon)
  ok('unbuilt products are marked soon, with no invoice', !!soon && !soon.invoice)
  ok('a soon card says so', doc.querySelector(`#grid .card[data-sku="${soon.sku}"] .badge.soon`) !== null)
  open(soon.sku)
  await tick()
  // An empty section hides regardless of which product is first-soon: a soon
  // product that does carry steps shows them, one without hides the box.
  ok('a soon product hides the empty sections', doc.querySelector('#sheet-after-box').hidden === ((soon.after || []).length === 0))
  const buy = doc.querySelector('#sheet-buy')
  ok('its button asks instead of buying', buy.textContent.includes('اسأل'))
  buy.click()
  ok('and opens the bot chat, never a purchase', opened.length === 1 && !opened[0].includes('start=buy_'), opened[0])
  ok('no runtime errors', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}

// ── 12. Opening offer: coupon, countdown, struck prices ──────────────────
console.log('\n12. opening offer')
{
  const { doc, window, errors } = boot()
  await tick()
  const coupon = doc.querySelector('#offer')
  const live = catalog.offer && Date.parse(catalog.offer.ends) > Date.now()
  ok('the coupon shows while the offer runs', coupon.hidden === !live)
  if (live) {
    ok('it carries the discount', doc.querySelector('#offer-pct').textContent === catalog.offer.pct + '%')
    ok('and a live countdown', doc.querySelector('#offer-left').textContent.startsWith('ينتهي خلال'))
    const basic = catalog.products.find((p) => p.sku === 'store-bot-basic')
    const was = doc.querySelector('#grid .card[data-sku="store-bot-basic"] .was')
    ok('the old price is struck through', !!was && was.textContent === basic.stars_full.toLocaleString('en-US'))
  }
  ok('section switches use drawn icons, not emoji', doc.querySelectorAll('#segment button svg').length === 2 && !/[💎🎁]/u.test(doc.querySelector('#segment').textContent))
  ok('no runtime errors', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}
{
  const saved = catalog.offer
  catalog.offer = { pct: 50, ends: '2020-01-01T00:00:00Z' }
  const { doc, window } = boot()
  await tick()
  ok('an ended offer hides the coupon', doc.querySelector('#offer').hidden === true)
  catalog.offer = saved
  window.close()
}

console.log(`\n${fails ? fails + ' CHECK(S) FAILED' : 'all store checks passed'}`)
process.exit(fails ? 1 : 0)