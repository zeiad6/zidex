# The shop bot's name

The storefront's buy links are built as `https://t.me/<bot>?start=buy_<sku>`.
That `<bot>` lives in exactly one place — the `bot` field of
`public/store/catalog.json` — and **every** surface reads it from there:

| Surface | Where it comes from |
|---|---|
| Website buy buttons | `src/lib/store.ts` → `catalog.bot` |
| Telegram Mini App | `public/store/store.js` → `catalog.bot` |
| Hero "trial" link | `src/pages/Home.tsx` |
| Worker payment quotes | `worker/kuraimi.ts`, `worker/orders.ts` |

## Why this file exists

On 2026-10-06 the catalogue said `ZeidexBot`. That bot does not exist — Telegram
answered it with the same "Contact @name" page it returns for any free handle,
and the real bot was `@deanonimaizer_2hbot_8fml_bot`. So every purchase button
on the site and in the Mini App opened a dead deep link, and the live Stars
invoices had gone unused.

Nothing failed loudly, which is the part worth remembering: a wrong bot username
produces no exception, no failed build, no failed test. It just quietly loses
the sale. That is why `scripts/test-bots.mjs` now asserts the catalogue's bot
against the Worker, so the next rename cannot drift the same way.

## The rule

**The bot's username is owned by BotFather, not by this repository.** It changes
when the owner runs `/setusername` in BotFather. So:

1. To rename: do it in **@BotFather** first, confirm it with `getMe`, then set
   `BOT_USERNAME` and re-run `update_catalog.py`.
2. Never type a username into a source file. `update_catalog.py` now requires
   `BOT_USERNAME` from the environment and will refuse to run without it, so the
   name cannot be pinned in the repository again.
3. The Worker matches the platform's own bot by **numeric id**
   (`DEFAULT_PLATFORM_BOT_ID` in `worker/bots.ts`, overridable with
   `BOT_PLATFORM_ID`), never by username. Bot ids never change; usernames do.

## Verifying a change

```bash
# 1. What the bot actually calls itself. This is the only authority.
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getMe" | grep username

# 2. What the catalogue will tell visitors to open.
python3 -c "import json;print(json.load(open('public/store/catalog.json'))['bot'])"

# 3. Both agree, and the whole suite still passes.
npm test
```

Steps 1 and 2 must print the same string. If they disagree, the storefront is
sending buyers to a dead deep link.