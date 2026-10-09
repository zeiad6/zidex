// Runs the real public/dash/dash.js against the real index.html in a DOM, with
// the /api/dash/ contract stubbed. This is the check that the dashboard is not
// a dead shell — the same guarantee test-store-app.mjs gives the storefront.
//
//   node scripts/test-dash-app.mjs
//
// A browser would be the better instrument, but this host has no working GPU
// process (Chromium aborts with "GPU process isn't usable"), so the logic is
// verified here and the pixels are left to a human with a device.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { JSDOM, VirtualConsole } from 'jsdom'

const here = dirname(fileURLToPath(import.meta.url))
const pub = join(here, '..', 'public', 'dash')
const html = readFileSync(join(pub, 'index.html'), 'utf8')
const runtime = readFileSync(join(pub, 'dash.js'), 'utf8')

const ID = 8968001501
const KEY = '1750000000.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef'
const state = {
  bot: { id: ID, username: 'shop_bot', paused: false, plan: 'paid', expires: null, lapsed: false, orders: 12, stars: 3400, users: 27, welcome: 'أهلاً بك في متجري', site: null, created: '2026-01-01', caps: { items: 50, faqs: 50 } },
  items: [{ id: 1, title: 'دورة تصميم كاملة', stars: 150, desc: 'دورة فيديو', sku: 'design-course', features: ['ميزة أولى'], after: ['خطوة أولى'] }],
  sections: [{ id: 1, name: '🤖 بوتات ومتاجر' }],
  faqs: [{ q: 'كيف أدفع؟', a: 'بنجوم تيليجرام' }],
  files: [{ id: 3, title: 'Guide.pdf', type: 'document' }],
}

let fails = 0
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
  if (!cond) fails++
}
const tick = () => new Promise((r) => setTimeout(r, 60))

/** A fresh page: jsdom, the real markup, the real script, the /api/dash/ stub. */
function boot({ fragment = '', session = null, answer = null } = {}) {
  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', (e) => errors.push(String(e)))
  vc.on('error', (...a) => errors.push(a.join(' ')))
  const ss = new Map()
  if (session) ss.set('zdash', JSON.stringify(session))
  const calls = []
  const dom = new JSDOM(html, {
    url: 'https://zeidexsoft.com/dash/' + fragment,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: {
          getItem: (k) => (ss.has(k) ? ss.get(k) : null),
          setItem: (k, v) => void ss.set(k, String(v)),
          removeItem: (k) => void ss.delete(k),
          clear: () => ss.clear(),
          key: (i) => [...ss.keys()][i] ?? null,
          get length() {
            return ss.size
          },
        },
      })
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
      window.fetch = async (url, init = {}) => {
        const u = String(url)
        const call = {
          url: u,
          method: init.method || 'GET',
          auth: (init.headers && init.headers.authorization) || '',
          body: init.body ? JSON.parse(init.body) : null,
        }
        calls.push(call)
        const a = answer ? answer(call) : u.endsWith('/state') ? { status: 200, data: state } : { status: 200, data: { ok: true } }
        return { ok: a.status >= 200 && a.status < 300, status: a.status, json: async () => a.data }
      }
    },
  })
  const { window } = dom
  window.eval(runtime)
  return { window, doc: window.document, errors, calls, ss }
}

// ── 1. the /web link: the fragment is the login ──────────────────────────
console.log('\n1. login — the /web link, the manual form, the remembered session')
{
  const { doc, window, errors, calls, ss } = boot({ fragment: `#id=${ID}&k=${KEY}` })
  await tick()
  ok('the state is fetched with the fragment\'s key',
    calls[0] && calls[0].url === `/api/dash/${ID}/state` && calls[0].auth === `Bearer ${KEY}`, calls[0] && calls[0].url)
  ok('the fragment is wiped from the address bar', window.location.hash === '', window.location.href)
  ok('the session is remembered in sessionStorage', ss.get('zdash') === JSON.stringify({ id: String(ID), key: KEY }))
  ok('the login door is hidden', doc.querySelector('#login').hidden === true)
  ok('the dashboard is shown', doc.querySelector('#app').hidden === false)
  ok('the bot username is rendered', doc.querySelector('#b-user').textContent === 'shop_bot')
  ok('the plan pill reads paid', doc.querySelector('#b-plan').textContent.includes('مدفوعة'))
  ok('the status pill reads running', doc.querySelector('#b-status').textContent.includes('يعمل'))
  ok('six stats are painted', doc.querySelectorAll('#stats .stat').length === 6, String(doc.querySelectorAll('#stats .stat').length))
  ok('the item count is rendered against the cap', doc.querySelector('#i-count').textContent === '(1/50)')
  ok('the item card carries its title', doc.querySelector('#items .card .title').textContent.includes('دورة تصميم'))
  ok('the FAQ card is rendered', doc.querySelector('#faqs .card .title').textContent.includes('كيف أدفع'))
  ok('the welcome textarea is prefilled', doc.querySelector('#s-welcome').value === state.bot.welcome)
  ok('no runtime errors', errors.length === 0, errors.join(' | ') || 'clean')
  window.close()
}

