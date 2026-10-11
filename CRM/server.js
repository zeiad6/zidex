'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const { db, now, ensureAdmin, hashPassword, verifyPassword } = require('./db');
const crm = require('./crm');
const bot = require('./bot');
const bridge = require('./bridge');
const events = require('./events');

const PORT = Number(process.env.PORT || 8787);
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_DAYS = 7;
const MAX_BODY = 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/* ---------- sessions ---------- */

/** Login pacing, in memory on purpose: the CRM runs as one process, and a throttle
 *  that needs a DB round-trip on every attempt is a throttle that can be slowed down
 *  by the very traffic it is there to stop. Five tries a minute per ip+username,
 *  and a success clears the slate. */
const loginThrottle = (() => {
  const hits = new Map();
  const WINDOW_MS = 60_000;
  const MAX_TRIES = 5;
  const sweep = () => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, at] of hits) if (at < cutoff) hits.delete(key);
  };
  setInterval(sweep, WINDOW_MS).unref();
  return {
    isLimited(key) {
      const at = hits.get(key) || 0;
      return at >= MAX_TRIES;
    },
    fail(key) {
      hits.set(key, (hits.get(key) || 0) + 1);
    },
    pass(key) {
      hits.delete(key);
    },
  };
})();

function createSession(agentId) {
  const token = crypto.randomBytes(32).toString('hex');
  const ts = now();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  db.prepare('INSERT INTO sessions (token, agent_id, created_at, expires_at) VALUES (?,?,?,?)')
    .run(token, agentId, ts, expires);
  return token;
}

function authFromReq(req) {
  const header = req.headers.authorization || '';
  let token = '';
  if (header.startsWith('Bearer ')) token = header.slice(7);
  if (!token) {
    const url = new URL(req.url, 'http://localhost');
    token = url.searchParams.get('token') || '';
  }
  if (!token) return null;
  const row = db
    .prepare('SELECT a.id, a.username, a.role, s.expires_at FROM sessions s JOIN agents a ON a.id = s.agent_id WHERE s.token = ?')
    .get(token);
  if (!row) return null;
  if (row.expires_at < now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { id: row.id, username: row.username, role: row.role, token };
}

function requireAuth(req, res, adminOnly = false) {
  const agent = authFromReq(req);
  if (!agent) {
    sendJson(res, 401, { error: 'unauthorized' });
    return null;
  }
  if (adminOnly && agent.role !== 'admin') {
    sendJson(res, 403, { error: 'admin only' });
    return null;
  }
  return agent;
}

/* ---------- helpers ---------- */

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, decodeURIComponent(pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('forbidden');
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  });
}

