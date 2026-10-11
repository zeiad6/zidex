/**
 * Anthropic API reverse proxy for bypassing geographic restrictions (e.g., Yemen).
 * Enforces Zero-Trust: only proxies requests that contain valid authentication tokens/keys,
 * or standard CLI health probes.
 */
export async function anthropicProxy(request: Request, url: URL): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }

  // Subpath after /api/anthropic. Build the target by assigning pathname/search on a fixed
  // base, never `new URL(subpath, base)`: a subpath like `//evil.com/x` is a protocol-relative
  // reference that would otherwise swap the host to evil.com and forward the caller's key there.
  const subpath = url.pathname.slice('/api/anthropic'.length) || '/'
  const targetUrl = new URL('https://api.anthropic.com')
  targetUrl.pathname = subpath
  targetUrl.search = url.search

  // Zero-Trust: allow /api/hello (CLI health probe) or requests with authentication
  const hasAuth = request.headers.has('x-api-key') || request.headers.has('authorization')
  const isHelloProbe = subpath === '/api/hello' || subpath === '/'

  if (!hasAuth && !isHelloProbe) {
    return new Response(
      JSON.stringify({
        error: {
          type: 'authentication_error',
          message: 'Missing API key or Authorization header',
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Clone headers and strip client IP identifiers that could trigger CF geoblocks
  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase()
    if (
      lower === 'cf-connecting-ip' ||
      lower === 'x-forwarded-for' ||
      lower === 'x-real-ip' ||
      lower === 'cf-ray' ||
      lower === 'cf-ipcountry' ||
      lower === 'cf-visitor' ||
      lower === 'host'
    ) {
      continue
    }
    headers.set(key, value)
  }
  headers.set('Host', 'api.anthropic.com')

  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'follow',
    })

    const responseHeaders = new Headers(upstreamRes.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
    responseHeaders.set('Access-Control-Allow-Headers', '*')

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: responseHeaders,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({
        error: {
          type: 'api_error',
          message: `Proxy upstream error: ${message}`,
        },
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
