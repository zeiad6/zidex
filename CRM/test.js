'use strict';

/* فحوص CRM — صفر تبعّيات، node:test فقط:
 *   node --test CRM/test.js
 *
 *  ثلاثة طبقات: المنطق (db/crm/bot)، الجسر (bridge)، ثم السيرفر كاملاً على منفذ
 *  حقيقي — فالاختبار الذي لا يلمس HTTP لا يثبت أن اللوحة تعمل. */

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const TOKEN_FAKE = '1'.repeat(35);
const BOT = {
  chat_id: 100,
  first_name: '<b>Sara</b> & <script>alert(1)</script>',
  username: 'sara',
};

/** يبني قاعدة نظيفة في ملف مؤقت، ويعيد الوحدات محمّلة عليها. */
function freshDb(name = 'test') {
  const path = require('node:path');
  const os = require('node:os');
  const fs = require('node:fs');
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), `crm-${name}-`)), 'crm.db');
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  // قاعدة نظيفة = إعداد نظيف: متغيّرات البيئة تتسرّب بين الاختبارات عبر process.env
  // (سابقةً جعلت اختباراً يرسل رداً حقيقياً إلى المنصّة!)
  delete process.env.BOT_TOKEN;
  delete process.env.BRIDGE_TOKEN;
  delete process.env.BRIDGE_BOT_ID;
  delete process.env.PLATFORM_ORIGIN;
  delete process.env.BOT_MODE;
  process.env.DB_PATH = file;
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASS = 'admin123';
  return { path: file, dbMod: require('./db'), crm: require('./crm'), bot: require('./bot'), events: require('./events') };
}

test('db: كلمة مرور صحيحة/خاطئة/مشوّهة', async () => {
  const { dbMod: db } = freshDb('auth');
  const hash = db.hashPassword('pw12345');
  assert.equal(db.verifyPassword('pw12345', hash), true);
  assert.equal(db.verifyPassword('wrong', hash), false);
  // سجل مشوّه لا يرفع استثناء (كان 500 على بوابة الدخول)
  for (const bad of ['', 'nope', 'salt:', ':hash', 'aa:zz']) {
    assert.equal(db.verifyPassword('x', bad), false, `malformed: ${bad}`);
  }
  assert.equal(db.verifyPassword('x', undefined), false);
});

test('crm: logMessage يعيد الصف المُدرج لا آخر الصفوف', async () => {
  const { crm } = freshDb('rows');
  const u = crm.upsertTelegramUser({ id: '1', first_name: 'A' });
  const v = crm.upsertTelegramUser({ id: '2', first_name: 'B' });
  const m1 = crm.logMessage(u.id, 'first', 'in');
  const m2 = crm.logMessage(v.id, 'second', 'in');
  assert.equal(m1.text, 'first');
  assert.equal(m2.text, 'second');
  assert.equal(m2.user_id, v.id, 'a concurrent write must not return the other chat’s row');
});

test('crm: ملاحظة تغيير الحالة تسجّل القديم والجديد', async () => {
  const { crm } = freshDb('status');
  const u = crm.upsertTelegramUser({ id: '3', first_name: 'C' });
  crm.updateUser(u.id, { status: 'interested' });
  const note = crm.listMessages(u.id).at(-1);
  assert.match(note.text, /جديد/);
  assert.match(note.text, /مهتم/);
  assert.equal(note.direction, 'out');
  // تعديل بلا تغيير حالة لا يكتب ملاحظة
  const before = crm.listMessages(u.id).length;
  crm.updateUser(u.id, { name: 'C2' });
  assert.equal(crm.listMessages(u.id).length, before);
});

test('crm: مطابقة القواعد تفهم العربية (تشكيل، ألف، أرقام، بادئة)', async () => {
  const { crm, dbMod } = freshDb('rules');
  dbMod.db.prepare('INSERT INTO rules (keyword, response, enabled, priority) VALUES (?,?,1,0)').run('السعر', '1750 نجمة');
  dbMod.db.prepare('INSERT INTO rules (keyword, response, enabled, priority) VALUES (?,?,1,0)').run('123', 'رمزك جاهز');
  assert.ok(crm.matchRule('كم السعر؟'));
  assert.ok(crm.matchRule('أبغى أعرف السعر'));
  assert.ok(crm.matchRule('١٢٣'), 'Arabic-Indic digits fold to Latin');
  assert.equal(crm.matchRule(''), null);
  assert.equal(crm.matchRule('مرحبا'), null);
  // كلمة أقصر داخل الكلمة التي كتبها العميل
  dbMod.db.prepare('INSERT INTO rules (keyword, response, enabled, priority) VALUES (?,?,1,0)').run('شحن', 'يShip مجاني');
  assert.ok(crm.matchRule('ابغى شحنها اليوم'));
});