/* ---------- router ---------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method = req.method || 'GET';

  try {
    if (pathname.startsWith('/api/')) {
      return await handleApi(req, res, method, pathname, url);
    }
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405);
      return res.end('method not allowed');
    }
    return serveStatic(req, res, pathname);
  } catch (err) {
    console.error('[server]', err);
    if (!res.headersSent) sendJson(res, 500, { error: err.message || 'internal error' });
  }
});

async function handleApi(req, res, method, pathname, url) {
  /* public endpoints */
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, { ok: true, ts: now(), botConfigured: Boolean(process.env.BOT_TOKEN) });
  }
  if (pathname === '/api/login' && method === 'POST') {
    const body = await readBody(req);
    // A login is the one unauthenticated door, so it is the one that gets paced:
    // scrypt is deliberately slow, but an open door is still an open door.
    const key = `${req.socket.remoteAddress || 'ip'}|${String(body.username || '').toLowerCase()}`;
    if (loginThrottle.isLimited(key)) {
      return sendJson(res, 429, { error: 'محاولات كثيرة — انتظر دقيقة ثم أعد المحاولة' });
    }
    const row = db.prepare('SELECT * FROM agents WHERE username = ?').get(String(body.username || ''));
    const { verifyPassword } = require('./db');
    if (!row || !verifyPassword(body.password || '', row.password_hash)) {
      loginThrottle.fail(key);
      return sendJson(res, 401, { error: 'بيانات الدخول غير صحيحة' });
    }
    loginThrottle.pass(key);
    const token = createSession(row.id);
    return sendJson(res, 200, { token, agent: { id: row.id, username: row.username, role: row.role } });
  }
  if (pathname === '/api/telegram/webhook' && method === 'POST') {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
    if (secret && !bridge.same(req.headers['x-telegram-bot-api-secret-token'] || '', secret)) {
      return sendJson(res, 403, { error: 'bad secret' });
    }
    const update = await readBody(req);
    await bot.handleUpdate(update);
    return sendJson(res, 200, { ok: true });
  }
  /* جسر المنصّة: نفس أحداث محرّك الأتمتة (n8n/Activepieces) تصغر إلى CRM مرئي.
     التوقيع هو التوكن المشتق للبوت — بلا كلمة سر للبوت، وبلا قراءة قاعدة قبل التحقق. */
  if (pathname === '/api/bridge' && method === 'POST') {
    if (!bridge.authorized(req)) return sendJson(res, bridge.CONFIG.enabled ? 403 : 503, { error: bridge.CONFIG.enabled ? 'forbidden' : 'bridge disabled' });
    const event = await readBody(req);
    const result = await bridge.applyEvent(event);
    events.publish('message', { bridge: true });
    return sendJson(res, 200, result);
  }

  /* everything below needs auth */
  const agent = requireAuth(req, res);
  if (!agent) return;

  if (pathname === '/api/logout' && method === 'POST') {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(agent.token);
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/me' && method === 'GET') {
    return sendJson(res, 200, { agent });
  }
  if (pathname === '/api/me/password' && method === 'POST') {
    const body = await readBody(req);
    const current = String(body.current || '');
    const next = String(body.next || '');
    if (next.length < 8) return sendJson(res, 400, { error: 'كلمة المرور الجديدة 8 أحرف على الأقل' });
    const row = db.prepare('SELECT password_hash FROM agents WHERE id = ?').get(agent.id);
    if (!verifyPassword(current, row.password_hash)) return sendJson(res, 403, { error: 'كلمة المرور الحالية غير صحيحة' });
    db.prepare('UPDATE agents SET password_hash = ? WHERE id = ?').run(hashPassword(next), agent.id);
    // Every other session for this agent dies with the old password
    db.prepare('DELETE FROM sessions WHERE agent_id = ? AND token != ?').run(agent.id, agent.token);
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const unsubscribe = events.subscribe(res);
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { /* closed */ }
    }, 25000);
    req.on('close', () => {
      clearInterval(ping);
      unsubscribe();
    });
    return;
  }

  if (pathname === '/api/stats' && method === 'GET') {
    const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 14, 1), 90);
    return sendJson(res, 200, crm.stats(days));
  }

  if (pathname === '/api/bot' && method === 'GET') {
    return sendJson(res, 200, { ...(await bot.info()), bridge: bridge.status() });
  }

  /* users */
  if (pathname === '/api/users' && method === 'GET') {
    const q = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status') || '';
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
    const offset = Number(url.searchParams.get('offset')) || 0;
    return sendJson(res, 200, crm.listUsers({ q, status, limit, offset }));
  }

  if (pathname === '/api/users' && method === 'POST') {
    const body = await readBody(req);
    const tgId = String(body.telegram_id || '').trim();
    if (!tgId) return sendJson(res, 400, { error: 'telegram_id is required' });
    const ts = now();
    const info = db
      .prepare('INSERT INTO users (telegram_id, name, username, phone, status, first_contact, last_contact, created_via) VALUES (?,?,?,?,?,?,?,?)')
      .run(tgId, String(body.name || ''), String(body.username || ''), String(body.phone || ''),
        crmUserStatus(body.status), ts, ts, 'manual');
    return sendJson(res, 201, crm.getUser(info.lastInsertRowid));
  }

  const userMatch = pathname.match(/^\/api\/users\/(\d+)(\/read|\/messages)?$/);
  if (userMatch) {
    const id = Number(userMatch[1]);
    const sub = userMatch[2];
    if (!sub && method === 'GET') {
      const user = crm.getUser(id);
      if (!user) return sendJson(res, 404, { error: 'user not found' });
      crm.markRead(id);
      return sendJson(res, 200, { user, messages: crm.listMessages(id), deals: crm.listDeals({ userId: id }) });
    }
    if (!sub && method === 'PATCH') {
      const body = await readBody(req);
      const user = crm.updateUser(id, sanitizeUserPatch(body));
      if (!user) return sendJson(res, 404, { error: 'user not found' });
      events.publish('user', { id });
      return sendJson(res, 200, user);
    }
    if (!sub && method === 'DELETE') {
      if (agent.role !== 'admin') return sendJson(res, 403, { error: 'admin only' });
      const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return sendJson(res, 200, { ok: info.changes > 0 });
    }
    if (sub === '/read' && method === 'POST') {
      crm.markRead(id);
      events.publish('user', { id });
      return sendJson(res, 200, { ok: true });
    }
    if (sub === '/messages' && method === 'GET') {
      return sendJson(res, 200, crm.listMessages(id));
    }
    if (sub === '/messages' && method === 'POST') {
      const body = await readBody(req);
      const text = String(body.text || '').trim();
      if (!text) return sendJson(res, 400, { error: 'text is required' });
      const user = crm.getUser(id);
      if (!user) return sendJson(res, 404, { error: 'user not found' });
      // الجسر أولاً: الردّ يخرج من البوت الذي كلّمه العميل، لا من حساب آخر
      const sent = await bridge.deliver(user, text);
      return sendJson(res, sent ? 201 : 502, { ok: Boolean(sent), sent: Boolean(sent) });
    }
  }

  /* deals */
  if (pathname === '/api/deals' && method === 'GET') {
    return sendJson(res, 200, crm.listDeals({ stage: url.searchParams.get('stage') || '' }));
  }
  if (pathname === '/api/deals' && method === 'POST') {
    const body = await readBody(req);
    if (!body.user_id) return sendJson(res, 400, { error: 'user_id is required' });
    if (!crm.getUser(body.user_id)) return sendJson(res, 400, { error: 'user not found' });
    const deal = crm.createDeal(body);
    events.publish('deal', deal);
    return sendJson(res, 201, deal);
  }

  const dealMatch = pathname.match(/^\/api\/deals\/(\d+)$/);
  if (dealMatch && (method === 'PATCH' || method === 'DELETE')) {
    const id = Number(dealMatch[1]);
    if (method === 'PATCH') {
      const body = await readBody(req);
      const deal = crm.updateDeal(id, body);
      if (!deal) return sendJson(res, 404, { error: 'deal not found' });
      events.publish('deal', deal);
      return sendJson(res, 200, deal);
    }
    const ok = crm.deleteDeal(id);
    events.publish('deal', { id, deleted: true });
    return sendJson(res, 200, { ok });
  }

  /* rules */
  if (pathname === '/api/rules' && method === 'GET') {
    return sendJson(res, 200, crm.listRules());
  }
  if (pathname === '/api/rules' && method === 'POST') {
    const body = await readBody(req);
    const rule = crm.createRule(body);
    events.publish('rule', rule);
    return sendJson(res, 201, rule);
  }
  const ruleMatch = pathname.match(/^\/api\/rules\/(\d+)$/);
  if (ruleMatch && (method === 'PATCH' || method === 'DELETE')) {
    const id = Number(ruleMatch[1]);
    if (method === 'PATCH') {
      const body = await readBody(req);
      const rule = crm.updateRule(id, body);
      if (!rule) return sendJson(res, 404, { error: 'rule not found' });
      return sendJson(res, 200, rule);
    }
    const ok = crm.deleteRule(id);
    events.publish('rule', { id, deleted: true });
    return sendJson(res, 200, { ok });
  }

  /* export — the CRM's data belongs to its owner, so it must be liftable */
  if (pathname === '/api/export/users.csv' && method === 'GET') {
    const rows = db
      .prepare(
        `SELECT u.*, (SELECT COUNT(*) FROM messages m WHERE m.user_id = u.id) AS messages
           FROM users u ORDER BY u.id`
      )
      .all();
    const head = ['id', 'telegram_id', 'name', 'username', 'phone', 'status', 'notes', 'unread', 'first_contact', 'last_contact', 'messages'];
    const csv = [head.join(',')]
      .concat(
        rows.map((r) =>
          head
            .map((k) => {
              const v = r[k] == null ? '' : String(r[k]);
              return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
            })
            .join(','),
        ),
      )
      .join('\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="crm-users.csv"',
      'Cache-Control': 'no-store',
    });
    return res.end('\uFEFF' + csv);
  }

  /* agents (admin) */
  if (pathname === '/api/agents' && method === 'GET') {
    if (agent.role !== 'admin') return sendJson(res, 403, { error: 'admin only' });
    const rows = db.prepare('SELECT id, username, role, created_at FROM agents ORDER BY id').all();
    return sendJson(res, 200, rows);
  }
  if (pathname === '/api/agents' && method === 'POST') {
    if (agent.role !== 'admin') return sendJson(res, 403, { error: 'admin only' });
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!username || password.length < 6) return sendJson(res, 400, { error: 'username required, password min 6 chars' });
    const exists = db.prepare('SELECT id FROM agents WHERE username = ?').get(username);
    if (exists) return sendJson(res, 409, { error: 'username taken' });
    const info = db
      .prepare('INSERT INTO agents (username, password_hash, role, created_at) VALUES (?,?,?,?)')
      .run(username, hashPassword(password), body.role === 'admin' ? 'admin' : 'agent', now());
    return sendJson(res, 201, db.prepare('SELECT id, username, role, created_at FROM agents WHERE id = ?').get(info.lastInsertRowid));
  }
  const agentMatch = pathname.match(/^\/api\/agents\/(\d+)$/);
  if (agentMatch && method === 'DELETE') {
    if (agent.role !== 'admin') return sendJson(res, 403, { error: 'admin only' });
    const id = Number(agentMatch[1]);
    if (id === agent.id) return sendJson(res, 400, { error: 'cannot delete yourself' });
    db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { error: 'endpoint not found' });
}

function crmUserStatus(status) {
  const { USERS_STATUSES } = require('./db');
  return USERS_STATUSES.includes(status) ? status : 'new';
}

function sanitizeUserPatch(body) {
  const patch = {};
  for (const key of ['name', 'username', 'phone', 'status', 'notes']) {
    if (body[key] !== undefined) {
      patch[key] = key === 'status' ? crmUserStatus(body.status) : String(body[key]).slice(0, 5000);
    }
  }
  return patch;
}

ensureAdmin();
bot.start();
server.listen(PORT, () => {
  console.log(`[crm] dashboard: http://localhost:${PORT}`);
  console.log(`[crm] db: ${process.env.DB_PATH || path.join(__dirname, 'crm.db')}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`\n[crm] ${sig} — shutting down`);
    bot.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500);
  });
}

module.exports = server;
