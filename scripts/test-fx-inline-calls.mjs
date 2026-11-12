// Every onclick="…" in the seven section pages must be understood by the CSP-safe
// dispatcher in public/fx/site-fx.js, or that control is dead on the live site.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync('public/fx/site-fx.js', 'utf8')
const block = src.slice(src.indexOf('var CALL_SHAPE'), src.indexOf('function initInlineCalls'))
const parseInlineCall = new Function(block + '; return parseInlineCall;')()

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
let total = 0
for (const page of ['index', 'about', 'blog', 'bots', 'programs', 'templates', 'trial']) {
  const html = readFileSync(`${page}.html`, 'utf8')
  for (const [, raw] of html.matchAll(/\sonclick="([^"]*)"/g)) {
    if (!raw.trim()) continue
    const source = decode(raw)
    const call = parseInlineCall(source)
    assert.ok(call, `${page}.html: unparsed handler ${source.slice(0, 80)}`)
    // Same values the browser would have produced by evaluating the literals.
    const expected = new Function('document', `var out; (function ${call.name}(){ out = [].slice.call(arguments) })(${source.slice(source.indexOf('(') + 1, source.lastIndexOf(')'))}); return out;`)(
      { getElementById: (id) => ({ value: `#${id}.value`, textContent: `#${id}.textContent` }) },
    )
    const actual = call.args.map((a) => (a.id ? `#${a.id}.${a.prop}` : a.text))
    assert.deepEqual(actual, expected, `${page}.html: ${source.slice(0, 80)}`)
    total++
  }
}
for (const bad of ["eval('x')", "open('javascript:1')", "openX(alert(1))", "closeX(); fetch('/')", "setX('a' + b)"]) {
  assert.equal(parseInlineCall(bad), null, `must reject: ${bad}`)
}
console.log(`✓ ${total} inline handlers parsed and matched; 5 hostile shapes rejected`)