// A dead key is a dead end: the error is shown and the session forgotten.
{
  const { doc, window, ss } = boot({ fragment: `#id=${ID}&k=bad`, answer: () => ({ status: 403, data: {} }) })
  await tick()
  ok('a 403 keeps the login door open', doc.querySelector('#login').hidden === false)
  ok('the expiry error is shown',
    doc.querySelector('#f-err').hidden === false && doc.querySelector('#f-err').textContent.includes('انتهت صلاحية المفتاح'))
  ok('the dead session is forgotten', ss.get('zdash') === undefined)
  window.close()
}

// The manual form: a pasted id and key open the same door.
{
  const { doc, window, calls, ss } = boot()
  await tick()
  ok('no fetch happens before a login', calls.length === 0)
  doc.querySelector('#f-id').value = String(ID)
  doc.querySelector('#f-key').value = KEY
  doc.querySelector('#f-go').click()
  await tick()
  ok('the manual key opens the dashboard', doc.querySelector('#app').hidden === false)
  ok('it is sent as the Bearer', calls[0] && calls[0].auth === `Bearer ${KEY}`)
  ok('the manual session is remembered', ss.get('zdash') === JSON.stringify({ id: String(ID), key: KEY }))
  window.close()
}
{
  const { doc, window, calls } = boot()
  await tick()
  doc.querySelector('#f-id').value = '12' // too short for a bot id
  doc.querySelector('#f-key').value = KEY
  doc.querySelector('#f-go').click()
  await tick()
  ok('a bad id never leaves the page', calls.length === 0 && doc.querySelector('#f-err').hidden === false)
  window.close()
}

// A remembered session auto-enters, the way a reopened tab does.
{
  const { doc, window, calls } = boot({ session: { id: String(ID), key: KEY } })
  await tick()
  ok('the remembered session reloads the dashboard',
    calls[0] && calls[0].url === `/api/dash/${ID}/state` && doc.querySelector('#app').hidden === false)
  window.close()
}

// ── 2. the console: tabs, dialogs, settings ───────────────────────────────
console.log('\n2. the console — tabs, the product form, the settings')
{
  const { doc, window } = boot({ session: { id: String(ID), key: KEY } })
  await tick()
  doc.querySelector('#tabs button[data-tab="faqs"]').click()
  await tick()
  ok('tab switching shows the faqs panel',
    doc.querySelector('#tab-faqs').hidden === false && doc.querySelector('#tab-stats').hidden === true)
  window.close()
}

// The product form: the add posts to the items endpoint with the Bearer key,
// and an empty title never leaves the page.
{
  const { doc, window, calls } = boot({ session: { id: String(ID), key: KEY } })
  await tick()
  doc.querySelector('#i-add').click()
  const dlg = doc.querySelector('#dialog')
  ok('the add dialog opens', dlg.hidden === false)
  ;[...dlg.querySelectorAll('button')].find((b) => b.textContent === 'إضافة المنتج').click()
  await tick()
  ok('an empty form never posts', !calls.some((c) => c.method === 'POST' && c.url.endsWith('/items')))
  const byPh = (ph) => dlg.querySelector(`input[placeholder="${ph}"]`)
  byPh('مثال: دورة تصميم كاملة').value = 'دورة جديدة'
  byPh('مثال: aifake-pro').value = 'new-course'
  byPh('150').value = '1750'
  ;[...dlg.querySelectorAll('button')].find((b) => b.textContent === 'إضافة المنتج').click()
  await tick()
  const post = calls.find((c) => c.method === 'POST' && c.url.endsWith('/items'))
  ok('the add posts to the items endpoint', !!post)
  ok('it carries the Bearer key', post && post.auth === `Bearer ${KEY}`)
  ok('the form fields travel in the body',
    post && post.body.title === 'دورة جديدة' && post.body.stars === 1750 && post.body.sku === 'new-course')
  ok('the dialog closes and the state reloads',
    dlg.hidden === true && calls.filter((c) => c.url.endsWith('/state')).length === 2)
  window.close()
}

// Settings: the welcome posts its text, and the pause tap posts the opposite flag.
{
  const { doc, window, calls } = boot({ session: { id: String(ID), key: KEY } })
  await tick()
  doc.querySelector('#s-welcome').value = 'ترحيب جديد'
  doc.querySelector('#s-save').click()
  await tick()
  const w = calls.find((c) => c.url.endsWith('/welcome'))
  ok('saving the welcome posts its text', w && w.method === 'POST' && w.body.text === 'ترحيب جديد')
  doc.querySelector('#s-pause').click()
  await tick()
  const p = calls.find((c) => c.url.endsWith('/pause'))
  ok('the pause tap posts the opposite flag', p && p.method === 'POST' && p.body.paused === true)
  window.close()
}

// Logout returns to the door and forgets the session.
{
  const { doc, window, ss } = boot({ session: { id: String(ID), key: KEY } })
  await tick()
  doc.querySelector('#b-out').click()
  await tick()
  ok('logout returns to the login door',
    doc.querySelector('#login').hidden === false && doc.querySelector('#app').hidden === true)
  ok('logout forgets the session', ss.get('zdash') === undefined)
  window.close()
}

console.log(`\n${fails ? fails + ' CHECK(S) FAILED' : 'all dash checks passed'}`)
process.exit(fails ? 1 : 0)
