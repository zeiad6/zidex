// Free programs for the storefront Mini App's "free" section, generated from
// src/data/programs.ts — the one place the site lists them — so a new version or a
// dead mirror is fixed once, not in a hand-copied JSON that silently goes stale.
//
//   node scripts/store-apps.mjs        (part of `npm run build`)
import * as esbuild from 'esbuild'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'store-apps-'))
try {
  await esbuild.build({
    entryPoints: [join(root, 'src/data/programs.ts')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile: join(dir, 'p.mjs'),
    logLevel: 'silent',
  })
  const { programs, programKinds } = await import(pathToFileURL(join(dir, 'p.mjs')).href)
  const apps = programs.map((p) => ({
    slug: p.slug,
    name: p.name,
    name_en: p.nameEn,
    tagline: p.tagline,
    tagline_en: p.taglineEn,
    version: p.version,
    platform: p.platform,
    kind: p.kind,
    kind_label: programKinds[p.kind].label,
    kind_label_en: programKinds[p.kind].labelEn,
    // The site has no /programs/<slug> route; each platform is a section with this id.
    page: `https://zeidexsoft.com/programs#programs-${p.kind}`,
    downloads: p.downloads.map((d) => ({ href: d.href, host: d.host, size: d.size })),
  }))
  writeFileSync(join(root, 'public/store/apps.json'), JSON.stringify({ apps }, null, 2) + '\n')
  console.log(`store apps: ${apps.length} free programs → public/store/apps.json`)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
