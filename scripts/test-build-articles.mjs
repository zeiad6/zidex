// The article renderer turns post text into HTML: escaping and href filtering
// are the trust boundary, and every block type in the data must have a renderer.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { inline, renderBlock, safeHref } from './build-articles.mjs'

assert.equal(inline('a <b> & "c"'), 'a &lt;b&gt; &amp; &quot;c&quot;')
assert.equal(inline('**x** *y* `z<`'), '<strong>x</strong> <em>y</em> <code dir="ltr">z&lt;</code>')
assert.equal(inline('[t](/blog.html)'), '<a href="/blog.html">t</a>')
assert.match(inline('[t](https://e.com/a?b=1&c=2)'), /href="https:\/\/e\.com\/a\?b=1&amp;c=2" target="_blank" rel="noopener noreferrer"/)
for (const bad of ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
  assert.equal(safeHref(bad), null, bad)
  assert.ok(!inline(`[t](${bad})`).includes('href'), `no link for ${bad}`)
}
assert.match(renderBlock({ type: 'code', lang: 'html', code: '<script>x</script>' }), /&lt;script&gt;x&lt;\/script&gt;/)
assert.throws(() => renderBlock({ type: 'nope' }), /no renderer/)

const pages = readdirSync('dist_pages/blog').filter((f) => f.endsWith('.html'))
assert.ok(pages.length >= 18, `expected article pages, found ${pages.length}`)
for (const file of pages) {
  const html = readFileSync(`dist_pages/blog/${file}`, 'utf8')
  const slug = file.replace(/\.html$/, '')
  assert.ok(html.includes(`<link rel="canonical" href="https://zeidexsoft.com/blog/${slug}"`), `${file}: canonical`)
  assert.ok(html.includes('<article class="post">') && html.includes('class="post-body"'), `${file}: article body`)
  assert.ok(!/\sonclick="/.test(html.slice(html.indexOf('<article'), html.indexOf('</article>'))), `${file}: inline handler in article`)
  for (const tag of ['div', 'section', 'article', 'ol', 'ul', 'table', 'figure']) {
    const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length
    assert.equal(open, close, `${file}: <${tag}> ${open} open / ${close} close`)
  }
}
const course = readFileSync('dist_pages/blog/craft-of-selfteaching.html', 'utf8')
assert.equal((course.match(/videos\/rendered\/(ar|en)_[\w-]+\.mp4/g) || []).length, 32, 'two players + 30 chapter links')
console.log(`✓ renderer escapes and filters; ${pages.length} article pages are well-formed`)
