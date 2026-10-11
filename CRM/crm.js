'use strict';

const { db, now, USERS_STATUSES, DEAL_STAGES } = require('./db');

/** Status labels shown in the system notes — the pipeline's own words, in Arabic,
 *  so the conversation reads as a log a human wrote and not as a raw enum. */
const STATUS_LABELS = {
  new: 'جديد',
  interested: 'مهتم',
  contacted: 'تم التواصل',
  customer: 'عميل',
  lost: 'مفقود',
};
const labelStatus = (s) => STATUS_LABELS[s] || s;

/* ---------------- Users ---------------- */

function upsertTelegramUser(tgUser) {
  const ts = now();
  const existing = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(String(tgUser.id));
  if (existing) {
    db.prepare(
      `UPDATE users SET name = ?, username = ?, last_contact = ?, unread = unread + 1 WHERE id = ?`
    ).run(tgUser.first_name || tgUser.username || '', tgUser.username || '', ts, existing.id);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
  }
  const info = db
    .prepare(
      `INSERT INTO users (telegram_id, name, username, status, first_contact, last_contact, created_via, unread)
       VALUES (?,?,?,?,?,?,?,?)`
    )
    .run(String(tgUser.id), tgUser.first_name || tgUser.username || '', tgUser.username || '', 'new', ts, ts, 'telegram', 1);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

function listUsers({ q = '', status = '', limit = 50, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (q) {
    // telegram_id is searchable too: an agent gets "派单 100234" from a screenshot,
    // not a name, and the id is the only key they have.
    where.push('(u.name LIKE ? OR u.username LIKE ? OR u.phone LIKE ? OR u.telegram_id LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    where.push('u.status = ?');
    params.push(status);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT u.*,
              (SELECT text FROM messages m WHERE m.user_id = u.id ORDER BY m.id DESC LIMIT 1) AS last_message,
              (SELECT direction FROM messages m WHERE m.user_id = u.id ORDER BY m.id DESC LIMIT 1) AS last_direction,
              (SELECT COUNT(*) FROM messages m WHERE m.user_id = u.id) AS messages_count,
              (SELECT COUNT(*) FROM deals d WHERE d.user_id = u.id) AS deals_count
         FROM users u ${clause}
        ORDER BY COALESCE(u.last_contact, u.first_contact) DESC
        LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM users u ${clause}`).get(...params).n;
  return { rows, total };
}

function getUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function updateUser(id, patch, actor = 'agent') {
  const allowed = ['name', 'username', 'phone', 'status', 'notes'];
  // The previous status is read BEFORE the write: the change note compares against
  // what the customer was, not against what they just became.
  const before = getUser(id);
  const fields = [];
  const params = [];
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(patch[key]);
    }
  }
  if (!fields.length) return before || null;
  params.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  const user = getUser(id);
  if (user && before && actor === 'agent' && patch.status && patch.status !== before.status) {
    logSystemMessage(id, `تم تغيير حالة العميل من «${labelStatus(before.status)}» إلى «${labelStatus(patch.status)}»`);
  }
  return user;
}

function markRead(userId) {
  db.prepare('UPDATE messages SET read = 1 WHERE user_id = ?').run(userId);
  db.prepare('UPDATE users SET unread = 0 WHERE id = ?').run(userId);
}

/* ---------------- Messages ---------------- */

function logMessage(userId, text, direction, source = 'telegram', kind = 'text') {
  const ts = now();
  const info = db
    .prepare('INSERT INTO messages (user_id, text, direction, source, kind, ts) VALUES (?,?,?,?,?,?)')
    .run(userId, String(text), direction, source, kind, ts);
  if (direction === 'in') {
    db.prepare('UPDATE users SET last_contact = ? WHERE id = ?').run(ts, userId);
  }
  // The row just inserted — never "the newest row in the table": two chats writing at
  // once would return each other's message.
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
}

function logSystemMessage(userId, text) {
  return logMessage(userId, text, 'out', 'system', 'system');
}

function listMessages(userId, { limit = 200 } = {}) {
  return db
    .prepare('SELECT * FROM messages WHERE user_id = ? ORDER BY id ASC LIMIT ?')
    .all(userId, limit);
}

/* ---------------- Deals / Pipeline ---------------- */

function listDeals({ stage = '', userId = null } = {}) {
  if (userId) {
    return db.prepare('SELECT d.*, u.name AS user_name FROM deals d JOIN users u ON u.id = d.user_id WHERE d.user_id = ? ORDER BY d.updated_at DESC').all(userId);
  }
  if (stage) {
    return db.prepare('SELECT d.*, u.name AS user_name FROM deals d JOIN users u ON u.id = d.user_id WHERE d.stage = ? ORDER BY d.updated_at DESC').all(stage);
  }
  return db.prepare('SELECT d.*, u.name AS user_name FROM deals d JOIN users u ON u.id = d.user_id ORDER BY d.updated_at DESC').all();
}

function createDeal({ user_id, title, value = 0, stage = 'interested' }) {
  const ts = now();
  const safeStage = DEAL_STAGES.includes(stage) ? stage : 'interested';
  const info = db
    .prepare('INSERT INTO deals (user_id, title, value, stage, created_at, updated_at) VALUES (?,?,?,?,?,?)')
    .run(user_id, String(title || ''), Number(value) || 0, safeStage, ts, ts);
  return db.prepare('SELECT * FROM deals WHERE id = ?').get(info.lastInsertRowid);
}

function updateDeal(id, patch) {
  const fields = [];
  const params = [];
  if (patch.title !== undefined) { fields.push('title = ?'); params.push(String(patch.title)); }
  if (patch.value !== undefined) { fields.push('value = ?'); params.push(Number(patch.value) || 0); }
  if (patch.stage !== undefined && DEAL_STAGES.includes(patch.stage)) { fields.push('stage = ?'); params.push(patch.stage); }
  if (!fields.length) return null;
  fields.push('updated_at = ?');
  params.push(now(), id);
  db.prepare(`UPDATE deals SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return db.prepare('SELECT * FROM deals WHERE id = ?').get(id);
}

function deleteDeal(id) {
  const info = db.prepare('DELETE FROM deals WHERE id = ?').run(id);
  return info.changes > 0;
}

/* ---------------- Rules (auto-reply) ---------------- */

function listRules() {
  return db.prepare('SELECT * FROM rules ORDER BY priority DESC, id ASC').all();
}

function createRule({ keyword, response, enabled = 1, priority = 0 }) {
  if (!String(keyword || '').trim() || !String(response || '').trim()) {
    throw new Error('keyword and response are required');
  }
  const info = db
    .prepare('INSERT INTO rules (keyword, response, enabled, priority) VALUES (?,?,?,?)')
    .run(String(keyword).trim(), String(response), enabled ? 1 : 0, Number(priority) || 0);
  return db.prepare('SELECT * FROM rules WHERE id = ?').get(info.lastInsertRowid);
}

function updateRule(id, patch) {
  const fields = [];
  const params = [];
  if (patch.keyword !== undefined) { fields.push('keyword = ?'); params.push(String(patch.keyword).trim()); }
  if (patch.response !== undefined) { fields.push('response = ?'); params.push(String(patch.response)); }
  if (patch.enabled !== undefined) { fields.push('enabled = ?'); params.push(patch.enabled ? 1 : 0); }
  if (patch.priority !== undefined) { fields.push('priority = ?'); params.push(Number(patch.priority) || 0); }
  if (!fields.length) return null;
  params.push(id);
  db.prepare(`UPDATE rules SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return db.prepare('SELECT * FROM rules WHERE id = ?').get(id);
}

function deleteRule(id) {
  return db.prepare('DELETE FROM rules WHERE id = ?').run(id).changes > 0;
}

/** Normalisation for matching — the same folds the platform's Worker applies:
 *  harakat and tatweel dropped, آ/أ/إ→ا, ى→ي, ة→ه, Arabic-Indic digits folded to
 *  Latin, case lowered, punctuation collapsed. Without it "الأسعار" never matches
 *  a rule written "السعرع" and a customer typing "۱٢۳" misses a rule for "123". */
function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[\u064b-\u0652\u0670\u0640]/g, '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064a')
    .replace(/\u0629/g, '\u0647')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** One word of the rule is enough — same generous matching a customer expects
 *  from a shop bot, instead of exact substring on raw text. */
function matchRule(text) {
  const rules = db.prepare('SELECT * FROM rules WHERE enabled = 1 ORDER BY priority DESC, id ASC').all();
  const needle = norm(text);
  if (!needle) return null;
  const tokens = needle.split(' ').filter(Boolean);
  for (const rule of rules) {
    const keyword = norm(rule.keyword);
    if (!keyword) continue;
    if (needle.includes(keyword)) return rule;
    if (keyword.includes(' ') && tokens.some((t) => t.length > 2 && keyword.includes(t))) return rule;
    if (tokens.some((t) => t.length > 2 && (t.includes(keyword) || keyword.includes(t)))) return rule;
    // a token that merely STARTS with the keyword (or the reverse) still counts: the
    // customer typed "سعريه" and the rule says "سعر", or dropped the article.
    if (tokens.some((t) => t.length >= 3 && keyword.length >= 3 && (t.startsWith(keyword) || keyword.startsWith(t)))) return rule;
  }
  return null;
}

/* ---------------- Stats ---------------- */

function stats(rangeDays = 14) {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const totals = db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM users WHERE first_contact >= ?) AS new_this_week,
       (SELECT COUNT(*) FROM messages) AS total_messages,
       (SELECT COUNT(*) FROM messages WHERE ts LIKE ?) AS messages_today,
       (SELECT COUNT(*) FROM messages WHERE direction = 'in' AND read = 0) AS unread_messages,
       (SELECT COUNT(*) FROM users WHERE status = 'customer') AS customers
     `
  ).get(weekAgo, `${today}%`);

  const messagesPerDay = db
    .prepare(
      `SELECT substr(ts, 1, 10) AS day,
              SUM(CASE WHEN direction = 'in' THEN 1 ELSE 0 END)  AS incoming,
              SUM(CASE WHEN direction = 'out' THEN 1 ELSE 0 END) AS outgoing
         FROM messages
        WHERE ts >= ?
        GROUP BY day
        ORDER BY day ASC`
    )
    .all(new Date(Date.now() - (rangeDays - 1) * 86400000).toISOString());

  const usersPerDay = db
    .prepare(
      `SELECT substr(first_contact, 1, 10) AS day, COUNT(*) AS count
         FROM users
        WHERE first_contact >= ?
        GROUP BY day
        ORDER BY day ASC`
    )
    .all(new Date(Date.now() - (rangeDays - 1) * 86400000).toISOString());

  const byStatus = db.prepare('SELECT status, COUNT(*) AS count FROM users GROUP BY status').all();
  const dealsByStage = db.prepare('SELECT stage, COUNT(*) AS count, COALESCE(SUM(value),0) AS value FROM deals GROUP BY stage').all();
  const topUsers = db
    .prepare(
      `SELECT u.id, u.name, u.username, COUNT(m.id) AS messages
         FROM users u JOIN messages m ON m.user_id = u.id
        GROUP BY u.id
        ORDER BY messages DESC
        LIMIT 5`
    )
    .all();

  const dealValue = db.prepare("SELECT COALESCE(SUM(value),0) AS won FROM deals WHERE stage = 'won'").get().won;

  return { totals, messagesPerDay, usersPerDay, byStatus, dealsByStage, topUsers, dealValue, rangeDays };
}

module.exports = {
  norm,
  upsertTelegramUser,
  listUsers,
  getUser,
  updateUser,
  markRead,
  logMessage,
  logSystemMessage,
  listMessages,
  listDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  matchRule,
  stats,
};
