'use strict';

/* ================= State ================= */
const state = {
  token: localStorage.getItem('crm_token') || '',
  agent: JSON.parse(localStorage.getItem('crm_agent') || 'null'),
  view: 'dashboard',
  users: [],
  selectedUserId: null,
  selectedUser: null,
  deals: [],
  rules: [],
  agents: [],
  statusFilter: '',
  search: '',
  refreshTimer: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ================= API ================= */
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 && !path.includes('/login')) {
    logout(false);
    throw new Error('انتهت الجلسة');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `خطأ ${res.status}`);
  return data;
}

function toast(msg, isError = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast${isError ? ' error' : ''}`;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 2600);
}

/* ================= Auth ================= */
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: $('#login-username').value.trim(),
        password: $('#login-password').value,
      }),
    });
    state.token = data.token;
    state.agent = data.agent;
    localStorage.setItem('crm_token', data.token);
    localStorage.setItem('crm_agent', JSON.stringify(data.agent));
    $('#login-error').textContent = '';
    boot();
  } catch (err) {
    $('#login-error').textContent = err.message;
  }
});

function logout(callApi = true) {
  if (callApi && state.token) api('/api/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_agent');
  state.token = '';
  state.agent = null;
  $('#app').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
}

$('#logout-btn').addEventListener('click', () => logout());
$('#export-btn').addEventListener('click', () => exportUsers());

/* ================= Boot ================= */
async function boot() {
  $('#login-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#sidebar-user').textContent = `${state.agent.username} (${state.agent.role})`;
  $('#nav-team').classList.toggle('hidden', state.agent.role !== 'admin');
  connectSSE();
  refreshAll();
  clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(refreshAll, 20000);
}

function connectSSE() {
  const es = new EventSource(`/api/events?token=${encodeURIComponent(state.token)}`);
  es.onopen = () => $('#live-dot').classList.add('on');
  es.onerror = () => $('#live-dot').classList.remove('on');
  es.addEventListener('message', () => loadUnreadBadge());
  es.addEventListener('user', () => refreshAll());
  es.addEventListener('deal', () => { if (state.view === 'pipeline') loadDeals(); });
}

/* ================= Views ================= */
$$('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.view = btn.dataset.view;
    $$('.view').forEach((v) => v.classList.add('hidden'));
    $(`#view-${state.view}`).classList.remove('hidden');
    const titles = { dashboard: 'لوحة المعلومات', customers: 'العملاء', pipeline: 'خط المبيعات', automation: 'الأتمتة', team: 'الفريق' };
    $('#view-title').textContent = titles[state.view] || '';
    if (state.view === 'dashboard') loadStats();
    if (state.view === 'customers') loadUsers();
    if (state.view === 'pipeline') loadDeals();
    if (state.view === 'automation') loadRules();
    if (state.view === 'team') loadAgents();
  });
});

