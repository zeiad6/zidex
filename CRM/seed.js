'use strict';

/* يملأ قاعدة البيانات ببيانات تجريبية لتجربة اللوحة بدون بوت حقيقي */

const { db, now } = require('./db');
const crm = require('./crm');

const FIRST = ['أحمد', 'سارة', 'خالد', 'نورة', 'محمد', 'لمى', 'عبدالله', 'رهف', 'فيصل', 'هند'];
const LAST_TS = [
  'السعر', 'أريد شراء الباقة', 'هل يوجد خصم؟', 'شكراً لكم', 'متى يوصل الطلب؟',
  'أرسلت المبلغ', 'كيف أدفع؟', 'أريد باقة البرو', 'السلام عليكم', 'هل تعملون بالجملة؟',
];
const STAGES = ['interested', 'contacted', 'won', 'lost'];
const STATUSES = ['new', 'interested', 'contacted', 'customer', 'lost'];

function seed() {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (existing > 0) {
    console.log('القاعدة تحتوي بيانات بالفعل — تخطَّ.');
    return;
  }

  for (let i = 0; i < FIRST.length; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const first = new Date(Date.now() - (14 - daysAgo) * 86400000).toISOString();
    const tgId = 100000 + i;
    const info = db
      .prepare(
        `INSERT INTO users (telegram_id, name, username, status, first_contact, last_contact, created_via, unread)
         VALUES (?,?,?,?,?,?,?,?)`
      )
      .run(String(tgId), FIRST[i], `user_${tgId}`, STATUSES[Math.floor(Math.random() * STATUSES.length)], first, first, 'telegram', 0);
    const userId = info.lastInsertRowid;

    const msgCount = 2 + Math.floor(Math.random() * 8);
    for (let m = 0; m < msgCount; m++) {
      const day = Math.max(0, daysAgo - Math.floor((m / msgCount) * 14));
      const ts = new Date(Date.now() - day * 86400000 - Math.random() * 3600000).toISOString();
      const inbound = m % 2 === 0;
      db.prepare('INSERT INTO messages (user_id, text, direction, source, ts, read) VALUES (?,?,?,?,?,1)')
        .run(userId, inbound ? LAST_TS[Math.floor(Math.random() * LAST_TS.length)] : 'تم الرد من الخدمة', inbound ? 'in' : 'out', inbound ? 'telegram' : 'dashboard', ts);
    }

    if (Math.random() > 0.5) {
      const stage = STAGES[Math.floor(Math.random() * STAGES.length)];
      crm.createDeal({
        user_id: userId,
        title: `باقة — ${FIRST[i]}`,
        value: [99, 149, 249, 499][Math.floor(Math.random() * 4)],
        stage,
      });
    }
  }

  db.prepare('INSERT INTO rules (keyword, response, enabled, priority) VALUES (?,?,1,10)')
    .run('السعر', 'بطاقة الأسعار:\n• الأساسية 99 ر.س/شهر\n• البرو 249 ر.س/شهر\n• الأعمال 499 ر.س/شهر\nللاشتراك أرسل: اشتراك');
  db.prepare('INSERT INTO rules (keyword, response, enabled, priority) VALUES (?,?,1,5)')
    .run('اشتراك', 'رائع! أرسل لنا رقم الجوال وسيتواصل معك المستشار فوراً.');

  console.log(`تم إنشاء بيانات تجريبية: ${FIRST.length} عملاء + رسائل + صفقات + قاعدتي رد آلي`);
}

seed();
