# ZeidexSoft Project & Security Rules

This rules file is automatically discovered and enforced by Antigravity and any AI model/agent operating in this workspace.

---

## 1. OWASP Top 10 for LLM & GenAI Applications (2026 Standards)

Every agent, assistant, and developer working in this repository MUST comply with the following architectural and security constraints:

### 1.1 Zero-Trust Backend Authorization & Strict Gateway Pattern (Anti-Excessive Agency)
- **Rule**: NEVER rely on an LLM, prompt instruction, or system prompt to enforce user authorization, access control, or administrative permissions.
- **Strict Gateway Pattern**: Treat the AI bot/agent like an untrusted frontend user. The backend code handling actual execution (e.g. KV writes, shell actions, payments, database updates) must deterministically hard-verify the caller's session, identity, and permissions (e.g. `isOwner = uid === cfg.owner` or `safeEqual(bearerToken, ADMIN_TOKEN)`) before executing any action.
- **Rule**: Administrative actions (such as `/admin`, `/add`, `/del`, `/licnew`, `/lRevoke`, `/pause`, `/resume`) must reject unauthorized callers immediately before reading or writing sensitive records.

### 1.2 Context Separation (Prompt Injection Fix)
- **Rule**: Never concatenate untrusted user inputs directly into system prompts or instructions (e.g. never do `f"Translate: {user_input}"`).
- **Rule**: Always separate system directives from user-provided data using strict structural encapsulation (OpenAI System/Developer vs User roles, typed parameters, or strict boundary delimiters like XML tags).
- **Rule**: Treat all inputs from chat messages, webhook payloads, and query parameters as untrusted.

### 1.3 Strict Input & Output Sanitization (XSS & Improper Output Handling Fix)
- **Rule**: Assume the AI/bot output has been influenced or compromised. Treat bot outputs like raw user input before presentation or persistence.
- **Rule**: When returning user-influenced data in Telegram messages with `parse_mode: 'HTML'`, ALWAYS sanitize text using `esc()` / `escapeHtml()` (`replace(/[&<>"]/g, ...)`).
- **Rule**: In web components and Mini Apps, never use `innerHTML` or `dangerouslySetInnerHTML` for user or query text. Always bind to textContent or safe JSX primitives to prevent XSS.

### 1.4 Sensitive Information & Secret Protection
- **Rule**: Plaintext private keys, bot tokens, and administrative secrets MUST NEVER be committed to the repository, logged to console, returned in API errors, or persisted in unencrypted KV fields.
- **Rule**: Software license keys are shown to the purchaser once upon issuance and stored strictly as SHA-256 hashes (`kh`).
- **Rule**: Customer bot tokens in Cloudflare Workers are stored sealed with AES-GCM-256 (`BOTS_KEY`).

---

## 2. Universal Security Frameworks & Automated Tooling Reference

All development and testing must adhere to the following universal guidelines and developer tools:

### 2.1 Security Frameworks & Knowledge Bases
- **OWASP Top 10 for LLM Applications 2026**: Primary vulnerability & mitigation checklist.
- **NIST AI Risk Management Framework (AI RMF)**: Structural AI risk governance and trustworthiness mapping.
- **CISA Guidelines for Secure AI System Development**: Secure design, development, deployment, and operation standards.
- **MITRE ATLAS**: Matrix of real-world adversary tactics and techniques against AI/LLM systems.
- **AVID (AI Vulnerability Database)**: Open-source repository tracking AI failure modes, vulnerabilities, and model biases.

### 2.2 Security Firewalls & LLM Guardrails (Runtime Protection)
- **NeMo Guardrails (NVIDIA)**: Programmatic rails to prevent bots from executing out-of-bounds commands or discussing prohibited domains.
- **LLM Guard (Protect AI)**: Pipeline sanitization for input prompt injection/PII filtering and output hallucination/injection detection.

### 2.3 Automated Red-Teaming, CI/CD & Static Analysis
- **Garak**: LLM vulnerability scanner (probing endpoints for injections, data leakage, and jailbreaks).
- **Promptfoo**: Automated CLI evaluation and red-teaming for prompt security and model constraints.
- **Snyk / GitHub Advanced Security**: Dependency vulnerability scanning and secret leak detection.
- **Semgrep**: Static analysis rules for configuration and code vulnerabilities.

---

## 3. Cloudflare Workers & KV Resource Flood Protection

### 3.1 Webhook Authentication Before KV Reads
- Telegram Webhook requests (`POST /tg/:botId`) MUST verify the `X-Telegram-Bot-Api-Secret-Token` header using constant-time comparison (`safeEqual`) against the HMAC-derived secret BEFORE performing any KV read or decryption.

### 3.2 In-Memory Caching for Bot Configurations
- To protect Cloudflare KV's 100,000/day free-tier read quota against message flooding attacks, worker isolates MUST maintain an in-memory cache (`configCache`) with a 60-second TTL.
- Reads within the TTL are served directly from isolate memory without consuming KV operations.
- Mutations (`save()`) must invalidate/update the cache immediately.

### 3.3 Rate Limiting & Payment Exemption
- All inbound webhook messages from non-owners must pass through atomic rate limiters (`BOT_LIMITER`).
- **Critical Exemption**: Financial transactions (`pre_checkout_query` and `successful_payment`) must NEVER be blocked by the rate limiter; Telegram Stars transactions must be answered immediately to avoid leaving customers in an indeterminate state.

---

## 4. Automated Storefront Licensing & Bot Naming Integrity

### 4.1 Automated Web Storefront Licensing
- Software and Pro purchases (via Kuraimi, card, or Telegram Stars) trigger automated, deterministic license key minting via `issueLicense()`.
- The plaintext license key is returned directly to the buyer on the success screen and alerted to admins via Telegram, with zero manual operator intervention required.

### 4.2 Bot Naming & ID Matching
- The official store bot username is owned by @BotFather, while this repository tracks the immutable Telegram ID (`DEFAULT_PLATFORM_BOT_ID = 8968001501`).
- The canonical designated store bot handle is `@ZeidexStoreBot`.
- Always run `npm test` before deployment to verify bot name resolution, license verification, and catalog integrity.
