#!/usr/bin/env node
/* Copies version, release date, download links and download totals of the
   third-party (redistributed) programs from data/programs.json into the two
   hand-shaped TypeScript catalogues. The author's own programs (zeiad6/*) and
   the MediaFire-only ones are skipped: their entries carry extra mirrors and
   article slugs that the JSON does not know about.
   Run after: fetch-releases.mjs → build-programs-data.mjs */
import fs from 'node:fs'

const { programs } = JSON.parse(fs.readFileSync('data/programs.json', 'utf8'))

const NOTES = {
  'Windows 10+': ['مثبّت ويندوز (موصى به)', 'Windows installer (recommended)'],
  'Linux x64': ['حزمة لينكس (.deb)', 'Linux package (.deb)'],
  'macOS Universal': ['macOS (Universal)', 'macOS (Universal)'],
  'macOS Apple Silicon': ['macOS (Apple Silicon)', 'macOS (Apple Silicon)'],
  'macOS Intel': ['macOS (Intel)', 'macOS (Intel)'],
  'Android 8+': ['حزمة أندرويد (APK)', 'Android package (APK)']
}

const nf = new Intl.NumberFormat('en-US')
const compact = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n))

/** [start, end) of the object literal that holds `slug`, or null. */
function block(src, slug) {
  const at = src.search(new RegExp(`slug: ['"]${slug}['"],`))
  if (at === -1) return null
  const next = src.slice(at + 1).search(/\n {4}slug: ['"]/)
  const tail = src.indexOf('\n]\n', at)
  return [at, next === -1 ? tail : Math.min(at + 1 + next, tail)]
}

function sync(file, { q, inline, counts }) {
  let src = fs.readFileSync(file, 'utf8')
  const s = (v) => q + String(v).replaceAll(q, '\\' + q) + q
  let done = 0
  for (const p of programs) {
    if (!p.repo || p.repo.startsWith('zeiad6/')) continue
    const range = block(src, p.slug)
    if (!range) throw new Error(`${file}: no entry for ${p.slug}`)
    let body = src.slice(...range)

    const rows = p.links.map((l) => {
      const [note, noteEn] = NOTES[l.platform] || [l.platform, l.platform]
      const fields = [
        ['href', l.href],
        ['host', l.host],
        ['file', l.href.slice(l.href.lastIndexOf('/') + 1)],
        ['size', l.size],
        ['note', note],
        ...(inline ? [['noteEn', noteEn]] : [])
      ]
      return inline
        ? `      { ${fields.map(([k, v]) => `${k}: ${s(v)}`).join(', ')} },`
        : `      {\n${fields.map(([k, v]) => `        ${k}: ${s(v)},`).join('\n')}\n      },`
    })
    const set = (re, value) => {
      if (!re.test(body)) throw new Error(`${file}: ${p.slug} has no ${re}`)
      body = body.replace(re, () => value)
    }
    set(/downloads: \[[\s\S]*?\n {4}\],/, `downloads: [\n${rows.join('\n')}\n    ],`)
    set(/version: ['"][^'"]*['"],/, `version: ${s(p.rawVersion)},`)
    set(/date: ['"][^'"]*['"],/, `date: ${s(p.released)},`)
    if (counts) {
      set(/exactDownloads: \d+,/, `exactDownloads: ${p.downloads},`)
      set(/downloadsCount: "[^"]*",/, `downloadsCount: "${nf.format(p.downloads)}+",`)
      set(/compactDownloads: "[^"]*",/, `compactDownloads: "${compact(p.downloads)} تحميلة",`)
      set(/compactDownloadsEn: "[^"]*",/, `compactDownloadsEn: "${compact(p.downloads)} downloads",`)
    }
    src = src.slice(0, range[0]) + body + src.slice(range[1])
    done++
  }
  fs.writeFileSync(file, src)
  console.log(`${file}: ${done} programs synced`)
}

sync('src/data/programs.ts', { q: "'", inline: false, counts: false })
sync('sovereign/src/lib/programs.ts', { q: '"', inline: true, counts: true })
