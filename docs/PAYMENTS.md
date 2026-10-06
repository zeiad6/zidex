# Website payments (outside Telegram)

Inside the bot and the Mini App, digital goods are paid in **Telegram Stars only**
(Telegram policy). The website (`/shop/<sku>`) can add other methods; each one appears
only once it is configured.

| Method | Where it is configured | Delivery |
|---|---|---|
| Stars | always on | bot (`successful_payment`) |
| TON / USDT (TON) | `TON_WALLET` in the bot's `.env`, then `python -m bot.storefront …` | buyer confirms → admin verifies (`/api/orders`) |
| PayPal | `PAYPAL_ME` in the bot's `.env` | same |
| Card | `CARD_LINKS=sku=https://…` in the bot's `.env` | same |
| **Kuraimi (Haseb / KJ / Mfloos)** | Worker secrets below | instant: bank answers in `SendPayment`; LikeCard code returned if the SKU is mapped |

## Kuraimi + LikeCard

Code: `worker/kuraimi.ts`. Check: `node scripts/test-kuraimi.mjs`.

```bash
# from the bank, at merchant onboarding
npx wrangler secret put KURAIMI_BASE_URL       # e.g. https://<bank-api-host>
npx wrangler secret put KURAIMI_USERNAME
npx wrangler secret put KURAIMI_PASSWORD
# credentials YOU choose and give the bank for the check-user webhook
npx wrangler secret put KURAIMI_WEBHOOK_USER
npx wrangler secret put KURAIMI_WEBHOOK_PASS
npx wrangler secret put KURAIMI_YER_PER_USD    # e.g. 530 (old-rial zone)
npx wrangler secret put KURAIMI_CURRENCY_ZONE  # old | new | all   (default old)

# optional: LikeCard wholesale codes (from the LikeCard merchant panel)
npx wrangler secret put LIKECARD_DEVICE_ID
npx wrangler secret put LIKECARD_EMAIL
npx wrangler secret put LIKECARD_PASSWORD
npx wrangler secret put LIKECARD_SECURITY_CODE
npx wrangler secret put LIKECARD_PHONE         # used in the create_order hash
npx wrangler secret put LIKECARD_HASH_KEY      # used in the create_order hash
npx wrangler secret put SUPPLIER_PRODUCTS      # sku=productId,sku2=productId
```

Give the bank this webhook: `https://zeidexsoft.com/api/pay/kuraimi/check-user`
(Basic auth with `KURAIMI_WEBHOOK_USER` / `KURAIMI_WEBHOOK_PASS`).

Endpoint paths and field names follow the open-source client
`github.com/al-saloul/kurimibanck` (Kuraimi) and `codebuglab/laravel-like4card`
(LikeCard). Confirm them against the contract you receive before going live, and run
one small real payment first.

Safety built in: the PIN is sent once to the bank and never stored or logged; 3 attempts
per IP per 10 minutes; one idempotency key per checkout so a double tap cannot charge
twice; the LikeCard `referenceId` is the same REFNO so a retry cannot buy a second code;
a paid order whose code purchase failed alerts the admin to deliver or reverse.
