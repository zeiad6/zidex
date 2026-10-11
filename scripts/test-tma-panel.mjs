// فحص لوحة التحكم المصغّرة (Mini App) — الخادم أولاً: توقيع initData، الجلسة،
// الحظر، صندوق الدعم، الإرسال الجماعي، وتثبيت زر القائمة.
//
//   node scripts/test-tma-panel.mjs
//
// نفس أداة test-bots.mjs: حزمة Worker حقيقية بـ esbuild، KV وهمية، وشبكة
// تيليجرام مبدّلة — فلا شيء هنا يعتمد على خدمة خارجية.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const dir = mkdtempSync(join(tmpdir(), 'tma-'))
await esbuild.build({ entryPoints: ['worker/bots.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: join(dir, 'b.mjs'), logLevel: 'silent' })
const b = await import(join(dir, 'b.mjs'))
rmSync(dir, { recursive: true, force: true })

const store = new Map()
const env = {
  DOWNLOADS: {
    get: async (k) => store.get(k) ?? null,
    put: async (k, v) => void store.set(k, v),
    delete: async (k) => void store.delete(k),
  },
  BOTS_KEY: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))),
  BOTS_ADMIN_TOKEN: 'admin-secret-1234567890',
}

const TOKEN = '123456789:' + 'A'.repeat(35)
const OWNER = 7001
const CUSTOMER = 5100
const ID = 123456789

/** كل نداء يخرج لتليجرام — يُسجّل هنا، فيُفحص ما أرسله البوت فعلاً. */
const calls = []
globalThis.fetch = async (url, init) => {
  const method = String(url).split('/').pop()
  calls.push({ method, body: init?.body ? JSON.parse(init.body) : {} })
  if (method === 'getMe') return Response.json({ ok: true, result: { id: ID, username: 'shop_bot' } })
  return Response.json({ ok: true, result: {} })
}

const admin = (method, path, body) =>
  b.botsAdmin(
    new Request(`https://zeidexsoft.com${path}`, {
      method,
      headers: { authorization: `Bearer ${env.BOTS_ADMIN_TOKEN}` },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
    new URL(`https://zeidexsoft.com${path}`),
  )

let fails = 0
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
  if (!cond) fails++
}

/* توقيع initData بالطريقة التي يوقّع بها تيليجرام نفسه — لا اختصار. */
const sign = async (fields, token = TOKEN) => {
  const mac = async (key, msg) => {
    const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? new TextEncoder().encode(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)))
  }
  const hex = (u) => [...u].map((x) => x.toString(16).padStart(2, '0')).join('')
  const secret = await mac('WebAppData', token)
  const hash = hex(await mac(secret, Object.entries(fields).map(([k, v]) => `${k}=${v}`).sort().join('\n')))
  return new URLSearchParams({ ...fields, hash }).toString()
}

const initDataFor = async (uid = OWNER, at = Math.floor(Date.now() / 1000), token = TOKEN) =>
  sign({ auth_date: String(at), user: JSON.stringify({ id: uid, first_name: 'Ali' }) }, token)

