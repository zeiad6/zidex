#!/usr/bin/env node
/*
 * Verifies every download link the site publishes — GitHub, MediaFire and
 * Google Drive — and reports what each source says about its file.
 *
 * What each source can answer (checked 2026-10-17):
 *   · GitHub     — public download counts per release asset, via the API.
 *                  (scripts/sync-programs.mjs turns them into the baseline.)
 *   · MediaFire  — no public download count exists (the anonymous get_info
 *                  API returns readiness/privacy/size, never a counter),
 *                  so this script verifies the file is `ready` and `public`
 *                  and prints its real size.
 *   · Drive      — no public count and no size without downloading; this
 *                  script verifies the file page resolves (200) and reads
 *                  the real file name from its <title>.
 *
 * It parses the two data files directly (regex over their stable shape), so
 * there is no third copy of the links to drift out of date.
 *
 * Run:  npm run check:downloads
 * Exit: 0 when every link is healthy, 1 when any is broken.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** slug -> hrefs, from a data file whose shape is `slug: 'x'` + `href: 'y'`. */
function linksFromPrograms() {
  const src = readFileSync(resolve(ROOT, 'src/data/programs.ts'), 'utf8')
  const blocks = src.split(/\n  \{\n/).slice(1)
  const out = {}
  for (const block of blocks) {
    const slug = block.match(/slug: '([^']+)'/)?.[1]
    if (!slug) continue
    // docs:/post: lines excluded; only download hrefs are collected.
    const hrefs = [...block.matchAll(/href: '(https?:\/\/[^']+)'/g)]
      .map((m) => m[1])
      .filter((h) => !/github\.com\/(zeiad6|storytold)\/[^/]+\/?$/.test(h))
    out[slug] = hrefs
  }
  return out
}

/** slug -> version-file hrefs, from the generated releases file. */
function linksFromReleases() {
  const src = readFileSync(resolve(ROOT, 'src/data/programReleases.ts'), 'utf8')
  const out = {}
  const json = src.match(/programReleases[^=]*=\s*(\{[\s\S]*?\n\})\n\n/)?.[1]
  if (!json) return out
  const parsed = JSON.parse(json)
  for (const [slug, info] of Object.entries(parsed)) {
    out[slug] = (info.versions ?? []).flatMap((v) => v.files.map((f) => ({ href: f.href, version: v.version })))
  }
  return out
}

const fmt = (b) => `${(b / 1048576).toFixed(1)} MB`
let broken = 0

async function checkGithub(href) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(href, { redirect: 'follow', method: 'HEAD' })
      if (res.status === 200) {
        return `HTTP 200 · ${decodeURIComponent(href.split('/').pop())}`
      }
      if (res.status === 405) {
        const getRes = await fetch(href, { redirect: 'follow', method: 'GET' })
        getRes.body?.cancel?.()
        if (getRes.status === 200) {
          return `HTTP 200 · ${decodeURIComponent(href.split('/').pop())}`
        }
      }
      if (res.status !== 200 && attempt === 2) {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (err) {
      if (attempt === 2) throw err
      await new Promise((r) => setTimeout(r, 600))
    }
  }
}

async function checkMediaFire(href) {
  const key = href.match(/mediafire\.com\/file\/([^/]+)/)?.[1]
  if (!key) throw new Error('no quick_key in URL')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://www.mediafire.com/api/1.5/file/get_info.php?quick_key=${key}&response_format=json`)
      const info = (await res.json())?.response?.file_info
      if (!info) throw new Error('API returned no file_info')
      if (info.ready !== 'yes') throw new Error(`not ready (${info.ready})`)
      if (info.privacy !== 'public') throw new Error(`not public (${info.privacy})`)
      return `${info.filename} · ${fmt(Number(info.size))} · ready/public`
    } catch (err) {
      if (attempt === 2) throw err
      await new Promise((r) => setTimeout(r, 600))
    }
  }
}

async function checkDrive(href) {
  const id = href.match(/\/file\/d\/([^/]+)/)?.[1] ?? href.match(/[?&]id=([^&]+)/)?.[1]
  if (!id) throw new Error('no file id in URL')
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://drive.google.com/file/d/${id}/view`, { redirect: 'follow' })
      const html = await res.text()
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
      if (/accounts\.google\.com|\/ServiceLogin/.test(res.url)) throw new Error('requires sign-in (not public)')
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s*-\s*Google Drive$/, '').trim()
      return title ? `public · “${title.slice(0, 60)}”` : 'public (no title)'
    } catch (err) {
      if (attempt === 2) throw err
      await new Promise((r) => setTimeout(r, 600))
    }
  }
}

function checkerFor(href) {
  if (href.includes('github.com')) return checkGithub
  if (href.includes('mediafire.com')) return checkMediaFire
  if (href.includes('drive.google.com')) return checkDrive
  return async () => {
    throw new Error('unknown host')
  }
}

const programs = linksFromPrograms()
const releases = linksFromReleases()
const total = Object.values(programs).flat().length + Object.values(releases).flat().length
console.log(`\nDownload-link audit — ${Object.keys(programs).length} programs, ${total} links\n`)

for (const [slug, hrefs] of Object.entries(programs)) {
  console.log(slug)
  for (const href of hrefs) {
    const host = href.includes('github.com') ? 'GitHub    ' : href.includes('mediafire') ? 'MediaFire ' : 'Drive     '
    try {
      const detail = await checkerFor(href)(href)
      console.log(`  ✓ ${host} ${detail}`)
    } catch (err) {
      broken += 1
      console.log(`  ✗ ${host} BROKEN — ${err.message}\n      ${href}`)
    }
  }
  for (const { href, version } of releases[slug] ?? []) {
    try {
      const detail = await checkerFor(href)(href)
      console.log(`  ✓ GitHub    v${version} · ${detail}`)
    } catch (err) {
      broken += 1
      console.log(`  ✗ GitHub    v${version} BROKEN — ${err.message}\n      ${href}`)
    }
  }
  console.log('')
}

console.log(broken === 0 ? `All ${total} links healthy.` : `${broken} broken link(s) — fix before deploying.`)
process.exit(broken === 0 ? 0 : 1)
