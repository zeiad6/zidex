/* Regenerates the program catalogue from data/programs.json:
   - public/fx/apps/<slug>.svg   product tile artwork
   - the card grid, the modal dataset, the totals in programs.html
   Run with --fetch first (scripts/fetch-releases.mjs) to pull new releases. */

import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/programs.json'), 'utf8'))
const programs = data.programs

const ACCENT2 = {
  '#10b981': '#22d3ee',
  '#06b6d4': '#3b82f6',
  '#3b82f6': '#22d3ee',
  '#8b5cf6': '#ec4899'
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const nf = new Intl.NumberFormat('en-US')

// The seal marks software ZeidexSoft built. Third-party builds the site only
// redistributes (a repo under another owner) must not carry it.
const own = (p) => !p.repo || p.repo.startsWith('zeiad6/')

const chip = (n) =>
  n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n)

/* ------------------------------------------------------------------ tiles */

const rect = (x, y, w, h, rx, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`
const line = (x, y, w, h, fill, op = 0.14) => rect(x, y, w, h, h / 2, fill, `opacity="${op}"`)
const dot = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`
const txt = (x, y, size, fill, body, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(body)}</text>`

const GLYPHS = {
  ledger: '<path d="M4 5h16M4 12h9M4 19h6"/><circle cx="18" cy="17" r="3.4"/><path d="M18 13.6v3.4l2 1.4"/>',
  scan: '<path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3"/><circle cx="12" cy="12" r="3"/>',
  device: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 5.5h3"/><path d="M12 18.4h.01"/>',
  archive: '<path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l2-3h14l2 3"/><path d="M9 12h6"/>',
  page: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
  sheet: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M3.5 15h17M9.5 4v16M15 4v16"/>',
  slides: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M12 17v3M9 20h6"/><path d="M10 9.5l4 2.5-4 2.5z"/>',
  photo: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-6 6-2-2-5 5"/>',
  paint: '<path d="M4 20c4 1 5-2 5-4M14 4l6 6-9 9-6-6z"/><path d="M4 20l4-1-3-3z"/>',
  timeline: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M10 9.5l4 2.5-4 2.5z"/><path d="M6 20h12"/>',
  vector: '<path d="M5 19C9 6 15 18 19 5"/><rect x="3" y="17" width="4" height="4" rx="1"/><rect x="17" y="3" width="4" height="4" rx="1"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M3 9h18"/>',
  vfx: '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M18 16l.9 2.1 2.1.9-2.1.9L18 22l-.9-2.1-2.1-.9 2.1-.9z"/>',
  audio: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
  raw: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
  ui: '<rect x="3" y="4" width="10" height="8" rx="1.6"/><rect x="11" y="12" width="10" height="8" rx="1.6"/><path d="M15 15l3 6 1.2-2.6 2.8-.6z"/>',
  pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><circle cx="15" cy="16" r="2.6"/><path d="M15 13.4V16"/>',
  cad: '<path d="M3 20V8l6-4 6 4v12"/><path d="M3 20h12"/><path d="M15 8l6-3v12l-6 3"/><path d="M8 12h4"/>',
  tiles: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>'
}

const ART = {
  /* finance ledger: rows, amounts, hash chain */
  ledger: (a) => `
    ${line(22, 50, 74, 7, a, 0.95)}
    ${rect(22, 66, 306, 1, 0, '#fff', 'opacity=".08"')}
    ${[0, 1, 2, 3].map((i) => {
      const y = 80 + i * 44
      return `${line(22, y, 140 - i * 12, 9, '#fff', 0.16)}
        ${line(22, y + 15, 96, 6, '#fff', 0.07)}
        ${rect(238, y - 4, 74, 20, 6, a, 'opacity=".16"')}
        ${line(248, y + 3, 40 + i * 6, 6, a, 0.85)}`
    }).join('')}
    ${rect(170, 74, 46, 168, 10, '#ffffff', 'opacity=".03"')}
    ${[0, 1, 2, 3].map((i) => dot(193, 92 + i * 44, 4, i < 3 ? a : '#ffffff', `opacity="${i < 3 ? 0.9 : 0.25}"`)).join('')}
    <path d="M193 96V220" stroke="${a}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 6"/>`,

  sheet: (a) => `
    ${rect(20, 48, 312, 20, 6, '#fff', 'opacity=".06"')}
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${76 + i * 52} 48v200" stroke="#fff" stroke-opacity=".07"/>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M20 ${68 + i * 30}h312" stroke="#fff" stroke-opacity=".07"/>`).join('')}
    ${rect(20, 98, 312, 30, 0, a, 'opacity=".1"')}
    ${line(28, 56, 34, 6, '#fff', 0.22)}
    ${[0, 1, 2, 3].map((i) => line(84 + i * 52, 56, 30, 6, a, 0.55)).join('')}
    ${[0, 1, 2, 3, 4, 5].map((i) => line(28 + (i % 2) * 0, 76 + i * 30, 34, 5, '#fff', 0.12)).join('')}
    ${[0, 1, 2, 3].map((i) => line(84 + i * 52, 76, 30, 5, '#fff', 0.1)).join('')}
    ${[0, 1, 2, 3, 4].map((i) => rect(196 + i * 26, 252 - (18 + i * 14), 16, 18 + i * 14, 4, a, `opacity="${0.35 + i * 0.13}"`)).join('')}`,

  slides: (a) => `
    ${[0, 1, 2].map((i) => {
      const x = 20 + i * 106
      return `${rect(x, 50, 94, 66, 8, '#fff', 'opacity=".05"')}
        ${rect(x, 50, 94, 66, 8, 'none', `stroke="${i === 1 ? a : '#ffffff22'}" stroke-width="${i === 1 ? 1.6 : 1}"`)}
        ${rect(x + 8, 58, 46, 5, 2, i === 1 ? a : '#fff', `opacity="${i === 1 ? 0.9 : 0.28}"`)}
        ${rect(x + 8, 70, 78, 3, 1.5, '#fff', 'opacity=".12"')}
        ${rect(x + 8, 78, 60, 3, 1.5, '#fff', 'opacity=".12"')}
        ${rect(x + 8, 92, 30, 14, 3, a, 'opacity=".22"')}`
    }).join('')}
    ${rect(20, 132, 312, 96, 10, a, 'opacity=".08"')}
    ${rect(36, 148, 120, 8, 4, '#fff', 'opacity=".5"')}
    ${rect(36, 164, 210, 5, 2.5, '#fff', 'opacity=".16"')}
    ${rect(36, 176, 180, 5, 2.5, '#fff', 'opacity=".16"')}
    ${rect(36, 196, 62, 18, 5, a, 'opacity=".8"')}
    ${rect(240, 150, 76, 62, 8, '#fff', 'opacity=".06"')}
    ${rect(250, 160, 56, 6, 3, '#fff', 'opacity=".2"')}
    ${rect(250, 174, 40, 6, 3, '#fff', 'opacity=".14"')}
    ${dot(168, 246, 3.5, a)}${dot(180, 246, 3.5, '#fff', 'opacity=".2"')}${dot(192, 246, 3.5, '#fff', 'opacity=".2"')}`,

  page: (a) => `
    ${rect(28, 48, 196, 240, 8, '#fff', 'opacity=".94"')}
    ${rect(44, 68, 96, 9, 4, '#0b1220', 'opacity=".75"')}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => rect(44, 90 + i * 16, i === 7 ? 84 : 160, 5, 2.5, '#0b1220', `opacity=".${i === 0 ? 3 : 18}"`)).join('')}
    ${rect(44, 236, 70, 30, 4, a, 'opacity=".2"')}
    ${rect(150, 240, 58, 4, 2, '#0b1220', 'opacity=".4"')}
    ${rect(150, 250, 44, 4, 2, '#0b1220', 'opacity=".28"')}
    ${[0, 1, 2].map((i) => `${rect(240, 60 + i * 78, 68, 62, 7, '#fff', 'opacity=".05"')}
      ${rect(250, 70 + i * 78, 40, 4, 2, '#fff', 'opacity=".25"')}
      ${rect(250, 80 + i * 78, 48, 3, 1.5, '#fff', 'opacity=".12"')}`).join('')}
    ${rect(240, 60, 68, 62, 7, 'none', `stroke="${a}" stroke-width="1.2" stroke-opacity=".7"`)}`,

  pdf: (a) => `
    ${rect(26, 46, 200, 244, 8, '#fff', 'opacity=".94"')}
    ${rect(42, 66, 110, 9, 4, '#0b1220', 'opacity=".75"')}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => rect(42, 88 + i * 15, i % 3 === 2 ? 120 : 166, 5, 2.5, '#0b1220', 'opacity=".16"')).join('')}
    ${rect(42, 200, 166, 40, 5, '#0b1220', 'opacity=".05"')}
    <path d="M56 228c14-16 22 8 34-4s16 10 30-6" stroke="${a}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${dot(184, 244, 20, a, 'opacity=".14"')}
    ${dot(184, 244, 15, 'none', `stroke="${a}" stroke-width="1.4"`)}
    <path d="M178 244l4 5 8-9" stroke="${a}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${rect(242, 60, 66, 84, 7, '#fff', 'opacity=".05"')}
    ${rect(252, 70, 38, 5, 2.5, '#fff', 'opacity=".25"')}
    ${rect(252, 84, 46, 3, 1.5, '#fff', 'opacity=".12"')}
    ${rect(252, 94, 32, 3, 1.5, '#fff', 'opacity=".12"')}
    ${rect(242, 156, 66, 84, 7, '#fff', 'opacity=".05"')}
    ${rect(252, 166, 38, 5, 2.5, '#fff', 'opacity=".25"')}
    ${rect(252, 180, 46, 3, 1.5, '#fff', 'opacity=".12"')}`,

  photo: (a) => `
    ${rect(22, 46, 232, 172, 10, a, 'opacity=".14"')}
    <defs><linearGradient id="ph" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}" stop-opacity=".55"/><stop offset="1" stop-color="${a}" stop-opacity=".05"/>
    </linearGradient></defs>
    ${rect(22, 46, 232, 172, 10, 'url(#ph)')}
    ${dot(186, 92, 22, '#fff', 'opacity=".5"')}
    <path d="M22 190l62-58 42 40 34-26 94 62v10a10 10 0 0 1-10 10H32a10 10 0 0 1-10-10z" fill="#0b1220" opacity=".55"/>
    <path d="M40 210l50-46 40 36" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none"/>
    ${rect(22, 232, 232, 54, 8, '#fff', 'opacity=".04"')}
    ${[6, 14, 9, 20, 26, 16, 31, 22, 12, 18].map((h, i) => rect(30 + i * 22, 276 - h * 1.4, 12, h * 1.4, 2, a, `opacity="${0.25 + i * 0.04}"`)).join('')}
    ${[0, 1, 2].map((i) => `${rect(270, 60 + i * 48, 58, 4, 2, '#fff', 'opacity=".14"')}
      ${dot(270 + 18 + i * 12, 62 + i * 48, 5, a)}
      ${rect(270, 74 + i * 48, 42, 3, 1.5, '#fff', 'opacity=".1"')}`).join('')}
    ${rect(264, 210, 68, 68, 8, '#fff', 'opacity=".04"')}
    <path d="M276 262c10-26 18 4 26-14s14 6 22-18" stroke="${a}" stroke-width="2" fill="none"/>`,

  raw: (a) => `
    ${rect(22, 46, 190, 150, 9, a, 'opacity=".16"')}
    ${dot(168, 86, 18, '#fff', 'opacity=".4"')}
    <path d="M22 172l54-52 40 36 30-24 66 44v4a10 10 0 0 1-10 10H32a10 10 0 0 1-10-10z" fill="#0b1220" opacity=".6"/>
    ${rect(22, 210, 190, 76, 9, '#fff', 'opacity=".04"')}
    <path d="M34 276c22-6 34-42 52-42s30 26 50 24 28-34 62-40" stroke="${a}" stroke-width="1.8" fill="none"/>
    ${dot(86, 234, 3, a)}${dot(136, 258, 3, a)}${rect(196, 262, 4, 4, 0, a)}
    ${rect(228, 50, 100, 116, 9, '#fff', 'opacity=".04"')}
    ${[0, 1, 2].map((i) => `${rect(238, 64 + i * 34, 66, 4, 2, '#fff', 'opacity=".16"')}
      ${dot(238 + 20 + i * 16, 66 + i * 34, 4.5, a)}`).join('')}
    ${rect(228, 180, 100, 106, 9, '#fff', 'opacity=".04"')}
    ${[0, 1, 2, 3].map((i) => rect(240 + i * 22, 200, 14, 70, 3, a, `opacity="${0.18 + i * 0.18}"`)).join('')}`,

  paint: (a) => `
    ${rect(18, 46, 250, 196, 10, '#fff', 'opacity=".04"')}
    <path d="M40 196c30-64 54 12 84-40s44 46 84-14" stroke="${a}" stroke-width="12" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M46 150c28 8 40-42 74-30s44 52 76 26" stroke="#f472b6" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="M52 118c22-18 46 10 70-6s38-22 62-6" stroke="#22d3ee" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => dot(44 + i * 30, 240, 8, [a, '#f472b6', '#22d3ee', '#fbbf24', '#a3e635', '#fb7185'][i], 'opacity=".9"')).join('')}
    ${rect(286, 52, 42, 190, 10, '#fff', 'opacity=".05"')}
    ${[0, 1, 2, 3].map((i) => rect(294, 64 + i * 44, 26, 26, 7, '#fff', `opacity=".${i === 0 ? 25 : 8}"`)).join('')}`,

  vector: (a) => `
    <path d="M40 210C96 62 168 250 236 92c24-56 44 30 68 6" stroke="${a}" stroke-width="2" fill="none"/>
    ${rect(34, 204, 12, 12, 2, '#0b1220', `stroke="${a}" stroke-width="1.6"`)}
    ${rect(230, 86, 12, 12, 2, '#0b1220', `stroke="${a}" stroke-width="1.6"`)}
    ${rect(298, 92, 12, 12, 2, '#0b1220', `stroke="${a}" stroke-width="1.6"`)}
    <path d="M40 210L96 150M236 92l40-28" stroke="#fff" stroke-opacity=".25" stroke-dasharray="3 4"/>
    ${dot(96, 150, 4, '#22d3ee')}${dot(276, 64, 4, '#22d3ee')}
    ${rect(34, 44, 76, 4, 2, '#fff', 'opacity=".16"')}
    ${rect(34, 54, 52, 3, 1.5, '#fff', 'opacity=".1"')}
    ${rect(250, 200, 78, 70, 8, '#fff', 'opacity=".04"')}
    ${[0, 1, 2].map((i) => `${rect(260, 212 + i * 18, 14, 8, 2, a, 'opacity=".5"')}${rect(280, 214 + i * 18, 34, 4, 2, '#fff', 'opacity=".14"')}`).join('')}`,

  layout: (a) => `
    ${rect(24, 44, 304, 244, 8, '#fff', 'opacity=".93"')}
    <path d="M164 44v244" stroke="#0b1220" stroke-opacity=".12"/>
    ${rect(44, 66, 90, 10, 4, '#0b1220', 'opacity=".7"')}
    ${[0, 1, 2, 3, 4, 5].map((i) => rect(44, 92 + i * 14, i === 5 ? 76 : 100, 4, 2, '#0b1220', 'opacity=".16"')).join('')}
    ${rect(44, 192, 100, 72, 5, a, 'opacity=".14"')}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => rect(178, 66 + i * 14, i === 0 ? 96 : 128, i === 0 ? 9 : 4, 2, '#0b1220', `opacity=".${i === 0 ? 7 : 16}"`)).join('')}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => rect(178, 172 + i * 9, 128, 2, 1, '#0b1220', 'opacity=".07"')).join('')}
    <path d="M24 44v14M24 44h14M328 44v14M328 44h-14M24 288v-14M24 288h14M328 288v-14M328 288h-14" stroke="${a}" stroke-width="1.4" opacity=".8"/>`,

  vfx: (a) => `
    ${rect(20, 46, 88, 244, 8, '#fff', 'opacity=".04"')}
    ${[0, 1, 2, 3].map((i) => `${rect(30, 60 + i * 32, 10, 10, 2, i === 0 ? a : '#fff', `opacity="${i === 0 ? 0.9 : 0.18}"`)}
      ${rect(48, 62 + i * 32, 42, 5, 2.5, '#fff', `opacity=".${i === 0 ? 3 : 12}"`)}`).join('')}
    ${rect(120, 46, 200, 168, 10, '#0b1220', `stroke="${a}" stroke-opacity=".35"`)}
    ${rect(146, 82, 66, 66, 10, a, 'opacity=".22"', 'transform="rotate(-12 179 115)"')}
    ${rect(196, 110, 66, 66, 10, '#fff', 'opacity=".06"', 'transform="rotate(14 229 143)"')}
    ${dot(230, 140, 26, '#fff', 'opacity=".04"')}
    ${rect(120, 226, 200, 64, 8, '#fff', 'opacity=".04"')}
    ${[0, 1, 2].map((i) => rect(132, 240 + i * 16, 176, 5, 2.5, '#fff', 'opacity=".08"')).join('')}
    <path d="M132 254h176" stroke="${a}" stroke-opacity=".4" stroke-width="1" stroke-dasharray="2 4"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M${150 + i * 46} 260l6 6-6 6-6-6z" fill="${i === 1 ? a : '#fff'}" opacity="${i === 1 ? 0.95 : 0.3}"/>`).join('')}`,

  timeline: (a) => `
    ${[0, 1, 2].map((i) => rect(20, 54 + i * 60, 312, 46, 8, '#fff', 'opacity=".04"')).join('')}
    ${rect(30, 62, 54, 30, 5, a, 'opacity=".55"')}
    ${rect(90, 62, 96, 30, 5, a, 'opacity=".3"')}
    ${rect(192, 62, 40, 30, 5, a, 'opacity=".18"')}
    ${rect(30, 122, 84, 30, 5, a, 'opacity=".35"')}
    ${rect(120, 122, 130, 30, 5, a, 'opacity=".22"')}
    ${rect(30, 182, 150, 30, 5, a, 'opacity=".18"')}
    ${rect(186, 182, 100, 30, 5, a, 'opacity=".3"')}
    ${rect(20, 226, 312, 62, 8, '#fff', 'opacity=".04"')}
    ${[3, 9, 18, 26, 14, 30, 22, 34, 18, 26, 12, 20, 28, 16, 24, 10, 18, 26].map((h, i) => rect(30 + i * 16, 257 - h, 8, h * 2, 3, a, `opacity="${0.35 + (i % 4) * 0.1}"`)).join('')}
    <path d="M196 46v244" stroke="#f472b6" stroke-width="1.4" opacity=".9"/>
    ${dot(196, 46, 4, '#f472b6')}`,

  audio: (a) => `
    ${[4, 10, 18, 30, 44, 62, 78, 56, 40, 66, 84, 58, 36, 24, 44, 60, 34, 20, 12, 6].map((h, i) => rect(26 + i * 15, 150 - h, 8, h * 2, 4, a, `opacity="${0.35 + (i % 5) * 0.11}"`)).join('')}
    ${rect(20, 234, 312, 58, 8, '#fff', 'opacity=".04"')}
    ${[0, 1, 2].map((i) => `${rect(32, 248 + i * 16, 220, 4, 2, '#fff', 'opacity=".1"')}
      ${dot(88 + i * 62, 250 + i * 16, 6, a)}`).join('')}
    ${rect(268, 246, 48, 34, 6, a, 'opacity=".18"')}
    ${rect(276, 254, 32, 4, 2, a, 'opacity=".7"')}
    ${rect(276, 264, 20, 4, 2, '#fff', 'opacity=".2"')}`,

  ui: (a) => `
    ${rect(22, 46, 132, 92, 8, '#fff', 'opacity=".05"', `stroke="${a}" stroke-opacity=".45"`)}
    ${rect(32, 56, 56, 6, 3, '#fff', 'opacity=".3"')}
    ${rect(32, 70, 96, 4, 2, '#fff', 'opacity=".12"')}
    ${rect(32, 80, 72, 4, 2, '#fff', 'opacity=".12"')}
    ${rect(32, 100, 54, 24, 6, a, 'opacity=".8"')}
    ${rect(94, 100, 40, 24, 6, '#fff', 'opacity=".08"')}
    ${rect(168, 76, 148, 120, 8, '#fff', 'opacity=".05"')}
    ${rect(180, 88, 44, 44, 8, a, 'opacity=".25"')}
    ${rect(232, 88, 72, 6, 3, '#fff', 'opacity=".2"')}
    ${rect(232, 102, 56, 4, 2, '#fff', 'opacity=".12"')}
    ${rect(180, 148, 124, 32, 6, '#fff', 'opacity=".07"')}
    <path d="M120 176l6 46 12-14 16 12 8-10-16-12 16-6z" fill="#fff" opacity=".85"/>
    ${rect(22, 208, 294, 78, 8, '#fff', 'opacity=".035"')}
    ${[0, 1, 2, 3, 4].map((i) => `${rect(34 + i * 56, 222, 46, 22, 5, '#fff', 'opacity=".06"')}
      ${rect(40 + i * 56, 229, 26, 4, 2, a, 'opacity=".5"')}`).join('')}
    ${rect(34, 256, 270, 18, 4, '#fff', 'opacity=".04"')}`,

  cad: (a) => `
    <defs><pattern id="cad" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M16 0H0v16" fill="none" stroke="#fff" stroke-opacity=".05"/>
    </pattern></defs>
    ${rect(20, 46, 312, 244, 6, 'url(#cad)')}
    <path d="M56 244V128l48-34 48 34v116" fill="none" stroke="${a}" stroke-width="1.8"/>
    <path d="M104 94v150M56 184h48M152 184h48M200 244V140l52-22v126" fill="none" stroke="${a}" stroke-opacity=".55" stroke-width="1.2"/>
    ${dot(56, 244, 3, a)}${dot(104, 94, 3, a)}${dot(152, 244, 3, a)}
    <path d="M56 262h96M56 256v12M152 256v12" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>
    ${txt(92, 276, 9, '#94a3b8', '2400', 'font-family="monospace"')}
    <path d="M214 262h92M214 256v12M306 256v12" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>
    ${txt(250, 276, 9, '#94a3b8', '1800', 'font-family="monospace"')}
    ${rect(20, 46, 72, 18, 4, '#0b1220', 'opacity=".7"')}
    ${txt(28, 59, 9, a, 'PLAN · L1', 'font-family="monospace" letter-spacing="1"')}`,

  archive: (a) => `
    ${rect(20, 46, 200, 26, 7, '#fff', 'opacity=".06"')}
    ${dot(34, 59, 4, '#fff', 'opacity=".25"')}
    ${rect(44, 56, 96, 5, 2.5, '#fff', 'opacity=".14"')}
    ${[0, 1, 2, 3].map((i) => `${rect(20, 84 + i * 52, 200, 44, 7, '#fff', 'opacity=".04"')}
      ${rect(30, 92 + i * 52, 28, 28, 6, a, `opacity="${0.18 + i * 0.06}"`)}
      ${rect(66, 96 + i * 52, 76 - i * 8, 6, 3, '#fff', 'opacity=".22"')}
      ${rect(66, 108 + i * 52, 108, 4, 2, '#fff', 'opacity=".1"')}`).join('')}
    ${rect(234, 46, 100, 244, 8, '#fff', 'opacity=".04"')}
    ${rect(244, 58, 80, 54, 5, a, 'opacity=".16"')}
    ${[0, 1, 2, 3, 4].map((i) => rect(244, 126 + i * 14, i === 4 ? 52 : 80, 4, 2, '#fff', 'opacity=".12"')).join('')}
    ${rect(244, 208, 80, 30, 5, a, 'opacity=".5"')}
    ${txt(254, 228, 10, '#04120e', 'SIGN', 'font-family="monospace" font-weight="700"')}`,

  scan: (a) => `
    ${rect(96, 46, 160, 244, 14, '#fff', 'opacity=".04"')}
    ${rect(96, 46, 160, 244, 14, 'none', `stroke="${a}" stroke-opacity=".3"`)}
    <ellipse cx="176" cy="150" rx="46" ry="58" fill="none" stroke="${a}" stroke-opacity=".5" stroke-width="1.2"/>
    ${dot(160, 138, 3, '#fff', 'opacity=".6"')}${dot(192, 138, 3, '#fff', 'opacity=".6"')}
    <path d="M166 172c6 4 14 4 20 0" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    ${[0, 1, 2].map((i) => `<path d="M176 ${60 + i * 22}v10M176 ${236 - i * 22}v-10" stroke="#fff" stroke-opacity=".12"/>`).join('')}
    ${rect(96, 118, 160, 56, 0, a, 'opacity=".14"')}
    <path d="M96 146h160" stroke="${a}" stroke-width="2"/>
    ${rect(102, 58, 44, 14, 4, '#0b1220', 'opacity=".8"')}
    ${txt(108, 68, 8, a, 'SCAN', 'font-family="monospace" letter-spacing="1.4"')}
    ${rect(272, 66, 62, 190, 6, '#fff', 'opacity=".04"')}
    ${[0, 1, 2, 3, 4, 5].map((i) => rect(280, 78 + i * 16, 40 - (i % 3) * 8, 4, 2, '#fff', 'opacity=".14"')).join('')}
    ${rect(280, 190, 46, 26, 4, a, 'opacity=".2"')}
    ${txt(284, 206, 7, a, 'HASH OK', 'font-family="monospace"')}`,

  device: (a) => `
    ${rect(74, 46, 116, 244, 16, '#fff', 'opacity=".05"')}
    ${rect(74, 46, 116, 244, 16, 'none', `stroke="${a}" stroke-opacity=".45"`)}
    ${rect(114, 56, 36, 5, 2.5, '#fff', 'opacity=".2"')}
    ${rect(88, 74, 88, 60, 8, a, 'opacity=".18"')}
    <path d="M118 104h12l-12 12h12" stroke="${a}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${[0, 1, 2].map((i) => `${rect(88, 148 + i * 30, 88, 24, 5, '#fff', 'opacity=".05"')}
      ${rect(96, 156 + i * 30, 40, 4, 2, '#fff', 'opacity=".2"')}
      ${rect(96, 164 + i * 30, 24, 3, 1.5, a, 'opacity=".6"')}`).join('')}
    <path d="M216 120h34M216 190h34" stroke="${a}" stroke-width="1.6" stroke-dasharray="4 4"/>
    <path d="M246 114l6 6-6 6M246 184l6 6-6 6" stroke="${a}" stroke-width="1.6" fill="none"/>
    ${[0, 1, 2].map((i) => `${rect(262, 100 + i * 70, 66, 40, 7, '#fff', 'opacity=".05"')}
      ${txt(274, 120 + i * 70, 11, a, ['MP4', 'PDF', 'QR'][i], 'font-family="monospace" font-weight="700"')}
      ${rect(274, 126 + i * 70, 34, 3, 1.5, '#fff', 'opacity=".14"')}`).join('')}`,

  tiles: (a) => `
    ${[0, 1, 2].map((row) => [0, 1, 2].map((col) => {
      const active = row === 0 && col === 1
      const x = 60 + col * 92
      const y = 58 + row * 78
      return `${rect(x, y, 72, 60, 12, active ? a : '#fff', active ? 'opacity=".9"' : 'opacity=".05"')}
        ${rect(x + 14, y + 14, 18, 18, 6, active ? '#04120e' : '#fff', active ? 'opacity=".7"' : 'opacity=".18"')}
        ${rect(x + 14, y + 40, 38, 5, 2.5, active ? '#04120e' : '#fff', active ? 'opacity=".45"' : 'opacity=".12"')}`
    }).join('')).join('')}
    ${rect(60 + 92, 58, 72, 60, 12, 'none', `stroke="${a}" stroke-width="2" stroke-dasharray="4 4" opacity=".7"`)}
    ${rect(200, 296, 92, 6, 3, '#fff', 'opacity=".07"')}`
}

