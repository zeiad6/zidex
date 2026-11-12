import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const REPOS = [
  'zeiad6/yusr', 'zeiad6/Edms-archive', 'zeiad6/Edms-archive-Android',
  'storytold/wordcraft', 'storytold/gridcraft', 'storytold/deckcraft', 'storytold/photocraft',
  'storytold/artcraft', 'storytold/filmcraft', 'storytold/vectorcraft', 'storytold/designcraft',
  'storytold/effectcraft', 'storytold/soundcraft', 'storytold/lightcraft', 'storytold/figcraft',
  'storytold/pdfcraft', 'storytold/cadcraft', 'storytold/craft-launcher'
]

const gh = (path) => JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 1 << 26 }))

const out = {}
for (const repo of REPOS) {
  const latest = gh(`repos/${repo}/releases/latest`)
  const releases = gh(`repos/${repo}/releases?per_page=100`)
  const total = releases.reduce((s, r) => s + (r.assets || []).reduce((x, a) => x + a.download_count, 0), 0)
  out[repo] = {
    tag: latest.tag_name,
    published: (latest.published_at || '').slice(0, 10),
    total,
    releases: releases.length,
    assets: (latest.assets || [])
      .filter((a) => /\.(msi|exe|deb|dmg|apk)$/i.test(a.name))
      .map((a) => ({ name: a.name, mb: +(a.size / 1048576).toFixed(1), dl: a.download_count }))
  }
  console.error(repo, latest.tag_name, total, out[repo].assets.length)
}

writeFileSync(new URL('../data/gh-releases.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
console.error('written')
