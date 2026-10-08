// Shared bot deployment secrets/derivations for the maintenance scripts.
// One source of truth so generate-payload.mjs and register-webhook.mjs can never
// disagree with worker/bots.ts again.
//
// SECURITY: never hardcode real secrets in this file. Everything is read from the
// gitignored .dev.vars (the same file wrangler reads) or the process environment.
// If a required value is missing we fail loudly instead of silently falling back
// to a stale or wrong credential. This file is therefore safe to commit.
//
// The webhook secret derivation MUST stay byte-identical to worker/bots.ts webhookSecret():
//   HMAC-SHA256(BOTS_KEY, `tg:<botId>`), base64, [A-Za-z0-9] only, first 48 chars.
import { existsSync } from 'node:fs'

// Load .dev.vars (gitignored) so the maintenance scripts see exactly the secrets wrangler uses.
if (existsSync('.dev.vars')) {
  try {
    process.loadEnvFile('.dev.vars')
  } catch {
    // .dev.vars exists but is unreadable — the required() checks below will explain what's missing.
  }
}

/** Read a required secret, failing loudly with a helpful message when it is absent. */
function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required secret ${name}. Add it to .dev.vars (gitignored) or export it in your shell.`,
    )
  }
  return value
}

export const BOT_TOKEN = required('BOT_TOKEN')
export const BOTS_KEY = required('BOTS_KEY')
// Telegram bot id is the numeric prefix of the bot token (e.g. "8968001501:AAF..."). Derive it so
// it can never drift from the token, but still allow an explicit override.
export const BOT_ID = Number(process.env.BOT_ID || BOT_TOKEN.split(':')[0])
export const OWNER_ID = Number(required('OWNER_ID'))

const enc = new TextEncoder()

/** Same as worker/bots.ts webhookSecret() — `tg:<id>`, 48 chars. */
export async function webhookSecret(botsKey, botId) {
  const rawKey = Uint8Array.from(atob(botsKey), (c) => c.charCodeAt(0))
  const k = await crypto.subtle.importKey('raw', rawKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(`tg:${botId}`)))
  return btoa(String.fromCharCode(...mac)).replace(/[^A-Za-z0-9]/g, '').slice(0, 48)
}

/** Same as worker/bots.ts seal() — AES-GCM under BOTS_KEY, "iv.ciphertext" base64. */
export async function sealToken(botsKey, plain) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const rawKey = Uint8Array.from(atob(botsKey), (c) => c.charCodeAt(0))
  const k = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt'])
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(plain)))
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...ct))}`
}
