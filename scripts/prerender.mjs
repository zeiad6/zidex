/**
 * Static HTML for every route, written next to the SPA after `vite build`.
 *
 * Without it, every URL answered with the same index.html: the homepage title and a
 * canonical pointing at "/", plus an empty #root until JavaScript ran. To a crawler every
 * page was a duplicate of the homepage. Each route now ships its own <title>,
 * description, canonical and Open Graph tags, and a readable summary inside #root that
 * React replaces on mount.
 *
 * Workers static assets map /shop → shop.html and /blog/x → blog/x.html
 * (html_handling: auto-trailing-slash), so no routing change is needed.
 *
 *   node scripts/prerender.mjs        # after vite build; part of `npm run build`
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://zeidexsoft.com'
const SITE = 'ZeidexSoft'

/** Node cannot import .ts, so data modules are bundled on the fly (as sync-post-meta does). */
async function load(entry) {
  const dir = mkdtempSync(join(tmpdir(), 'prerender-'))
  const out = join(dir, 'm.mjs')
  await esbuild.build({ entryPoints: [resolve(root, entry)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' })
  const mod = await import(`file://${out}`)
  rmSync(dir, { recursive: true, force: true })
  return mod
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const { allPosts } = await load('src/data/posts.ts')
const { programs } = await load('src/data/programs.ts')
const catalog = JSON.parse(readFileSync(resolve(root, 'public/store/catalog.json'), 'utf8'))
// Idempotent: a second run starts from the clean shell, not from last run's output.
const template = readFileSync(resolve(root, 'dist/index.html'), 'utf8').replace(
  /<div id="root"><main class="prerender">[\s\S]*?<\/main><\/div>/,
  '<div id="root"></div>',
)

const nav = `<nav><a href="/">الرئيسية</a> · <a href="/shop">المتجر</a> · <a href="/blog">المقالات</a> · <a href="/programs">البرامج</a> · <a href="/links">الروابط</a> · <a href="/about">عن المنصة</a></nav>`
const list = (items) => `<ul>${items.map(([href, text]) => `<li><a href="${href}">${esc(text)}</a></li>`).join('')}</ul>`

const routes = [
  {
    path: '/',
    title: null, // keep the homepage head as authored in index.html
    body: `<h1>ZeidexSoft — نبني بوتات تيليجرام وبرمجيات تعمل لعملك</h1>
      <p>بوتات متاجر وإدارة مجموعات وخدمة عملاء وحجوزات واشتراكات، بدفع بالنجوم والكريمي وتجربة مجانية 3 أيام، وبرامج احترافية ومقالات تقنية.</p>
      <h2>المتجر</h2>${list(catalog.products.filter((p) => p.category === 'bots').map((p) => [`/shop/${p.sku}`, p.title]))}
      <h2>أحدث المقالات</h2>${list(allPosts.slice(0, 6).map((p) => [`/blog/${p.slug}`, p.title]))}`,
  },
  {
    path: '/shop',
    title: `المتجر — ${SITE}`,
    description: 'بوت متجر رقمي على تيليجرام يقبل الدفع بالنجوم: باقة أساسية واحترافية واستضافة شهرية.',
    body: `<h1>بوت متجر رقمي يبيع عنك على تيليجرام</h1>
      <p>عملاؤك يدفعون بنجوم تيليجرام من داخل التطبيق، وتصلهم مشترياتهم وتصلك الطلبات فوراً.</p>
      ${list(catalog.products.map((p) => [`/shop/${p.sku}`, `${p.title} — ${p.stars} نجمة${p.usd ? ` أو $${p.usd}` : ''}`]))}`,
  },
  ...catalog.products.map((p) => ({
    path: `/shop/${p.sku}`,
    title: `${p.title} — ${SITE}`,
    description: p.description,
    image: `${ORIGIN}/store/img/products/${p.sku}.png`,
    body: `<h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>
      <p>السعر: ${p.stars} نجمة تيليجرام${p.monthly ? ' شهرياً' : ''}${p.usd ? ` — أو $${p.usd} على الموقع` : ''}.</p>
      ${p.features?.length ? `<h2>ما الذي تحصل عليه</h2><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}`,
  })),
  {
    path: '/blog',
    title: `المدونة — ${SITE}`,
    description: 'مقالات عملية مشروحة عن التقنية وصناعة المحتوى والتصميم.',
    body: `<h1>المدونة</h1>${list(allPosts.map((p) => [`/blog/${p.slug}`, p.title]))}`,
  },
  ...allPosts.map((p) => ({
    path: `/blog/${p.slug}`,
    title: `${p.title} — ${SITE}`,
    description: p.excerpt,
    body: `<article><h1>${esc(p.title)}</h1><p>${esc(p.excerpt)}</p>
      ${p.headings?.length ? `<ul>${p.headings.map((h) => `<li>${esc(h.text)}</li>`).join('')}</ul>` : ''}</article>`,
  })),
  {
    path: '/programs',
    title: `البرامج — ${SITE}`,
    description: 'برامج وتطبيقات جاهزة للتحميل من ZeidexSoft.',
    body: `<h1>برامج جاهزة للتحميل</h1>${list(programs.map((p) => [p.post ? `/blog/${p.post}` : '/programs', `${p.name} v${p.version} — ${p.tagline}`]))}`,
  },
  {
    path: '/templates',
    title: `قوالب المتاجر — ${SITE}`,
    description: 'قوالب متاجر إلكترونية جاهزة: عربية أولاً، إنجليزية كاملة، صفر تبعيات، وأعلى معايير الأمان — تُجرَّب حية قبل أن تُشترى.',
    body: `<h1>قوالب متاجر تُجرَّب قبل أن تُشترى</h1>
      <p>ثلاثة متاجر كاملة بهويات مختلفة، كل قالب عربي أولاً (RTL) مع إنجليزية كاملة، صفر تبعيات تشغيلية، ورؤوس أمان صارمة.</p>
      ${list(catalog.products.filter((p) => p.category === 'sites').map((p) => [`/shop/${p.sku}`, `${p.title} — ${p.stars} نجمة أو $${p.usd}`]))}`,
  },
  ...catalog.products
    .filter((p) => p.category === 'sites')
    .map((p) => ({
      path: `/shop/${p.sku}`,
      title: `${p.title} — ${SITE}`,
      description: p.description,
      image: `${ORIGIN}/store/img/products/${p.sku}.png`,
      body: `<h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>
        <p>السعر: ${p.stars} نجمة تيليجرام${p.usd ? ` — أو $${p.usd} على الموقع` : ''}.</p>
        ${p.features?.length ? `<h2>ما الذي تحصل عليه</h2><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}`,
    })),
  { path: '/links', title: `الروابط — ${SITE}`, description: 'كل الروابط المهمة لـ ZeidexSoft في مكان واحد.', body: '<h1>الروابط</h1>' },
  { path: '/about', title: `عن المنصة — ${SITE}`, description: 'عن تصميم وتقنية ZeidexSoft، وسياسة الخصوصية.', body: '<h1>عن المنصة</h1>' },
]

function render({ path, title, description, image, body }) {
  let html = template
  const url = `${ORIGIN}${path}`
  if (title) {
    // Attributes in index.html wrap across lines, so whitespace between them is \s+.
    const meta = (attr, key, value) => {
      html = html.replace(new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*"`), (_m, pre) => `${pre}${esc(value)}"`)
    }
    html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(title)}</title>`)
    html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*"/, (_m, pre) => `${pre}${url}"`)
    meta('name', 'description', description)
    meta('property', 'og:title', title)
    meta('property', 'og:description', description)
    meta('property', 'og:url', url)
    meta('name', 'twitter:title', title)
    meta('name', 'twitter:description', description)
    if (image) {
      meta('property', 'og:image', image)
      meta('name', 'twitter:image', image)
    }
  }
  // Function replacements: a `$&` or `$'` in post text must never be expanded.
  return html.replace('<div id="root"></div>', () => `<div id="root"><main class="prerender">${nav}${body}</main></div>`)
}

// The sitemap is generated from the same route list, so a new post or product can never
// be missing from it.
const today = new Date().toISOString().slice(0, 10)
const lastmod = (path) => allPosts.find((p) => `/blog/${p.slug}` === path)?.date ?? today
writeFileSync(
  resolve(root, 'dist/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes
      .map(({ path }) => `  <url><loc>${ORIGIN}${path}</loc><lastmod>${lastmod(path)}</lastmod></url>`)
      .join('\n') +
    '\n</urlset>\n',
)

// Free content the Telegram bot shows (/free, /articles): one export, so the bot can
// never list a program or article the site does not have.
mkdirSync(resolve(root, 'dist/data'), { recursive: true })
writeFileSync(
  resolve(root, 'dist/data/site.json'),
  JSON.stringify({
    programs: programs.map((p) => ({
      slug: p.slug, name: p.name, version: p.version, platform: p.platform, kind: p.kind,
      tagline: p.tagline, post: p.post ?? null,
      downloads: p.downloads.map((d) => ({ host: d.host, href: d.href, size: d.size })),
    })),
    posts: allPosts.map((p) => ({ slug: p.slug, title: p.title, category: p.category, excerpt: p.excerpt, date: p.date })),
  }),
)

let count = 0
for (const route of routes) {
  const file = route.path === '/' ? 'dist/index.html' : `dist${route.path}.html`
  mkdirSync(dirname(resolve(root, file)), { recursive: true })
  writeFileSync(resolve(root, file), render(route))
  count++
}
console.log(`prerendered ${count} routes`)
