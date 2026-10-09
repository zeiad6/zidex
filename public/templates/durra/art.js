/** رسومات SVG خالصة مستوحاة من الزخرفة الهندسية — لا صور خارجية. */
let seq = 0;
const palettes = [
    ['#c4562f', '#8f3418'],
    ['#b98a2f', '#8a6216'],
    ['#1e3a2b', '#2f5c46'],
    ['#7c4a2d', '#57331c'],
    ['#a4552f', '#74331a'],
    ['#94682c', '#6b4a1c'],
];
const ornament = `<circle cx="40" cy="50" r="30" fill="none" stroke="G2" stroke-width="0.6" opacity="0.4"/>
  <circle cx="40" cy="50" r="22" fill="none" stroke="G2" stroke-width="0.6" opacity="0.3"/>`;
const shapes = {
    dates: `${ornament}
    <ellipse cx="40" cy="58" rx="20" ry="26" fill="G1" opacity="0.18"/>
    <ellipse cx="40" cy="58" rx="20" ry="26" fill="none" stroke="G2" stroke-width="1.4"/>
    <path d="M40 34c8 8 8 34 0 48M40 34c-8 8-8 34 0 48" fill="none" stroke="G2" stroke-width="1.1" opacity="0.7"/>
    <path d="M28 50h24M30 60h20" stroke="G2" stroke-width="0.8" opacity="0.5"/>`,
    box: `${ornament}
    <rect x="22" y="42" width="36" height="30" rx="4" fill="G1" opacity="0.2" stroke="G2" stroke-width="1.4"/>
    <path d="M22 50h36M40 42v30" stroke="G2" stroke-width="1.2"/>
    <path d="M32 42c0-6 4-8 8-8s8 2 8 8" fill="none" stroke="G2" stroke-width="1.4"/>
    <circle cx="40" cy="57" r="3" fill="G2"/>`,
    beans: `${ornament}
    <path d="M24 60c0-12 8-20 16-20s16 8 16 20z" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.4"/>
    <path d="M32 44c2 6 2 12 0 18M48 44c-2 6-2 12 0 18" fill="none" stroke="G2" stroke-width="1.1"/>
    <ellipse cx="40" cy="66" rx="16" ry="7" fill="G2" opacity="0.25"/>`,
    dallah: `${ornament}
    <path d="M28 46h24l3 22a10 10 0 0 1-10 9H35a10 10 0 0 1-10-9z" fill="G1" opacity="0.2" stroke="G2" stroke-width="1.4"/>
    <path d="M28 46c-6-2-8-6-8-10M52 46c6-2 8-6 8-10" fill="none" stroke="G2" stroke-width="1.4"/>
    <rect x="34" y="30" width="12" height="5" rx="2" fill="G2"/>
    <path d="M40 34v-6a5 5 0 0 1 10 0" fill="none" stroke="G2" stroke-width="1.2"/>`,
    tray: `${ornament}
    <ellipse cx="40" cy="62" rx="26" ry="12" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.4"/>
    <ellipse cx="40" cy="58" rx="26" ry="12" fill="none" stroke="G2" stroke-width="1.2" opacity="0.7"/>
    <path d="M22 62a18 8 0 0 0 36 0" fill="none" stroke="G2" stroke-width="1.1" opacity="0.5"/>`,
    oud: `${ornament}
    <path d="M36 34h8v10l6 22a12 12 0 0 1-20 0l6-22z" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.4"/>
    <rect x="34" y="26" width="12" height="8" rx="2" fill="G2"/>
    <path d="M40 20v6M34 24h12" stroke="G2" stroke-width="1.2"/>`,
    gift: `${ornament}
    <rect x="20" y="46" width="40" height="28" rx="5" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.4"/>
    <path d="M20 56h40M40 46v28" stroke="G2" stroke-width="1.2"/>
    <path d="M40 46c-8 0-10-8-4-11s10-1 4 11zM40 46c8 0 10-8 4-11s-10-1-4 11z" fill="G2" opacity="0.35"/>`,
    cups: `${ornament}
    <path d="M24 48h16v10a8 8 0 0 1-16 0z" fill="G1" opacity="0.2" stroke="G2" stroke-width="1.4"/>
    <path d="M40 48h16v10a8 8 0 0 1-16 0z" fill="G1" opacity="0.12" stroke="G2" stroke-width="1.4"/>
    <path d="M40 58h16M28 62v6M48 62v6" stroke="G2" stroke-width="1.2"/>`,
};
/** رسمة المنتج داخل البطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `dr${seq++}`;
    const body = shapes[kind].replaceAll('G1', g1).replaceAll('G2', g2);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body.replaceAll(g2, `url(#l${id})`)}
  </svg>`;
}
/** لوحة الهيرو: نخلة وزخرفة. */
export function heroArt() {
    const id = `drh${seq++}`;
    const fronds = Array.from({ length: 6 }, (_, i) => {
        const a = -60 + i * 24;
        return `<path d="M40 46 Q ${40 + Math.cos((a * Math.PI) / 180) * 26} ${46 + Math.sin((a * Math.PI) / 180) * 26 - 10} ${40 + Math.cos(((a + 14) * Math.PI) / 180) * 22} ${46 + Math.sin(((a + 14) * Math.PI) / 180) * 26}" fill="none" stroke="url(#f${id})" stroke-width="2.4" stroke-linecap="round"/>`;
    }).join('');
    return `<svg viewBox="0 0 130 100" class="hero-svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="f${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2f5c46"/><stop offset="1" stop-color="#1e3a2b"/>
      </linearGradient>
    </defs>
    <path d="M40 46v40" stroke="#6b4a1c" stroke-width="3" stroke-linecap="round"/>
    ${fronds}
    <path d="M14 86h52" stroke="#b98a2f" stroke-width="1" opacity="0.5"/>
    <path d="M20 92h40" stroke="#b98a2f" stroke-width="1" opacity="0.35"/>
    <circle cx="40" cy="46" r="4" fill="#c4562f"/>
    <path d="M64 70h44M64 78h30" stroke="#b98a2f" stroke-width="1.4" opacity="0.6" stroke-linecap="round"/>
  </svg>`;
}
