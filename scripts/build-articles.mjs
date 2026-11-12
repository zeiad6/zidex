/* Static article pages for the seven-page site.
 *
 * The section pages are plain HTML, but /blog/<slug> was still produced by the
 * old SPA prerender, whose template no longer has a #root: every article URL
 * answered with the home page under the article's <title>. This script renders
 * each post (src/data/posts.ts + postBodies.ts) into the blog.html shell, and
 * regenerates the card grid in blog.html from the same list, so a new post is
 * one data entry and never a hand-written card.
 *
 *   node scripts/build-articles.mjs                 # blog.html grid + dist and dist_pages, under blog/
 *   node scripts/build-articles.mjs --out some/dir  # pages into some/dir/blog
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://zeidexsoft.com'
const SITE = 'ZeidexSoft'

/** Node cannot import .ts, so data modules are bundled on the fly (as prerender does). */
async function load(entry) {
  const dir = mkdtempSync(join(tmpdir(), 'articles-'))
  const out = join(dir, 'm.mjs')
  await esbuild.build({ entryPoints: [resolve(root, entry)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' })
  const mod = await import(`file://${out}`)
  rmSync(dir, { recursive: true, force: true })
  return mod
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** Post text is authored in-repo, but an unfiltered href is still a javascript: sink. */
export const safeHref = (href) => (/^(https?:\/\/|\/|#|mailto:)/i.test(href.trim()) ? href.trim() : null)

/** **bold**, *italic*, `code`, [text](url) — the same four forms the React Prose accepts. */
export function inline(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
    .map((token) => {
      if (/^\*\*[^*]+\*\*$/.test(token)) return `<strong>${esc(token.slice(2, -2))}</strong>`
      if (/^\*[^*]+\*$/.test(token)) return `<em>${esc(token.slice(1, -1))}</em>`
      if (/^`[^`]+`$/.test(token)) return `<code dir="ltr">${esc(token.slice(1, -1))}</code>`
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (link) {
        const href = safeHref(link[2])
        if (!href) return esc(link[1])
        const external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${esc(href)}"${external}>${esc(link[1])}</a>`
      }
      return esc(token)
    })
    .join('')
}

const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6-6l-6 6 6 6"/></svg>'
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>'
const items = (list) => list.map((item) => `<li>${inline(item)}</li>`).join('')

export function renderBlock(block) {
  switch (block.type) {
    case 'p':
      return `<p>${inline(block.text)}</p>`
    case 'h2':
      return `<h2 id="${esc(block.id)}">${inline(block.text)}</h2>`
    case 'h3':
      return `<h3 id="${esc(block.id)}">${inline(block.text)}</h3>`
    case 'ul':
      return `<ul>${items(block.items)}</ul>`
    case 'ol':
      return `<ol>${items(block.items)}</ol>`
    case 'quote':
      return `<blockquote><p>${inline(block.text)}</p>${block.by ? `<cite>${esc(block.by)}</cite>` : ''}</blockquote>`
    case 'callout':
      return `<aside class="post-callout post-callout--${esc(block.tone)}"><p class="post-callout-title">${inline(block.title)}</p><ul>${items(block.items)}</ul></aside>`
    case 'code':
      return `<div class="post-code" dir="ltr"><span class="post-code-lang">${esc(block.lang)}</span><pre tabindex="0"><code>${esc(block.code)}</code></pre></div>`
    case 'stats':
      return `<dl class="post-stats">${block.items.map((s) => `<div><dt>${esc(s.value)}</dt><dd>${inline(s.label)}</dd></div>`).join('')}</dl>`
    case 'checklist':
      return `<ul class="post-checklist">${block.items.map((item) => `<li>${CHECK}<span>${inline(item)}</span></li>`).join('')}</ul>`
    case 'table':
      return `<div class="post-table" tabindex="0" role="region" aria-label="${esc(block.caption ?? 'جدول')}"><table>${block.caption ? `<caption>${esc(block.caption)}</caption>` : ''}<thead><tr>${block.head.map((h) => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    case 'divider':
      return '<hr>'
    case 'image':
      return `<figure class="post-figure"><picture><source srcset="${esc(block.src)}" type="image/webp"><img src="${esc(block.fallback)}" alt="${esc(block.alt)}" loading="lazy" decoding="async"></picture>${block.caption ? `<figcaption>${inline(block.caption)}</figcaption>` : ''}</figure>`
    case 'download': {
      const sources = [block, ...(block.also ?? [])]
      return `<div class="post-download">${sources
        .map((src) => {
          const href = safeHref(src.href)
          return `<div class="post-download-row"><div><p class="post-download-label">${esc(src.label)}</p><p class="post-download-meta" dir="ltr">${esc(src.meta)}</p></div>${href ? `<a class="prog-download" href="${esc(href)}" target="_blank" rel="noopener noreferrer">فتح</a>` : ''}</div>`
        })
        .join('')}</div>`
    }
    case 'hub':
      return `<figure class="post-hub"><div class="post-hub-center"><strong>${esc(block.center.title)}</strong><span>${esc(block.center.sub)}</span></div><ul>${block.nodes.map((n) => `<li><strong>${esc(n.title)}</strong><span>${esc(n.sub)}</span><em>${esc(n.role)}</em></li>`).join('')}</ul>${block.caption ? `<figcaption>${inline(block.caption)}</figcaption>` : ''}</figure>`
    case 'videos': {
      const first = block.items[0]
      // Each chapter is a real link to its file, so the list works with scripts
      // off; site-fx.js upgrades a click into "play it in the player above".
      return `<figure class="post-player" data-fx-player dir="${block.lang === 'ar' ? 'rtl' : 'ltr'}"><video controls playsinline preload="metadata" src="${esc(first.src)}"></video><p class="post-player-now" aria-live="polite">${esc(first.title)}</p><ol>${block.items
        .map((item, i) => `<li><a href="${esc(item.src)}"${i === 0 ? ' aria-current="true"' : ''}>${PLAY}<span>${esc(item.title)}</span></a></li>`)
        .join('')}</ol>${block.caption ? `<figcaption>${inline(block.caption)}</figcaption>` : ''}</figure>`
    }
    default:
      throw new Error(`build-articles: no renderer for block type "${block.type}"`)
  }
}

const dateLabel = (iso) => new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn' }).format(new Date(`${iso}T00:00:00Z`))

/* ------------------------------------------------------------ card artwork */

const HUES = { emerald: '#34d399', sky: '#38bdf8', amber: '#fbbf24', rose: '#fb7185', teal: '#2dd4bf', ghost: '#a78bfa', veil: '#94a3b8', tiktok: '#f472b6' }
const GLYPHS = {
  terminal: '<path d="M4 17l6-5-6-5M12 19h8"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  package: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  download: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
}

/** A 16:10 tile for a post with no screenshot: one hue, its cover glyph, its Latin tags. */
function tile(post) {
  const hue = HUES[(post.coverFrom.match(/^from-([a-z]+)/) || [])[1]] ?? HUES.sky
  const glyph = GLYPHS[post.cover] ?? GLYPHS.spark
  const label = post.tags.filter((t) => /^[\x20-\x7E]+$/.test(t)).slice(0, 3).join('  ·  ').toUpperCase()
  const stroke = `fill="none" stroke="${hue}" stroke-linecap="round" stroke-linejoin="round"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" role="img" aria-label="${esc(post.title)}">
<defs><radialGradient id="g" cx="0.85" cy="0.08" r="0.95"><stop offset="0" stop-color="${hue}" stop-opacity="0.32"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient></defs>
<rect width="640" height="400" fill="#070b16"/><rect width="640" height="400" fill="url(#g)"/>
<g transform="translate(318 62) scale(13)" ${stroke} stroke-width="0.9" opacity="0.2">${glyph}</g>
<rect x="40" y="40" width="76" height="76" rx="20" fill="${hue}" fill-opacity="0.12" stroke="${hue}" stroke-opacity="0.42"/>
<g transform="translate(57 57) scale(1.75)" ${stroke} stroke-width="1.7">${glyph}</g>
<rect x="40" y="252" width="300" height="14" rx="7" fill="#fff" fill-opacity="0.16"/><rect x="40" y="282" width="212" height="14" rx="7" fill="#fff" fill-opacity="0.09"/>
${label ? `<text x="40" y="350" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="17" font-weight="700" letter-spacing="2" fill="${hue}">${esc(label)}</text>` : ''}
</svg>
`
}

/** The post's own first screenshot when it has one on disk, else a generated tile. */
function thumbFor(post, body) {
  const shot = body.find((b) => b.type === 'image' && existsSync(resolve(root, 'public', b.src.replace(/^\//, ''))))
  if (shot) return shot.src
  mkdirSync(resolve(root, 'public/fx/posts'), { recursive: true })
  writeFileSync(resolve(root, 'public/fx/posts', `${post.slug}.svg`), tile(post))
  return `/fx/posts/${post.slug}.svg`
}

function card(post, thumb, extra = '') {
  const href = `/blog/${post.slug}.html`
  return `          <article class="prog-card post-card"${extra}>
            <a class="prog-thumb" href="${href}" tabindex="-1" aria-hidden="true">
              <img src="${esc(thumb)}" alt="" width="640" height="400" loading="lazy" decoding="async">
            </a>
            <div class="prog-body">
              <div class="prog-meta">
                <span class="prog-badge">${esc(post.category)}</span>
                <time class="prog-dl prog-dl--direct" datetime="${post.date}"><span>${dateLabel(post.date)} · ${post.readMinutes} د</span></time>
              </div>
              <h3 class="prog-title"><a href="${href}">${esc(post.title)}</a></h3>
              <p class="prog-desc">${esc(post.excerpt)}</p>
              <div class="prog-actions">
                <a class="prog-download" href="${href}" aria-label="قراءة: ${esc(post.title)}"><span>قراءة المقال</span>${ARROW}</a>
              </div>
            </div>
          </article>`
}

function article(post, body, prev, next) {
  const toc = post.headings.filter((h) => h.level === 2)
  const sibling = (p, label) => (p ? `<a href="/blog/${p.slug}.html"><span>${label}</span><strong>${esc(p.title)}</strong></a>` : '<span></span>')
  return `    <article class="post">
      <header class="post-head">
        <a class="post-back" href="/blog.html">${ARROW}<span>كل المقالات</span></a>
        <h1>${esc(post.title)}</h1>
        <p class="post-lede">${esc(post.excerpt)}</p>
        <p class="post-meta"><span>${esc(post.category)}</span><time datetime="${post.date}">${dateLabel(post.date)}</time><span>${post.readMinutes} دقائق قراءة</span></p>
      </header>
      ${toc.length > 2 ? `<nav class="post-toc" aria-label="محتويات المقال"><p>في هذا المقال</p><ol>${toc.map((h) => `<li><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join('')}</ol></nav>` : ''}
      <div class="post-body">
${body.map(renderBlock).join('\n')}
      </div>
      <footer class="post-foot">
        <ul class="post-tags">${post.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <nav class="post-siblings" aria-label="مقالات أخرى">${sibling(next, 'الأحدث')}${sibling(prev, 'الأقدم')}</nav>
      </footer>
    </article>
`
}

const GRID_START = '<!-- articles:start (generated by scripts/build-articles.mjs) -->'
const GRID_END = '<!-- articles:end -->'
const CONTENT = /    <section class="pt-8 pb-6 border-b[\s\S]*?(?=\n  <!-- Footer -->)/

function page(shell, post, body, prev, next) {
  const url = `${ORIGIN}/blog/${post.slug}`
  const title = `${post.title} — ${SITE}`
  const meta = (html, attr, key, value) => html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*"`), (_m, pre) => `${pre}${esc(value)}"`)
  let html = shell.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`)
  html = html.replace(/(<link rel="canonical" href=")[^"]*"/, (_m, pre) => `${pre}${url}"`)
  html = meta(html, 'name', 'description', post.excerpt)
  html = meta(html, 'name', 'keywords', post.tags.join(', '))
  html = meta(html, 'property', 'og:type', 'article')
  html = meta(html, 'property', 'og:url', url)
  html = meta(html, 'property', 'og:title', title)
  html = meta(html, 'property', 'og:description', post.excerpt)
  if (!CONTENT.test(html)) throw new Error('build-articles: blog.html content region not found')
  // Function replacement: a `$&` in post text must never be expanded.
  return html.replace(CONTENT, () => article(post, body, prev, next))
}

async function main() {
  const { allPosts } = await load('src/data/posts.ts')
  const { postBodies } = await load('src/data/postBodies.ts')
  const posts = allPosts.filter((p) => postBodies[p.slug])

  // 1. The index grid inside blog.html.
  const blogPath = resolve(root, 'blog.html')
  let shell = readFileSync(blogPath, 'utf8')
  const thumbs = Object.fromEntries(posts.map((p) => [p.slug, thumbFor(p, postBodies[p.slug])]))
  const grid = `${GRID_START}\n        <div class="prog-grid">\n${posts.map((p) => card(p, thumbs[p.slug])).join('\n')}\n        </div>\n        ${GRID_END}`
  if (shell.includes(GRID_START)) {
    shell = shell.replace(new RegExp(`${GRID_START.replace(/[()]/g, '\\$&')}[\\s\\S]*?${GRID_END}`), () => grid)
  } else {
    const legacy = /<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">[\s\S]*?(?=\n\n      <\/div>\n    <\/section>\n\n  <!-- Footer -->)/
    if (!legacy.test(shell)) throw new Error('build-articles: blog.html card grid not found')
    shell = shell.replace(legacy, () => grid)
  }
  writeFileSync(blogPath, shell)

  // 1b. The three newest posts on the home page. index.html reveals only
  // elements that carry [data-reveal], so the tiles opt in explicitly.
  const homePath = resolve(root, 'index.html')
  const home = readFileSync(homePath, 'utf8')
  const HOME = /<!-- home-articles:start[^>]*-->[\s\S]*?<!-- home-articles:end -->/
  if (!HOME.test(home)) throw new Error('build-articles: index.html home-articles markers not found')
  writeFileSync(
    homePath,
    home.replace(HOME, () => `<!-- home-articles:start (generated by scripts/build-articles.mjs) -->\n        <div class="prog-grid home-posts">\n${posts.slice(0, 3).map((p) => card(p, thumbs[p.slug], ' data-reveal')).join('\n')}\n        </div>\n        <!-- home-articles:end -->`),
  )

  // 2. One page per post.
  const flag = process.argv.indexOf('--out')
  const outs = flag > -1 ? [process.argv[flag + 1]] : ['dist', 'dist_pages'].filter((d) => existsSync(resolve(root, d)))
  for (const out of outs) {
    const dir = resolve(root, out, 'blog')
    mkdirSync(dir, { recursive: true })
    posts.forEach((post, i) => {
      // allPosts is newest first: i - 1 is newer, i + 1 is older.
      writeFileSync(join(dir, `${post.slug}.html`), page(shell, post, postBodies[post.slug], posts[i + 1], posts[i - 1]))
    })
  }
  console.log(`✔ ${posts.length} article cards → blog.html · 3 → index.html · ${posts.length} article pages → ${outs.map((o) => `${o}/blog`).join(', ') || '(no output dir)'}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
