/* ------------------------------------------------------------------ *
 * Journal — the real article index (17 entries) in both languages.
 * Titles, excerpts, categories, dates and headings come verbatim from
 * src/data/posts.ts and src/data/posts.en.ts, so a summary modal is
 * backed by the article itself and the switch is instant.
 * ------------------------------------------------------------------ */

export type Post = {
  slug: string
  title: string
  titleEn: string
  excerpt: string
  excerptEn: string
  category: string
  categoryEn: string
  date: string
  minutes: number
  tags: string[]
  tagsEn: string[]
  headings: string[]
  headingsEn: string[]
}

export const posts: Post[] = [
  {
    slug: "local-cicd-guide", title: "الدليل العملي الشامل: تشغيل وتثبيت CI/CD محلياً على Linux و Windows و Termux دون أخطاء",
    titleEn: "The Definitive Guide: Running Local CI/CD & GitHub Actions on Linux, Windows & Termux Without Errors",
    excerpt: "كيف تشغل وتبني خطوط الأنابيب CI/CD محلياً على جهازك باستخدام act و Docker في بيئات Windows و Linux و Termux/PRoot: تثبيت سليم، إعداد .actrc، إدارة الأسرار، وحلول قطعية لأشهر 7 أخطاء شائعة.", excerptEn: "How to install and run CI/CD pipelines locally with act and Docker across Windows, Linux, and Termux/PRoot: flawless setup, .actrc tuning, secrets management, and definitive fixes for the top 7 errors.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-10-29", minutes: 7,
    tags: ["CI/CD", "GitHub Actions", "Docker", "act", "Linux", "Windows", "Termux"],
    tagsEn: ["CI/CD", "GitHub Actions", "Docker", "act", "Linux", "Windows", "Termux"],
    headings: ["لماذا تشغيل CI/CD محلياً على جهازك؟", "كيف يعمل محرك CI/CD المحلي (المعمارية)", "التثبيت على أنظمة Linux (Ubuntu / Debian / Arch)", "التثبيت على نظام Windows (PowerShell و WSL2)", "التشغيل في البيئات المقيدة (Android / Termux / PRoot)"],
    headingsEn: ["Why Run CI/CD Locally?", "How Local CI/CD Works (Architecture)", "Installation on Linux (Ubuntu / Debian / Arch)", "Installation on Windows (PowerShell & WSL2)", "Running in Constrained Environments (Android / Termux / PRoot)", "Configuring .actrc & Runner Image Selection"],
  },
  {
    slug: "yusr", title: "نظام يُسر (Yusr): المنظومة المحاسبية والمالية المستقلة للمنظمات غير الربحية والأوقاف",
    titleEn: "Yusr: Sovereign Autonomous Fund Accounting Suite for Charities & Awqaf",
    excerpt: "نظام سيادي مكتمل لإدارة أموال وصناديق الجمعيات الخيرية ولجان الزكاة: دفتر أستاذ غير قابل للتلاعب بسلسلة كتل SHA-256، مستشار ذكي محلي، فوترة ZATCA، وتثبيت ذاتي يعمل دون إنترنت 100%.", excerptEn: "Enterprise-grade back-office and fund accounting suite for non-profits: tamper-evident SHA-256 ledger, local AI advisor, ZATCA Phase 2 e-invoicing, and 100% offline-first architecture.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-10-29", minutes: 2,
    tags: ["محاسبة", "أوقاف", "زكاة", "ZATCA", "Rust", "PostgreSQL", "ذكاء اصطناعي"],
    tagsEn: ["Accounting", "Non-Profit", "Zakat", "ZATCA", "Rust", "PostgreSQL", "AI"],
    headings: ["نظرة عامة على نظام يُسر", "دفتر الأستاذ الرقمي ومكافحة التلاعب", "المستشار الذكي المحلي (Offline AI Advisor)", "الفاتورة الإلكترونية وهيئة الزكاة (ZATCA)", "النسخ الاحتياطي التلقائي متعدد المسارات"],
    headingsEn: ["Overview of Yusr Suite", "Tamper-Evident SHA-256 Hash-Chain Ledger", "Offline Local AI Advisor", "ZATCA Phase 2 Electronic Invoicing", "Multi-Target Automated Backup Engine", "LAN Collaboration & Granular RBAC"],
  },
  {
    slug: "zeidex-convert-android", title: "Zeidex Convert للأندرويد: محوّل ملفات محلي شامل، استخراج الصور الحية، وتحسين جودة الوسائط",
    titleEn: "Zeidex Convert for Android: 100% Offline File Converter, Live Photo Extractor & Media Booster",
    excerpt: "تطبيق أندرويد مستقل يعمل 100% دون إنترنت: استخراج فيديو الصور الحية (Pixel و Samsung و Apple Live Photo) إلى MP4، تحسين دقة وجودة الفيديو والصور، ضغط الملفات وحفظها تلقائياً في ذاكرة الهاتف.", excerptEn: "A standalone Android app that runs 100% offline: extract Motion Photos and Apple Live Photos to MP4, upscale and boost video/image quality, compress media files, and auto-save neatly to phone storage.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-10-22", minutes: 3,
    tags: ["أندرويد", "تحويل ملفات", "صور حية", "Motion Photo", "MP4", "تحسين الجودة", "أوفلاين"],
    tagsEn: ["Android", "File Converter", "Motion Photo", "Live Photo", "MP4", "Offline", "Quality Booster"],
    headings: ["الميزات الأساسية والقدرات", "استخراج فيديو الصور الحية (Motion & Live Photos)", "صور وواجهات التطبيق", "أداة تحسين جودة الفيديو والصور", "الحفظ التلقائي المنظم في ذاكرة الهاتف"],
    headingsEn: ["Key features and capabilities", "Extract Live Photo & Motion Photo videos", "App interface and screenshots", "Video & Image Quality Booster", "Organized automatic phone storage", "100% local privacy and cryptographic signatures"],
  },
  {
    slug: "archive-1-0-6", title: "أرشيف 1.0.6: أمان أعلى، ترقية آمنة، ومثبّت بهوية Zeidex",
    titleEn: "Archive 1.0.6: stronger security, safe upgrades, and a Zeidex-branded installer",
    excerpt: "تحديث أمني وإصلاحات ومزايا جديدة لنظام الأرشفة الإلكترونية: روابط تحميل من ثلاثة مصادر، وخطوات ترقية من 1.0.0 تحافظ على بياناتك كما هي.", excerptEn: "A security update with fixes and new features for the document archive: three download mirrors, and upgrade steps from 1.0.0 that keep your data exactly as it is.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-10-04", minutes: 2,
    tags: ["أرشيف", "ويندوز", "أمن", "EDMS", "1.0.6"],
    tagsEn: ["Archive", "Windows", "Security", "EDMS", "1.0.6"],
    headings: ["ما الجديد", "الإقلاع والاختبارات", "الترقية من 1.0.0", "تنبيه SmartScreen", "المصدر والروابط"],
    headingsEn: ["What is new", "Boot and tests", "Upgrading from 1.0.0", "SmartScreen notice", "Source and links"],
  },
  {
    slug: "ai-fake-detector-android", title: "VerityScope v0.4.0 — كاشف التزييف العميق بالذكاء الاصطناعي",
    titleEn: "VerityScope v0.4.0 — AI Deepfake Detector for Android",
    excerpt: "تطبيق أندرويد يكشف التزييف العميق في الصور والفيديو والنصوص محلياً بـ 5 نماذج AI ودمج log-odds وفحص بيانات المصدر — v0.4.0 يضيف الفحص الذكي، ووضع عدم الاتصال، وتقرير PDF جنائياً، وحزمة APK واحدة لكل الأجهزة.", excerptEn: "An Android app that detects deepfakes in images, video and text on the device with 5 AI models, log-odds fusion and a source-metadata pass — v0.4.0 adds Smart Scan, offline mode, a forensic PDF report, and one APK for every device.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-10-02", minutes: 4,
    tags: ["Android", "Kotlin", "ONNX", "Deepfake", "AI", "Forensics"],
    tagsEn: ["Android", "Kotlin", "ONNX", "Deepfake", "AI", "Forensics"],
    headings: ["ما الجديد في v0.4.0", "كيف يعمل", "كشف النصوص المولّدة", "النماذج المتاحة", "فحص بيانات المصدر"],
    headingsEn: ["What is new in v0.4.0", "How it works", "AI-text detection", "Available models", "Source-metadata forensics", "The interface"],
  },
  {
    slug: "edms-archive-android", title: "عميل أرشيف برو على أندرويد — نفس النظام على جوالك",
    titleEn: "Archive Pro on Android — the same system on your phone",
    excerpt: "عميل أندرويد أصلي لنظام أرشيف برو: يعمل كاملاً على الجهاز بقاعدة بيانات وملفات محلية، أو يتصل بالنسخة المكتبية عبر بوابة HTTPS بشهادة مثبّتة. القاعدة والنسخ الاحتياطي وكلمات المرور تنتقل في الاتجاهين بلا تحويل.", excerptEn: "The native Android client for Archive Pro: runs fully on-device with a local database and file store, or pairs with the desktop build over a certificate-pinned HTTPS gateway. Database, backup and passwords move both ways with no conversion.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-09-30", minutes: 2,
    tags: ["Android", "Kotlin", "أرشيف برو", "EDMS"],
    tagsEn: ["Android", "Kotlin", "Archive Pro", "EDMS"],
    headings: ["طريقتان للتشغيل", "التوافق مع سطح المكتب", "نموذج الثقة", "نتائج الاختبار", "ما يجب أن تعرفه"],
    headingsEn: ["Two ways to run it", "Compatibility with the desktop", "Trust model", "Test results", "What you should know"],
  },
  {
    slug: "cloudcli-setup-guide", title: "الدليل الشامل: تثبيت CloudCLI وربط OpenCode و Codex و Claude Code به",
    titleEn: "The complete guide: installing CloudCLI and wiring OpenCode, Codex, and Claude Code to it",
    excerpt: "CloudCLI محوراً لثلاثة وكلاء برمجة: تثبيته، وربط Claude Code و Codex و OpenCode به، ثم المهارات والوكلاء وسيرفرات MCP والإضافات — موثّق من بيئة حقيقية تعمل على arm64 داخل PRoot.", excerptEn: "CloudCLI as the hub for three coding agents: installing it, connecting Claude Code, Codex, and OpenCode, then skills, agents, MCP servers, and plugins — documented from a real setup running on arm64 inside PRoot.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-09-28", minutes: 13,
    tags: ["CloudCLI", "Claude Code", "Codex", "OpenCode", "MCP"],
    tagsEn: ["CloudCLI", "Claude Code", "Codex", "OpenCode", "MCP"],
    headings: ["خارطة الطريق: ما الذي بنيناه؟", "الجزء الأول: تثبيت CloudCLI", "ما هو CloudCLI؟", "خطوات التثبيت", "التشغيل"],
    headingsEn: ["The roadmap: what we built", "Part one: installing CloudCLI", "What is CloudCLI?", "Installation steps", "Running it", "Part two: connecting the three agents"],
  },
  {
    slug: "edms-archive-pro", title: "أرشيف برو EDMS: نظام إدارة الوثائق الإلكترونية",
    titleEn: "Archive Pro EDMS: an electronic document management system",
    excerpt: "نظام أرشفة إلكترونية يعمل كخادم مركزي: بحث نصي كامل، إصدارات غير قابلة للاستبدال، سير عمل واعتمادات، توقيع Ed25519، DLP، واحتجاز قانوني — مع تحميل مجاني.", excerptEn: "An electronic archiving system that runs as a central server: full-text search, immutable versions, workflows and approvals, Ed25519 signatures, DLP, and legal hold — with a free download.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-09-27", minutes: 6,
    tags: ["EDMS", "أرشفة", "SQLite", "أمن", "OCR"],
    tagsEn: ["EDMS", "Archiving", "SQLite", "Security", "OCR"],
    headings: ["بنية التشغيل", "البحث والفهرسة", "إدارة الوثائق والإصدارات", "سجل إصدارات غير قابل للاستبدال", "الموافقات وسير العمل"],
    headingsEn: ["Runtime architecture", "Search and indexing", "Documents and versions", "An immutable version history", "Approvals and workflows", "Security and identity"],
  },
  {
    slug: "google-antigravity-on-ubuntu", title: "تثبيت Google Antigravity على Ubuntu: من الصفر إلى بيئة عمل",
    titleEn: "Installing Google Antigravity on Ubuntu: from zero to a working setup",
    excerpt: "خمس خطوات لتحويل أوبونتو إلى بيئة تطوير متكاملة لـ Google Antigravity — مع الخادم الخلفي، وواجهة الويب، و Python SDK، وأوامر التشغيل اليومية.", excerptEn: "Five steps to turn Ubuntu into a complete development environment for Google Antigravity — with the backend server, the web UI, the Python SDK, and the everyday commands.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-09-27", minutes: 5,
    tags: ["Antigravity", "Ubuntu", "tmux", "Python", "MCP"],
    tagsEn: ["Antigravity", "Ubuntu", "tmux", "Python", "MCP"],
    headings: ["الخطوة صفر — الحزم الأساسية", "الخطوة 1 — تثبيت محرك Antigravity", "الخطوة 2 — Python SDK داخل بيئة معزولة", "الخطوة 3 — تشغيل واجهة الويب", "الدخول والتفعيل"],
    headingsEn: ["Step zero — base packages", "Step 1 — install the Antigravity engine", "Step 2 — the Python SDK in an isolated environment", "Step 3 — start the web UI", "Sign-in and activation", "Step 4 — the full IDE"],
  },
  {
    slug: "opencode-tooling-guide", title: "أدوات بناء موقع من الصفر: ما استخدمته مع OpenCode فعلاً",
    titleEn: "Tools for building a site from scratch: what I actually used with OpenCode",
    excerpt: "ثمانية وكلاء وأربع مهارات وثمانية سيرفرات MCP — شرح آلية كل واحدة، ومتى استدعيتها، والأخطاء التي كلّفتني وقتاً. مع جدول يصلح كمادة مرجعية.", excerptEn: "Eight agents, four skills, and eight MCP servers — how each one works, when I called it, and the mistakes that cost me time. With a table that works as a reference.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-09-27", minutes: 6,
    tags: ["OpenCode", "MCP", "وكلاء", "مهارات", "أدوات"],
    tagsEn: ["OpenCode", "MCP", "Agents", "Skills", "Tools"],
    headings: ["الوكلاء: عقول بسياق نظيف", "قوة المراجعة في الطلب لا في الوكيل", "الدرس الأهم: أوقف سيرفرات MCP افتراضياً", "المهارات: تعليمات تُحمَّل عند الحاجة", "ثلاثة أخطاء حقيقية كشفتها المراجعة"],
    headingsEn: ["Agents: minds with a clean context", "The power of a review is in the request, not the agent", "The biggest lesson: keep MCP servers off by default", "Skills: instructions loaded on demand", "Three real bugs the review caught", "The trap that never throws an error"],
  },
  {
    slug: "docker-on-android-termux", title: "تشغيل Docker على أندرويد عبر Termux — دليلك العملي",
    titleEn: "Running Docker on Android with Termux — a practical guide",
    excerpt: "دليل مُجرَّب لتشغيل محرّك Docker كاملاً على هاتف أندرويد بدون روت، عبر آلة افتراضية Alpine خفيفة داخل Termux. كل أمر مع زر نسخ مباشر.", excerptEn: "A tested guide to running a full Docker engine on an Android phone without root, through a lightweight Alpine virtual machine inside Termux. Every command comes with a copy button.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-09-27", minutes: 5,
    tags: ["Docker", "Termux", "أندرويد", "QEMU", "Alpine"],
    tagsEn: ["Docker", "Termux", "Android", "QEMU", "Alpine"],
    headings: ["قبل أن تبدأ: ما ستحتاجه", "الخطوة 1 — تثبيت الحزم الأساسية في Termux", "الخطوة 2 — إنشاء مجلد العمل وتحميل Alpine", "الخطوة 3 — تشغيل النظام الافتراضي لأول مرة", "الخطوة 4 — تفعيل الشبكة والمستودعات"],
    headingsEn: ["Before you start: what you need", "Step 1 — install the base packages in Termux", "Step 2 — create a work folder and download Alpine", "Step 3 — boot the virtual machine for the first time", "Step 4 — enable networking and repositories", "Step 5 — install and start Docker"],
  },
  {
    slug: "first-30-seconds", title: "أول 30 ثانية: كيف تقرر المشاهد يكمل أم يتخطى",
    titleEn: "The first 30 seconds: how viewers decide to stay or swipe",
    excerpt: "الفيديو القصير لا يُحسم في أول ٣٠ ثانية فقط، بل في أول إطارين. دليل عملي لبناء خطاف يوقف التمرير دون أن يكون صاخباً.", excerptEn: "A short video is not decided in the first 30 seconds — it is decided in the first two frames. A practical guide to building a hook that stops the scroll without shouting.",
    category: "صناعة المحتوى", categoryEn: "Content",
    date: "2026-09-18", minutes: 3,
    tags: ["خطاف", "الاحتفاظ", "مونتاج"],
    tagsEn: ["Hook", "Retention", "Editing"],
    headings: ["الأسئلة الثلاثة التي يجيب عنها أول مشهد", "خمسة أنواع من الخطافات، ولكل منها موضع", "الصوت أول من الصورة", "كيف تعرف أن الخطاف نجح", "قائمة فحص قبل النشر"],
    headingsEn: ["The three questions your opening shot answers", "Five kinds of hook, each with its place", "Sound before picture", "How to tell the hook worked", "Pre-publish checklist"],
  },
  {
    slug: "tiktok-algorithm-2026", title: "كيف يوزّع تيك توك الفيديوهات في 2026",
    titleEn: "How TikTok distributes videos in 2026",
    excerpt: "النظام لم يعد يوزّع على المتابعين أولاً. شرح مبسّط لمراحل التوزيع الأربع، ولماذا فيديو قد ينفجر بلا متابعين إطلاقاً.", excerptEn: "The system no longer shows your videos to followers first. A simple explanation of the four distribution stages, and why a video can blow up with zero followers.",
    category: "تيك توك", categoryEn: "TikTok",
    date: "2026-09-12", minutes: 2,
    tags: ["الخوارزمية", "توزيع", "نمو"],
    tagsEn: ["Algorithm", "Distribution", "Growth"],
    headings: ["مراحل التوزيع الأربع", "الإشارات مرتبة حسب التأثير", "التوقيت والنشر المتكرر", "ماذا تفعل غداً"],
    headingsEn: ["The four distribution stages", "Signals ranked by impact", "Timing and posting cadence", "What to do tomorrow"],
  },
  {
    slug: "dark-mode-that-works", title: "الوضع الليلي الذي لا يقتل العين",
    titleEn: "A dark mode that does not hurt your eyes",
    excerpt: "أغلب تطبيقات الوضع الليلي تفشل باستخدام أسود نقي وأبيض نقي. هنا الأرقام الصحيحة، وقواعد التباين، ودور الـ tokens — ولماذا هي الحل.", excerptEn: "Most dark modes fail by using pure black and pure white. Here are the right numbers, the contrast rules, and the role of tokens — and why they are the fix.",
    category: "تصميم", categoryEn: "Design",
    date: "2026-09-05", minutes: 2,
    tags: ["تصميم", "ألوان", "tokens"],
    tagsEn: ["Design", "Colour", "tokens"],
    headings: ["لماذا الأسود النقي عدو القراءة", "نظام الـ Tokens: طبقة واحدة تتغير، والباقي لا يُلمس", "منع الوميض عند التبديل", "الصور والأيقونات لا تتبع الوضع تلقائياً", "احترام تفضيل النظام"],
    headingsEn: ["Why pure black is the enemy of reading", "A token system: one layer changes, nothing else is touched", "Preventing the flash on load", "Images and icons do not follow the mode on their own", "Respecting the system preference"],
  },
  {
    slug: "link-hub-that-converts", title: "صفحة روابط تحوّل الزائر إلى متابع",
    titleEn: "A links page that turns visitors into followers",
    excerpt: "صفحة الروابط ليست قائمة روابط. هي واجهة. ترتيب الروابط، وسرعة الفتح، وقياس الضغط — ثلاثة قرارات تفصل بين صفحة تعمل وأخرى مجرد جدول.", excerptEn: "A links page is not a list of links. It is a storefront. Link order, load speed, and click measurement — three decisions separate a page that works from one that is just a table.",
    category: "نمو", categoryEn: "Growth",
    date: "2026-08-27", minutes: 2,
    tags: ["روابط", "تحويل", "UX"],
    tagsEn: ["Links", "Conversion", "UX"],
    headings: ["الهرمية قبل التنسيق", "البطاقة تحتاج أكثر من رابط", "الاحتكاك يقتل التحويل", "ما الذي يجب أن تقيسه", "قائمة فحص"],
    headingsEn: ["Hierarchy before styling", "A card needs more than a link", "Friction kills conversion", "What to measure", "Checklist"],
  },
  {
    slug: "mobile-first-performance", title: "أداء الصفحات على الجوال: ما الذي يُقاس فعلاً",
    titleEn: "Mobile page performance: what actually gets measured",
    excerpt: "LCP وحده لا يكفي. مؤشرات الأداء الحقيقية التي تحسّن التحويل على شبكة بطيئة، وكيف نقيسها على جهاز متوسط، لا على حاسوب سريع.", excerptEn: "LCP alone is not enough. The real performance metrics that lift conversion on a slow network, and how to measure them on an average device — not a fast laptop.",
    category: "تقنية", categoryEn: "Engineering",
    date: "2026-08-19", minutes: 2,
    tags: ["أداء", "جوال", "CWV"],
    tagsEn: ["Performance", "Mobile", "CWV"],
    headings: ["المؤشرات الأربعة التي تهم", "CLS: أكثر خطأ يقع فيه المبتدئون", "الخطوط: أكبر مصدر صامت للبطء", "قِس على جهاز متوسط"],
    headingsEn: ["The four metrics that matter", "CLS: the mistake beginners make most", "Fonts: the biggest silent source of slowness", "Measure on an average device"],
  },
  {
    slug: "consistent-visual-identity", title: "هوية بصرية تُبنى مرة واحدة وتعمل لسنوات",
    titleEn: "A visual identity you build once and use for years",
    excerpt: "أغلب الحسابات تموت بصرياً ليس لأن المحتوى سيّئ، بل لأنها تغيّر ألوانها كل شهر. نظام من أربعة عناصر يكفي لبناء هوية ثابتة.", excerptEn: "Most accounts die visually not because the content is bad, but because they change their colours every month. A four-part system is enough to build a stable identity.",
    category: "تصميم", categoryEn: "Design",
    date: "2026-08-08", minutes: 2,
    tags: ["هوية", "ألوان", "اتساق"],
    tagsEn: ["Identity", "Colour", "Consistency"],
    headings: ["أربعة عناصر تكفي", "التباين هو الاحترافية", "الحركة جزء من الهوية", "قائمة فحص الهوية"],
    headingsEn: ["Four elements are enough", "Contrast is professionalism", "Motion is part of the identity", "Identity checklist"],
  },

]

export const postCategories = ['الكل', ...Array.from(new Set(posts.map((p) => p.category)))]

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

