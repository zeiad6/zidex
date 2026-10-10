/** رسومات SVG خالصة — بلا صور خارجية. */
/** شعار كل بوت: شكل مميز بلونيه هو. */
export function glyph(kind, palette) {
    const [a, b] = palette;
    const g = (inner) => `<svg viewBox="0 0 64 64" class="glyph" role="img" aria-hidden="true"><defs><linearGradient id="gl${palette[0].slice(1)}${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#gl${palette[0].slice(1)}${kind})" opacity="0.16"/>
    <g fill="none" stroke="url(#gl${palette[0].slice(1)}${kind})" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
    const shapes = {
        bag: '<path d="M18 26h28l-3 24a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z"/><path d="M26 26v-6a6 6 0 0 1 12 0v6"/>',
        star: '<path d="m32 14 6 13 14 2-10 10 2 14-12-6-12 6 2-14-10-10 14-2z"/>',
        server: '<rect x="14" y="16" width="36" height="12" rx="4"/><rect x="14" y="36" width="36" height="12" rx="4"/><path d="M22 22h.01M22 42h.01"/>',
        shield: '<path d="M32 12l16 6v12c0 10-7 17-16 22-9-5-16-12-16-22V18z"/><path d="m25 31 5 5 9-10"/>',
        headset: '<path d="M16 34v-4a16 16 0 0 1 32 0v4"/><rect x="12" y="34" width="10" height="12" rx="4"/><rect x="42" y="34" width="10" height="12" rx="4"/>',
        calendar: '<rect x="14" y="18" width="36" height="34" rx="6"/><path d="M14 28h36M24 14v8M40 14v8"/>',
        key: '<circle cx="24" cy="32" r="8"/><path d="M32 32h18M44 32v8M50 32v6"/>',
        trophy: '<path d="M20 14h24v10a12 12 0 0 1-24 0z"/><path d="M20 18H12v4a8 8 0 0 0 8 8M44 18h8v4a8 8 0 0 1-8 8"/><path d="M32 36v10M24 50h16"/>',
        spark: '<path d="M32 10l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"/><path d="M48 42l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
        grid: '<rect x="12" y="12" width="16" height="16" rx="4"/><rect x="36" y="12" width="16" height="16" rx="4"/><rect x="12" y="36" width="16" height="16" rx="4"/><rect x="36" y="36" width="16" height="16" rx="4"/>',
        flow: '<rect x="10" y="24" width="14" height="14" rx="4"/><rect x="40" y="24" width="14" height="14" rx="4"/><path d="M24 31h16M32 20v22"/>',
        chat: '<path d="M14 18h36v22H30l-10 8v-8h-6z"/><path d="M24 29h16M24 35h10"/>',
    };
    const shape = shapes[kind] ?? shapes['chat'] ?? '';
    return g(shape);
}
/** إطار الهاتف مع شريط تيليجرام. */
export function phoneFrame(palette, label) {
    return `<div class="phone" style="--pa:${palette[0]};--pb:${palette[1]}">
    <div class="phone-bar"><span class="dot"></span><span class="phone-title">${label}</span><span class="phone-menu">⋮</span></div>
    <div class="phone-screen" id="chat"></div>
  </div>`;
}
/** عدّاد دائري صغير للوحة الموحّدة. */
export function ring(pct, palette) {
    const r = 26;
    const c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 64 64" class="ring" aria-hidden="true">
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="#1b2740" stroke-width="7"/>
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="${palette[1]}" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 32 32)"/>
    <text x="32" y="37" text-anchor="middle" class="ring-t">${Math.round(pct * 100)}%</text>
  </svg>`;
}
/** شريط زخرفي علوي للّوحة. */
export function wave(color) {
    return `<svg viewBox="0 0 600 60" preserveAspectRatio="none" class="wave" aria-hidden="true">
    <path d="M0 40 Q 75 10 150 34 T 300 30 T 450 36 T 600 22 V60 H0 Z" fill="${color}" opacity="0.18"/>
  </svg>`;
}
export const bi = (lang, b) => b[lang];
