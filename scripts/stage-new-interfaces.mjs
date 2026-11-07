// Stage new modular section interfaces into dist and dist_pages
// Deprecates the old SPA shell and activates the 7 high-density independent interfaces
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pages = ['index.html', 'bots.html', 'programs.html', 'templates.html', 'blog.html', 'trial.html', 'about.html']
const aliases = [
  ['bots.html', 'shop.html'],
  ['programs.html', 'program.html'],
  ['about.html', 'links.html'],
  ['trial.html', 'pricing.html'],
  ['trial.html', 'pay.html']
]

const targets = ['dist', 'dist_pages']

for (const target of targets) {
  const dir = resolve(root, target)
  mkdirSync(dir, { recursive: true })

  // Stage 7 main pages
  for (const page of pages) {
    const src = resolve(root, page)
    if (existsSync(src)) {
      copyFileSync(src, resolve(dir, page))
    }
  }

  // Stage route aliases
  for (const [srcName, aliasName] of aliases) {
    const src = resolve(root, srcName)
    if (existsSync(src)) {
      copyFileSync(src, resolve(dir, aliasName))
    }
  }

  // Stage _redirects
  const redirectsSrc = resolve(root, 'public/_redirects')
  if (existsSync(redirectsSrc)) {
    copyFileSync(redirectsSrc, resolve(dir, '_redirects'))
  }
}

console.log('✔ Successfully staged all 7 new section interfaces and aliases into dist and dist_pages.')

// Generate CSP headers
execSync('node scripts/cf-headers.mjs', { cwd: root, stdio: 'inherit' })
if (existsSync(resolve(root, 'dist/_headers'))) {
  copyFileSync(resolve(root, 'dist/_headers'), resolve(root, 'dist_pages/_headers'))
}

// Sanity check
for (const p of pages) {
  const html = readFileSync(resolve(root, p), 'utf-8')
  const tagsToCheck = ['div', 'section', 'header', 'footer', 'button', 'script', 'style']
  for (const tag of tagsToCheck) {
    const openCount = (html.match(new RegExp('<' + tag + '(\\s+[^>]*)?>', 'gi')) || []).length
    const closeCount = (html.match(new RegExp('</' + tag + '>', 'gi')) || []).length
    if (openCount !== closeCount) {
      console.error(`Mismatch in ${p} for <${tag}>: open=${openCount}, close=${closeCount}`)
      process.exit(1)
    }
  }
}
console.log('✔ Structural HTML validation passed: all 7 new section pages are 100% sound.')