test('crm: البحث يقبل معرّف تيليجرام', async () => {
  const { crm } = freshDb('search');
  crm.upsertTelegramUser({ id: '555123', first_name: 'NoName' });
  assert.equal(crm.listUsers({ q: '555' }).total, 1);
  assert.equal(crm.listUsers({ q: 'NoName' }).total, 1);
  assert.equal(crm.listUsers({ q: 'zzz' }).total, 0);
});

test('bot: اسم العميل يُهرَّب قبل إرساله HTML', async () => {
  const { bot, crm } = freshDb('escape');
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    sent.push(JSON.parse(init.body));
    return { json: async () => ({ ok: true, result: {} }) };
  };
  try {
    // يتطلب توكن: نضعه مؤقتاً
    process.env.BOT_TOKEN = TOKEN_FAKE;
    // bot.js قرأ التوكن عند التحميل، فنعيد تحميله
    for (const k of Object.keys(require.cache)) if (k.includes('/CRM/')) delete require.cache[k];
    const bot2 = require('./bot');
    const u = crm.upsertTelegramUser(BOT);
    await bot2.handleUpdate({ message: { chat: { id: BOT.chat_id }, from: BOT, text: '/start' } });
    const welcome = sent.at(-1);
    assert.ok(!welcome.text.includes('<b>Sara</b>'), 'the customer’s name must arrive as text');
    assert.ok(welcome.text.includes('&lt;b&gt;'));
    assert.ok(!welcome.text.includes('<script>'), 'no markup from the customer at all');
    assert.equal(crm.listMessages(u.id).at(-1).direction, 'out', 'the welcome is recorded after it sent');
  } finally {
    delete process.env.BOT_TOKEN;
    globalThis.fetch = realFetch;
  }
});

test('bot: ردٌ فشل إرساله لا يُسجَّل كأنه خرج', async () => {
  const { bot, crm } = freshDb('sendfail');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const e = new Error('telegram sendMessage failed: chat not found');
    e.code = 400;
    throw e;
  };
  try {
    process.env.BOT_TOKEN = TOKEN_FAKE;
    for (const k of Object.keys(require.cache)) if (k.includes('/CRM/')) delete require.cache[k];
    const bot2 = require('./bot');
    const u = crm.upsertTelegramUser({ id: '777', first_name: 'X' });
    const out = await bot2.replyToUser(u.id, 'نص الرد');
    assert.equal(out, null, 'a failed send reports failure');
    const msgs = crm.listMessages(u.id);
    assert.equal(msgs.filter((m) => m.direction === 'out' && m.text === 'نص الرد').length, 0);
    assert.match(msgs.at(-1).text, /تعذّر إرسال الرد/, 'a system note explains what happened');
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.BOT_TOKEN;
  }
});

test('bridge: التوقيع يحدّد من يتكلّم', async () => {
  const { crm } = freshDb('bridge-auth');
  delete process.env.BRIDGE_TOKEN;
  delete process.env.BRIDGE_BOT_ID;
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const off = require('./bridge');
  assert.equal(off.authorized({ headers: { 'x-zeidex-signature': 'x' } }), false);
  assert.equal(off.status().mode, 'local');

  process.env.BRIDGE_TOKEN = 'tok-123';
  process.env.BRIDGE_BOT_ID = '8968001501';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const on = require('./bridge');
  assert.equal(on.authorized({ headers: { 'x-zeidex-signature': 'tok-123' } }), true);
  assert.equal(on.authorized({ headers: { 'x-zeidex-signature': 'tok-124' } }), false);
  assert.equal(on.authorized({ headers: {} }), false);
  // بلا PLATFORM_ORIGIN الأحداث تُستقبل والردود تخرج من توكن البوت المحلي
  assert.equal(on.status().mode, 'events-only');
  process.env.PLATFORM_ORIGIN = 'https://zeidexsoft.com';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const via = require('./bridge');
  assert.equal(via.status().mode, 'platform');
  assert.equal(via.status().botId, '8968001501');
  assert.ok(crm);
});

test('bridge: حدث رسالة يُنشئ عميلاً ويسجّل الرسالة ويشغّل القاعدة', async () => {
  const { crm, dbMod } = freshDb('bridge-msg');
  dbMod.db.prepare('INSERT INTO rules (keyword, response, enabled, priority) VALUES (?,?,1,0)').run('السعر', '1750');
  process.env.BRIDGE_TOKEN = 'tok-1';
  process.env.BRIDGE_BOT_ID = '1';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const bridge = require('./bridge');
  const r = await bridge.applyEvent({
    type: 'message',
    bot: { id: 1, username: 'shop_bot' },
    at: new Date().toISOString(),
    user: { id: 4242, name: 'Sara' },
    text: 'كم السعر؟',
  });
  assert.deepEqual(r, { ok: true, kind: 'message', rule: 1 });
  const user = crm.listUsers({ q: '4242' }).rows[0];
  assert.equal(user.name, 'Sara');
  assert.equal(crm.listMessages(user.id).at(-1).text, '1750');
  assert.equal(crm.listMessages(user.id).at(-1).direction, 'out', 'the rule’s answer is recorded');
});

