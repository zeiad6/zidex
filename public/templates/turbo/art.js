/** رسومات SVG خالصة — لا صور خارجية ولا شبكة. كل منتج رمزه هنا.
 *  لوحة فولاذية مع لمسة نيلية (indigo) بروح متجر سيارات حديث. */
let seq = 0;
const palettes = [
    ['#818cf8', '#6366f1'],
    ['#a5b4fc', '#818cf8'],
    ['#cbd5e1', '#94a3b8'],
    ['#60a5fa', '#3b82f6'],
    ['#e2e8f0', '#94a3b8'],
    ['#a78bfa', '#818cf8'],
];
const shapes = {
    // إطار: مطّاط خارجي + مداس + فتحة الجنط
    tire: `<circle cx="40" cy="46" r="21" fill="G1" opacity="0.12" stroke="G2" stroke-width="3.4"/>
    <circle cx="40" cy="46" r="10" fill="none" stroke="G2" stroke-width="1.6" opacity="0.9"/>
    <circle cx="40" cy="46" r="3.4" fill="G2"/>
    <g stroke="G2" stroke-width="1.5" stroke-linecap="round" opacity="0.8">
      <path d="M40 23v6M40 63v6M17 46h6M57 46h6M24 30l4 4M56 62l-4-4M56 30l-4 4M24 62l4-4"/>
    </g>`,
    // جنط رياضي: 5 أذرع + صواميل
    wheel: `<circle cx="40" cy="46" r="20" fill="G1" opacity="0.12" stroke="G2" stroke-width="2"/>
    <circle cx="40" cy="46" r="6" fill="none" stroke="G2" stroke-width="1.8"/>
    <circle cx="40" cy="46" r="2" fill="G2"/>
    <g stroke="G2" stroke-width="2.4" stroke-linecap="round">
      <path d="M40 40V27M46 49l11 6M34 49l-11 6M44 43l12-4M36 43l-12-4"/>
    </g>
    <g fill="G2"><circle cx="40" cy="44" r="1.2"/><circle cx="42" cy="47" r="1.2"/><circle cx="38" cy="47" r="1.2"/></g>`,
    // فرامل: قرص + فتحات تهوية + كاليبر
    brake: `<circle cx="40" cy="46" r="20" fill="G1" opacity="0.12" stroke="G2" stroke-width="2.2"/>
    <circle cx="40" cy="46" r="8" fill="none" stroke="G2" stroke-width="1.6"/>
    <g stroke="G2" stroke-width="1.3" opacity="0.7"><path d="M40 29v7M51 46h-6M40 63v-7M29 46h6M31 37l5 5M49 37l-5 5"/></g>
    <path d="M55 38a20 20 0 0 1 0 16l-5-2a15 15 0 0 0 0-12z" fill="G2" opacity="0.85"/>`,
    // إضاءة LED: عاكس + أشعة
    light: `<path d="M26 34h20a16 16 0 0 1 0 24H26a4 4 0 0 1-4-4V38a4 4 0 0 1 4-4z" fill="G1" opacity="0.14" stroke="G2" stroke-width="1.8"/>
    <circle cx="36" cy="46" r="6" fill="none" stroke="G2" stroke-width="1.6"/><circle cx="36" cy="46" r="2" fill="G2"/>
    <g stroke="G2" stroke-width="1.8" stroke-linecap="round"><path d="M50 40h10M50 46h12M50 52h10"/></g>`,
    // دواسة أرضية: مستطيل بحواف + خطوط تصريف
    mat: `<path d="M24 28h28a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4z" fill="G1" opacity="0.14" stroke="G2" stroke-width="1.8"/>
    <path d="M26 34h24M26 40h24M26 46h24M26 52h24M26 58h24" stroke="G2" stroke-width="1.3" opacity="0.6"/>
    <rect x="32" y="30" width="12" height="4" rx="2" fill="G2" opacity="0.7"/>`,
};
/** رسمة المنتج داخل البطاقة — تدرّج لوني خاص بكل بطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `tb${seq++}`;
    const shape = shapes[kind] || shapes.wheel;
    const body = shape.replaceAll('G1', g1).replaceAll('G2', g2);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body.replaceAll(g2, `url(#l${id})`)}
  </svg>`;
}
/** لوحة الهيرو: سيارة رياضية جانبية + خطوط سرعة. */
export function heroArt() {
    const id = `tbh${seq++}`;
    const speed = Array.from({ length: 5 }, (_, i) =>
        `<path d="M${6 + i * 3} ${40 + i * 7}h${26 - i * 3}" stroke="url(#s${id})" stroke-width="2" stroke-linecap="round" opacity="${0.5 - i * 0.07}"/>`
    ).join('');
    return `<svg viewBox="0 0 130 100" class="hero-svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#a5b4fc"/><stop offset="1" stop-color="#6366f1"/>
      </linearGradient>
      <linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#818cf8" stop-opacity="0"/><stop offset="1" stop-color="#818cf8"/>
      </linearGradient>
    </defs>
    ${speed}
    <path d="M18 70 L34 70 Q38 56 52 54 L74 52 Q86 51 94 60 L112 64 Q118 65 118 70 L118 73 Q118 76 114 76 L22 76 Q18 76 18 73 Z"
      fill="url(#g${id})" opacity="0.18" stroke="url(#g${id})" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M40 70 Q45 57 55 56 L72 55 Q80 55 85 61 L92 69 Z" fill="none" stroke="#818cf8" stroke-width="1.4" opacity="0.8"/>
    <circle cx="44" cy="76" r="10" fill="#0a0e1f" stroke="url(#g${id})" stroke-width="2.4"/>
    <circle cx="44" cy="76" r="3.6" fill="#818cf8"/>
    <circle cx="100" cy="76" r="10" fill="#0a0e1f" stroke="url(#g${id})" stroke-width="2.4"/>
    <circle cx="100" cy="76" r="3.6" fill="#818cf8"/>
    <path d="M6 90h118" stroke="#2a2f52" stroke-width="0.6"/>
  </svg>`;
}
