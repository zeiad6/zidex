/** الرسم الفني لكل منتج — SVG متجهي يولَّد محلياً بلا أي صورة خارجية:
 *  صفر طلبات شبكة (صورة CSP يمكن أن تكون 'none' تقريباً)، حِدّة كاملة على كل
 *  الشاشات، وحجم بايتات. لكل نوع شكل، ولكل منتج لون ذهبي يتفاوت. */
let seq = 0;
/** درجات الذهب المميزة لكل منتج — تتفاوت دورياً فيصبح كل بطاقة فريدة. */
const golds = [
    ['#d9ab52', '#8a6420'],
    ['#e8c37e', '#a0762e'],
    ['#c79a45', '#6f5122'],
    ['#f0d29a', '#b08a44'],
];
const shape = {
    // قارورة عطر: عنق وبدن وغطاء ذهبي
    bottle: '<rect x="46" y="10" width="8" height="16" rx="2" fill="G2"/>' +
        '<rect x="41" y="4" width="18" height="7" rx="2.5" fill="G1"/>' +
        '<path d="M32 34q-6 4-6 14v32a10 10 0 0010 10h28a10 10 0 0010-10V48q0-10-6-14z" fill="GL" stroke="G1" stroke-width="2"/>' +
        '<path d="M34 60q6-8 14-6t10 4v26a7 7 0 01-7 7H38a7 7 0 01-7-7z" fill="G1" opacity=".45"/>',
    // مبخرة: بدن نحاسي مقبب وقاعدة
    burner: '<path d="M24 42h32l-4 34a6 6 0 01-6 5H34a6 6 0 01-6-5z" fill="GL" stroke="G1" stroke-width="2"/>' +
        '<path d="M20 42q6-10 20-10t20 10z" fill="G1"/>' +
        '<rect x="28" y="82" width="24" height="6" rx="3" fill="G2"/>' +
        '<path d="M40 26q-3 6 0 10" stroke="G1" stroke-width="2" fill="none" opacity=".7"/>',
    // قطع عود: كومة شرائح داكنة
    chips: '<path d="M18 66l10-18 14-6 12 10 8 16-6 10H26z" fill="GL" stroke="G1" stroke-width="2"/>' +
        '<path d="M30 52l8 14 10-4" fill="none" stroke="G2" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M22 74h26" stroke="G2" stroke-width="2" stroke-linecap="round" opacity=".8"/>',
    // علبة هدية: صندوق وشريط
    gift: '<rect x="20" y="30" width="40" height="50" rx="4" fill="GL" stroke="G1" stroke-width="2"/>' +
        '<rect x="16" y="24" width="48" height="10" rx="3" fill="G1"/>' +
        '<path d="M40 34v46M20 34h40" stroke="G2" stroke-width="2" opacity=".6"/>',
};
/** يولّد رسم SVG كامل لمنتج — كل بطاقة بدرجة ذهبية تخصها. */
export function art(kind, index) {
    const [g1, g2] = golds[index % golds.length];
    const id = `g${seq++}`;
    const body = shape[kind]
        .replaceAll('GL', `url(#l${id})`)
        .replaceAll('G1', g1)
        .replaceAll('G2', g2);
    return (`<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">` +
        `<defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${g1}" stop-opacity=".33"/>` +
        `<stop offset="1" stop-color="${g2}" stop-opacity=".18"/>` +
        `</linearGradient></defs>${body}</svg>`);
}
/** رسم الواجهة الكبير — قارورة مركزية تتردد ببطء (الدوران يفعّله CSS). */
export function heroArt() {
    return (`<svg viewBox="0 0 300 320" class="hero-svg" aria-hidden="true">` +
        `<defs><radialGradient id="hglow" cx=".5" cy=".5" r=".5">` +
        `<stop offset="0" stop-color="#d9ab52" stop-opacity=".5"/>` +
        `<stop offset=".6" stop-color="#d9ab52" stop-opacity=".16"/>` +
        `<stop offset="1" stop-color="#d9ab52" stop-opacity="0"/>` +
        `</radialGradient></defs>` +
        `<circle cx="150" cy="160" r="150" fill="url(#hglow)"/>` +
        `<g class="hero-float">` +
        `<rect x="142" y="26" width="16" height="26" rx="4" fill="#8a6420"/>` +
        `<rect x="132" y="12" width="36" height="16" rx="6" fill="#d9ab52"/>` +
        `<path d="M112 66q-12 8-12 28v130a20 20 0 0020 20h60a20 20 0 0020-20V94q0-20-12-28z" fill="none" stroke="#d9ab52" stroke-width="3"/>` +
        `<path d="M116 96q12-16 28-12t20 8v150a14 14 0 01-14 14h-20a14 14 0 01-14-14z" fill="#d9ab52" opacity=".35"/>` +
        `</g>` +
        `<circle cx="86" cy="70" r="4" fill="#d9ab52" class="spark s1"/>` +
        `<circle cx="236" cy="120" r="3" fill="#e8c37e" class="spark s2"/>` +
        `<circle cx="210" cy="268" r="5" fill="#c79a45" class="spark s3"/>` +
        `</svg>`);
}
