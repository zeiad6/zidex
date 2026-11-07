import crypto from 'node:crypto';

export interface WebhookVerificationParams {
  /** Raw unparsed body buffer or utf8 string */
  payload: string | Buffer;
  /** Signature header value received from payment gateway */
  signatureHeader: string;
  /** Webhook signing secret */
  secret: string;
  /** Maximum allowable drift in seconds (default: 300s = 5 minutes) */
  toleranceSeconds?: number;
}

/**
 * High-Security Webhook Signature Verification for Moyasar & Stripe.
 * Defends against:
 * 1. Forged payment confirmations
 * 2. Timing Attacks (Constant-time comparison via timingSafeEqual)
 * 3. Replay Attacks (Timestamp drift verification)
 */
export function verifyGatewaySignature({
  payload,
  signatureHeader,
  secret,
  toleranceSeconds = 300
}: WebhookVerificationParams): boolean {
  if (!signatureHeader || !secret || !payload) {
    return false;
  }

  // Handle Stripe signature scheme: t=timestamp,v1=signature
  if (signatureHeader.includes('t=') && signatureHeader.includes('v1=')) {
    const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, item) => {
      const idx = item.indexOf('=');
      if (idx !== -1) {
        const k = item.slice(0, idx).trim();
        const v = item.slice(idx + 1).trim();
        acc[k] = v;
      }
      return acc;
    }, {});

    const timestampStr = parts['t'];
    const signature = parts['v1'];

    if (!timestampStr || !signature) {
      return false;
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return false;
    }

    // Anti-replay check: prevent accepting expired or future-dated webhooks
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTimestamp - timestamp) > toleranceSeconds) {
      return false;
    }

    const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
    const signedPayload = `${timestamp}.${payloadString}`;

    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(computedSignature, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== actualBuffer.length || expectedBuffer.length === 0) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  // Handle Moyasar & standard HMAC-SHA256 signature scheme
  const payloadBuffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(payloadBuffer)
    .digest('hex');

  const expectedBuf = Buffer.from(computedHash, 'utf8');
  const actualBuf = Buffer.from(signatureHeader.trim(), 'utf8');

  if (expectedBuf.length !== actualBuf.length || expectedBuf.length === 0) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
