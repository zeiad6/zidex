#!/bin/bash
# One coherent path to a fully working platform bot on the primary host (zeidexsoft.com).
#
# What was wrong before: payload.json carried a webhook secret derived with `hook:`
# (42 chars) while the Worker verifies the `tg:` derivation (48 chars) — every update
# Telegram delivered was dropped and the bot never answered. The old reseed script
# also pointed the webhook at zeidex.zeidex.workers.dev, which wrangler.toml no
# longer serves (workers_dev = false), and wrote to a stale KV namespace id.
#
# This script: regenerate the payload → push it to the DOWNLOADS KV binding from
# wrangler.toml → set BOT_TOKEN (order notifications) → deploy the Worker →
# re-register the Telegram webhook with the secret the Worker actually checks.
set -euo pipefail

echo "1/5 — Generating bot KV payload (correct tg: secret)…"
node scripts/generate-payload.mjs

echo "2/5 — Updating BOT_TOKEN secret…"
# Never hardcode the token here. Read it from the gitignored .dev.vars so this script stays safe to commit.
BOT_TOKEN="$(grep -E '^BOT_TOKEN=' .dev.vars | head -1 | sed -E 's/^BOT_TOKEN=//; s/^"//; s/"$//')"
if [ -z "$BOT_TOKEN" ]; then echo "ERROR: BOT_TOKEN not found in .dev.vars"; exit 1; fi
printf '%s' "$BOT_TOKEN" | npx wrangler secret put BOT_TOKEN

echo "3/5 — Pushing bot configuration to the primary KV (DOWNLOADS binding)…"
npx wrangler kv key put --binding=DOWNLOADS "tb:8968001501" --path=payload.json

echo "4/5 — Deploying worker to the primary host…"
npm run deploy:cf

echo "5/5 — Registering the Telegram webhook with the matching secret…"
node scripts/register-webhook.mjs

echo "Done! The official bot is live on zeidexsoft.com with a webhook secret the Worker accepts."
