/** رسومات SVG خالصة — لا صور خارجية ولا شبكة. كل منتج مالي رمزه هنا. */
let seq = 0;
const palettes = [
    ['#a5b4fc', '#6366f1'],
    ['#c4b5fd', '#8b5cf6'],
    ['#93c5fd', '#3b82f6'],
    ['#f0abfc', '#c026d3'],
    ['#fca5a5', '#f472b6'],
    ['#86efac', '#34d399'],
];
const shapes = {
    wallet: `<rect x="20" y="30" width="40" height="30" rx="8" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <path d="M20 38h40" stroke="G2" stroke-width="1.4"/><rect x="46" y="42" width="14" height="10" rx="3" fill="G1" opacity="0.4" stroke="G2" stroke-width="1.4"/><circle cx="53" cy="47" r="2" fill="G2"/>`,
    card: `<rect x="18" y="32" width="44" height="28" rx="6" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <path d="M18 40h44" stroke="G2" stroke-width="3" opacity="0.5"/><rect x="24" y="50" width="12" height="4" rx="2" fill="G2"/><rect x="40" y="50" width="8" height="4" rx="2" fill="G2" opacity="0.6"/>`,
    transfer: `<path d="M24 38h26l-6-6M56 50H30l6 6" fill="none" stroke="G2" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="40" cy="44" r="18" fill="G1" opacity="0.1"/>`,
    topup: `<circle cx="40" cy="44" r="17" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <path d="M40 36v16M32 44h16" stroke="G2" stroke-width="2.2" stroke-linecap="round"/>`,
    bills: `<rect x="26" y="24" width="28" height="40" rx="5" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <path d="M32 34h16M32 42h16M32 50h10" stroke="G2" stroke-width="1.6" stroke-linecap="round"/><path d="M44 58l3 3 5-6" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    savings: `<path d="M22 46a16 12 0 1 1 32 0 16 12 0 0 1-32 0z" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <circle cx="48" cy="44" r="2" fill="G2"/><path d="M30 34l6-4M38 58v4M44 58v4" stroke="G2" stroke-width="1.6" stroke-linecap="round"/><path d="M26 42h4" stroke="G2" stroke-width="2" stroke-linecap="round"/>`,
    crypto: `<circle cx="40" cy="44" r="17" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <path d="M36 34v20M44 34v20M31 40h14a4 4 0 0 1 0 8H31M31 48h16a4 4 0 0 1 0 8H31" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    gift: `<rect x="22" y="40" width="36" height="22" rx="5" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <rect x="20" y="34" width="40" height="8" rx="3" fill="G2" opacity="0.4"/><path d="M40 34v28" stroke="G2" stroke-width="1.6"/>
    <path d="M40 34c-4-8-14-4-8 2M40 34c4-8 14-4 8 2" fill="none" stroke="G2" stroke-width="1.6"/>`,
};
/** رسمة المنتج داخل البطاقة — تدرّج لوني خاص بكل بطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `mf${seq++}`;
    const body = shapes[kind].replaceAll('G1', g1).replaceAll('G2', g2);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body.replaceAll(g2, `url(#l${id})`)}
  </svg>`;
}
/** لوحة الهيرو: بطاقة رصيد بتدرّج بنفسجي ورقاقة. */
export function heroArt() {
    const id = `mfh${seq++}`;
    return `<svg viewBox="0 0 150 110" class="hero-svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="c${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#eef0ff" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect x="22" y="22" width="106" height="66" rx="16" fill="url(#c${id})" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="34" y="40" width="20" height="15" rx="4" fill="#c7b8ff" opacity="0.85"/>
    <path d="M38 44h12M38 48h8" stroke="#8b5cf6" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M34 70h42M34 76h26" stroke="#8b86d8" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>
    <circle cx="112" cy="40" r="9" fill="#f0abfc" opacity="0.8"/><circle cx="102" cy="40" r="9" fill="#a5b4fc" opacity="0.8"/>
  </svg>`;
}