/* ================= Stats ================= */
async function loadStats() {
  try {
    const s = await api('/api/stats');
    const t = s.totals;
    const cards = [
      { icon: '👥', value: t.total_users, label: 'إجمالي العملاء' },
      { icon: '🆕', value: t.new_this_week, label: 'جدد هذا الأسبوع' },
      { icon: '💬', value: t.messages_today, label: 'رسائل اليوم' },
      { icon: '📩', value: t.unread_messages, label: 'رسائل غير مقروءة' },
      { icon: '✅', value: t.customers, label: 'عملاء مؤكَّدون' },
      { icon: '💵', value: `${t.wonValue || s.dealValue || 0} ر.س`, label: 'قيمة المبيعات' },
    ];
    $('#stat-cards').innerHTML = cards.map((c) => `
      <div class="stat-card">
        <div class="stat-icon">${c.icon}</div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join('');

    drawBarChart($('#chart-messages'),
      fillDays(s.messagesPerDay, s.rangeDays),
      [{ key: 'incoming', color: '#3b82f6', label: 'واردة' }, { key: 'outgoing', color: '#22c55e', label: 'صادرة' }]);

    drawBarChart($('#chart-users'),
      fillDays(s.usersPerDay, s.rangeDays).map((d) => ({ day: d.day, count: d.count })),
      [{ key: 'count', color: '#a855f7', label: 'عملاء جدد' }]);

    const stageNames = { interested: 'مهتم', contacted: 'تم التواصل', won: 'تم البيع', lost: 'مفقود' };
    const stageColors = { interested: '#eab308', contacted: '#3b82f6', won: '#22c55e', lost: '#ef4444' };
    const max = Math.max(1, ...s.dealsByStage.map((d) => d.count));
    $('#funnel').innerHTML = ['interested', 'contacted', 'won', 'lost'].map((st) => {
      const row = s.dealsByStage.find((d) => d.stage === st) || { count: 0, value: 0 };
      const pct = Math.round((row.count / max) * 100);
      return `<div class="funnel-row">
        <span class="funnel-label">${stageNames[st] || st}</span>
        <div class="funnel-bar-wrap"><div class="funnel-bar" style="width:${pct}%;background:${stageColors[st]}"></div></div>
        <span class="funnel-value">${row.count}</span>
      </div>`;
    }).join('');

    $('#top-users').innerHTML = s.topUsers.length
      ? s.topUsers.map((u) => `<li><span>${esc(u.name || u.username || `ID:${u.id}`)}</span><span class="count">${u.messages} رسالة</span></li>`).join('')
      : '<li class="muted">لا توجد بيانات بعد</li>';
  } catch (err) {
    toast(err.message, true);
  }
}

function fillDays(rows, days) {
  const out = [];
  const map = new Map(rows.map((r) => [r.day, r]));
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const row = map.get(day) || {};
    out.push({ day, incoming: Number(row.incoming) || 0, outgoing: Number(row.outgoing) || 0, count: Number(row.count) || 0 });
  }
  return out;
}

function drawBarChart(canvas, days, series) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 400;
  const h = 220;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const padL = 30, padB = 24, padT = 10;
  const chartW = w - padL - 8;
  const chartH = h - padB - padT;
  const max = Math.max(1, ...days.flatMap((d) => series.map((s) => d[s.key] || 0)));

  ctx.strokeStyle = '#2a3554';
  ctx.fillStyle = '#8b96b3';
  ctx.font = '10px sans-serif';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (chartH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - 8, y);
    ctx.stroke();
    ctx.fillText(String(Math.round((max * i) / 4)), 4, y + 3);
  }

  const slot = chartW / days.length;
  const barW = Math.max(2, Math.min(14, slot / (series.length + 1)));
  days.forEach((d, i) => {
    series.forEach((s, j) => {
      const v = d[s.key] || 0;
      const bh = (v / max) * chartH;
      const x = padL + slot * i + (slot - barW * series.length) / 2 + j * barW;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.roundRect(x, padT + chartH - bh, barW - 1, Math.max(bh, v > 0 ? 2 : 0), 2);
      ctx.fill();
    });
    ctx.fillStyle = '#8b96b3';
    ctx.fillText(d.day.slice(5), padL + slot * i + 2, h - 6);
  });

  /* legend */
  let lx = padL;
  series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, 2, 8, 8);
    ctx.fillStyle = '#8b96b3';
    ctx.fillText(s.label, lx + 11, 9);
    lx += 11 + ctx.measureText(s.label).width + 14;
  });
}

/* ================= Users ================= */
async function loadUsers() {
  try {
    const params = new URLSearchParams();
    if (state.statusFilter) params.set('status', state.statusFilter);
    if (state.search) params.set('q', state.search);
    params.set('limit', '100');
    const data = await api(`/api/users?${params}`);
    state.users = data.rows;
    renderUsersList();
    if (state.selectedUserId) selectUser(state.selectedUserId, true);
  } catch (err) {
    toast(err.message, true);
  }
}

function renderUsersList() {
  const el = $('#users-list');
  if (!state.users.length) {
    el.innerHTML = '<p class="empty">لا يوجد عملاء</p>';
    return;
  }
  el.innerHTML = state.users.map((u) => {
    const last = u.last_message || '';
    const arrow = u.last_direction === 'in' ? '↙' : '↗';
    return `<div class="user-row${u.id === state.selectedUserId ? ' active' : ''}" data-id="${u.id}">
      <div class="avatar">${esc((u.name || '?').trim().charAt(0))}</div>
      <div class="info">
        <div class="name">${esc(u.name || u.username || 'بدون اسم')}</div>
        <div class="preview">${arrow} ${esc(last.slice(0, 40))}</div>
      </div>
      <div class="meta">
        <div class="time">${fmtTime(u.last_contact || u.first_contact)}</div>
        ${u.unread ? `<span class="unread-dot">${u.unread}</span>` : ''}
      </div>
    </div>`;
  }).join('');
  $$('.user-row').forEach((row) => {
    row.addEventListener('click', () => selectUser(Number(row.dataset.id)));
  });
}

async function selectUser(id, keepList = false) {
  state.selectedUserId = id;
  if (!keepList) renderUsersList();
  try {
    const data = await api(`/api/users/${id}`);
    state.selectedUser = data;
    renderUserDetail(data);
    loadUnreadBadge();
  } catch (err) {
    if (err.message !== 'user not found') toast(err.message, true);
  }
}

function renderUserDetail({ user, messages, deals }) {
  const statuses = {
    new: 'جديد', interested: 'مهتم', contacted: 'تم التواصل',
    customer: 'عميل', lost: 'مفقود',
  };
  $('#user-detail').innerHTML = `
    <div class="detail-header">
      <div class="avatar">${esc((user.name || '?').charAt(0))}</div>
      <div class="info">
        <div class="name">${esc(user.name || user.username || 'بدون اسم')}</div>
        <div class="sub">${user.username ? '@' + esc(user.username) + ' · ' : ''}${user.telegram_id ? 'TG ID: ' + esc(user.telegram_id) : 'عميل يدوي'} · منذ ${fmtTime(user.first_contact)}</div>
      </div>
      <select class="status-pill status-${user.status}" id="status-select">
        ${Object.entries(statuses).map(([v, l]) => `<option value="${v}"${v === user.status ? ' selected' : ''}>${l}</option>`).join('')}
      </select>
      <button class="btn btn-sm btn-ghost" id="save-notes">💾 ملاحظة</button>
    </div>
    <div class="chat" id="chat">
      ${messages.length ? messages.map(chatBubble).join('') : '<p class="chat-empty">لا توجد رسائل بعد — اكتب أول رد بالأسفل</p>'}
    </div>
    <form class="reply-bar" id="reply-form">
      <input type="text" id="reply-input" placeholder="اكتب رداً... (يُرسل عبر تليجرام)" autocomplete="off">
      <button type="submit" class="btn btn-primary">إرسال</button>
    </form>`;

  const statusSel = $('#status-select');
  statusSel.addEventListener('change', async () => {
    try {
      await api(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusSel.value }),
      });
      toast(`تم تحديث الحالة إلى: ${statuses[statusSel.value]}`);
      loadUsers();
    } catch (err) { toast(err.message, true); }
  });

  $('#save-notes').addEventListener('click', async () => {
    try {
      await api(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: $('#notes-input') ? $('#notes-input').value : user.notes }),
      });
      toast('تم حفظ الملاحظة');
    } catch (err) { toast(err.message, true); }
  });

  $('#reply-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#reply-input');
    const text = input.value.trim();
    if (!text) return;
    try {
      await api(`/api/users/${user.id}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
      input.value = '';
      selectUser(user.id, true);
    } catch (err) { toast(err.message, true); }
  });

  const chat = $('#chat');
  chat.scrollTop = chat.scrollHeight;
}

