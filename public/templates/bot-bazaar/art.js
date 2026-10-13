/** رسومات SVG خالصة — لا صور خارجية ولا شبكة. كل منتج رقمي رمزه هنا. */
let seq = 0;
const palettes = [
    ['#a78bfa', '#7c5cff'],
    ['#34d399', '#10b981'],
    ['#38bdf8', '#6366f1'],
    ['#f472b6', '#c026d3'],
    ['#fbbf24', '#f59e0b'],
    ['#2dd4bf', '#0ea5e9'],
];
const shapes = {
    // رأس بوت: وجه مستدير، عينان، وهوائي
    bot: `<rect x="22" y="30" width="36" height="34" rx="11" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.6"/>
    <circle cx="33" cy="47" r="4" fill="G2"/><circle cx="47" cy="47" r="4" fill="G2"/>
    <path d="M40 20v10" stroke="G2" stroke-width="1.6" stroke-linecap="round"/><circle cx="40" cy="18" r="3" fill="G2"/>
    <path d="M34 56h12" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>
    <rect x="16" y="42" width="4" height="10" rx="2" fill="G2" opacity="0.6"/><rect x="60" y="42" width="4" height="10" rx="2" fill="G2" opacity="0.6"/>`,
    // ذكاء اصطناعي: عقدة مركزية + شرارات
    ai: `<circle cx="40" cy="46" r="12" fill="G1" opacity="0.18" stroke="G2" stroke-width="1.6"/>
    <path d="M40 46l-9-9M40 46l11-7M40 46l-7 11M40 46l9 9" stroke="G2" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="31" cy="37" r="3.2" fill="G2"/><circle cx="51" cy="39" r="3.2" fill="G2"/>
    <circle cx="33" cy="57" r="3.2" fill="G2"/><circle cx="49" cy="55" r="3.2" fill="G2"/>
    <path d="M40 28l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="G2"/>`,
    // CRM: بطاقات متراكبة
    crm: `<rect x="24" y="30" width="32" height="22" rx="5" fill="G1" opacity="0.14" stroke="G2" stroke-width="1.5"/>
    <rect x="30" y="38" width="32" height="22" rx="5" fill="G1" opacity="0.2" stroke="G2" stroke-width="1.6"/>
    <circle cx="39" cy="47" r="4.5" fill="G2" opacity="0.7"/>
    <path d="M48 44h10M48 50h7" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>`,
    // قالب متجر: واجهة + كيس
    store: `<rect x="22" y="28" width="36" height="40" rx="7" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.6"/>
    <path d="M22 38h36" stroke="G2" stroke-width="1.4"/>
    <circle cx="28" cy="33" r="1.6" fill="G2"/><circle cx="33" cy="33" r="1.6" fill="G2"/>
    <path d="M34 48a6 6 0 0 1 12 0v10h-12z" fill="none" stroke="G2" stroke-width="1.6"/>`,
    // سكربت: أقواس كود </>
    script: `<rect x="20" y="28" width="40" height="40" rx="9" fill="G1" opacity="0.14" stroke="G2" stroke-width="1.6"/>
    <path d="M34 42l-7 6 7 6" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M46 42l7 6-7 6" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M42 38l-4 20" stroke="G2" stroke-width="1.6" stroke-linecap="round"/>`,
    // لوحة تحكم: أعمدة + مؤشر
    panel: `<rect x="18" y="28" width="44" height="40" rx="7" fill="G1" opacity="0.14" stroke="G2" stroke-width="1.6"/>
    <rect x="25" y="48" width="5" height="12" rx="2" fill="G2"/><rect x="33" y="42" width="5" height="18" rx="2" fill="G2" opacity="0.8"/>
    <rect x="41" y="38" width="5" height="22" rx="2" fill="G2" opacity="0.6"/>
    <path d="M24 36h14" stroke="G2" stroke-width="1.6" stroke-linecap="round"/><circle cx="54" cy="36" r="3" fill="G2"/>`,
    // اشتراك: شارة تجديد دائري
    sub: `<circle cx="40" cy="46" r="16" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.6"/>
    <path d="M40 34a12 12 0 1 1-10 5.5" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M40 30v6h-6" fill="none" stroke="G2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 46l2.5 2.5" stroke="G2" stroke-width="1.8" stroke-linecap="round"/>`,
    // ألعاب: يد تحكم
    game: `<path d="M24 40h32a10 10 0 0 1 10 12l-2 8a6 6 0 0 1-11 1l-3-6H30l-3 6a6 6 0 0 1-11-1l-2-8a10 10 0 0 1 10-12z" fill="G1" opacity="0.16" stroke="G2" stroke-width="1.6"/>
    <path d="M28 48v8M24 52h8" stroke="G2" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="52" cy="50" r="2.6" fill="G2"/><circle cx="58" cy="56" r="2.6" fill="G2"/>`,
};
/** رسمة المنتج داخل البطاقة — تدرّج لوني خاص بكل بطاقة. */
export function art(kind, index) {
    const [g1, g2] = palettes[index % palettes.length];
    const id = `bb${seq++}`;
    const body = shapes[kind].replaceAll('G1', g1).replaceAll('G2', g2);
    return `<svg viewBox="0 0 80 100" class="art" role="img" aria-hidden="true">
    <defs><linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g2}"/><stop offset="1" stop-color="${g1}"/>
    </linearGradient></defs>${body.replaceAll(g2, `url(#l${id})`)}
  </svg>`;
}
/** لوحة الهيرو: شبكة عقد بوتية + موجة نبض. */
export function heroArt() {
    const id = `bbh${seq++}`;
    const bars = Array.from({ length: 13 }, (_, i) => {
        const h = 10 + ((i * 37) % 46);
        return `<rect x="${16 + i * 6}" y="${64 - h}" width="3.4" height="${h}" rx="1.7" fill="url(#b${id})" opacity="${0.35 + (i % 4) * 0.16}"/>`;
    }).join('');
    return `<svg viewBox="0 0 130 100" class="hero-svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#34d399"/>
      </linearGradient>
      <linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#a78bfa" stop-opacity="0"/><stop offset="0.5" stop-color="#a78bfa"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="M0 78h130" stroke="#2a2550" stroke-width="0.5"/>
    ${bars}
    <path d="M4 62 Q 30 30 52 52 T 96 40 T 126 50" fill="none" stroke="url(#s${id})" stroke-width="2" stroke-linecap="round"/>
    <circle cx="96" cy="40" r="3.2" fill="#34d399"/>
  </svg>`;
}
