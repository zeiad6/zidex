// The filter wrapper in public/fx/site-fx.js must still run the page's own
// filter, and must not leave view-transition names behind (they would join
// every page-to-page transition).
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { JSDOM, VirtualConsole } from 'jsdom'

const src = readFileSync('public/fx/site-fx.js', 'utf8')

const dom = new JSDOM(
  '<!doctype html><body><div class="prog-card"></div><div class="prog-card"></div></body>',
  { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: new VirtualConsole() }
)
const { window } = dom
const { document } = window

let calls = 0
let namesDuringUpdate = 0
window.filterPrograms = function (arg) {
  calls += arg
  namesDuringUpdate = [...document.querySelectorAll('.prog-card')].filter((c) => c.style.viewTransitionName).length
}

let release
document.startViewTransition = (update) => {
  update()
  return { finished: new Promise((resolve) => (release = resolve)) }
}

window.eval(src)

assert.notEqual(window.filterPrograms.length, 1, 'filterPrograms was not wrapped')
window.filterPrograms(7)
assert.equal(calls, 7, 'the original filter did not run with its arguments')
assert.equal(namesDuringUpdate, 2, 'cards carry no transition name during the update')
assert.ok(document.documentElement.classList.contains('fx-filtering'), 'fx-filtering not set while running')

release()
await new Promise((resolve) => setTimeout(resolve, 0))
assert.ok(!document.documentElement.classList.contains('fx-filtering'), 'fx-filtering not cleared')
assert.equal(
  [...document.querySelectorAll('.prog-card')].filter((c) => c.style.viewTransitionName).length,
  0,
  'transition names left behind'
)

console.log('fx filter motion: all checks passed')
