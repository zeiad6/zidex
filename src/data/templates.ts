/** قوالب المتاجر الجاهزة — الخدمة الجديدة: موقع متجر كامل يُشترى ويُستضاف.
 *  المصدر الوحيد لهذه البيانات؛ المعرض وصفحة التجربة والكتالوج كلها تقرأ منه. */

export type TemplateFeature = { ar: string; en: string }

export type StoreTemplate = {
  slug: string
  /** معرّف المنتج في كتالوج المتجر (نفس sku في public/store/catalog.json). */
  sku: string
  name: TemplateFeature
  tagline: TemplateFeature
  description: TemplateFeature
  /** السعر بنجوم تيليجرام (الدفع داخل تيليجرام) وبالدولار (بقية الطرق). */
  stars: number
  usd: number
  /** مسار التجربة الحية على نفس الموقع (iframe). */
  demoPath: string
  /** مستودع القالب الخاص. */
  repo: string
  /** شريحة الهوية البصرية في البطاقة. */
  swatch: string
  features: TemplateFeature[]
}

export const TEMPLATES: StoreTemplate[] = [
  {
    slug: 'oud-amber',
    sku: 'site-oud-amber',
    name: { ar: 'عود وعنبر', en: 'Oud & Amber' },
    tagline: { ar: 'متجر عطور وعود فاخر', en: 'Luxury fragrance & oud store' },
    description: {
      ar: 'قالب متجر كامل لبيع العود والعطور والهدايا: هوية ذهبية داكنة، بطاقات منتج بلمسات فنية، عرض سريع وسلة محفوظة، وطلب جاهز عبر تيليجرام أو واتساب. عربي أولاً بإنجليزية كاملة.',
      en: 'A complete storefront template for oud, perfume and gifts: dark gold identity, artful product cards, quick view and a saved cart, with checkout ready over Telegram or WhatsApp. Arabic-first with full English.',
    },
    stars: 7000,
    usd: 99,
    demoPath: '/templates/oud-amber/',
    repo: 'https://github.com/zeiad6/oud-amber-store',
    swatch: 'linear-gradient(140deg,#1a1206,#3a2a0d 55%,#d4a94e)',
    features: [
      { ar: '8 منتجات جاهزة بصور SVG مرسومة بالكود', en: '8 ready products with code-drawn SVG art' },
      { ar: 'بحث عربي يتجاهل الحركات والهمزات', en: 'Arabic search ignoring harakat and hamza' },
      { ar: 'سلة محفوظة تُكمل بعد إغلاق الصفحة', en: 'Cart that survives a page reload' },
      { ar: 'طلب فوري عبر تيليجرام أو واتساب', en: 'Instant ordering via Telegram or WhatsApp' },
      { ar: 'صفر تبعيات: ملفان ثابتان فقط', en: 'Zero dependencies: two static files' },
    ],
  },
  {
    slug: 'smart-zone',
    sku: 'site-smart-zone',
    name: { ar: 'سمارت زون', en: 'Smart Zone' },
    tagline: { ar: 'متجر إلكترونيات وتقنية', en: 'Electronics & gadgets store' },
    description: {
      ar: 'قالب متجر إلكترونيات بهوية تقنية داكنة: رقاقات مواصفات، ترتيب حسب السعر، عدّادات متحركة، وبطاقات بانورامية. مبنيّ لعرض الأجهزة بثقة — ضمان، فحص، دعم.',
      en: 'An electronics template with a dark tech identity: spec chips, price sorting, animated counters and panoramic cards. Built to show devices with confidence — warranty, inspection, support.',
    },
    stars: 5600,
    usd: 79,
    demoPath: '/templates/smart-zone/',
    repo: 'https://github.com/zeiad6/smart-zone-store',
    swatch: 'linear-gradient(140deg,#06080c,#0e2233 55%,#22d3ee)',
    features: [
      { ar: '9 أجهزة عبر 3 تصنيفات', en: '9 devices across 3 categories' },
      { ar: 'ترتيب بالسعر: الأرخص أو الأغلى أولاً', en: 'Price sorting either way' },
      { ar: 'رقاقات مواصفات لكل جهاز', en: 'Spec chips on every device' },
      { ar: 'شريط علامات متحرك وعدّادات', en: 'Animated brand strip and counters' },
      { ar: 'هوية داكنة عالية التباين', en: 'High-contrast dark identity' },
    ],
  },
  {
    slug: 'durra',
    sku: 'site-durra',
    name: { ar: 'دُرّة', en: 'Durra' },
    tagline: { ar: 'متجر تمور وقهوة وضيافة', en: 'Dates, coffee & hospitality store' },
    description: {
      ar: 'قالب ضيافة بهوية صحراوية دافئة: عناوين بخط النسخ، شريط علب هدايا، وآراء عملاء. مناسب لمحامص التمور والقهوة ومتاجر الهدايا الموسمية.',
      en: 'A hospitality template with warm desert identity: naskh display headings, a gift-box band and guest voices. Ideal for date roasters, coffee houses and seasonal gift shops.',
    },
    stars: 4600,
    usd: 65,
    demoPath: '/templates/durra/',
    repo: 'https://github.com/zeiad6/durra-store',
    swatch: 'linear-gradient(140deg,#f1e9db,#c4562f 55%,#1e3a2b)',
    features: [
      { ar: '9 منتجات: تمور، قهوة، علب هدايا', en: '9 products: dates, coffee, gift boxes' },
      { ar: 'شريط علب هدايا بارز', en: 'A prominent gift-box band' },
      { ar: 'قسم آراء الضيوف', en: 'A guest voices section' },
      { ar: 'زخرفة هندسية مرسومة SVG', en: 'Code-drawn geometric ornament' },
      { ar: 'هُوية صحراوية فاتحة أنيقة', en: 'An elegant light desert identity' },
    ],
  },
]

export const templateBySlug = (slug: string | undefined): StoreTemplate | undefined =>
  TEMPLATES.find((t) => t.slug === slug)