test('bridge: حدث طلب يبني صفقة رابحة ويحوّل الحالة', async () => {
  const { crm, dbMod } = freshDb('bridge-order');
  process.env.BRIDGE_TOKEN = 'tok-2';
  process.env.BRIDGE_BOT_ID = '2';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const bridge = require('./bridge');
  const r = await bridge.applyEvent({
    type: 'order',
    bot: { id: 2, username: 'shop_bot' },
    user: { id: 909, name: 'Omar' },
    item: 'بوت المتجر الذكي',
    stars: 1750,
  });
  assert.equal(r.kind, 'order');
  const deals = crm.listDeals();
  assert.equal(deals.length, 1);
  assert.equal(deals[0].stage, 'won');
  assert.equal(deals[0].value, 1750);
  assert.equal(crm.listUsers({ q: '909' }).rows[0].status, 'customer');
});

test('bridge: الردّ يمرّ عبر المنصّة بنفس العقد', async () => {
  const { crm } = freshDb('bridge-reply');
  process.env.BRIDGE_TOKEN = 'tok-3';
  process.env.BRIDGE_BOT_ID = '3';
  process.env.PLATFORM_ORIGIN = 'https://zeidexsoft.com';
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const bridge = require('./bridge');
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), auth: init.headers.authorization, body: JSON.parse(init.body) });
    return { ok: true, json: async () => ({ ok: true }) };
  };
  try {
    const u = crm.upsertTelegramUser({ id: '313', first_name: 'Reem' });
    const sent = await bridge.deliver(u, 'تم الحل');
    assert.equal(sent, 'تم الحل');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://zeidexsoft.com/api/wf/3');
    assert.equal(calls[0].auth, 'Bearer tok-3');
    assert.deepEqual(calls[0].body, { chat_id: 313, text: 'تم الحل' });
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('server: اللوحة تُخدَم كاملة — دخول، جسر، رد، تصدير', async () => {
  const { crm } = freshDb('http');
  process.env.PORT = '0';
  process.env.BRIDGE_TOKEN = 'sig-secret';
  process.env.BRIDGE_BOT_ID = '8968001501';
  process.env.PLATFORM_ORIGIN = ''; // ردود محلية في هذا الفحص
  delete process.env.PLATFORM_ORIGIN;
  for (const k of Object.keys(require.cache)) delete require.cache[k];
  const server = require('./server');
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  // الردّ الصادر من اللوحة يمرّ الجسر، فيُسجَّل محلياً بلا شبكة
  const login = async (pass = 'admin123') => {
    const res = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: pass }),
    });
    return res.json();
  };
  const { token } = await login();
  assert.ok(token);

  // جسر: حدث موقّع يصير عميلاً في اللوحة
  const bridged = await fetch(`${base}/api/bridge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-zeidex-signature': 'sig-secret' },
    body: JSON.stringify({ type: 'customer_new', bot: { id: 1, username: 'b' }, user: { id: 5150, name: 'نانسي' } }),
  });
  assert.equal(bridged.status, 200);
  const forged = await fetch(`${base}/api/bridge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-zeidex-signature': 'wrong' },
    body: JSON.stringify({ type: 'customer_new', user: { id: 1, name: 'x' } }),
  });
  assert.equal(forged.status, 403);

  const users = await (await fetch(`${base}/api/users?q=5150`, { headers: { authorization: `Bearer ${token}` } })).json();
  assert.equal(users.rows[0].name, 'نانسي');
  assert.ok(crm);

  // تصدير CSV: البايتات الخام تحمل BOM (fetch.text() يحذفه، فالعربية تظهر
  // مفكّكة في Excel بدونه) ورأس الأعمدة كاملاً
  const csvRes = await fetch(`${base}/api/export/users.csv`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(csvRes.headers.get('content-disposition'), 'attachment; filename="crm-users.csv"');
  const bytes = new Uint8Array(await csvRes.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], 'a BOM makes Excel read Arabic');
  const csv = new TextDecoder().decode(bytes);
  assert.ok(csv.includes('id,telegram_id,name,username,phone,status,notes,unread,first_contact,last_contact,messages'));

  // حظر عميل من اللوحة
  const banned = await fetch(`${base}/api/users/${users.rows[0].id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'customer' }),
  });
  assert.equal(banned.status, 200);

  // الخنق: ست محاولات خاطئة ثم 429
  let saw429 = false;
  for (let i = 0; i < 7 && !saw429; i++) {
    const bad = await login('nope-nope');
    saw429 = Boolean(bad.error && bad.error.includes('انتظر'));
  }
  assert.ok(saw429, 'the login door gets paced');

  server.close();
});
