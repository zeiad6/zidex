/**
 * ZeidexSoft — Input Sanitization & Anti-Exploit Module
 * Protects against:
 * 1. Protocol-based XSS (javascript:, data:, vbscript:)
 * 2. Open Redirect vulnerabilities
 * 3. CRLF header/body injection
 * 4. CSS-based data exfiltration and keylogging attacks
 */

/**
 * Sanitizes URLs provided by users for link hubs and micro-stores.
 * Returns the sanitized URL string or null if dangerous/invalid.
 */
export function sanitizeUserUrl(rawUrl: string, allowedHosts: string[] = []): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();

  // 1. Block dangerous injection schemes
  const dangerousProtocols = /^(javascript:|data:|vbscript:|file:|about:|blob:)/i;
  if (dangerousProtocols.test(trimmed)) {
    return null;
  }

  // 2. Reject CRLF injection characters
  if (/[\r\n]/.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    // 3. Permit only safe, explicit communication protocols
    const permittedProtocols = ['https:', 'http:', 'mailto:', 'tel:'];
    if (!permittedProtocols.includes(parsed.protocol)) {
      return null;
    }

    // 4. Open-Redirect prevention when an allowed domain whitelist is provided
    if (allowedHosts.length > 0) {
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = allowedHosts.some(allowed => 
        hostname === allowed.toLowerCase() || hostname.endsWith(`.${allowed.toLowerCase()}`)
      );
      if (!isAllowed) {
        return null;
      }
    }

    return parsed.href;
  } catch {
    // Malformed URL
    return null;
  }
}

/**
 * Sanitizes custom CSS strings injected in user-customized storefronts and profile themes.
 * Strips data exfiltration vectors, external import hooks, and script evaluations.
 */
export function sanitizeCustomCss(rawCss: string): string {
  if (!rawCss || typeof rawCss !== 'string') {
    return '';
  }

  return rawCss
    // Strip external stylesheets importing (@import)
    .replace(/@import\b[^;]*;?/gi, '/* [ZEIDEX-BLOCKED-IMPORT] */')
    // Prevent CSS url() data exfiltration attacks, allowing only safe Google fonts
    .replace(/url\s*\((?!['"]?https:\/\/fonts\.gstatic\.com)[^)]*\)/gi, 'none')
    // Strip legacy Microsoft expression() evaluations
    .replace(/expression\s*\(.*?\)/gi, 'none')
    // Strip HTML tag boundaries to prevent CSS-to-HTML context break
    .replace(/<\/?[a-z][\s\S]*>/gi, '')
    // Strip suspicious Unicode escape sequences often used to bypass filters
    .replace(/\\00[0-9a-f]{2}/gi, '')
    // Strip JavaScript protocol references within CSS
    .replace(/javascript\s*:/gi, 'blocked:');
}