function chatBubble(m) {
  const cls = m.kind === 'system' ? 'system' : m.direction === 'in' ? 'in' : 'out';
  return `<div class="msg ${cls}">${esc(m.text)}<span class="ts">${fmtTime(m.ts, true)}</span></div>`;
}

$('#filter-status').addEventListener('change', (e) => {
  state.statusFilter = e.target.value;
  loadUsers();
});

$('#global-search').addEventListener('input', (e) => {
  state.search = e.target.value.trim();
  clearTimeout(state._searchT);
  state._searchT = setTimeout(() => {
    if (state.view === 'customers') loadUsers();
    else {
      $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === 'customers'));
      state.view = 'customers';
      $$('.view').forEach((v) => v.classList.add('hidden'));
      $('#view-customers').classList.remove('hidden');
      $('#view-title').textContent = 'العملاء';
      loadUsers();
    }
  }, 400);
});

/* ================= Pipeline ================= */
async function loadDeals() {
  try {
    state.deals = await api('/api/deals');
    renderBoard();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderBoard() {
  const stages = {
    interested: { label: 'مهتم', color: '#eab308' },
    contacted: { label: 'تم التواصل', color: '#3b82f6' },
    won: { label: 'تم البيع', color: '#22c55e' },
    lost: { label: 'مفقود', color: '#ef4444' },
  };
  $('#board').innerHTML = Object.entries(stages).map(([st, meta]) => {
    const deals = state.deals.filter((d) => d.stage === st);
    const total = deals.reduce((s, d) => s + d.value, 0);
    return `<div class="board-col">
      <h4><span style="color:${meta.color}">● ${meta.label}</span><span class="col-count">${deals.length} · ${total}</span></h4>
      ${deals.map((d) => `
        <div class="deal-card">
          <div class="title">${esc(d.title || 'صفقة')}</div>
          <div class="who">${esc(d.user_name || '')}</div>
          <div class="value">${d.value}</div>
          <div class="deal-actions">
            ${Object.keys(stages).filter((s) => s !== st).map((s) => `<button data-id="${d.id}" data-stage="${s}">→ ${stages[s].label}</button>`).join('')}
            <button data-del="${d.id}">🗑</button>
          </div>
        </div>`).join('')}
      <button class="board-add" data-stage-add="${st}">+ إضافة صفقة</button>
    </div>`;
  }).join('');

  $$('.deal-actions [data-stage]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api(`/api/deals/${btn.dataset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ stage: btn.dataset.stage }),
        });
        loadDeals();
      } catch (err) { toast(err.message, true); }
    });
  });
  $$('.deal-actions [data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api(`/api/deals/${btn.dataset.del}`, { method: 'DELETE' });
        loadDeals();
      } catch (err) { toast(err.message, true); }
    });
  });
  $$('.board-add').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const user = state.users.length
        ? state.users[0]
        : (await api('/api/users')).rows[0];
      if (!user) return toast('أضف عميلاً أولاً', true);
      const title = prompt('عنوان الصفقة:');
      if (!title) return;
      const value = Number(prompt('القيمة:', '0')) || 0;
      try {
        await api('/api/deals', {
          method: 'POST',
          body: JSON.stringify({ user_id: user.id, title, value, stage: btn.dataset.stageAdd }),
        });
        loadDeals();
      } catch (err) { toast(err.message, true); }
    });
  });
}

