/** رسومات SVG خالصة — لا صور خارجية ولا شبكة. كل جهاق شكله هنا. */
let seq = 0;
const palettes = [
    ['#22d3ee', '#0ea5e9'],
    ['#a3e635', '#22c55e'],
    ['#818cf8', '#6366f1'],
    ['#f472b6', '#ec4899'],
    ['#fbbf24', '#f59e0b'],
    ['#34d399', '#10b981'],
];
const shapes = {
    phone: `<rect x="24" y="14" width="32" height="72" rx="7" fill="G1" opacity="0.16"/>
    <rect x="24" y="14" width="32" height="72" rx="7" fill="none" stroke="G2" stroke-width="1.6"/>
    <rect x="30" y="20" width="20" height="50" rx="3" fill="G2" opacity="0.28"/>
    <rect x="34" y="72" width="12" height="3" rx="1.5" fill="G2"/>
    <circle cx="40" cy="17" r="1.6" fill="G2"/>`,
    buds: `<path d="M26 26a8 8 0 0 1 16 0v10a8 8 0 0 1-16 0z" fill="G1" opacity="0.2" stroke="G2" stroke-width="1.5"/>
    <path d="M30 44v18a6 6 0 0 0 12 0V44" fill="none" stroke="G2" stroke-width="1.5"/>
    <circle cx="36" cy="30" r="3.4" fill="G2"/>
    <circle cx="52" cy="34" r="7" fill="G1" opacity="0.35"/>
    <path d="M52 41v11a5 5 0 0 0 10 0V41" fill="none" stroke="G2" stroke-width="1.4"/>`,
    watch: `<rect x="26" y="24" width="28" height="42" rx="9" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.6"/>
    <rect x="32" y="31" width="16" height="28" rx="4" fill="G2" opacity="0.3"/>
    <path d="M34 18h12M34 72h12" stroke="G2" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="40" cy="45" r="5" fill="none" stroke="G2" stroke-width="1.6"/>`,
    console: `<path d="M20 44h40a10 10 0 0 1 10 10v6a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10v-6a10 10 0 0 1 10-10z" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.5"/>
    <circle cx="26" cy="55" r="5.5" fill="none" stroke="G2" stroke-width="1.5"/>
    <path d="M26 52v6M23 55h6" stroke="G2" stroke-width="1.5"/>
    <circle cx="55" cy="51" r="3" fill="G2"/><circle cx="62" cy="57" r="3" fill="G2"/>
    <circle cx="48" cy="57" r="3" fill="G2"/><circle cx="55" cy="63" r="3" fill="G2"/>`,
    speaker: `<rect x="28" y="20" width="24" height="60" rx="7" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.6"/>
    <circle cx="40" cy="36" r="8" fill="none" stroke="G2" stroke-width="1.5"/>
    <circle cx="40" cy="36" r="3" fill="G2"/>
    <rect x="33" y="54" width="14" height="18" rx="4" fill="G2" opacity="0.3"/>`,
    hub: `<rect x="22" y="34" width="36" height="26" rx="8" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.6"/>
    <circle cx="33" cy="47" r="4" fill="G2"/><circle cx="47" cy="47" r="4" fill="G2" opacity="0.55"/>
    <path d="M40 24v10M30 28l10 6M50 28l-10 6" stroke="G2" stroke-width="1.4" stroke-linecap="round"/>`,
    drone: `<rect x="28" y="40" width="24" height="14" rx="5" fill="G1" opacity="0.2" stroke="G2" stroke-width="1.5"/>
    <circle cx="22" cy="34" r="6" fill="none" stroke="G2" stroke-width="1.5"/>
    <circle cx="58" cy="34" r="6" fill="none" stroke="G2" stroke-width="1.5"/>
    <path d="M28 34l4 6M52 34l-4 6M22 40l6 4M58 40l-6 4" stroke="G2" stroke-width="1.3"/>
    <circle cx="40" cy="47" r="3" fill="G2"/>`,
    kit: `<rect x="22" y="44" width="36" height="12" rx="5" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.5"/>
    <path d="M40 44V26a6 6 0 0 1 12 0" fill="none" stroke="G2" stroke-width="1.6"/>
    <circle cx="52" cy="24" r="4" fill="G2"/>
    <path d="M26 56v14M54 56v14" stroke="G2" stroke-width="1.4" stroke-linecap="round"/>`,
};
/** رسمة المنتج داخل البطاقة — تدرّج لوني خاص بكل بطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `sz${seq++}`;
    const body = shapes[kind].replaceAll('G1', g1).replaceAll('G2', g2);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body.replaceAll(g2, `url(#l${id})`)}
  </svg>`;
}
/** لوحة الهيرو: شبكة تقنية + موجة نبض. */
export function heroArt() {
    const id = `szh${seq++}`;
    const bars = Array.from({ length: 13 }, (_, i) => {
        const h = 10 + ((i * 37) % 46);
        return `<rect x="${16 + i * 6}" y="${64 - h}" width="3.4" height="${h}" rx="1.7" fill="url(#b${id})" opacity="${0.35 + (i % 4) * 0.16}"/>`;
    }).join('');
    return `<svg viewBox="0 0 130 100" class="hero-svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#6366f1"/>
      </linearGradient>
      <linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#22d3ee" stop-opacity="0"/><stop offset="0.5" stop-color="#22d3ee"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0 78h130" stroke="#1e293b" stroke-width="0.5"/>
    ${bars}
    <path d="M4 62 Q 30 30 52 52 T 96 40 T 126 50" fill="none" stroke="url(#s${id})" stroke-width="2" stroke-linecap="round"/>
    <circle cx="96" cy="40" r="3.2" fill="#22d3ee"/>
  </svg>`;
}
