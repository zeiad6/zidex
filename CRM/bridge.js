'use strict';

/** جسر المنصّة: يأخذ أحداث محرّك الأتمتة (No-Code Engine) كما تصدرها worker/bots.ts
 *  بالضبط — نفس المسار الذي يستقبل n8n وActivepieces — فيصير هذا الـCRM واجهة بصرية
 *  لذلك الجسر: العملاء والرسائل والصفقات تُبنى من الأحداث، والردود تعود عبر Bot.
 *
 *  عقد المنصّة (مصدره worker/bots.ts):
 *    صادراً إليك:  POST <cfg.workflow>  { type, bot:{id,username}, at, ...extra }
 *                  ترويسة x-zeidex-signature = التوكن المشتق للبوت
 *    راجعاً للبوت: POST /api/wf/<botId>  Authorization: Bearer <نفس التوكن>
 *                  { chat_id, text, keyboard? }
 *
 *  الربط لا يحتاج كلمة سر للبوت نفسه: صاحب المتجر يضع رابط هذا السيرفر في
 *  `/wf <url>` داخل بوت، ويصبح كل عميل وكل رسالة هنا. */

const crypto = require('node:crypto');

const { db, now, USERS_STATUSES, DEAL_STAGES } = require('./db');
const crm = require('./crm');
const bot = require('./bot');

/** متغيّرات الربط — غيابها يعني «لا جسر»، ويعمل الـCRM مستقلاً كما كان. */
const CONFIG = {
  enabled: Boolean(process.env.BRIDGE_TOKEN && process.env.BRIDGE_BOT_ID),
  token: process.env.BRIDGE_TOKEN || '',
  botId: String(process.env.BRIDGE_BOT_ID || ''),
  /** أصل المنصّة: إليه تُرسل الردود لتصدر من البوت نفسه. */
  origin: (process.env.PLATFORM_ORIGIN || 'https://zeidexsoft.com').replace(/\/+$/, ''),
  /** هل الردود تعبر المنصّة أم تخرج من توكن البوت المحلي؟ */
  viaPlatform: Boolean(process.env.BRIDGE_TOKEN && process.env.PLATFORM_ORIGIN),
};

const wfUrl = (id) => `${CONFIG.origin}/api/wf/${id}`;

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** الترويسة المُوقَّعة مطابقة للتوكن؟ المقارنة ثابتة الزمن كالعادة. */
function authorized(req) {
  if (!CONFIG.enabled) return false;
  const header = req.headers['x-zeidex-signature'] || '';
  return same(header, CONFIG.token);
}

/* ---------------- inbound: event -> CRM ---------------- */

/** حدث واحد من المنصّة. يُعيد ما جرى ليُسجَّل في الرد. */
async function applyEvent(event) {
  const type = String(event.type || '');
  const user = event.user || {};
  if (!user.id) return { ok: false, error: 'user.id required' };
  const tgId = String(user.id);
  const record = crm.upsertTelegramUser({
    id: tgId,
    first_name: user.name,
    username: user.username,
  });

  if (type === 'message') {
    const text = String(event.text || '').slice(0, 4000);
    if (text) crm.logMessage(record.id, text, 'in', 'bridge', 'text');
    // قواعد الردّ الآلي تعمل هنا أيضاً — الجسر لا يغيّر المنطق، يغيّر المصدر فقط
    const rule = crm.matchRule(text);
    if (rule) {
      await deliver(record, rule.response, 'bridge');
      return { ok: true, kind: 'message', rule: rule.id };
    }
    return { ok: true, kind: 'message' };
  }

  if (type === 'customer_new') {
    crm.logSystemMessage(record.id, `عميل جديد من بوت @${event.bot?.username || CONFIG.botId}`);
    return { ok: true, kind: 'customer_new' };
  }

  if (type === 'order') {
    // طلب مدفوع = صفقة رابحة: خط المبيعات يُبنى من الحدث لا من إدخال يدوي
    const stars = Number(event.stars) || 0;
    db.prepare('INSERT INTO deals (user_id, title, value, stage, created_at, updated_at) VALUES (?,?,?,?,?,?)')
      .run(record.id, String(event.item || 'طلب').slice(0, 120), stars, 'won', now(), now());
    crm.updateUser(record.id, { status: 'customer' }, 'system');
    crm.logSystemMessage(record.id, `طلب مدفوع: ${event.item || 'طلب'} — ⭐️ ${stars}`);
    return { ok: true, kind: 'order', stars };
  }

  return { ok: true, kind: 'ignored', type };
}

/* ---------------- outbound: reply -> platform ---------------- */

/** أرسل الرد للعميل: عبر المنصّة إن الربط مُعدّ، وإلا فمن توكن البوت المحلي.
 *  الترتيب مقصود: لو المنصّة هي صاحبة العلاقة مع العميل، فالردّ يخرج منها — نفس
 *  الحساب الذي كلّمه أول مرة، لا حساب الـCRM. */
async function deliver(user, text, source = 'dashboard') {
  if (!user) throw new Error('user not found');
  if (CONFIG.viaPlatform && user.telegram_id) {
    try {
      const res = await fetch(wfUrl(CONFIG.botId), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${CONFIG.token}`,
        },
        body: JSON.stringify({ chat_id: Number(user.telegram_id), text: String(text).slice(0, 4000) }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`platform ${res.status}`);
      crm.logMessage(user.id, text, 'out', source);
      return String(text);
    } catch (err) {
      console.error('[bridge] reply via platform failed:', err.message);
      crm.logSystemMessage(user.id, `تعذّر إرسال الرد عبر المنصّة (${err.message})`);
      return null;
    }
  }
  return bot.replyToUser(user.id, text, source);
}

/* ---------------- status for the dashboard ---------------- */

function status() {
  return {
    enabled: CONFIG.enabled,
    viaPlatform: CONFIG.viaPlatform,
    botId: CONFIG.botId || null,
    origin: CONFIG.viaPlatform ? CONFIG.origin : null,
    mode: !CONFIG.enabled ? 'local' : CONFIG.viaPlatform ? 'platform' : 'events-only',
  };
}

module.exports = { authorized, applyEvent, deliver, status, CONFIG, same };
