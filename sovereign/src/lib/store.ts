/* ------------------------------------------------------------------ *
 * Store — the real catalogue and the eight storefront templates, read
 * from public/store/catalog.json and src/data/templates.ts. Prices are
 * Telegram Stars and USD exactly as the bot charges them. Every row is
 * bilingual: the English name, description and feature list come from the
 * catalogue itself, not from a translation layer.
 * ------------------------------------------------------------------ */

export type StoreCategory = 'bots' | 'types' | 'apps' | 'sites' | 'channel'

export type StoreItem = {
  sku: string
  title: string
  titleEn: string
  desc: string
  descEn: string
  stars: number
  usd: number
  category: StoreCategory
  featured: boolean
  demo?: string
  swatch?: string
  demoPath?: string
  features: string[]
  featuresEn: string[]
}

export const storeTabs = [
  { id: 'bots', label: 'بوتات وخدمات', labelEn: 'Bots & services', note: 'BOTS & SERVICES' },
  { id: 'sites', label: 'قوالب المتاجر', labelEn: 'Storefronts', note: 'STOREFRONTS' },
  { id: 'channel', label: 'خدمات القناة', labelEn: 'Channel', note: 'CHANNEL' },
] as const

export const storeItems: StoreItem[] = [
  {
    sku: "store-bot-basic", title: "بوت المتجر الذكي — الباقة الأساسية", titleEn: "Smart Store Bot — Basic",
    desc: "بوت متجر رقمي متطور باسمك: حتى 50 منتجاً، دفع بنجوم تيليجرام، تسليم تلقائي للمنتج، وإشعار لك بكل طلب. دون لوحة تحكم تقف في الطريق.", descEn: "An advanced digital store bot under your name: up to 50 products, Stars checkout, auto delivery. No dashboard in the way.",
    stars: 1750, usd: 24.5, category: "bots", featured: false,
    demo: "store",
    features: ["حتى 50 منتجاً رقمياً مرتبة في أقسام", "دفع بنجوم تيليجرام — بلا بوابة دفع ولا بطاقة", "تسليم تلقائي للملف أو الرابط بعد الدفع", "إشعار فوري لك بكل طلب وسجل كامل للطلبات"],
    featuresEn: ["Up to 50 digital products in categories", "Telegram Stars checkout, no gateway or card", "Automatic file or link delivery after payment", "Instant alert on every order, full order log"],
  },
  {
    sku: "store-bot-pro", title: "بوت المتجر المتكامل — الباقة الاحترافية", titleEn: "Integrated Store Bot — Pro",
    desc: "واجهة متجر Mini App بتصميم عصري واحترافي: أقسام ومنتجات غير محدودة، لغتان، ثيم نهاري وليلي، ربط بموقعك، وإحصائيات متقدمة.", descEn: "Modern Mini App storefront: unlimited categories/products, bilingual, light/dark themes, linked to site, advanced stats.",
    stars: 3750, usd: 49.5, category: "bots", featured: true,
    demo: "store",
    features: ["كل مميزات الباقة الأساسية", "واجهة متجر Mini App بلغتين وثيم نهاري وليلي", "منتجات وأقسام بلا حد، واشتراكات شهرية بالنجوم", "أسئلة تلقائية بعد الشراء تصلك إجاباتها"],
    featuresEn: ["Everything in Basic", "Mini App storefront, two languages, light and dark", "Unlimited products and categories, Stars subscriptions", "Automatic post-purchase questions sent to you"],
  },
  {
    sku: "store-bot-hosting", title: "استضافة وصيانة بوتك", titleEn: "Bot hosting & upkeep",
    desc: "تشغيل بوتك على مدار الساعة، نسخ احتياطي، تحديثات أمنية، وتعديلات بسيطة كل شهر. يتجدد كل 30 يوماً ويمكن إلغاؤه من إعدادات تيليجرام في أي وقت.", descEn: "Your bot online around the clock, backups, security updates and small monthly tweaks. Renews every 30 days; cancel any time in Telegram settings.",
    stars: 750, usd: 9, category: "bots", featured: false,
    features: ["تشغيل على مدار الساعة مع مراقبة", "نسخ احتياطي لقاعدة البيانات", "تحديثات أمنية وتحديث المكتبات", "تعديلات بسيطة كل شهر"],
    featuresEn: ["Online around the clock, monitored", "Database backups", "Security and library updates", "Small changes every month"],
  },
  {
    sku: "group-bot", title: "بوت المشرف الآلي للمجموعات", titleEn: "Automated Group Admin Bot",
    desc: "حماية متطورة لمجموعتك: تحقق ذكي من الأعضاء، منع الروابط والسبام بدقة عالية، ترحيب، تحذيرات، وتقارير تفصيلية للمشرفين.", descEn: "Advanced group protection: smart captcha, high-accuracy link/spam filters, welcomes, warnings, detailed admin reports.",
    stars: 1250, usd: 17.5, category: "types", featured: false,
    demo: "group",
    features: ["تحقق كابتشا للأعضاء الجدد", "فلترة الروابط والكلمات والسبام", "رسائل ترحيب وقوانين مثبتة", "تحذيرات تلقائية ثم كتم أو حظر"],
    featuresEn: ["Captcha for new members", "Link, word and spam filters", "Welcome message and pinned rules", "Automatic warnings, then mute or ban"],
  },
  {
    sku: "support-bot", title: "بوت خدمة العملاء الفوري", titleEn: "Instant Customer Support Bot",
    desc: "ردود فورية وذكية على الأسئلة الشائعة، يحوّل المحادثة لموظف عند اللزوم، إدارة تذاكر متطورة، وتقييم جودة الخدمة.", descEn: "Smart instant FAQ replies, human handoff, advanced ticketing, and service quality rating.",
    stars: 1500, usd: 19.5, category: "types", featured: false,
    demo: "support",
    features: ["ردود فورية على الأسئلة الشائعة", "تحويل لموظف بزر واحد", "تذاكر برقم متابعة", "ساعات عمل ورسالة خارج الدوام"],
    featuresEn: ["Instant FAQ answers", "One-tap handoff to a human", "Tickets with a tracking number", "Working hours and an after-hours reply"],
  },
  {
    sku: "booking-bot", title: "بوت الحجوزات والمواعيد الذكي", titleEn: "Smart Booking Bot",
    desc: "نظام حجوزات آلي متكامل: اختيار الخدمة والموعد، تزامن دقيق لمنع التضارب، تذكير تلقائي، ودفع العربون بنجوم تيليجرام.", descEn: "Fully automated booking system: precise slot sync to prevent double-booking, auto reminders, and Stars deposits.",
    stars: 1750, usd: 22.5, category: "types", featured: false,
    demo: "booking",
    features: ["اختيار الخدمة واليوم والساعة", "منع الحجز المزدوج للموعد", "تذكير تلقائي قبل الموعد", "عربون أو دفع كامل بالنجوم"],
    featuresEn: ["Service, day and time picker", "No double-booked slots", "Automatic reminder before the slot", "Deposit or full payment in Stars"],
  },
  {
    sku: "subs-bot", title: "بوت إدارة الاشتراكات الذكي", titleEn: "Smart Subscriptions Bot",
    desc: "إدارة آلية لاشتراكات قنواتك الخاصة: بيع بالنجوم، إضافة وإزالة الأعضاء تلقائياً، تذكير بالتجديد، وإحصائيات نمو تفصيلية.", descEn: "Automated private channel subscriptions: sell in Stars, auto add/remove members, renewal reminders, detailed growth stats.",
    stars: 1500, usd: 19.5, category: "types", featured: false,
    demo: "subs",
    features: ["اشتراك شهري بنجوم تيليجرام", "رابط دعوة خاص لكل مشترك", "إخراج تلقائي عند انتهاء الاشتراك", "تذكير قبل التجديد"],
    featuresEn: ["Monthly Stars subscription", "Personal invite link per member", "Automatic removal on expiry", "Reminder before renewal"],
  },
  {
    sku: "quiz-bot", title: "بوت المسابقات التفاعلية المطور", titleEn: "Advanced Interactive Quiz Bot",
    desc: "مسابقات وتحديات تفاعلية مشوقة: جولات بوقت، لوحة صدارة لحظية، بنك أسئلة متطور، وتوزيع جوائز للفائزين تلقائياً.", descEn: "Engaging interactive challenges: timed rounds, real-time leaderboard, advanced question bank, and auto prize distribution.",
    stars: 1000, usd: 12.5, category: "types", featured: false,
    demo: "quiz",
    features: ["أسئلة باختبارات تيليجرام الأصلية", "جولات بوقت محدد", "لوحة صدارة للمجموعة", "بنك أسئلة تضيفه بسهولة"],
    featuresEn: ["Native Telegram quiz polls", "Timed rounds", "Group leaderboard", "Easy question bank"],
  },
  {
    sku: "ai-bot", title: "بوت المساعد الذكي المتطور", titleEn: "Advanced AI Assistant Bot",
    desc: "مساعد ذكاء اصطناعي: يجيب من قاعدة معرفة نشاطك فقط بدقة تامة، تحويل سريع للموظف، ويدعم العربية والإنجليزية بطلاقة.", descEn: "An AI assistant that answers exclusively and accurately from your knowledge base, fast human handoff, fluent bilingual support.",
    stars: 2500, usd: 32.5, category: "types", featured: false,
    demo: "ai",
    features: ["يجيب من معلومات نشاطك فقط", "لا يخترع أسعاراً أو وعوداً", "تحويل لإنسان بزر واحد", "حدود استخدام لكل مستخدم"],
    featuresEn: ["Answers only from your business facts", "Never invents prices or promises", "One-tap human handoff", "Per-user usage limits"],
  },
  {
    sku: "multibot-crm", title: "منصة CRM الموحدة لإدارة وأتمتة البوتات", titleEn: "Unified Multi-Bot CRM Platform",
    desc: "لوحة تحكم سحابية مركزية لإدارة كل بوتاتك في مكان واحد، مزامنة فورية للبيانات، وسيناريوهات أتمتة ذكية بين البوتات.", descEn: "Centralized cloud dashboard to manage all your bots in one place, real-time data sync, and smart cross-bot automations.",
    stars: 4750, usd: 64.5, category: "types", featured: false,
    demo: "crm",
    features: ["إدارة مركزية لعدة بوتات من واجهة واحدة", "أتمتة متقاطعة بين بوتات المبيعات والدعم", "لوحة تحليلات وإحصائيات مركزية موحدة", "تخزين سحابي فائق السرعة وأمان مشدد"],
    featuresEn: ["Central management for multiple bots from one UI", "Cross-bot triggers between sales and help desks", "Unified real-time analytics dashboard", "Ultra-fast cloud storage and hardened security"],
  },
  {
    sku: "workflow-engine", title: "محرك الأتمتة والربط الذكي (No-Code Engine)", titleEn: "Visual Workflow Automation Engine",
    desc: "ربط بوتاتك بمنصات الأتمتة العالمية مثل n8n وActivepieces وبناء مسارات عمل مخصصة دون كتابة أسطر برمجية.", descEn: "Connect your bots to visual workflow tools like n8n and Activepieces to craft tailored automations without coding.",
    stars: 4250, usd: 57.5, category: "types", featured: false,
    demo: "workflow",
    features: ["تكامل مباشر مع n8n وActivepieces وWebhooks", "أتمتة إرسال الرسائل بناءً على أحداث خارجية", "قوالب جاهزة لمزامنة جداول البيانات وGoogle Sheets", "معالجة فورية للبيانات وتنبيهات مخصصة"],
    featuresEn: ["Native hooks for n8n, Activepieces and Webhooks", "Event-driven messaging triggered by external actions", "Ready templates for spreadsheets and Google Sheets sync", "Real-time payload processing and alerts"],
  },
  {
    sku: "whatsapp-bot-pro", title: "بوت واتساب للأعمال والربط المزدوج", titleEn: "WhatsApp Business & Dual-Bot Suite",
    desc: "حل متكامل لخدمة ومبيعات واتساب مع مزامنة كاملة وتوجيه الرسائل الذكي المشترك بين تيليجرام وواتساب.", descEn: "Complete WhatsApp sales and service suite with dual-channel sync and smart routing between Telegram and WhatsApp.",
    stars: 5500, usd: 74.5, category: "types", featured: false,
    demo: "whatsapp",
    features: ["ربط رسمي عبر WhatsApp Cloud API أو جلسات آمنة", "مزامنة الرسائل والمبيعات بين تيليجرام وواتساب", "ردود آلية ذكية ورسائل ترحيب تفاعلية", "توزيع التذاكر واستفسارات المستخدمين آلياً"],
    featuresEn: ["Official WhatsApp Cloud API or secure session bridge", "Cross-sync orders and chats across both platforms", "Interactive replies and welcoming flows", "Automated ticket assignment to team members"],
  },
  {
    sku: "aifake-pro", title: "AiFake Pro — تطبيق أندرويد", titleEn: "AiFake Pro — Android App",
    desc: "النسخة الاحترافية الكاملة من تطبيق AiFake لأندرويد (ملف APK): بلا إعلانات، بلا قيود، مع التحديثات مجاناً مدى الحياة عبر قناة التخزين الخاصة. يُسلَّم ملف التطبيق تلقائياً…", descEn: "The full Pro edition of the AiFake Android app (APK): no ads, no limits, free lifetime updates through the private storage channel. The APK is delivered automatically…",
    stars: 2250, usd: 30, category: "apps", featured: true,
    features: ["النسخة الاحترافية الكاملة — كل الميزات مفتوحة", "بلا إعلانات وبلا اشتراك — مرة واحدة وتملكه", "ملف APK رسمي وموقّع — يُسلَّم تلقائياً بعد الدفع", "تحديثات مجانية مدى الحياة عبر قناة التخزين الخاصة"],
    featuresEn: ["Full Pro edition — every feature unlocked", "No ads, no subscription — one payment, yours forever", "Official signed APK — auto-delivered right after payment", "Free lifetime updates through the private storage channel"],
  },
  {
    sku: "site-oud-amber", title: "قالب متجر عود وعنبر — عطور فاخرة", titleEn: "Oud & Amber store template — luxury fragrance",
    desc: "متجر عطور وعود كامل: هوية ذهبية داكنة، 8 منتجات بصور SVG مرسومة بالكود، عرض سريع وسلة محفوظة، وطلب فوري عبر تيليجرام أو واتساب. عربي أولاً (RTL) بإنجليزية كاملة، صفر…", descEn: "A complete oud and perfume store: dark gold identity, 8 products with code-drawn SVG art, quick view and a saved cart, and instant ordering over Telegram or WhatsApp.…",
    stars: 7000, usd: 99, category: "sites", featured: true,
    swatch: "linear-gradient(140deg,#1a1206,#3a2a0d 55%,#d4a94e)",
    demoPath: "/templates/oud-amber/",
    features: ["هوية ذهبية داكنة فاخرة وغير مكررة", "8 منتجات جاهزة مع صور SVG مرسومة بالكود", "بحث عربي يتجاهل الحركات والهمزات", "سلة محفوظة تُكمل بعد إغلاق الصفحة"],
    featuresEn: ["A premium dark-gold identity, not a clone", "8 ready products with code-drawn SVG art", "Arabic search ignoring harakat and hamza", "A cart that survives a page reload"],
  },
  {
    sku: "site-smart-zone", title: "قالب متجر سمارت زون — إلكترونيات", titleEn: "Smart Zone store template — electronics",
    desc: "متجر إلكترونيات بهوية تقنية داكنة: 9 أجهزة عبر 3 تصنيفات، رقاقات مواصفات، ترتيب بالسعر، عدّادات متحركة، وشريط علامات. مبنيّ لعرض الأجهزة بثقة — ضمان وفحص ودعم. عربي…", descEn: "An electronics store with a dark tech identity: 9 devices across 3 categories, spec chips, price sorting, animated counters and a brand strip. Built to show devices with…",
    stars: 5600, usd: 79, category: "sites", featured: false,
    swatch: "linear-gradient(140deg,#06080c,#0e2233 55%,#22d3ee)",
    demoPath: "/templates/smart-zone/",
    features: ["9 أجهزة عبر 3 تصنيفات (هواتف، صوتيات، منزل ذكي)", "ترتيب بالسعر: الأرخص أو الأغلى أولاً", "رقاقات مواصفات لكل جهاز", "شريط علامات متحرك وعدّادات إحصائية"],
    featuresEn: ["9 devices across 3 categories (phones, audio, smart home)", "Price sorting either way", "Spec chips on every device", "Animated brand strip and stat counters"],
  },
  {
    sku: "site-durra", title: "قالب متجر دُرّة — تمور وقهوة وضيافة", titleEn: "Durra store template — dates, coffee & hospitality",
    desc: "متجر ضيافة بهوية صحراوية دافئة: 9 منتجات بين التمور والقهوة وعلب الهدايا، شريط علب هدايا بارز، وقسم آراء عملاء. مناسب لمحامص التمور والقهوة ومتاجر الهدايا الموسمية. عربي…", descEn: "A hospitality store with a warm desert identity: 9 products across dates, coffee and gift boxes, a prominent gift-box band and a guest voices section. Ideal for date…",
    stars: 4600, usd: 65, category: "sites", featured: false,
    swatch: "linear-gradient(140deg,#f1e9db,#c4562f 55%,#1e3a2b)",
    demoPath: "/templates/durra/",
    features: ["9 منتجات: تمور، قهوة عربية، علب هدايا", "شريط علب هدايا بارز بنداء واضح", "قسم آراء العملاء", "زخرفة هندسية مرسومة SVG"],
    featuresEn: ["9 products: dates, Arabic coffee, gift boxes", "A prominent gift-box band with a clear call", "A guest voices section", "Code-drawn geometric ornament"],
  },
  {
    sku: "site-bot-bazaar", title: "قالب متجر بوت بازار — سوق بوتات ومنتجات رقمية", titleEn: "Bot Bazaar store template — bots & digital goods marketplace",
    desc: "سوق رقمي بهوية بنفسجية داكنة بأسلوب Bento: 8 منتجات بين بوتات تيليجرام والأدوات والقوالب والاشتراكات، برموز مرسومة بالكود، بحث وترتيب وسلة محفوظة. مصمَّم للبيع بتسليم…", descEn: "A digital marketplace with a dark violet Bento identity: 8 products across Telegram bots, tools, templates and subscriptions, with code-drawn glyphs, search, sort and a…",
    stars: 5200, usd: 75, category: "sites", featured: false,
    swatch: "linear-gradient(140deg,#0a0918,#7c5cff 55%,#34d399)",
    demoPath: "/templates/bot-bazaar/",
    features: ["8 منتجات رقمية: بوتات، أدوات، اشتراكات", "تخطيط Bento ببلاطات معيارية", "رموز منتجات مرسومة بالكود SVG", "بحث وترتيب وسلة محفوظة"],
    featuresEn: ["8 digital products: bots, tools, subscriptions", "A Bento layout of modular tiles", "Code-drawn SVG product glyphs", "Search, sort and a saved cart"],
  },
  {
    sku: "site-aman", title: "قالب متجر أمان — خطط تأمين رقمي", titleEn: "Aman store template — digital insurance plans",
    desc: "متجر تأمين بأسلوب Soft Care هادئ فاتح: بطاقات بيضاء عائمة، بطاقة ترحيب بتدرّج دافئ، وأزرار إسبريسو مستديرة — مستوحى من تصميم تطبيق تأمين على Dribbble. 8 خطط بين الصحي…", descEn: "An insurance store in a calm light Soft Care style: white floating cards, a warm-gradient welcome card and rounded espresso buttons — inspired by an insurance app design…",
    stars: 4200, usd: 59, category: "sites", featured: false,
    swatch: "linear-gradient(150deg,#f3a07f,#e8623a 55%,#1e1816)",
    demoPath: "/templates/aman/",
    features: ["8 خطط: صحي، مركبات، سفر، منزل، أجهزة", "أسلوب هادئ فاتح ببطاقات بيضاء", "بطاقة ترحيب بتدرّج دافئ", "رموز تأمين مرسومة بالكود SVG"],
    featuresEn: ["8 plans: health, motor, travel, home, devices", "A calm light style with white cards", "A warm-gradient welcome card", "Code-drawn SVG insurance glyphs"],
  },
  {
    sku: "site-mahfazah", title: "قالب متجر محفظة — خدمات مالية ومحفظة رقمية", titleEn: "Mahfazah store template — digital wallet & finance",
    desc: "متجر فينتك بأسلوب Aurora Wallet فاتح بلافندر بنفسجي: بطاقات بيضاء عائمة، بطاقة رصيد بتدرّج بنفسجي، وأزرار إنديغو — مستوحى من تصميم تطبيق محفظة إلكترونية على Dribbble. 8…", descEn: "A fintech store in a light violet Aurora Wallet style: white floating cards, a violet-gradient balance card and indigo buttons — inspired by an e-wallet app design on…",
    stars: 3600, usd: 49, category: "sites", featured: false,
    swatch: "linear-gradient(140deg,#ece9fb,#6366f1 55%,#8b5cf6)",
    demoPath: "/templates/mahfazah/",
    features: ["8 خدمات: بطاقات، تحويلات، فواتير، ادخار", "أسلوب فينتك فاتح ببطاقات بيضاء", "بطاقة رصيد بتدرّج بنفسجي", "رموز مالية مرسومة بالكود SVG"],
    featuresEn: ["8 services: cards, transfers, bills, savings", "A light fintech style with white cards", "A violet-gradient balance card", "Code-drawn SVG finance glyphs"],
  },
  {
    sku: "site-chrono", title: "قالب متجر كرونو — سوق ساعات فاخرة", titleEn: "Chrono store template — luxury watch marketplace",
    desc: "سوق ساعات فاخر بأسلوب Cobalt Luxe داكن navy بتوهّج أزرق كوبالت: بطاقات داكنة، أزرار أزرق متدرّج، وأسعار كبيرة — مستوحى من تصميم تطبيق سوق ساعات على Dribbble. 8 موديلات…", descEn: "A luxury watch marketplace in a dark navy Cobalt Luxe style with electric-blue glow: dark cards, blue-gradient buttons and large prices — inspired by a watch marketplace…",
    stars: 8800, usd: 129, category: "sites", featured: false,
    swatch: "linear-gradient(140deg,#0a0e1f,#2563eb 55%,#60a5fa)",
    demoPath: "/templates/chrono/",
    features: ["8 موديلات: أوتوماتيك، كرونوغراف، غوص، فاخر", "أسلوب داكن navy بتوهّج أزرق كوبالت", "وجوه ساعات مرسومة بالكود SVG", "بحث وترتيب وسلة محفوظة"],
    featuresEn: ["8 models: automatic, chronograph, diver, luxury", "A dark navy style with electric-blue glow", "Code-drawn SVG watch faces", "Search, sort and a saved cart"],
  },
  {
    sku: "post-50", title: "حزمة 50 منشور", titleEn: "50-post bundle",
    desc: "نشر 50 رسالة في قناتك من داخل البوت مع سجل كامل في لوحة التحكم.", descEn: "Publish 50 messages to your channel from the bot, fully logged in the dashboard.",
    stars: 125, usd: 1.5, category: "channel", featured: false,
    features: [],
    featuresEn: [],
  },
  {
    sku: "pin-month", title: "تثبيت شهري", titleEn: "Monthly pin",
    desc: "تثبيت رسالتك في أعلى القناة لمدة 30 يوماً، تتجدد تلقائياً.", descEn: "Your message pinned at the top of the channel for 30 days, auto-renewed.",
    stars: 250, usd: 3, category: "channel", featured: false,
    features: [],
    featuresEn: [],
  },
  {
    sku: "archive-5k", title: "أرشيف 5000 رسالة", titleEn: "5,000-message archive",
    desc: "تصدير تاريخ القناة كاملاً إلى JSON مع فهرسة زمنية.", descEn: "Export the full channel history to JSON with a time index.",
    stars: 450, usd: 6, category: "channel", featured: false,
    features: [],
    featuresEn: [],
  },
  {
    sku: "panel-pro", title: "لوحة تحكم Pro — شهر", titleEn: "Pro dashboard — 1 month",
    desc: "كل ميزات لوحة التحكم: نسخ احتياطي، تصدير، وجدولة متقدمة.", descEn: "Every dashboard feature: backups, exports and advanced scheduling.",
    stars: 350, usd: 4.5, category: "channel", featured: false,
    features: [],
    featuresEn: [],
  },

]

export function itemsFor(tab: (typeof storeTabs)[number]['id']): StoreItem[] {
  const map = { bots: ['bots', 'types', 'apps'], sites: ['sites'], channel: ['channel'] } as const
  return storeItems.filter((item) => (map[tab] as readonly string[]).includes(item.category))
}

export function starsLabel(stars: number): string {
  return stars.toLocaleString('en-US')
}

