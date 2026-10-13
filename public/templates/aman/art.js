/** رسومات SVG خالصة — لا صور خارجية ولا شبكة. كل خطة رمزها هنا. */
let seq = 0;
const palettes = [
    ['#f0916b', '#e8623a'],
    ['#e9a07a', '#d8734a'],
    ['#f2b79a', '#e07a4e'],
    ['#e4b59c', '#c38b70'],
    ['#f3a07f', '#dd6f43'],
    ['#edb19a', '#cf7c57'],
];
const shapes = {
    // درع حماية مع علامة صح
    shield: `<path d="M40 16l20 8v16c0 14-9 24-20 28-11-4-20-14-20-28V24z" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.8"/>
    <path d="M31 44l6 7 13-15" fill="none" stroke="G2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    // قلب (حياة)
    heart: `<path d="M40 66S18 52 18 36a12 12 0 0 1 22-7 12 12 0 0 1 22 7c0 16-22 30-22 30z" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.8"/>
    <path d="M28 40h8l3-6 5 12 3-6h7" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
    // سيارة
    car: `<path d="M18 52l5-14a6 6 0 0 1 6-4h22a6 6 0 0 1 6 4l5 14v10a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-2H28v2a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <path d="M22 52h36" stroke="G2" stroke-width="1.5"/><circle cx="29" cy="58" r="3" fill="G2"/><circle cx="51" cy="58" r="3" fill="G2"/>`,
    // منزل
    home: `<path d="M20 44l20-18 20 18" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 42v22h28V42" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <rect x="35" y="50" width="10" height="14" rx="2" fill="G2" opacity="0.4"/>`,
    // طائرة (سفر)
    plane: `<path d="M20 50l40-14a4 4 0 0 1 3 7L30 60l-4 8-4-2 1-9-9-4a2 2 0 0 1 0-4z" fill="G1" opacity="0.2" stroke="G2" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="58" cy="30" r="2.4" fill="G2"/>`,
    // مظلة (حماية عامة)
    umbrella: `<path d="M22 44a18 18 0 0 1 36 0z" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M40 44v18a5 5 0 0 1-10 0" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M22 44q9-6 18 0q9-6 18 0" fill="none" stroke="G2" stroke-width="1.3"/>`,
    // حقيبة أعمال
    briefcase: `<rect x="20" y="36" width="40" height="28" rx="6" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <path d="M32 36v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" fill="none" stroke="G2" stroke-width="1.7"/>
    <path d="M20 48h40" stroke="G2" stroke-width="1.5"/><rect x="36" y="45" width="8" height="6" rx="2" fill="G2" opacity="0.5"/>`,
    // جوال (أجهزة)
    phone: `<rect x="28" y="20" width="24" height="44" rx="6" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.7"/>
    <rect x="32" y="26" width="16" height="30" rx="2" fill="G2" opacity="0.28"/>
    <circle cx="40" cy="60" r="1.8" fill="G2"/>`,
};
/** رسمة المنتج داخل البطاقة — تدرّج لوني دافئ خاص بكل بطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `am${seq++}`;
    const body = shapes[kind].replaceAll('G1', g1).replaceAll('G2', g2);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body.replaceAll(g2, `url(#l${id})`)}
  </svg>`;
}
/** لوحة الهيرو: درع كبير هادئ على توهّج دافئ. */
export function heroArt() {
    const id = `amh${seq++}`;
    return `<svg viewBox="0 0 130 120" class="hero-svg" role="img" aria-hidden="true">
    <defs>
      <radialGradient id="g${id}" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.25"/>
      </radialGradient>
      <linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="1" stop-color="#ffe6d8" stop-opacity="0.8"/>
      </linearGradient>
    </defs>
    <circle cx="65" cy="58" r="40" fill="url(#g${id})"/>
    <path d="M65 26l30 12v22c0 20-13 34-30 40-17-6-30-20-30-40V38z" fill="url(#s${id})" stroke="#ffffff" stroke-width="2" opacity="0.95"/>
    <path d="M51 60l9 10 20-23" fill="none" stroke="#e8623a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
