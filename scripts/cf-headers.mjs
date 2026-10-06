// Copy cloudflare/_headers into dist with the CSP allowing exactly the inline scripts
// that index.html ships (the pre-paint theme script). Hashing at build time means an
// edit to that script can never silently get blocked by a stale hash.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist/index.html', 'utf8')
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
  ([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
)
const headers = readFileSync('cloudflare/_headers', 'utf8').replace(
  /script-src 'self'( 'sha256-[^']+')*;/,
  `script-src 'self'${hashes.map((h) => ` ${h}`).join('')};`,
)
writeFileSync('dist/_headers', headers)
console.log(`_headers → dist (${hashes.length} inline script hash${hashes.length === 1 ? '' : 'es'})`)
