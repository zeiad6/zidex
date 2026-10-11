'use strict';

const { db, getSetting, setSetting } = require('./db');
const crm = require('./crm');

const API = 'https://api.telegram.org';
const TOKEN = process.env.BOT_TOKEN || '';
const MODE = process.env.BOT_MODE || (TOKEN ? 'poll' : 'off');
/** The one canned answer, in one place — before it, /help's text lived inline and
 *  drifted from what the dashboard's rules could say. */
const HELP_TEXT = 'اكتب رسالتك وسيتواصل معك أحد ممثلي الخدمة. يمكنك أيضاً السؤال عن الأسعار بكتابة "السعر".';

/** A hung poll must not hang the process: every API call gets a ceiling. */
const API_TIMEOUT_MS = Number(process.env.BOT_API_TIMEOUT || 35000);

/** Telegram's HTML parse mode means anything interpolated into a message is markup.
 *  A customer's first_name is customer input — <b>Sara</b> must arrive as text, or a
 *  customer can send a welcome message that renders broken HTML (or worse, a link).
 *  Rule responses and dashboard replies are typed by the agent, so they are trusted. */
function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let running = false;
let pollTimer = null;

function apiUrl(method) {
  return `${API}/bot${TOKEN}/${method}`;
}

async function callApi(method, payload) {
  if (!TOKEN) throw new Error('BOT_TOKEN is not set');
  const res = await fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) {
    const err = new Error(`telegram ${method} failed: ${data.description || res.status}`);
    err.code = data.error_code;
    throw err;
  }
  return data.result;
}

async function sendMessage(telegramId, text) {
  return callApi('sendMessage', {
    chat_id: telegramId,
    text: String(text).slice(0, 4000),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

function setBotCommands() {
  return callApi('setMyCommands', {
    commands: [
      { command: 'start', description: 'البدء والتسجيل' },
      { command: 'help', description: 'المساعدة' },
    ],
  }).catch(() => {});
}

function buildWelcome(name) {
  return [
    `مرحباً ${esc(name) || 'بك'} 👋`,
    '',
    'أهلاً بك في خدمة العملاء.',
    'اكتب استفسارك وسيتم الرد عليك في أقرب وقت.',
  ].join('\n');
}

async function handleUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message) return null;
  const chatId = message.chat && message.chat.id;
  if (chatId == null) return null;

  const from = message.from || { id: chatId, first_name: message.chat.title || 'Unknown' };
  const text = message.text || message.caption || `[${message.photo || message.document || message.voice ? 'مرفق' : 'رسالة'}]`;

  const user = crm.upsertTelegramUser({ id: from.id, first_name: from.first_name, username: from.username });
  crm.logMessage(user.id, text, 'in', 'telegram', message.text ? 'text' : 'attachment');
  broadcast('message', { userId: user.id });

  if (message.text && message.text.startsWith('/')) {
    const command = message.text.split(' ')[0].split('@')[0].toLowerCase();
    if (command === '/start') {
      return { user, replied: await replyToUser(user.id, buildWelcome(user.name), 'bot') };
    }
    if (command === '/help') {
      return { user, replied: await replyToUser(user.id, HELP_TEXT, 'bot') };
    }
  }

  const rule = crm.matchRule(text);
  if (rule) {
    return { user, replied: await replyToUser(user.id, rule.response, 'bot'), rule: rule.id };
  }
  return { user };
}

/** Send, then record — never the other way round: a reply that failed to reach the
 *  customer must not appear in the conversation as if it had. Returns the text that
 *  actually went out, or null when the send failed. */
async function replyToUser(userId, text, source = 'dashboard') {
  const user = crm.getUser(userId);
  if (!user) throw new Error('user not found');
  const body = String(text);
  if (!user.telegram_id || !TOKEN) {
    // Local mode (or a manual record with no Telegram id): the note is still the
    // conversation's truth, so it is logged with the source that tried.
    crm.logMessage(userId, body, 'out', source);
    broadcast('message', { userId });
    return body;
  }
  try {
    await sendMessage(user.telegram_id, body);
  } catch (err) {
    console.error('[bot] send failed:', err.message);
    crm.logSystemMessage(userId, `تعذّر إرسال الرد (${err.message})`);
    broadcast('message', { userId });
    return null;
  }
  crm.logMessage(userId, body, 'out', source);
  broadcast('message', { userId });
  return body;
}

async function pollLoop() {
  if (!TOKEN || MODE !== 'poll') return;
  running = true;
  let offset = Number(getSetting('tg_offset', 0)) || 0;
  console.log('[bot] long-polling started');
  while (running) {
    try {
      const updates = await callApi('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message', 'edited_message'],
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
      setSetting('tg_offset', String(offset));
    } catch (err) {
      if (err.code === 409 || err.code === 401) {
        console.error(`[bot] telegram error ${err.code}: ${err.message} — stopping`);
        running = false;
        break;
      }
      console.error('[bot] poll error:', err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

function start() {
  if (MODE === 'off') {
    console.log('[bot] disabled (no BOT_TOKEN) — dashboard works in local mode');
    return;
  }
  if (MODE === 'poll') {
    setBotCommands();
    pollLoop();
  }
  if (MODE === 'webhook') {
    setBotCommands();
    console.log('[bot] webhook mode — waiting for updates at /api/telegram/webhook');
  }
}

function stop() {
  running = false;
  if (pollTimer) clearTimeout(pollTimer);
}

async function info() {
  if (!TOKEN) return { enabled: false };
  const me = await callApi('getMe').catch((e) => ({ error: e.message }));
  return { enabled: true, mode: MODE, me };
}

function broadcast(event, data) {
  const bus = require('./events');
  bus.publish(event, data);
}

module.exports = { handleUpdate, replyToUser, sendMessage, start, stop, info, callApi, esc, norm: crm.norm };