/* --------------------------------------------------------------- svg tile */

function tile(p) {
  const a = p.accent
  const a2 = ACCENT2[a] || a
  const glyph = GLYPHS[p.art] || GLYPHS.page
  const art = (ART[p.art] || ART.page)(a)
  const u = `t${p.id}`
  const ver = p.version
  const verW = 22 + ver.length * 6.6

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img">
<defs>
  <linearGradient id="${u}bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0c1526"/><stop offset="1" stop-color="#05080f"/>
  </linearGradient>
  <radialGradient id="${u}glow" cx="0.8" cy="0.1" r="0.95">
    <stop offset="0" stop-color="${a}" stop-opacity="0.3"/><stop offset="1" stop-color="${a}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="${u}ac" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${a2}"/><stop offset="1" stop-color="${a}"/>
  </linearGradient>
  <pattern id="${u}dots" width="26" height="26" patternUnits="userSpaceOnUse">
    <circle cx="1.2" cy="1.2" r="1.2" fill="#ffffff" fill-opacity="0.07"/>
  </pattern>
  <linearGradient id="${u}shade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </linearGradient>
</defs>

<rect width="640" height="400" fill="url(#${u}bg)"/>
<rect width="640" height="400" fill="url(#${u}glow)"/>
<rect width="640" height="400" fill="url(#${u}dots)"/>
<path d="M0 300L640 180" stroke="#ffffff" stroke-opacity="0.04"/>
<path d="M0 340L640 220" stroke="#ffffff" stroke-opacity="0.03"/>

<!-- product window -->
<g transform="translate(252 56)">
  <rect x="0" y="6" width="352" height="300" rx="18" fill="#000" opacity="0.35"/>
  <rect width="352" height="300" rx="16" fill="#0a1020" stroke="#ffffff" stroke-opacity="0.09"/>
  <path d="M0 34h352" stroke="#ffffff" stroke-opacity="0.06"/>
  <circle cx="18" cy="17" r="3.4" fill="#ff5f57" opacity="0.5"/>
  <circle cx="31" cy="17" r="3.4" fill="#febc2e" opacity="0.5"/>
  <circle cx="44" cy="17" r="3.4" fill="#28c840" opacity="0.5"/>
  <rect x="292" y="12" width="44" height="10" rx="5" fill="#ffffff" fill-opacity="0.06"/>
  <rect x="0" y="0" width="352" height="300" rx="16" fill="url(#${u}shade)" opacity="0.35"/>
  <g>${art}</g>
</g>

<!-- identity -->
<g transform="translate(40 244)">
  <rect x="0" y="4" width="64" height="64" rx="18" fill="#000" opacity="0.4"/>
  <rect width="64" height="64" rx="18" fill="url(#${u}ac)"/>
  <g transform="translate(16 16) scale(1.333)" fill="none" stroke="#04120e" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
</g>
${txt(118, 274, 21, '#f8fafc', p.short, 'font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-weight="700"')}
${txt(118, 294, 9.5, '#8ea3bd', (p.tagline || '').toUpperCase().slice(0, 26), 'font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" letter-spacing="1.6"')}
<g transform="translate(118 304)">
  <rect width="${verW.toFixed(0)}" height="21" rx="10.5" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="11" y="14.5" font-size="10.5" fill="#cbd5e1" font-family="ui-monospace, Menlo, monospace">${esc(ver)}</text>
</g>
<text x="40" y="352" font-size="9" fill="#64748b" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" letter-spacing="1.4">VERIFIED BUILD · SHA-256</text>

<!-- monogram watermark: legible at any size, no text to turn to mush -->
<g transform="translate(586 34) scale(0.95)" fill="none" stroke="#f0c674" stroke-opacity="0.28" stroke-width="1.6" stroke-linejoin="round">
  <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z"/><path d="M7.5 8.5H16.5L7.5 15.5H16.5" stroke-linecap="round"/>
</g>
</svg>
`
}

/* ------------------------------------------------------------------ cards */

const ICON_DL =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>'
const ICON_CHECK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'

const SEAL = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.5 8.5H16.5L7.5 15.5H16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function card(p) {
  const primary = p.links.find((l) => l.primary) || p.links[0]
  const sizeLabel = (primary.size || '').replace(/\s+/g, ' ')
  const search = [p.title, p.desc, p.platform, p.badge, p.version, ...p.items].join(' ')
  const dl = p.downloads
    ? `<span class="prog-dl" title="تحميلات موثّقة من GitHub — جميع الإصدارات">
        ${ICON_DL}<b dir="ltr">${nf.format(p.downloads)}</b>
      </span>`
    : `<span class="prog-dl prog-dl--direct" title="توزيع مباشر — لا يوفّر المضيف عدّاد تحميل عام">
        ${ICON_CHECK}<span>تنزيل مباشر</span>
      </span>`

  return `          <article class="prog-card" data-category="${p.cat}" data-search="${esc(search)}">
            <div class="prog-thumb">
              <img src="/fx/apps/${p.slug}.svg" alt="" width="640" height="400" loading="lazy" decoding="async">
${own(p) ? `              <span class="prog-seal">${SEAL}<b>ZEIDEX</b></span>\n` : ''}              <span class="prog-ver" dir="ltr">${esc(p.version)}</span>
            </div>
            <div class="prog-body">
              <div class="prog-meta">
                <span class="prog-badge">${esc(p.badge)}</span>
                ${dl}
              </div>
              <h3 class="prog-title">${esc(p.title)}</h3>
              <p class="prog-desc">${esc(p.desc)}</p>
              <ul class="prog-feats">
                ${p.items.slice(0, 2).map((i) => `<li>${ICON_CHECK}<span>${esc(i)}</span></li>`).join('\n                ')}
              </ul>
${p.released ? `              <p class="prog-date">آخر تحديث: <time datetime="${p.released}" dir="ltr">${p.released}</time></p>\n` : ''}              <div class="prog-actions">
                <a class="prog-download" href="${esc(primary.href)}" target="_blank" rel="noopener noreferrer" download>
                  ${ICON_DL}<span>تنزيل</span><span class="prog-size" dir="ltr">${esc(sizeLabel)}</span>
                </a>
                <button class="prog-more" type="button" onclick="openProgramDetailsModalById(${p.id})" title="عرض تفاصيل ${esc(p.title)}">التفاصيل</button>
              </div>
            </div>
          </article>`
}

/* -------------------------------------------------------------- assembling */

const outDir = path.join(root, 'public/fx/apps')
fs.mkdirSync(outDir, { recursive: true })
for (const p of programs) {
  fs.writeFileSync(path.join(outDir, `${p.slug}.svg`), tile(p))
}

const GRID_START = '<div class="prog-grid" id="programsGrid">'
const GRID_END = '<!-- Empty State for Programs Search -->'

let html = fs.readFileSync(path.join(root, 'programs.html'), 'utf8')

const startAt = html.indexOf('id="programsGrid"')
if (startAt === -1) throw new Error('grid anchor missing')
const openStart = html.lastIndexOf('<div', startAt)
const endAt = html.indexOf(GRID_END)
if (endAt === -1) throw new Error('grid end anchor missing')

const grid = `${GRID_START}
${programs.map(card).join('\n')}
        </div>

        `
html = html.slice(0, openStart) + grid + html.slice(endAt)

const dataset = programs.map((p) => ({
  id: p.id,
  slug: p.slug,
  cat: p.cat,
  badge: p.badge,
  version: p.version,
  rawVersion: p.rawVersion,
  released: p.released,
  platform: p.platform,
  title: p.title,
  desc: p.desc,
  items: p.items,
  links: p.links.map((l) => ({
    href: l.href,
    text: l.text,
    host: l.host,
    size: l.size,
    platform: l.platform
  })),
  exactDownloads: p.downloads,
  downloadsCount: p.downloads ? nf.format(p.downloads) : null,
  compactDownloads: p.downloads ? chip(p.downloads) : 'تنزيل مباشر',
  accent: p.accent,
  art: p.art,
  short: p.short
}))

html = html.replace(
  /const progsDataset = \[[\s\S]*?\];/,
  'const progsDataset = ' + JSON.stringify(dataset) + ';'
)

const total = programs.reduce((s, p) => s + (p.downloads || 0), 0)
const yusr = programs.find((p) => p.slug === 'yusr')
const values = {
  count: String(programs.length),
  total: nf.format(total),
  compact: '+' + chip(total),
  date: data.generated,
  'yusr-ver': yusr.version,
  'yusr-dl': nf.format(yusr.downloads)
}
for (const [key, value] of Object.entries(values)) {
  html = html.replace(new RegExp(`<!--@${key}-->[\\s\\S]*?<!--/@${key}-->`), `<!--@${key}-->${value}<!--/@${key}-->`)
}

fs.writeFileSync(path.join(root, 'programs.html'), html)
console.log(`tiles ${programs.length} · total ${nf.format(total)} · grid rebuilt (${grid.length} bytes)`)