const dash = (method, action, body, code) =>
  b.botsDash(
    new Request(`https://zeidexsoft.com/api/dash/${ID}/${action}`, {
      method,
      headers: { authorization: `Bearer ${code}` },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
    new URL(`https://zeidexsoft.com/api/dash/${ID}/${action}`),
  )

const deliver = (update) =>
  b.botWebhook(
    new Request(`https://zeidexsoft.com/tg/${ID}`, { method: 'POST', headers: { 'x-telegram-bot-api-secret-token': (JSON.parse(store.get(`tb:${ID}`))).secret }, body: JSON.stringify(update) }),
    env,
    String(ID),
  )

let feedFlush = null
const cfg = () => JSON.parse(store.get(`tb:${ID}`))
/** سجل الدعم المستقل: الأسماء والصندوق — ليس سجل المتجر. */
const feed = () => JSON.parse(store.get(`feed:${ID}`) ?? '{"contacts":{},"inbox":[]}')

// ── التهيئة ───────────────────────────────────────────────────────────
assert.equal((await admin('POST', '/admin/bots', { token: TOKEN, owner_id: OWNER })).status, 200)
ok('بوت مهيّأ للاختبار', store.has(`tb:${ID}`))

// عميل يبدأ الحوار، فيصبح في قائمة العملاء وله رسالة ترحيب
await deliver({ message: { chat: { id: CUSTOMER, type: 'private' }, from: { id: CUSTOMER, first_name: 'Sara' }, text: '/start' } })
ok('عميل جديد يُسجَّل', cfg().users.includes(CUSTOMER))

// ── 1) مصادقة Mini App: التوقيع الصحيح يمرح، وغيره يُرفض ──────────────
const sessionRes = await dash('POST', 'session', { initData: await initDataFor() }, 'x')
ok('الجلسة بلا رمز ليست ممنوعة (نداء التوقيع)', sessionRes.status === 200)
const session = await sessionRes.json()
ok('رموز الجلسة تُمنح للمالك', !!session.code && session.user.id === OWNER)

const signedForge = await initDataFor(OWNER, Math.floor(Date.now() / 1000))
const bad = await dash('POST', 'session', { initData: signedForge.replace(/hash=.+$/, 'hash=' + '0'.repeat(64)) }, 'x')
ok('توقيع مزيّف يُرفض', bad.status === 403)

const stale = await dash('POST', 'session', { initData: await initDataFor(OWNER, Math.floor(Date.now() / 1000) - 90000) }, 'x')
ok('initData قديم (يوم) يُرفض', stale.status === 403)

const stranger = await dash('POST', 'session', { initData: await initDataFor(9999) }, 'x')
ok('غير المالك يُرفض', stranger.status === 403)

const wrongBotToken = await dash('POST', 'session', { initData: await initDataFor(OWNER, undefined, '999999999:' + 'B'.repeat(35)) }, 'x')
ok('توقيع بتوكن بوت آخر يُرفض', wrongBotToken.status === 403)

// ── 2) رمز الجلسة يفتح كل نقاط اللوحة ─────────────────────────────────
const state = await (await dash('GET', 'state', null, session.code)).json()
ok('الحالة تُقرأ برمز الجلسة', state.bot.id === ID && state.users.length === 1)
const noToken = await dash('GET', 'state', null, '1750000000.nope')
ok('رمز خاطئ يُرفض', noToken.status === 403)

// ── 3) الدعم الفني: رسالة العميل تُخزَّن، والرد يخرج من البوت ──────────
calls.length = 0
await deliver({ message: { chat: { id: CUSTOMER, type: 'private' }, from: { id: CUSTOMER, first_name: 'Sara' }, text: 'كم سعر المنتج؟' } })
ok('رسالة العميل تُخزَّن في الصندوق', feed().inbox.at(-1)?.text === 'كم سعر المنتج؟')
ok('اسم العميل يُحفظ لقائمة العملاء', feed().contacts[String(CUSTOMER)] === 'Sara')
ok('الصندوق في سجل مستقل لا في سجل المتجر', cfg().inbox === undefined)
const listState = await (await dash('GET', 'state', null, session.code)).json()
ok('الحالة تعرض اسم العميل', listState.users.some((u) => u.id === CUSTOMER && u.name === 'Sara'))

const reply = await dash('POST', 'inbox/reply', { to: CUSTOMER, text: 'السعر 150 نجمة' }, session.code)
ok('ردّ الدعم يُقبل', reply.status === 200)
const sent = calls.filter((c) => c.method === 'sendMessage').map((c) => c.body)
ok('الرد خرج للعميل من البوت', sent.some((s) => s.chat_id === CUSTOMER && s.text === 'السعر 150 نجمة'))
ok('رسائل العميل تُعلَّم كمُجاب عنها', feed().inbox.every((m) => m.replied))

// ── 4) الحظر: العميل المحظور لا يجيب عليه البوت ───────────────────────
const ban = await dash('POST', 'users/ban', { user: CUSTOMER, banned: true }, session.code)
ok('الحظر يُقبل', ban.status === 200 && (await ban.json()).banned === true)
calls.length = 0
await deliver({ message: { chat: { id: CUSTOMER, type: 'private' }, from: { id: CUSTOMER, first_name: 'Sara' }, text: 'هل يوجد خصم؟' } })
ok('البوت يتجاهل المحظور', calls.filter((c) => c.method === 'sendMessage').length === 0)
ok('رسالة المحظور لا تدخل الصندوق', feed().inbox.at(-1)?.text !== 'هل يوجد خصم؟')

const unban = await dash('POST', 'users/ban', { user: CUSTOMER, banned: false }, session.code)
ok('رفع الحظر يُقبل', unban.status === 200 && (await unban.json()).banned === false)
calls.length = 0
await deliver({ message: { chat: { id: CUSTOMER, type: 'private' }, from: { id: CUSTOMER, first_name: 'Sara' }, text: 'عودة بعد رفع الحظر' } })
ok('المحظور المرفوع يعود للطبيعي', calls.filter((c) => c.method === 'sendMessage').length > 0)

// ── 5) الإرسال الجماعي: مهمة + دفعات + حالة ──────────────────────────
for (const uid of [5101, 5102, 5103, 5104]) {
  await deliver({ message: { chat: { id: uid, type: 'private' }, from: { id: uid }, text: '/start' } })
}
const job = await (await dash('POST', 'broadcast', { text: 'عرض خاص الليلة فقط' }, session.code)).json()
ok('مهمة إرسال تُنشأ', !!job.job && job.total >= cfg().users.length)

calls.length = 0
const tick1 = await (await dash('POST', 'broadcast/tick', { job: job.job, text: 'عرض خاص الليلة فقط' }, session.code)).json()
ok('الدفعة الأولى أرسلت', tick1.done > 0 && calls.filter((c) => c.method === 'sendMessage').length === tick1.done)
ok('كل رسائل الدفعة نص العرض نفسه', calls.filter((c) => c.method === 'sendMessage').every((c) => c.body.text === 'عرض خاص الليلة فقط'))

let done = tick1.done
for (let i = 0; i < 20 && done < job.total; i++) {
  const s = await (await dash('POST', 'broadcast/tick', { job: job.job, text: 'عرض خاص الليلة فقط' }, session.code)).json()
  done = s.done
}
ok('الإرسال يكمل حتى النهاية', done === job.total, `${done}/${job.total}`)
const finalState = await (await dash('GET', `broadcast/${job.job}`, null, session.code)).json()
ok('حالة المهمة تُقرأ بعد الاكتمال', finalState.done === job.total && finalState.failed === 0)

const empty = await dash('POST', 'broadcast', { text: '' }, session.code)
ok('إرسال بلا نص يُرفض', empty.status === 400)
const noJob = await dash('GET', 'broadcast/nope', null, session.code)
ok('مهمة غير موجودة تُرفض', noJob.status === 404)

// ── 5ب) الخطة المجانية المتقاعدة: لا كتابة ولا صندوق ─────────────────
b.__expireOwnerCache()
store.set(`tb:${ID}`, JSON.stringify({ ...cfg(), plan: 'free' }))
b.__expireOwnerCache()
feedFlush = feed()
calls.length = 0
await deliver({ message: { chat: { id: 5099, type: 'private' }, from: { id: 5099, first_name: 'Guest' }, text: 'رسالة على خطة مجانية' } })
ok('الخطة المجانية لا تكتب سجل الدعم', JSON.stringify(JSON.parse(store.get(`feed:${ID}`) ?? 'null')) === JSON.stringify(feedFlush))
store.set(`tb:${ID}`, JSON.stringify({ ...cfg(), plan: 'paid' }))

// ── 6) تثبيت لوحة القائمة: web_app على رابط اللوحة ────────────────────
calls.length = 0
const menu = await dash('POST', 'menu', {}, session.code)
ok('تثبيت الزر يُقبل', menu.status === 200)
const menuCall = calls.find((c) => c.method === 'setChatMenuButton')
ok('setChatMenuButton استُدعي', !!menuCall)
ok('الزر يفتح اللوحة المصغّرة للبوت نفسه', menuCall?.body?.menu_button?.web_app?.url === 'https://zeidexsoft.com/panel/#id=' + ID)
ok('الزر في محادثة المالك وحده', menuCall?.body?.chat_id === OWNER)

// ── 7) الترحيب والإيقاف يبقيا على المسار نفسه ────────────────────────
const welcome = await dash('POST', 'welcome', { text: 'أهلاً بك في متجرنا' }, session.code)
ok('حفظ الترحيب يعمل', welcome.status === 200 && cfg().welcome === 'أهلاً بك في متجرنا')
const pause = await dash('POST', 'pause', { paused: true }, session.code)
ok('الإيقاف للصيانة يعمل', pause.status === 200 && cfg().paused === true)
const pause2 = await dash('POST', 'pause', { paused: false }, session.code)
ok('الاستئناف يعمل', pause2.status === 200 && cfg().paused === false)

// ── 8) أمر /tma يرسل زر Mini App للمالك ──────────────────────────────
calls.length = 0
await deliver({ message: { chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'Ali' }, text: '/tma' } })
const tma = calls.filter((c) => c.method === 'sendMessage').at(-1)
ok('أمر /tma يرسل زر اللوحة المصغّرة', !!tma?.body?.reply_markup?.inline_keyboard?.[0]?.[0]?.web_app?.url)
ok('أمر /tma يثبّت زر القائمة', calls.some((c) => c.method === 'setChatMenuButton'))
ok('رابط الزر هو لوحة هذا البوت', tma?.body?.reply_markup?.inline_keyboard?.[0]?.[0]?.web_app?.url === `https://zeidexsoft.com/panel/#id=${ID}`)

console.log(`\n  ${fails === 0 ? '✅ كل الفحوص ناجحة' : `❌ ${fails} فحصاً راسباً`}\n`)
process.exit(fails ? 1 : 0)
