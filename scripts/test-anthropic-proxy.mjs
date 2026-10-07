import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const dir = mkdtempSync(join(tmpdir(), 'proxy-test-'))
await esbuild.build({
  entryPoints: ['worker/anthropic.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile: join(dir, 'p.mjs'),
  logLevel: 'silent',
})
const { anthropicProxy } = await import(join(dir, 'p.mjs'))
rmSync(dir, { recursive: true, force: true })

test('anthropicProxy handles CORS preflight OPTIONS', async () => {
  const req = new Request('https://zeidexsoft.com/api/anthropic/v1/messages', {
    method: 'OPTIONS',
  })
  const url = new URL(req.url)
  const res = await anthropicProxy(req, url)
  assert.equal(res.status, 204)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*')
})

test('anthropicProxy rejects unauthenticated non-probe requests with 401', async () => {
  const req = new Request('https://zeidexsoft.com/api/anthropic/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  const url = new URL(req.url)
  const res = await anthropicProxy(req, url)
  assert.equal(res.status, 401)
  const body = await res.json()
  assert.equal(body.error.type, 'authentication_error')
})

test('anthropicProxy allows /api/hello health probe without auth', async () => {
  let capturedHeaders = null
  let capturedUrl = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (target, init) => {
    capturedUrl = target
    capturedHeaders = init.headers
    return new Response(null, { status: 200 })
  }

  try {
    const req = new Request('https://zeidexsoft.com/api/anthropic/api/hello', {
      method: 'HEAD',
      headers: {
        'cf-connecting-ip': '150.228.11.209',
        'x-forwarded-for': '150.228.11.209',
      },
    })
    const url = new URL(req.url)
    const res = await anthropicProxy(req, url)
    assert.equal(res.status, 200)
    assert.equal(capturedUrl, 'https://api.anthropic.com/api/hello')
    assert.equal(capturedHeaders.has('cf-connecting-ip'), false)
    assert.equal(capturedHeaders.has('x-forwarded-for'), false)
    assert.equal(capturedHeaders.get('Host'), 'api.anthropic.com')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('anthropicProxy forwards authenticated requests and strips client IP headers', async () => {
  let capturedHeaders = null
  let capturedUrl = null
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (target, init) => {
    capturedUrl = target
    capturedHeaders = init.headers
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const req = new Request('https://zeidexsoft.com/api/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-key',
        'cf-connecting-ip': '150.228.11.209',
        'x-forwarded-for': '150.228.11.209',
        'x-real-ip': '150.228.11.209',
        'cf-ray': 'abc',
        'cf-ipcountry': 'YE',
      },
      body: JSON.stringify({ model: 'claude-3-haiku' }),
    })
    const url = new URL(req.url)
    const res = await anthropicProxy(req, url)
    assert.equal(res.status, 200)
    assert.equal(capturedUrl, 'https://api.anthropic.com/v1/messages')
    assert.equal(capturedHeaders.get('x-api-key'), 'test-key')
    assert.equal(capturedHeaders.has('cf-connecting-ip'), false)
    assert.equal(capturedHeaders.has('x-forwarded-for'), false)
    assert.equal(capturedHeaders.has('cf-ipcountry'), false)
    assert.equal(capturedHeaders.get('Host'), 'api.anthropic.com')
  } finally {
    globalThis.fetch = originalFetch
  }
})
