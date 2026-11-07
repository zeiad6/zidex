# Cloudflare WAF & Rate Limiting Configuration — ZeidexSoft Ecosystem

## 1. Custom WAF Firewall Rule: Block Malicious AI Scrapers & Untrusted Bots

### Name:
`Zeidex-Shield: Block Untrusted AI Agents & Automated Scrapers`

### Action:
`Managed Challenge` (or `Block` for aggressive mode)

### Filter Expression (Direct Cloudflare Rule Expression):
```cloudflare
(
  not cf.client.bot
  and not (http.user_agent contains "Stripe" or http.user_agent contains "Moyasar" or http.user_agent contains "TelegramBot" or http.user_agent contains "Zapier")
  and not ip.geoip.asnum in {15169 8075 13335}
  and (
    http.user_agent contains "Bytespider"
    or http.user_agent contains "GPTBot"
    or http.user_agent contains "ClaudeBot"
    or http.user_agent contains "PerplexityBot"
    or http.user_agent contains "CCBot"
    or http.user_agent contains "curl"
    or http.user_agent contains "python-requests"
    or http.user_agent contains "Go-http-client"
    or http.user_agent contains "PostmanRuntime"
    or http.user_agent contains "Scrapy"
    or cf.threat_score gt 25
  )
)
```

---

## 2. Rate Limiting Rule: Protect Authentication & ZATCA Invoicing Endpoints

### Name:
`Zeidex-Shield: Auth & Financial Endpoint Rate Limiter`

### Targeted Expression:
```cloudflare
(
  http.request.uri.path contains "/api/auth/"
  or http.request.uri.path contains "/api/v1/invoices/zatca"
  or http.request.uri.path contains "/store/checkout"
)
```

### Settings:
- **Characteristics**: IP (`cf.collo.ip` or Client IP)
- **Requests**: 10 requests per 10 seconds
- **Action**: Block
- **Block Duration**: 3600 seconds (1 hour)
- **Response**: Custom JSON
  ```json
  {
    "status": 429,
    "error": "Too Many Requests",
    "message": "Rate limit exceeded. Your IP has been temporarily throttled by Zeidex Shield."
  }
  ```

---

## 3. Financial Webhooks Bypass Rule

### Name:
`Zeidex-Shield: Payment Webhook Exemption`

### Targeted Expression:
```cloudflare
(
  http.request.uri.path eq "/api/webhooks/moyasar"
  or http.request.uri.path eq "/api/webhooks/stripe"
  or http.request.uri.path eq "/api/webhooks/telegram"
)
```

### Action:
`Skip` -> All remaining WAF rate limiting and challenge rules.
*(Note: Webhooks must be verified cryptographically in application code using `verifyGatewaySignature`).*
