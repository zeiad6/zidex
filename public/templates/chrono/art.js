/** رسومات SVG خالصة — لا صور خارجية ولا شبكة. كل ساعة وجهها هنا. */
let seq = 0;
const palettes = [
    ['#60a5fa', '#2563eb'],
    ['#93c5fd', '#3b82f6'],
    ['#a5b4fc', '#4f46e5'],
    ['#7dd3fc', '#0ea5e9'],
    ['#fcd34d', '#d4af37'],
    ['#cbd5e1', '#94a3b8'],
];
/** إطار ساعة عام مع سوارين — يُلحق به تفاصيل كل نوع. */
const face = (inner) => `<rect x="34" y="10" width="12" height="14" rx="4" fill="G2" opacity="0.5"/>
   <rect x="34" y="76" width="12" height="14" rx="4" fill="G2" opacity="0.5"/>
   <circle cx="40" cy="50" r="24" fill="G1" opacity="0.14" stroke="G2" stroke-width="2"/>
   <circle cx="40" cy="50" r="20" fill="none" stroke="G2" stroke-width="1" opacity="0.5"/>${inner}`;
const shapes = {
    automatic: face(`<path d="M40 50V34M40 50l10 6" stroke="G2" stroke-width="2.2" stroke-linecap="round"/><circle cx="40" cy="50" r="2.4" fill="G2"/><circle cx="40" cy="33" r="1.4" fill="G2"/>`),
    dress: face(`<path d="M40 50V36M40 50l8 3" stroke="G2" stroke-width="1.8" stroke-linecap="round"/><path d="M40 32v3M58 50h-3M40 68v-3M22 50h3" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>`),
    chrono: face(`<circle cx="32" cy="50" r="4" fill="none" stroke="G2" stroke-width="1.2"/><circle cx="48" cy="50" r="4" fill="none" stroke="G2" stroke-width="1.2"/><circle cx="40" cy="58" r="4" fill="none" stroke="G2" stroke-width="1.2"/><path d="M40 50V37" stroke="G2" stroke-width="2" stroke-linecap="round"/>`),
    diver: face(`<circle cx="40" cy="50" r="24" fill="none" stroke="G2" stroke-width="3" stroke-dasharray="3 5" opacity="0.7"/><path d="M40 50V35M40 50l9 4" stroke="G2" stroke-width="2.4" stroke-linecap="round"/><circle cx="40" cy="30" r="2" fill="G2"/>`),
    sport: face(`<path d="M40 50V36M40 50l-7 6" stroke="G2" stroke-width="2.2" stroke-linecap="round"/><path d="M30 40l4 4M50 40l-4 4" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>`),
    smart: face(`<rect x="30" y="40" width="20" height="20" rx="5" fill="G2" opacity="0.28"/><path d="M34 50h5l2-4 3 8 2-4h2" fill="none" stroke="G2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`),
    gold: face(`<circle cx="40" cy="50" r="15" fill="none" stroke="G2" stroke-width="1" opacity="0.6"/><path d="M40 50V37M40 50l9 5" stroke="G2" stroke-width="2.2" stroke-linecap="round"/><path d="M40 36l1.5 3 3 .4-2.2 2 .5 3-2.8-1.5-2.8 1.5.5-3-2.2-2 3-.4z" fill="G2"/>`),
    skeleton: face(`<circle cx="34" cy="46" r="4" fill="none" stroke="G2" stroke-width="1.2"/><circle cx="46" cy="54" r="5" fill="none" stroke="G2" stroke-width="1.2"/><path d="M40 50V38M40 50l7 4" stroke="G2" stroke-width="1.8" stroke-linecap="round"/><path d="M30 58l20-16" stroke="G2" stroke-width="1" opacity="0.5"/>`),
};
/** رسمة المنتج داخل البطاقة — تدرّج لوني خاص بكل بطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `ch${seq++}`;
    const body = shapes[kind].replaceAll('G1', g1).replaceAll('G2', g2);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body.replaceAll(g2, `url(#l${id})`)}
  </svg>`;
}
/** لوحة الهيرو: ساعة كبيرة على توهّج أزرق كوبالت. */
export function heroArt() {
    const id = `chh${seq++}`;
    return `<svg viewBox="0 0 130 130" class="hero-svg" role="img" aria-hidden="true">
    <defs>
      <radialGradient id="g${id}" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0" stop-color="#3b82f6" stop-opacity="0.55"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#dbeafe"/><stop offset="1" stop-color="#93c5fd"/>
      </linearGradient>
    </defs>
    <circle cx="65" cy="62" r="46" fill="url(#g${id})"/>
    <rect x="56" y="14" width="18" height="20" rx="6" fill="#93c5fd" opacity="0.5"/>
    <rect x="56" y="92" width="18" height="20" rx="6" fill="#93c5fd" opacity="0.5"/>
    <circle cx="65" cy="62" r="34" fill="none" stroke="url(#s${id})" stroke-width="4"/>
    <circle cx="65" cy="62" r="27" fill="none" stroke="#60a5fa" stroke-width="1.4" opacity="0.6"/>
    <path d="M65 62V40M65 62l15 9" stroke="#dbeafe" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="65" cy="62" r="3.4" fill="#dbeafe"/>
  </svg>`;
}
