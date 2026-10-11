'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'crm.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id   TEXT UNIQUE,
  name          TEXT NOT NULL DEFAULT '',
  username      TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'new',
  notes         TEXT DEFAULT '',
  first_contact TEXT,
  last_contact  TEXT,
  created_via   TEXT DEFAULT 'telegram',
  unread        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text      TEXT NOT NULL,
  direction TEXT NOT NULL,
  source    TEXT DEFAULT 'telegram',
  kind      TEXT DEFAULT 'text',
  ts        TEXT NOT NULL,
  read      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, id DESC);

CREATE TABLE IF NOT EXISTS deals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT '',
  value      REAL NOT NULL DEFAULT 0,
  stage      TEXT NOT NULL DEFAULT 'interested',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);

CREATE TABLE IF NOT EXISTS rules (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword  TEXT NOT NULL,
  response TEXT NOT NULL,
  enabled  INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'agent',
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token     TEXT PRIMARY KEY,
  agent_id  INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`);

const now = () => new Date().toISOString();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  // A malformed or empty stored hash must read as "wrong password", never as an
  // exception: timingSafeEqual throws on a length mismatch, and a throw here would
  // turn one corrupt row into a 500 on the login endpoint.
  if (!salt || !hash || !/^[0-9a-f]+$/i.test(hash)) return false;
  let candidate;
  try {
    candidate = crypto.scryptSync(String(password), salt, 64);
  } catch {
    return false;
  }
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== candidate.length) return false;
  return crypto.timingSafeEqual(expected, candidate);
}

function ensureAdmin() {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || 'admin123';
  const row = db.prepare('SELECT id FROM agents WHERE username = ?').get(user);
  if (!row) {
    db.prepare('INSERT INTO agents (username, password_hash, role, created_at) VALUES (?,?,?,?)')
      .run(user, hashPassword(pass), 'admin', now());
    if (!process.env.ADMIN_PASS) {
      console.log(`[auth] account created: ${user} / ${pass}  <- change it now`);
    }
  }
}

function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
}

const USERS_STATUSES = ['new', 'interested', 'contacted', 'customer', 'lost'];
const DEAL_STAGES = ['interested', 'contacted', 'won', 'lost'];
const DIRECTIONS = ['in', 'out'];

module.exports = {
  db,
  now,
  hashPassword,
  verifyPassword,
  ensureAdmin,
  getSetting,
  setSetting,
  USERS_STATUSES,
  DEAL_STAGES,
  DIRECTIONS,
};
