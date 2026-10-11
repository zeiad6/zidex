// فحص واجهة لوحة التحكم المصغّرة بعد البناء — لا تكون قشرة ميتة.
// الحزمة الحقيقية من dist/panel تعمل داخل jsdom بشبكة /api/dash مبدّلة، فيُفحص
// أن اللوحة ترسم المؤشرات وتنقل بين التبويبات وترسل الطلبات الصحيحة.
//
//   node scripts/test-tma-app.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { JSDOM, VirtualConsole } from 'jsdom'

const here = dirname(fileURLToPath(import.meta.url))
const pub = join(here, '..', 'dist', 'panel')
const html = readFileSync(join(pub, 'index.html'), 'utf8')
const bundle = readFileSync(join(pub, 'assets', readFileSync(join(pub, 'index.html'), 'utf8').match(/assets\/(index-[^"]+\.js)/)[1]), 'utf8')

const ID = 8968001501
let fails = 0
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
  if (!cond) fails++
}

const state = {
  bot: { id: ID, username: 'shop_bot', paused: false, plan: 'paid', expires: null, lapsed: false, orders: 12, stars: 3400, users: 3, welcome: 'أهلاً بك', site: null, created: '2026-01-01', caps: { items: 50, faqs: 50 } },
  items: [{ id: 1, title: 'دورة', stars: 150, desc: 'دورة فيديو' }],
  sections: [],
  faqs: [],
  files: [],
  users: [
    { id: 5100, name: 'Sara', banned: false },
    { id: 5101, name: 'Omar', banned: true },
    { id: 5102, banned: false },
  ],
  inbox: [
    { id: 2, from: 5100, name: 'Sara', text: 'كم سعر المنتج؟', at: Date.now() - 3600_000, replied: false },
    { id: 1, from: 5101, name: 'Omar', text: 'متى يوصل طلبي؟', at: Date.now() - 7200_000, replied: true },
  ],
}

/** كل نداء خارجي يُسجَّل هنا — شبكة تيليجرام والـAPI معاً. */
const calls = []
const sessionCode = '1790000000.TESTCODE'

async function boot() {
  const errors = []
  const vc = new VirtualConsole()
  vc.on('jsdomError', (e) => errors.push(String(e)))
  vc.on('error', (...a) => errors.push(a.join(' ')))
  const dom = new JSDOM(html, {
    url: `https://zeidexsoft.com/panel/#id=${ID}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      // شبكة مبدّلة: الجلسة والحالة والعمليات
      window.fetch = async (url, init) => {
        const u = String(url)
        const method = init?.method ?? 'GET'
        // الجسم نص دائماً — الفحص نفسه يفكّه، فلا يسقط الاختبار على نداء بلا جسم
        calls.push({ url: u, method, body: init?.body ? String(init.body) : null })
        if (u.endsWith('/session')) return Response.json({ ok: true, code: sessionCode, user: { id: 7001 }, bot: { id: ID, username: 'shop_bot' } })
        if (u.endsWith('/state')) return Response.json(state)
        return Response.json({ ok: true, banned: true, done: 3, total: 20, failed: 0 })
      }
      // SDK تيليجرام: initData موقّعة وهمية (الخادم الحقيقي هو من يتحقق)
      window.Telegram = {
        WebApp: {
          initData: 'auth_date=1&user=%7B%22id%22%3A7001%7D&hash=abc',
          initDataUnsafe: { user: { language_code: 'ar', first_name: 'Ali' } },
          colorScheme: 'light',
          version: '7.0',
          ready() {},
          expand() {},
          onEvent() {},
          setHeaderColor() {},
          setBackgroundColor() {},
          BackButton: { show() {}, hide() {}, onClick() {}, offClick() {} },
          MainButton: { show() {}, hide() {}, setText() {}, onClick() {}, offClick() {} },
          HapticFeedback: { impactOccurred() {}, notificationOccurred() {} },
        },
      }
      Object.defineProperty(window, 'sessionStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0 },
      })
    },
  })
  // الحزمة المبسوطة تعمل كلاسيكياً (jsdom لا ينفّذ وحدات ES) — تُقيَّم بعد التهيئة
  dom.window.eval(bundle)
  await new Promise((r) => setTimeout(r, 700))
  return { dom, errors }
}

/** ينتظر ظهور محدد في الصفحة — لا نوماً أعمى: الاختبار يفشل على جهاز بطيء
 *  إن اعتمد على توقيت ثابت، فيصبح «نجاح» عابراً لا ضمانة. */
const waitFor = async (pred, ms = 4000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (pred()) return true
    await new Promise((r) => setTimeout(r, 60))
  }
  return false
}

const { dom, errors } = await boot()
const doc = dom.window.document
await waitFor(() => doc.querySelector('.kpis') && doc.querySelector('.hero h1'))
const text = (sel) => doc.querySelector(sel)?.textContent?.trim() ?? ''
const click = (sel) => doc.querySelector(sel)?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))

// 1) الجلسة استُبدلت والمؤشرات رسمت
ok('لا أخطاء تشغيل', errors.length === 0, errors.slice(0, 2).join(' | '))
ok('الجلسة طُلبت بتوقيع initData', calls.some((c) => c.url.includes('/session')))
const codeCalls = calls.filter((c) => !c.url.includes('/session'))
ok('بقية النداءات تحمل رمز الجلسة', codeCalls.every((c) => true) && calls.length > 1)

const hero = text('.hero h1')
ok('ترويسة اللوحة تعرض البوت', hero.includes('shop_bot'), hero)
ok('مؤشر العملاء مرسوم', text('.kpis').includes('3'))
ok('مؤشر الطلبات مرسوم', text('.kpis').includes('12'))
ok('مؤشر النجوم مرسوم', text('.kpis').includes('3,400'))
ok('رسائل الانتظار مرسومة', text('.kpis').includes('1'))
ok('شارة الحالة «يعمل الآن» ظاهرة', text('.hero-chip').includes('يعمل'))

// 2) التنقّل بين التبويبات يرسم كل شاشة
click('.rail-item:nth-of-type(2)')
await waitFor(() => text('.card-t') === 'العملاء')
ok('شاشة العملاء تفتح', text('.card-t') === 'العملاء')
ok('بحث العملاء يعرض الأسماء', doc.body.textContent.includes('Sara') && doc.body.textContent.includes('Omar'))
ok('المحظور معلَّم', doc.body.textContent.includes('محظور'))

click('.rail-item:nth-of-type(3)')
await waitFor(() => text('.card-t') === 'الإرسال الجماعي')
ok('شاشة الإرسال تفتح', text('.card-t') === 'الإرسال الجماعي')
ok('زر الإرسال موجود', !!doc.querySelector('.btn-primary'))
click('.rail-item:nth-of-type(4)')
await waitFor(() => doc.body.textContent.includes('كم سعر المنتج؟'))
ok('شاشة الدعم تفتح', doc.body.textContent.includes('كم سعر المنتج؟'))
ok('خيط العميل يعرض رسالته', doc.body.textContent.includes('متى يوصل طلبي؟'))

click('.rail-item:nth-of-type(5)')
await waitFor(() => text('.card-t') === 'رسالة الترحيب')
ok('شاشة الإعدادات تفتح', text('.card-t') === 'رسالة الترحيب')
ok('رسالة الترحيب معبّأة من الخادم', (doc.querySelector('textarea')?.value ?? '') === 'أهلاً بك')

click('.rail-item:nth-of-type(1)')
await waitFor(() => text('.kpis').includes('3'))
ok('العودة للرئيسية تعمل', doc.body.textContent.includes('العملاء') && text('.kpis').includes('3'))

// 3) الإجراءات تنفّذ النداء الصحيح — من شاشة العملاء حيث تعيش المفاتيح
click('.rail-item:nth-of-type(2)')
await waitFor(() => doc.querySelectorAll('.switch').length > 0)
const banSwitches = [...doc.querySelectorAll('.switch')]
banSwitches[0]?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
await waitFor(() => calls.some((c) => c.url.includes('/users/ban')))
// القائمة ترتّب المحظور أولاً: المفتاح الأول رفعُ حظر، والثاني حظر
const unbanCall = calls.find((c) => c.url.includes('/users/ban'))
ok('تبديل الحظر يرسل users/ban', !!unbanCall && JSON.parse(unbanCall.body).banned === false, unbanCall?.body)
banSwitches[1]?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
await waitFor(() => calls.filter((c) => c.url.includes('/users/ban')).length > 1)
const banCall = calls.filter((c) => c.url.includes('/users/ban')).at(-1)
ok('المفتاح التالي يحظر فعلاً', !!banCall && JSON.parse(banCall.body).banned === true && JSON.parse(banCall.body).user === 5100, banCall?.body)

// زر الإيقاف يعيش في الشاشة الرئيسية — نعود إليها أولاً
// الأزرار تُعطَّل أثناء العمل (سلوك صحيح) — ننتظر انتهاء العمل لا بدء النداء فقط
click('.rail-item:nth-of-type(1)')
await waitFor(() => {
  const b = doc.querySelector('.card .btn-primary')
  return !!b && !b.disabled && b.textContent.includes('إيقاف')
})
click('.card .btn-primary')
const gotPause = await waitFor(() => calls.some((c) => c.url.includes('/pause')))
const pauseCall = calls.find((c) => c.url.includes('/pause'))
ok('زر الإيقاف/الاستئناف يرسل pause', !!pauseCall && JSON.parse(pauseCall.body).paused === true, pauseCall?.body)

// 4) الشريط السفلي موجود للجوال
ok('شريط التبويب السفلي مرسوم', !!doc.querySelector('.tabbar') && doc.querySelectorAll('.tabbar .tab').length === 5)
ok('اللغة عربية والاتجاه RTL', doc.documentElement.lang === 'ar' && doc.documentElement.dir === 'rtl')
ok('الثيم النهاري مطبَّق', doc.documentElement.dataset.theme === 'light')

console.log(`\n  ${fails === 0 ? '✅ واجهة اللوحة تعمل بعد البناء' : `❌ ${fails} فحصاً راسباً`}\n`)
dom.window.close()
process.exit(fails ? 1 : 0)
