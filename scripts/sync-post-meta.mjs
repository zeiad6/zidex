/**
 * Regenerates the derived fields in src/data/posts.ts and posts.en.ts:
 *   readMinutes  — word count of the body, divided by 190
 *   headings     — the h2/h3 list that feeds the table of contents
 *
 * Both now live in the light index while the bodies sit in lazily-loaded
 * chunks, which means they can drift from the articles they describe. This
 * script is the repair: run it after editing a body.
 *
 *   node scripts/sync-post-meta.mjs          # report only, exits 1 on drift
 *   node scripts/sync-post-meta.mjs --write  # rewrite the index files
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as esbuild from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

/** Node cannot import .ts, so the body modules are bundled on the fly. */
async function loadBodiesFrom(entry) {
  const out = mkdtempSync(join(tmpdir(), 'sync-meta-'))
  const bundle = join(out, 'bodies.mjs')
  await esbuild.build({
    entryPoints: [resolve(root, entry)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: bundle,
    logLevel: 'silent',
  })
  const mod = await import(`file://${bundle}`)
  rmSync(out, { recursive: true, force: true })
  return mod
}

const { postBodies } = await loadBodiesFrom('src/data/postBodies.ts')
const { postBodiesEn } = await loadBodiesFrom('src/data/postBodies.en.ts')

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const toLatin = (s) =>
  s.replace(/[٠-٩۰-۹]/g, (d) => {
    const a = ARABIC_DIGITS.indexOf(d)
    return String(a > -1 ? a : PERSIAN_DIGITS.indexOf(d))
  })

const WORDS_PER_MINUTE = 190

function blockText(b) {
  if (b.text) return b.text
  if (b.code) return b.code
  if (b.head) return [...b.head, ...b.rows.flat()].join(' ')
  if (b.label) return `${b.label} ${b.meta}`
  if (b.center) return [b.center.title, b.center.sub, ...b.nodes.flatMap((n) => [n.title, n.sub, n.role])].join(' ')
  if (b.items) return b.items.map((i) => (typeof i === 'string' ? i : `${i.value} ${i.label}`)).join(' ')
  return ''
}

function measure(blocks) {
  const words = blocks.map(blockText).join(' ').trim().split(/\s+/).filter(Boolean).length
  return {
    readMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    headings: blocks
      .filter((b) => b.type === 'h2' || b.type === 'h3')
      .map((b) => ({ id: b.id, text: toLatin(b.text), level: b.type === 'h2' ? 2 : 3 })),
  }
}

/**
 * The two index files key entries differently — posts.ts uses
 * `slug: 'x'` while posts.en.ts uses `'x': { ... }` — so both anchors are
 * tried before giving up.
 */
function anchorFor(src, slug) {
  return src.indexOf(`slug: '${slug}'`) !== -1
    ? { at: src.indexOf(`slug: '${slug}'`), re: new RegExp(`slug: '${slug}'`) }
    : src.indexOf(`'${slug}': {`) !== -1
      ? { at: src.indexOf(`'${slug}': {`), re: new RegExp(`'${slug}': \{`) }
      : null
}

/** Reads the fields currently written into an index file. */
function currentFor(file, slug) {
  const src = readFileSync(file, 'utf8')
  const anchor = anchorFor(src, slug)
  if (!anchor) return null
  const at = anchor.at
  const slice = src.slice(at, at + 40000)
  const minutes = slice.match(/^\s*readMinutes: (\d+),/m)
  const headings = slice.match(/^\s*headings: (\[.*?\]),$/m)
  return {
    readMinutes: minutes ? Number(minutes[1]) : null,
    headings: headings ? JSON.parse(headings[1]) : null,
  }
}

const targets = [
  // posts.ts owns both derived fields.
  { file: resolve(root, 'src/data/posts.ts'), bodies: postBodies, fields: ['readMinutes', 'headings'] },
  // posts.en.ts owns headings only — reading time is language-neutral and is
  // inherited from the Arabic index by the merge in posts.ts.
  { file: resolve(root, 'src/data/posts.en.ts'), bodies: postBodiesEn, fields: ['headings'] },
]

const write = process.argv.includes('--write')
let drift = 0
let checked = 0

for (const { file, bodies, fields } of targets) {
  let src = readFileSync(file, 'utf8')

  for (const [slug, blocks] of Object.entries(bodies)) {
    const anchor = anchorFor(src, slug)
    if (!anchor) {
      console.log(`  ⚠ ${slug}: no index entry in ${file.split('/').pop()}`)
      continue
    }
    const want = measure(blocks)
    const have = currentFor(file, slug)
    if (!have) continue
    checked++

    if (fields.includes('readMinutes') && have.readMinutes !== want.readMinutes) {
      console.log(`  ↻ ${slug}: readMinutes ${have.readMinutes} → ${want.readMinutes}`)
      src = src.replace(
        new RegExp(`(${anchor.re.source}[\\s\\S]{0,40000}?readMinutes: )\\d+`),
        `$1${want.readMinutes}`,
      )
      drift++
    }

    const a = JSON.stringify(have.headings ?? [])
    const b = JSON.stringify(want.headings)
    if (fields.includes('headings') && a !== b) {
      const label = have.headings === null ? 'added' : `${have.headings.length} → ${want.headings.length}`
      console.log(`  ↻ ${slug}: headings ${label}`)
      const line = `    headings: ${b},`
      // An entry that has no headings line yet needs one inserted, not replaced.
      const re = new RegExp(`(${anchor.re.source}[\\s\\S]{0,40000}?tags: \\[[^\\]]*\\],)`)
      if (have.headings === null) {
        if (re.test(src)) src = src.replace(re, `$1\n${line}`)
        else console.log(`     ↳ skipped: no tags line to anchor the insert in ${file.split('/').pop()}`)
      } else {
        src = src.replace(
          new RegExp(`(${anchor.re.source}[\\s\\S]{0,40000}?headings: )\\[.*?\\],`),
          (_m, p1) => `${p1}${b},`,
        )
      }
      drift++
    }
  }

  if (write && drift) writeFileSync(file, src, 'utf8')
}

console.log(`\nchecked ${checked} posts · ${drift} field(s) drifted`)
if (drift === 0) {
  console.log('✅ index metadata matches the bodies')
} else if (write) {
  console.log('✏  rewritten — re-run to confirm')
} else {
  console.log('↳ run with --write to repair')
  process.exitCode = 1
}
