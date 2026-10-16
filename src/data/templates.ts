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
  {
    slug: 'bot-bazaar',
    sku: 'site-bot-bazaar',
    name: { ar: 'بوت بازار', en: 'Bot Bazaar' },
    tagline: { ar: 'سوق بوتات ومنتجات رقمية', en: 'Bots & digital goods marketplace' },
    description: {
      ar: 'قالب سوق رقمي بهوية بنفسجية داكنة بأسلوب Bento: بطاقات بوتات وأدوات واشتراكات برموز مرسومة بالكود، بحث وترتيب، وسلة محفوظة. مصمَّم لبيع بوتات تيليجرام والقوالب والسكربتات مع تسليم فوري. عربي أولاً بإنجليزية كاملة.',
      en: 'A digital-marketplace template with a dark violet Bento identity: bot, tool and subscription cards with code-drawn glyphs, search and sort, and a saved cart. Built to sell Telegram bots, templates and scripts with instant delivery. Arabic-first with full English.',
    },
    stars: 5200,
    usd: 75,
    demoPath: '/templates/bot-bazaar/',
    repo: 'https://github.com/zeiad6/bot-bazaar-store',
    swatch: 'linear-gradient(140deg,#0a0918,#7c5cff 55%,#34d399)',
    features: [
      { ar: '8 منتجات رقمية: بوتات، أدوات، اشتراكات', en: '8 digital products: bots, tools, subscriptions' },
      { ar: 'تخطيط Bento ببلاطات معيارية', en: 'A Bento layout of modular tiles' },
      { ar: 'رموز منتجات مرسومة بالكود SVG', en: 'Code-drawn SVG product glyphs' },
      { ar: 'بحث وترتيب وسلة محفوظة', en: 'Search, sort and a saved cart' },
      { ar: 'طلب فوري عبر تيليجرام أو واتساب', en: 'Instant ordering via Telegram or WhatsApp' },
      { ar: 'صفر تبعيات ورؤوس أمان صارمة', en: 'Zero dependencies and strict security headers' },
    ],
  },
  {
    slug: 'aman',
    sku: 'site-aman',
    name: { ar: 'أمان', en: 'Aman' },
    tagline: { ar: 'متجر خطط تأمين رقمي', en: 'Digital insurance plans store' },
    description: {
      ar: 'قالب متجر تأمين بأسلوب "Soft Care" هادئ فاتح: بطاقات بيضاء عائمة، بطاقة ترحيب بتدرّج دافئ، وأزرار إسبريسو مستديرة — مستوحى من تصميم تطبيق تأمين على Dribbble. 8 خطط بين الصحي والمركبات والممتلكات، برموز مرسومة بالكود. عربي أولاً بإنجليزية كاملة.',
      en: 'An insurance store template in a calm light "Soft Care" style: white floating cards, a warm-gradient welcome card and rounded espresso buttons — inspired by an insurance app design on Dribbble. 8 plans across health, motor and property, with code-drawn glyphs. Arabic-first with full English.',
    },
    stars: 4200,
    usd: 59,
    demoPath: '/templates/aman/',
    repo: 'https://github.com/zeiad6/aman-store',
    swatch: 'linear-gradient(150deg,#f3a07f,#e8623a 55%,#1e1816)',
    features: [
      { ar: '8 خطط: صحي، مركبات، سفر، منزل، أجهزة', en: '8 plans: health, motor, travel, home, devices' },
      { ar: 'أسلوب هادئ فاتح ببطاقات بيضاء', en: 'A calm light style with white cards' },
      { ar: 'بطاقة ترحيب بتدرّج دافئ', en: 'A warm-gradient welcome card' },
      { ar: 'رموز تأمين مرسومة بالكود SVG', en: 'Code-drawn SVG insurance glyphs' },
      { ar: 'بحث وترتيب وقائمة خطط محفوظة', en: 'Search, sort and a saved plans list' },
      { ar: 'صفر تبعيات ورؤوس أمان صارمة', en: 'Zero dependencies and strict security headers' },
    ],
  },
  {
    slug: 'mahfazah',
    sku: 'site-mahfazah',
    name: { ar: 'محفظة', en: 'Mahfazah' },
    tagline: { ar: 'متجر خدمات مالية ومحفظة رقمية', en: 'Digital wallet & finance store' },
    description: {
      ar: 'قالب متجر فينتك بأسلوب "Aurora Wallet" فاتح بلافندر بنفسجي: بطاقات بيضاء عائمة، بطاقة رصيد بتدرّج بنفسجي، وأزرار إنديغو — مستوحى من تصميم تطبيق محفظة إلكترونية على Dribbble. 8 خدمات بين البطاقات والباقات والتحويلات برموز مرسومة بالكود. عربي أولاً بإنجليزية كاملة.',
      en: 'A fintech store template in a light violet "Aurora Wallet" style: white floating cards, a violet-gradient balance card and indigo buttons — inspired by an e-wallet app design on Dribbble. 8 services across cards, bundles and transfers with code-drawn glyphs. Arabic-first with full English.',
    },
    stars: 3600,
    usd: 49,
    demoPath: '/templates/mahfazah/',
    repo: 'https://github.com/zeiad6/mahfazah-store',
    swatch: 'linear-gradient(140deg,#ece9fb,#6366f1 55%,#8b5cf6)',
    features: [
      { ar: '8 خدمات: بطاقات، تحويلات، فواتير، ادخار', en: '8 services: cards, transfers, bills, savings' },
      { ar: 'أسلوب فينتك فاتح ببطاقات بيضاء', en: 'A light fintech style with white cards' },
      { ar: 'بطاقة رصيد بتدرّج بنفسجي', en: 'A violet-gradient balance card' },
      { ar: 'رموز مالية مرسومة بالكود SVG', en: 'Code-drawn SVG finance glyphs' },
      { ar: 'بحث وترتيب وسلة محفوظة', en: 'Search, sort and a saved cart' },
      { ar: 'صفر تبعيات ورؤوس أمان صارمة', en: 'Zero dependencies and strict security headers' },
    ],
  },
  {
    slug: 'chrono',
    sku: 'site-chrono',
    name: { ar: 'كرونو', en: 'Chrono' },
    tagline: { ar: 'سوق ساعات فاخرة', en: 'Luxury watch marketplace' },
    description: {
      ar: 'قالب سوق ساعات فاخر بأسلوب "Cobalt Luxe" داكن navy بتوهّج أزرق كوبالت: بطاقات داكنة، أزرار أزرق متدرّج، وأسعار كبيرة — مستوحى من تصميم تطبيق سوق ساعات على Dribbble. 8 موديلات بين الكلاسيك والرياضي والفاخر بوجوه ساعات مرسومة بالكود. عربي أولاً بإنجليزية كاملة.',
      en: 'A luxury watch marketplace template in a dark navy "Cobalt Luxe" style with electric-blue glow: dark cards, blue-gradient buttons and large prices — inspired by a watch marketplace app design on Dribbble. 8 models across classic, sport and luxury with code-drawn watch faces. Arabic-first with full English.',
    },
    stars: 8800,
    usd: 129,
    demoPath: '/templates/chrono/',
    repo: 'https://github.com/zeiad6/chrono-store',
    swatch: 'linear-gradient(140deg,#0a0e1f,#2563eb 55%,#60a5fa)',
    features: [
      { ar: '8 موديلات: أوتوماتيك، كرونوغراف، غوص، فاخر', en: '8 models: automatic, chronograph, diver, luxury' },
      { ar: 'أسلوب داكن navy بتوهّج أزرق كوبالت', en: 'A dark navy style with electric-blue glow' },
      { ar: 'وجوه ساعات مرسومة بالكود SVG', en: 'Code-drawn SVG watch faces' },
      { ar: 'بحث وترتيب وسلة محفوظة', en: 'Search, sort and a saved cart' },
      { ar: 'طلب فوري عبر تيليجرام أو واتساب', en: 'Instant ordering via Telegram or WhatsApp' },
      { ar: 'صفر تبعيات ورؤوس أمان صارمة', en: 'Zero dependencies and strict security headers' },
    ],
  },
  {
    slug: 'turbo',
    sku: 'site-turbo',
    name: { ar: 'تيربو', en: 'Turbo' },
    tagline: { ar: 'متجر إطارات وجنوط وإكسسوارات', en: 'Tires, wheels & accessories store' },
    description: {
      ar: 'قالب متجر سيارات بأسلوب داكن عصري ولمسة نيلية (indigo): hero بسيارة مرسومة بالكود، تصنيفات إطارات/جنوط/إكسسوارات، وبطاقات منتجات بمواصفات. مستوحى من AutoForge على Dribbble. 8 منتجات، عربي أولاً بإنجليزية كاملة.',
      en: 'An automotive store template in a modern dark style with an indigo accent: a code-drawn car hero, tire/wheel/accessory categories, and spec-rich product cards. Inspired by AutoForge on Dribbble. 8 products, Arabic-first with full English.',
    },
    stars: 4600,
    usd: 65,
    demoPath: '/templates/turbo/',
    repo: 'https://github.com/zeiad6/turbo-store',
    swatch: 'linear-gradient(150deg,#1e1f30,#6366f1 55%,#0a0b16)',
    features: [
      { ar: '8 منتجات: إطارات، جنوط، فرامل، إضاءة، دواسات', en: '8 products: tires, wheels, brakes, lights, mats' },
      { ar: 'هوية داكنة عصرية بلمسة نيلية (indigo)', en: 'A modern dark identity with an indigo accent' },
      { ar: 'سيارة ورموز منتجات مرسومة بالكود SVG', en: 'Code-drawn SVG car and product marks' },
      { ar: 'بحث وترتيب وتصنيفات وسلة محفوظة', en: 'Search, sort, categories and a saved cart' },
      { ar: 'طلب فوري عبر تيليجرام أو واتساب', en: 'Instant ordering via Telegram or WhatsApp' },
      { ar: 'صفر تبعيات ورؤوس أمان صارمة', en: 'Zero dependencies and strict security headers' },
    ],
  },
]

export const templateBySlug = (slug: string | undefined): StoreTemplate | undefined =>
  TEMPLATES.find((t) => t.slug === slug)