/* ================= Rules ================= */
async function loadRules() {
  try {
    state.rules = await api('/api/rules');
    renderRules();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderRules() {
  const el = $('#rules-list');
  if (!state.rules.length) {
    el.innerHTML = '<p class="empty">لا توجد قواعد — أضف قاعدة مثل: "السعر" → بطاقة الأسعار</p>';
    return;
  }
  el.innerHTML = state.rules.map((r) => `
    <div class="rule-item">
      <div class="kw">«${esc(r.keyword)}»</div>
      <div class="resp">${esc(r.response)}</div>
      <div class="row">
        <button class="btn btn-sm ${r.enabled ? 'btn-primary' : 'btn-ghost'}" data-toggle="${r.id}">${r.enabled ? 'مُفعّلة' : 'موقوفة'}</button>
        <button class="btn btn-sm btn-danger" data-del-rule="${r.id}">حذف</button>
      </div>
    </div>`).join('');
  $$('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const rule = state.rules.find((r) => r.id === Number(btn.dataset.toggle));
      try {
        await api(`/api/rules/${rule.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: rule.enabled ? 0 : 1 }) });
        loadRules();
      } catch (err) { toast(err.message, true); }
    });
  });
  $$('[data-del-rule]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api(`/api/rules/${btn.dataset.delRule}`, { method: 'DELETE' });
        loadRules();
      } catch (err) { toast(err.message, true); }
    });
  });
}

$('#rule-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/rules', {
      method: 'POST',
      body: JSON.stringify({
        keyword: $('#rule-keyword').value,
        response: $('#rule-response').value,
      }),
    });
    $('#rule-keyword').value = '';
    $('#rule-response').value = '';
    toast('تمت إضافة القاعدة');
    loadRules();
  } catch (err) { toast(err.message, true); }
});

/* ================= Team ================= */
async function loadAgents() {
  try {
    state.agents = await api('/api/agents');
    renderAgents();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderAgents() {
  const el = $('#agents-list');
  if (!state.agents.length) {
    el.innerHTML = '<p class="empty">لا يوجد أعضاء</p>';
    return;
  }
  el.innerHTML = state.agents.map((a) => `
    <div class="rule-item">
      <div class="row" style="justify-content:space-between">
        <strong>${esc(a.username)}</strong>
        <span class="status-pill status-${a.role === 'admin' ? 'customer' : 'contacted'}">${a.role === 'admin' ? 'مدير' : 'مسؤول'}</span>
      </div>
      <div class="resp muted">أُنشئ في ${fmtTime(a.created_at)}</div>
      ${a.id !== state.agent.id ? `<button class="btn btn-sm btn-danger" data-del-agent="${a.id}">حذف</button>` : ''}
    </div>`).join('');
  $$('[data-del-agent]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('حذف هذا العضو؟')) return;
      try {
        await api(`/api/agents/${btn.dataset.delAgent}`, { method: 'DELETE' });
        loadAgents();
      } catch (err) { toast(err.message, true); }
    });
  });
}

$('#agent-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/agents', {
      method: 'POST',
      body: JSON.stringify({
        username: $('#agent-username').value,
        password: $('#agent-password').value,
        role: $('#agent-role').value,
      }),
    });
    $('#agent-username').value = '';
    $('#agent-password').value = '';
    toast('تمت إضافة العضو');
    loadAgents();
  } catch (err) { toast(err.message, true); }
});

/* ================= Misc ================= */
async function loadUnreadBadge() {
  try {
    const data = await api('/api/users?limit=200');
    const unread = data.rows.filter((u) => u.unread > 0).length;
    const badge = $('#nav-unread');
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  } catch { /* session expired */ }
}

async function loadBridgeState() {
  try {
    const info = await api('/api/bot');
    const el = $('#bridge-state');
    const b = info.bridge || {};
    if (!b.enabled) { el.textContent = 'محلي'; el.className = 'bridge-state local'; el.title = 'لا جسر: هذا الـCRM يستقبل من توكن بوت خاص'; return; }
    if (b.viaPlatform) { el.textContent = `جسر المنصّة ⚡`; el.className = 'bridge-state platform'; el.title = `الأحداث والردود عبر المنصّة (بوت ${b.botId})`; return; }
    el.textContent = 'أحداث فقط'; el.className = 'bridge-state events'; el.title = 'الأحداث تُستقبل، والردود تخرج من توكن البوت المحلي';
  } catch { /* ignore */ }
}

async function exportUsers() {
  try {
    // نص خام لا JSON: api() يحلّل الجسم، وهذا الملف ليس كائناً
    const res = await fetch('/api/export/users.csv', { headers: { Authorization: `Bearer ${state.token}` } });
    if (!res.ok) throw new Error('export failed');
    const raw = await res.text();
    const blob = new Blob([raw], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'crm-users.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('تم التصدير');
  } catch (e) {
    toast('تعذّر التصدير', true);
  }
}

async function loadBotStatus() {
  try {
    const info = await api('/api/bot');
    const el = $('#bot-status');
    if (info.enabled) {
      el.textContent = `البوت: ${info.me && info.me.username ? '@' + info.me.username : 'متصل'} (${info.mode})`;
      el.classList.add('ok');
    } else {
      el.textContent = 'البوت غير مُعدّ — وضع محلي';
    }
  } catch { /* ignore */ }
}

async function refreshAll() {
  if (!state.token) return;
  loadUnreadBadge();
  loadBotStatus();
  loadBridgeState();
  if (state.view === 'dashboard') loadStats();
  if (state.view === 'customers') loadUsers();
  if (state.view === 'pipeline') loadDeals();
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtTime(iso, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const date = d.toLocaleDateString('ar-SA-u-nu-latn', { day: 'numeric', month: 'short' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/* ================= Init ================= */
if (state.token && state.agent) boot();
