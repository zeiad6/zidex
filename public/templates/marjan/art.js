import { CONFIG } from './config.js';
/** رسومات SVG خالصة — لا صور خارجية ولا شبكة. كل نوع منتج له عبوة مرسومة. */
let seq = 0;
/** [فاتح، قوي] — درجات دافئة تنسجم مع البطاقة المرجانية. */
const palettes = [
    ['#f9b9a8', '#e5484d'],
    ['#f6c9a0', '#d9822b'],
    ['#f3b6c4', '#c9416b'],
    ['#e9c3a6', '#a8603f'],
    ['#d9bfe6', '#8e5aa8'],
    ['#f7d39a', '#c98a1e'],
];
const shapes = {
    // سيروم: قارورة بقطّارة
    serum: `<rect x="29" y="46" width="22" height="34" rx="7" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <rect x="35" y="36" width="10" height="10" rx="2" fill="G2"/>
    <path d="M40 36V26" stroke="G2" stroke-width="1.6"/><ellipse cx="40" cy="22" rx="6" ry="5" fill="G2"/>
    <path d="M40 56c3 4 4.5 6 4.5 8a4.5 4.5 0 0 1-9 0c0-2 1.5-4 4.5-8z" fill="G2"/>`,
    // كريم: برطمان بغطاء
    cream: `<rect x="21" y="48" width="38" height="26" rx="8" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <rect x="19" y="38" width="42" height="11" rx="4" fill="G2"/>
    <path d="M30 60h20M33 66h14" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>`,
    // ماسك: وجه قناع
    mask: `<ellipse cx="40" cy="52" rx="17" ry="22" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <path d="M30 48c2-3 5-3 7 0M43 48c2-3 5-3 7 0" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M34 62c4 3 8 3 12 0" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round"/>`,
    // زيت: قارورة طويلة وورقة
    oil: `<rect x="31" y="40" width="18" height="40" rx="6" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <rect x="35" y="28" width="10" height="12" rx="2.5" fill="G2"/>
    <path d="M40 72c-5-5-5-12 0-17 5 5 5 12 0 17z" fill="G2"/>`,
    // شامبو: عبوة بمضخّة
    shampoo: `<rect x="27" y="44" width="26" height="36" rx="8" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <path d="M40 44V32M40 32H28v4" fill="none" stroke="G2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="35" y="38" width="10" height="6" rx="1.5" fill="G2"/>
    <path d="M33 58h14M33 64h9" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>`,
    // معطّر: بخّاخ ورذاذ
    mist: `<rect x="31" y="46" width="20" height="34" rx="6" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <rect x="35" y="34" width="12" height="12" rx="2.5" fill="G2"/>
    <circle cx="27" cy="34" r="1.6" fill="G2"/><circle cx="22" cy="29" r="1.6" fill="G2"/>
    <circle cx="22" cy="39" r="1.6" fill="G2"/><circle cx="17" cy="34" r="1.6" fill="G2"/>`,
    // شمعة: كأس ولهب
    candle: `<rect x="25" y="50" width="30" height="28" rx="6" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <path d="M40 50v-6" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M40 26c5 6 6 9 6 12a6 6 0 0 1-12 0c0-3 1-6 6-12z" fill="G2"/>`,
    // طقم: علبة هدية بشريط
    set: `<rect x="21" y="48" width="38" height="28" rx="5" fill="G1" opacity="0.5" stroke="G2" stroke-width="1.6"/>
    <rect x="18" y="40" width="44" height="9" rx="3" fill="G2"/>
    <path d="M40 40v36" stroke="G2" stroke-width="2"/>
    <path d="M40 40c-8-9-15-4-10 0M40 40c8-9 15-4 10 0" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round"/>`,
};
/** رسمة المنتج داخل البطاقة — لوحة ألوان خاصة بكل بطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `mj${seq++}`;
    const body = shapes[kind].replaceAll('G1', g1).replaceAll('G2', `url(#l${id})`);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body}
  </svg>`;
}
/** حلقة الهيرو: نسبة خصم الطلب الأول. الحركة في styles.css (ring-fill). */
export function heroArt() {
    return `<svg viewBox="0 0 100 100" class="ring-svg" role="img" aria-hidden="true">
    <circle class="ring-track" cx="50" cy="50" r="42"/>
    <circle class="ring-fg" cx="50" cy="50" r="42"/>
    <text class="ring-num" x="50" y="56" direction="ltr">${CONFIG.firstOrderOff}%</text>
  </svg>`;
}
