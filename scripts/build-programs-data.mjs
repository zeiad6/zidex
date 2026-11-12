import fs from 'node:fs'

const html = fs.readFileSync('programs.html', 'utf8')
const dataset = JSON.parse(html.match(/const progsDataset = (\[.*?\]);/s)[1])
const gh = JSON.parse(fs.readFileSync('data/gh-releases.json', 'utf8'))

const META = {
  yusr: { repo: 'zeiad6/yusr', short: 'يُسر', art: 'ledger', accent: '#10b981', tagline: 'دفتر أستاذ مشفّر' },
  verityscope: { short: 'VerityScope', art: 'scan', accent: '#06b6d4', tagline: 'كشف التزييف محلياً' },
  'zeidex-convert-android': { short: 'Convert', art: 'device', accent: '#06b6d4', tagline: 'تحويل بلا إنترنت', mediafire: true },
  'edms-archive-pro': { repo: 'zeiad6/Edms-archive', short: 'EDMS', art: 'archive', accent: '#10b981', tagline: 'أرشفة موقّعة' },
  'edms-archive-android': { repo: 'zeiad6/Edms-archive-Android', short: 'EDMS Go', art: 'device', accent: '#06b6d4', tagline: 'أرشيف في جيبك' },
  wordcraft: { repo: 'storytold/wordcraft', short: 'WordCraft', art: 'page', accent: '#3b82f6' },
  gridcraft: { repo: 'storytold/gridcraft', short: 'GridCraft', art: 'sheet', accent: '#3b82f6' },
  deckcraft: { repo: 'storytold/deckcraft', short: 'DeckCraft', art: 'slides', accent: '#3b82f6' },
  photocraft: { repo: 'storytold/photocraft', short: 'PhotoCraft', art: 'photo', accent: '#8b5cf6' },
  artcraft: { repo: 'storytold/artcraft', short: 'ArtCraft', art: 'paint', accent: '#8b5cf6' },
  filmcraft: { repo: 'storytold/filmcraft', short: 'FilmCraft', art: 'timeline', accent: '#8b5cf6' },
  vectorcraft: { repo: 'storytold/vectorcraft', short: 'VectorCraft', art: 'vector', accent: '#8b5cf6' },
  designcraft: { repo: 'storytold/designcraft', short: 'DesignCraft', art: 'layout', accent: '#8b5cf6' },
  effectcraft: { repo: 'storytold/effectcraft', short: 'EffectCraft', art: 'vfx', accent: '#8b5cf6' },
  soundcraft: { repo: 'storytold/soundcraft', short: 'SoundCraft', art: 'audio', accent: '#8b5cf6' },
  lightcraft: { repo: 'storytold/lightcraft', short: 'LightCraft', art: 'raw', accent: '#8b5cf6' },
  figcraft: { repo: 'storytold/figcraft', short: 'FigCraft', art: 'ui', accent: '#8b5cf6' },
  pdfcraft: { repo: 'storytold/pdfcraft', short: 'PdfCraft', art: 'pdf', accent: '#8b5cf6' },
  cadcraft: { repo: 'storytold/cadcraft', short: 'CadCraft', art: 'cad', accent: '#8b5cf6' },
  'craft-launcher': { repo: 'storytold/craft-launcher', short: 'Launcher', art: 'tiles', accent: '#8b5cf6' }
}

const PLATFORM_LABEL = {
  '.msi': 'Windows 10+',
  '.exe': 'Windows 10+',
  '.deb': 'Linux x64',
  '.dmg': 'macOS Universal',
  '.apk': 'Android 8+'
}

const out = dataset.map((p) => {
  const meta = META[p.slug]
  if (!meta) throw new Error('missing meta for ' + p.slug)

  let version = p.version
  let rawVersion = p.rawVersion
  let links = p.links
  let downloads = null
  let released = null

  if (meta.repo) {
    const rel = gh[meta.repo]
    if (!rel) throw new Error('missing release data for ' + meta.repo)
    rawVersion = rel.tag.replace(/^[a-z-]*v?/i, '').replace(/^artcraft-v/i, '')
    version = 'v' + rawVersion
    released = rel.published
    downloads = rel.total
    const base = `https://github.com/${meta.repo}/releases/download/${rel.tag}/`
    links = []
    const pick = (pattern, label, host = 'GitHub') => {
      const asset = rel.assets.find((a) => pattern.test(a.name))
      if (!asset) return
      const ext = asset.name.slice(asset.name.lastIndexOf('.'))
      links.push({
        href: base + asset.name,
        host,
        size: asset.mb + ' MB',
        text: `${label} (${ext.slice(1).toUpperCase()} ${asset.mb} MB)`,
        platform: PLATFORM_LABEL[ext] || label,
        primary: links.length === 0
      })
    }
    pick(/windows-x64\.msi$/, 'Windows x64')
    pick(/x64_en-US\.msi$/, 'Windows x64')
    pick(/x64-setup\.exe$/, 'Windows x64')
    pick(/Setup-x64\.exe$/, 'Windows x64')
    pick(/windows-x64-portable\.zip$/, 'Windows محمول')
    pick(/linux-x86_64\.deb$/, 'Linux x64')
    pick(/_amd64\.deb$/, 'Linux x64')
    pick(/-zeidex\.apk$/, 'Android APK')
    pick(/app-release\.apk$/, 'Android APK')
    pick(/macos-universal\.dmg$/, 'macOS')
    pick(/universal\.dmg$/, 'macOS')
    // One row per platform keeps the card and the modal from repeating a build.
    links = links.filter((link, i) => links.findIndex((l) => l.platform === link.platform) === i)
    if (!links.length) throw new Error('no assets for ' + meta.repo)
    if (!links.some((l) => l.primary)) links[0].primary = true
  } else {
    links = p.links.map((l, i) => ({ ...l, platform: p.platform, primary: i === 0 }))
  }

  return {
    id: p.id,
    slug: p.slug,
    cat: p.cat,
    badge: p.badge,
    platform: p.platform,
    title: p.title,
    desc: p.desc,
    items: p.items,
    version,
    rawVersion,
    released,
    downloads,
    repo: meta.repo || null,
    short: meta.short,
    art: meta.art,
    accent: meta.accent,
    tagline: meta.tagline || p.badge,
    links
  }
})

const total = out.reduce((s, p) => s + (p.downloads || 0), 0)
fs.writeFileSync('data/programs.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), total, programs: out }, null, 2) + '\n')
console.log('programs', out.length, 'verified total', total)
for (const p of out) console.log(String(p.id).padStart(2), p.slug.padEnd(24), p.version.padEnd(14), String(p.downloads).padStart(8), p.links.length + ' links')
