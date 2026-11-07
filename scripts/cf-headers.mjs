// Copy cloudflare/_headers into dist with the CSP allowing exactly the inline scripts
// across all 7 section pages. Hashing at build time prevents CSP script blocking.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const pages = ['index.html', 'bots.html', 'programs.html', 'templates.html', 'blog.html', 'trial.html', 'about.html']
const hashes = new Set()

for (const p of pages) {
  const filePath = existsSync(`dist/${p}`) ? `dist/${p}` : p
  if (existsSync(filePath)) {
    const html = readFileSync(filePath, 'utf8')
    const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    for (const [, body] of matches) {
      hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`)
    }
  }
}

const headers = readFileSync('cloudflare/_headers', 'utf8').replace(
  /script-src 'self'( 'sha256-[^']+')*;/,
  `script-src 'self' https://cdn.tailwindcss.com ${[...hashes].join(' ')};`,
)
writeFileSync('dist/_headers', headers)
console.log(`_headers → dist (${hashes.size} inline script hashes from all 7 section pages)`)
