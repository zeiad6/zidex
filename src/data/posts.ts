import type { Lang } from '@/lib/i18n'
import { postsEn } from './posts.en'

/* ------------------------------------------------------------------ *
 * Block model — a small typed AST so posts stay structured (headings
 * feed the table of contents, code gets its own chrome, quotes and
 * callouts render distinctly) without pulling in a markdown pipeline.
 * ------------------------------------------------------------------ */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; id: string; text: string }
  | { type: 'h3'; id: string; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string; by?: string }
  | { type: 'callout'; tone: 'info' | 'warn' | 'tip'; title: string; items: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'stats'; items: { value: string; label: string }[] }
  | { type: 'checklist'; items: string[] }
  | {
      type: 'table'
      head: string[]
      rows: string[][]
      /** Optional caption rendered above the table. */
      caption?: string
    }
  | { type: 'divider' }
  /**
   * A screenshot. `src` is a WebP under /img with a JPEG fallback in
   * `fallback`, because Safari < 14 has no WebP and a broken <picture>
   * element is worse than a heavier image.
   */
  | {
      type: 'image'
      src: string
      fallback: string
      alt: string
      caption?: string
    }
  /** Prominent download button; `meta` is the file name, size, and host. */
  | { type: 'download'; href: string; label: string; meta: string }
  /** Hub-and-spoke architecture diagram: one centre node wired to N nodes below it. */
  | {
      type: 'hub'
      center: { title: string; sub: string }
      nodes: { title: string; sub: string; role: string }[]
      caption?: string
    }

export type Category = 'صناعة المحتوى' | 'تيك توك' | 'تقنية' | 'تصميم' | 'نمو'

/**
 * Everything the index and the cards need. Deliberately body-free.
 */
export type PostMeta = {
  slug: string
  title: string
  excerpt: string
  category: Category
  date: string
  readMinutes: number
  featured?: boolean
  /** Emoji stands in for a cover image so no binary assets are needed. */
  cover: string
  /** Two-stop gradient used on the card's cover strip. */
  coverFrom: string
  coverTo: string
  tags: string[]
  /** Precomputed from the body; see note on RawPost. */
  headings: { id: string; text: string; level: 2 | 3 }[]
}

/** A post plus its article text — only the article page ever builds one. */
export type Post = PostMeta & { body: Block[] }

/**
 * The blog index needs a title, an excerpt, a date and a reading time — not
 * the article. Bodies live in ./postBodies and are fetched only when a reader
 * opens a post, which keeps them out of the entry bundle.
 */
type RawPost = PostMeta

const raw: RawPost[] = [
  {
    slug: 'cloudcli-setup-guide',
    title: 'الدليل الشامل: تثبيت CloudCLI وربط OpenCode و Codex و Claude Code به',
    excerpt:
      'CloudCLI محوراً لثلاثة وكلاء برمجة: تثبيته، وربط Claude Code و Codex و OpenCode به، ثم المهارات والوكلاء وسيرفرات MCP والإضافات — موثّق من بيئة حقيقية تعمل على arm64 داخل PRoot.',
    category: 'تقنية',
    date: '2026-09-28',
    featured: true,
    cover: 'layers',
    coverFrom: 'from-sky-500',
    coverTo: 'to-veil-600',
    tags: ['CloudCLI', 'Claude Code', 'Codex', 'OpenCode', 'MCP'],
    readMinutes: 13,
    headings: [{"id": "roadmap", "text": "خارطة الطريق: ما الذي بنيناه؟", "level": 2}, {"id": "install", "text": "الجزء الأول: تثبيت CloudCLI", "level": 2}, {"id": "what-is-cloudcli", "text": "ما هو CloudCLI؟", "level": 3}, {"id": "install-steps", "text": "خطوات التثبيت", "level": 3}, {"id": "run", "text": "التشغيل", "level": 3}, {"id": "connect", "text": "الجزء الثاني: ربط الوكلاء الثلاثة", "level": 2}, {"id": "connect-claude", "text": "الربط الأول: Claude Code — يقوده CloudCLI مباشرة", "level": 3}, {"id": "connect-codex", "text": "الربط الثاني: Codex — يستهلك browser-use من CloudCLI عبر MCP", "level": 3}, {"id": "connect-opencode", "text": "الربط الثالث: OpenCode — OpenRouter للموديلات + browser-use من CloudCLI", "level": 3}, {"id": "compare", "text": "جدول المقارنة السريع", "level": 3}, {"id": "skills", "text": "الجزء الثالث: المهارات (Skills)", "level": 2}, {"id": "what-is-skill", "text": "ما هي المهارة؟", "level": 3}, {"id": "key-skills", "text": "أهم المهارات المستخدمة هنا", "level": 3}, {"id": "add-skill", "text": "كيف تضيف مهارة جديدة؟", "level": 3}, {"id": "agents", "text": "الجزء الرابع: الوكلاء (Agents)", "level": 2}, {"id": "skill-vs-agent", "text": "الفرق بين المهارة والوكيل", "level": 3}, {"id": "agents-inventory", "text": "ما لدينا فعلياً", "level": 3}, {"id": "add-agent", "text": "كيف تضيف وكيلاً؟", "level": 3}, {"id": "mcp", "text": "الجزء الخامس: سيرفرات MCP", "level": 2}, {"id": "what-is-mcp", "text": "ما هو MCP؟", "level": 3}, {"id": "mcp-inventory", "text": "سيرفرات MCP المستخدمة هنا", "level": 3}, {"id": "add-mcp", "text": "كيف تضيف سيرفر MCP؟", "level": 3}, {"id": "plugins", "text": "الجزء السادس: الإضافات والبلجنز والأوامر", "level": 2}, {"id": "claude-plugins", "text": "إضافات Claude Code (Marketplaces)", "level": 3}, {"id": "opencode-plugins", "text": "بلجنز OpenCode العالمية", "level": 3}, {"id": "opencode-commands", "text": "أوامر OpenCode الجاهزة (21 أمراً)", "level": 3}, {"id": "ops", "text": "الجزء السابع: نصائح تشغيلية من أرض الواقع", "level": 2}, {"id": "proot-socket", "text": "مشكلة cross-session messaging في PRoot", "level": 3}, {"id": "openrouter-402", "text": "مشكلة تحويل Claude Code إلى OpenRouter", "level": 3}, {"id": "keys", "text": "إدارة المفاتيح بأمان", "level": 3}, {"id": "maintenance", "text": "عادات الصيانة", "level": 3}, {"id": "checklist", "text": "قائمة تحقق نهائية", "level": 2}],
  },

  {
    slug: 'edms-archive-pro',
    title: 'أرشيف برو EDMS: نظام إدارة الوثائق الإلكترونية',
    excerpt:
      'نظام أرشفة إلكترونية يعمل كخادم مركزي: بحث نصي كامل، إصدارات غير قابلة للاستبدال، سير عمل واعتمادات، توقيع Ed25519، DLP، واحتجاز قانوني — مع تحميل مجاني.',
    category: 'تقنية',
    date: '2026-09-27',
    cover: 'archive',
    coverFrom: 'from-veil-600',
    coverTo: 'to-ink-900',
    tags: ['EDMS', 'أرشفة', 'SQLite', 'أمن', 'OCR'],
    readMinutes: 6,
    headings: [{"id": "architecture", "text": "بنية التشغيل", "level": 2}, {"id": "search", "text": "البحث والفهرسة", "level": 2}, {"id": "documents", "text": "إدارة الوثائق والإصدارات", "level": 2}, {"id": "versions", "text": "سجل إصدارات غير قابل للاستبدال", "level": 3}, {"id": "workflow", "text": "الموافقات وسير العمل", "level": 2}, {"id": "security", "text": "الأمان والهوية", "level": 2}, {"id": "signature", "text": "التوقيعات التشفيرية", "level": 2}, {"id": "dlp", "text": "DLP ومنع تسريب البيانات", "level": 2}, {"id": "retention", "text": "الاحتفاظ والحجز القانوني", "level": 2}, {"id": "backup", "text": "النسخ الاحتياطي والاستعادة", "level": 2}, {"id": "ops", "text": "التشغيل والمراقبة", "level": 2}, {"id": "results", "text": "نتائج التحقق", "level": 2}, {"id": "unsigned", "text": "ملاحظات قبل التثبيت", "level": 2}, {"id": "get", "text": "التحميل", "level": 2}],
  },

  {
    slug: 'google-antigravity-on-ubuntu',
    title: 'تثبيت Google Antigravity على Ubuntu: من الصفر إلى بيئة عمل',
    excerpt:
      'خمس خطوات لتحويل أوبونتو إلى بيئة تطوير متكاملة لـ Google Antigravity — مع الخادم الخلفي، وواجهة الويب، و Python SDK، وأوامر التشغيل اليومية.',
    category: 'تقنية',
    date: '2026-09-27',
    cover: 'compass',
    coverFrom: 'from-ghost-600',
    coverTo: 'to-ink-900',
    tags: ['Antigravity', 'Ubuntu', 'tmux', 'Python', 'MCP'],
    readMinutes: 5,
    headings: [{"id": "prereq", "text": "الخطوة صفر — الحزم الأساسية", "level": 2}, {"id": "engine", "text": "الخطوة 1 — تثبيت محرك Antigravity", "level": 2}, {"id": "sdk", "text": "الخطوة 2 — Python SDK داخل بيئة معزولة", "level": 2}, {"id": "web-ui", "text": "الخطوة 3 — تشغيل واجهة الويب", "level": 2}, {"id": "login", "text": "الدخول والتفعيل", "level": 3}, {"id": "ide", "text": "الخطوة 4 — واجهة التطوير الكاملة (IDE)", "level": 2}, {"id": "first-run", "text": "أول تشغيل — خطوات تسجيل الدخول", "level": 3}, {"id": "stop-web", "text": "إيقاف واجهة الويب", "level": 3}, {"id": "daily", "text": "الأوامر اليومية", "level": 2}, {"id": "troubleshoot", "text": "حل المشاكل المتكرّرة", "level": 2}],
  },

  {
    slug: 'opencode-tooling-guide',
    title: 'أدوات بناء موقع من الصفر: ما استخدمته مع OpenCode فعلاً',
    excerpt:
      'ثمانية وكلاء وأربع مهارات وثمانية سيرفرات MCP — شرح آلية كل واحدة، ومتى استدعيتها، والأخطاء التي كلّفتني وقتاً. مع جدول يصلح كمادة مرجعية.',
    category: 'تقنية',
    date: '2026-09-27',
    featured: true,
    cover: 'terminal',
    coverFrom: 'from-veil-500',
    coverTo: 'to-ink-900',
    tags: ['OpenCode', 'MCP', 'وكلاء', 'مهارات', 'أدوات'],
    readMinutes: 6,
    headings: [{"id": "agents", "text": "الوكلاء: عقول بسياق نظيف", "level": 2}, {"id": "reviewer-lesson", "text": "قوة المراجعة في الطلب لا في الوكيل", "level": 3}, {"id": "mcp-idle", "text": "الدرس الأهم: أوقف سيرفرات MCP افتراضياً", "level": 2}, {"id": "skills", "text": "المهارات: تعليمات تُحمَّل عند الحاجة", "level": 2}, {"id": "errors-found", "text": "ثلاثة أخطاء حقيقية كشفتها المراجعة", "level": 2}, {"id": "npm-trap", "text": "الفخ الذي لا يُصدر خطأ أبداً", "level": 2}, {"id": "security", "text": "الأمان والخصوصية في البناء", "level": 2}, {"id": "lessons", "text": "دروس من النشر الفعلي", "level": 2}, {"id": "lesson-401", "text": "401 على كل شيء بعد النشر", "level": 3}, {"id": "lesson-domain", "text": "النطاق المحجوز عالمياً", "level": 3}, {"id": "checklist", "text": "قائمة تحقق نهائية", "level": 2}, {"id": "adapters", "text": "ما يناسبك أنت", "level": 2}],
  },

  {
    slug: 'ai-fake-detector-android',
    title: 'AI Fake — كاشف المحتوى المولَّد بالذكاء الاصطناعي على أندرويد',
    excerpt:
      'تطبيق أندرويد مفتوح يفحص الصور والفيديو وروابط الفيديو محلياً على الجهاز عبر نماذج ONNX، ويكشف التزييف العميق ب fusion متعدد النماذج — دون رفع أي ملف.',
    category: 'تقنية',
    date: '2026-09-30',
    cover: 'shield',
    coverFrom: 'from-veil-500',
    coverTo: 'to-ink-900',
    tags: ['Android', 'Kotlin', 'ONNX', 'Deepfake', 'AI'],
    readMinutes: 2,
    headings: [{"id":"how-it-works","text":"كيف يعمل","level":2},{"id":"models","text":"النماذج المتاحة","level":2},{"id":"metadata","text":"فحص بيانات المصدر","level":2},{"id":"screens","text":"من الواجهة","level":2},{"id":"limits","text":"حدود يجب أن تعرفها","level":2}],
  },

  {
    slug: 'docker-on-android-termux',
    title: 'تشغيل Docker على أندرويد عبر Termux — دليلك العملي',
    excerpt:
      'دليل مُجرَّب لتشغيل محرّك Docker كاملاً على هاتف أندرويد بدون روت، عبر آلة افتراضية Alpine خفيفة داخل Termux. كل أمر مع زر نسخ مباشر.',
    category: 'تقنية',
    date: '2026-09-27',
    cover: 'package',
    coverFrom: 'from-ghost-500',
    coverTo: 'to-ink-900',
    tags: ['Docker', 'Termux', 'أندرويد', 'QEMU', 'Alpine'],
    readMinutes: 5,
    headings: [{"id": "prereq", "text": "قبل أن تبدأ: ما ستحتاجه", "level": 2}, {"id": "step-1", "text": "الخطوة 1 — تثبيت الحزم الأساسية في Termux", "level": 2}, {"id": "step-2", "text": "الخطوة 2 — إنشاء مجلد العمل وتحميل Alpine", "level": 2}, {"id": "step-3", "text": "الخطوة 3 — تشغيل النظام الافتراضي لأول مرة", "level": 2}, {"id": "step-4", "text": "الخطوة 4 — تفعيل الشبكة والمستودعات", "level": 2}, {"id": "step-5", "text": "الخطوة 5 — تثبيت Docker وتشغيله", "level": 2}, {"id": "step-6", "text": "الخطوة 6 — اختبار المحرك", "level": 2}, {"id": "ports", "text": "إدارة المنافذ: نشر تطبيق ويب", "level": 2}, {"id": "shutdown", "text": "إيقاف النظام بأمان", "level": 2}, {"id": "ssh", "text": "الوصول عبر SSH بدلاً من كتابة الأوامر يدوياً", "level": 2}],
  },

  {
    slug: 'first-30-seconds',
    title: 'أول 30 ثانية: كيف تقرر المشاهد يكمل أم يتخطى',
    excerpt:
      'الفيديو القصير لا يُحسم في أول ٣٠ ثانية فقط، بل في أول إطارين. دليل عملي لبناء خطاف يوقف التمرير دون أن يكون صاخباً.',
    category: 'صناعة المحتوى',
    date: '2026-09-18',
    featured: true,
    cover: 'video',
    coverFrom: 'from-ghost-500',
    coverTo: 'to-veil-600',
    tags: ['خطاف', 'الاحتفاظ', 'مونتاج'],
    readMinutes: 3,
    headings: [{"id": "the-3-questions", "text": "الأسئلة الثلاثة التي يجيب عنها أول مشهد", "level": 2}, {"id": "hook-types", "text": "خمسة أنواع من الخطافات، ولكل منها موضع", "level": 2}, {"id": "audio", "text": "الصوت أول من الصورة", "level": 2}, {"id": "measure", "text": "كيف تعرف أن الخطاف نجح", "level": 2}, {"id": "checklist", "text": "قائمة فحص قبل النشر", "level": 2}],
  },
  {
    slug: 'tiktok-algorithm-2026',
    title: 'كيف يوزّع تيك توك الفيديوهات في 2026',
    excerpt:
      'النظام لم يعد يوزّع على المتابعين أولاً. شرح مبسّط لمراحل التوزيع الأربع، ولماذا فيديو قد ينفجر بلا متابعين إطلاقاً.',
    category: 'تيك توك',
    date: '2026-09-12',
    featured: true,
    cover: 'spark',
    coverFrom: 'from-tiktok-600',
    coverTo: 'to-ghost-500',
    tags: ['الخوارزمية', 'توزيع', 'نمو'],
    readMinutes: 2,
    headings: [{"id": "four-stages", "text": "مراحل التوزيع الأربع", "level": 2}, {"id": "signals-ranked", "text": "الإشارات مرتبة حسب التأثير", "level": 2}, {"id": "cadence", "text": "التوقيت والنشر المتكرر", "level": 2}, {"id": "what-to-do", "text": "ماذا تفعل غداً", "level": 2}],
  },
  {
    slug: 'dark-mode-that-works',
    title: 'الوضع الليلي الذي لا يقتل العين',
    excerpt:
      'أغلب تطبيقات الوضع الليلي تفشل باستخدام أسود نقي وأبيض نقي. هنا الأرقام الصحيحة، وقواعد التباين، ودور الـ tokens — ولماذا هي الحل.',
    category: 'تصميم',
    date: '2026-09-05',
    cover: 'moon',
    coverFrom: 'from-veil-600',
    coverTo: 'to-ink-900',
    tags: ['تصميم', 'ألوان', 'tokens'],
    readMinutes: 2,
    headings: [{"id": "the-problem", "text": "لماذا الأسود النقي عدو القراءة", "level": 2}, {"id": "tokens", "text": "نظام الـ Tokens: طبقة واحدة تتغير، والباقي لا يُلمس", "level": 2}, {"id": "anti-flicker", "text": "منع الوميض عند التبديل", "level": 2}, {"id": "images", "text": "الصور والأيقونات لا تتبع الوضع تلقائياً", "level": 2}, {"id": "respect-preference", "text": "احترام تفضيل النظام", "level": 2}],
  },
  {
    slug: 'link-hub-that-converts',
    title: 'صفحة روابط تحوّل الزائر إلى متابع',
    excerpt:
      'صفحة الروابط ليست قائمة روابط. هي واجهة. ترتيب الروابط، وسرعة الفتح، وقياس الضغط — ثلاثة قرارات تفصل بين صفحة تعمل وأخرى مجرد جدول.',
    category: 'نمو',
    date: '2026-08-27',
    featured: true,
    cover: 'link',
    coverFrom: 'from-teal-500',
    coverTo: 'to-ghost-500',
    tags: ['روابط', 'تحويل', 'UX'],
    readMinutes: 2,
    headings: [{"id": "hierarchy", "text": "الهرمية قبل التنسيق", "level": 2}, {"id": "card-design", "text": "البطاقة تحتاج أكثر من رابط", "level": 2}, {"id": "friction", "text": "الاحتكاك يقتل التحويل", "level": 2}, {"id": "measure", "text": "ما الذي يجب أن تقيسه", "level": 2}, {"id": "checklist", "text": "قائمة فحص", "level": 2}],
  },
  {
    slug: 'mobile-first-performance',
    title: 'أداء الصفحات على الجوال: ما الذي يُقاس فعلاً',
    excerpt:
      'LCP وحده لا يكفي. مؤشرات الأداء الحقيقية التي تحسّن التحويل على شبكة بطيئة، وكيف نقيسها على جهاز متوسط، لا على حاسوب سريع.',
    category: 'تقنية',
    date: '2026-08-19',
    cover: 'download',
    coverFrom: 'from-amber-500',
    coverTo: 'to-rose-500',
    tags: ['أداء', 'جوال', 'CWV'],
    readMinutes: 2,
    headings: [{"id": "metrics", "text": "المؤشرات الأربعة التي تهم", "level": 2}, {"id": "cls", "text": "CLS: أكثر خطأ يقع فيه المبتدئون", "level": 2}, {"id": "font", "text": "الخطوط: أكبر مصدر صامت للبطء", "level": 2}, {"id": "measure-real", "text": "قِس على جهاز متوسط", "level": 2}],
  },
  {
    slug: 'consistent-visual-identity',
    title: 'هوية بصرية تُبنى مرة واحدة وتعمل لسنوات',
    excerpt:
      'أغلب الحسابات تموت بصرياً ليس لأن المحتوى سيّئ، بل لأنها تغيّر ألوانها كل شهر. نظام من أربعة عناصر يكفي لبناء هوية ثابتة.',
    category: 'تصميم',
    date: '2026-08-08',
    cover: 'grid',
    coverFrom: 'from-rose-500',
    coverTo: 'to-veil-500',
    tags: ['هوية', 'ألوان', 'اتساق'],
    readMinutes: 2,
    headings: [{"id": "four-elements", "text": "أربعة عناصر تكفي", "level": 2}, {"id": "contrast", "text": "التباين هو الاحترافية", "level": 2}, {"id": "motion", "text": "الحركة جزء من الهوية", "level": 2}, {"id": "checklist", "text": "قائمة فحص الهوية", "level": 2}],
  },
]

/**
 * Article text is a separate chunk, fetched only when a reader opens a post.
 * A static import here would put every article into the entry bundle and
 * charge that cost to the first paint of the home page.
 */
export async function loadBodies(slug: string, lang: Lang = 'ar'): Promise<Block[] | undefined> {
  // Both languages are separate chunks. A slug with no translation falls back
  // to the Arabic body so an untranslated article is never a blank page.
  if (lang === 'en') {
    const en = await import('./postBodies.en')
    const translated = en.postBodiesEn[slug]
    if (translated) return translated
  }
  const mod = await import('./postBodies')
  return mod.postBodies[slug]
}

export const allPosts: PostMeta[] = [...raw].sort((a, b) => b.date.localeCompare(a.date))

/**
 * English edition: same slugs, dates, covers and heading ids (so #anchors
 * work in both languages); text fields come from posts.en.ts. A post with no
 * translation falls back to the Arabic original rather than disappearing.
 */
const allPostsEn: PostMeta[] = allPosts.map((p) => {
  const tr = postsEn[p.slug]
  if (!tr) return p
  // `tr.headings` is the English list, so an English reader gets an English
  // table of contents instead of the Arabic one inherited from posts.ts.
  return { ...p, ...tr }
})

export function postsFor(lang: Lang) {
  return lang === 'en' ? allPostsEn : allPosts
}

/** Category values stay Arabic as filter keys; this is only the display label. */
const categoryEn: Record<Category, string> = {
  'صناعة المحتوى': 'Content creation',
  'تيك توك': 'TikTok',
  تقنية: 'Tech',
  تصميم: 'Design',
  نمو: 'Growth',
}

export function categoryLabel(c: Category, lang: Lang) {
  return lang === 'en' ? categoryEn[c] : c
}

export const categories: Category[] = ['صناعة المحتوى', 'تيك توك', 'تقنية', 'تصميم', 'نمو']

export function getPost(slug: string, lang: Lang = 'ar') {
  return postsFor(lang).find((p) => p.slug === slug)
}

export function getAdjacentPosts(slug: string, lang: Lang = 'ar') {
  const list = postsFor(lang)
  const i = list.findIndex((p) => p.slug === slug)
  if (i === -1) return { prev: undefined, next: undefined }
  return {
    // `next` is the older post (posts are newest-first).
    next: list[i + 1],
    prev: list[i - 1],
  }
}

/** Headings for the table of contents, derived from the same source as the body. */
export function getHeadings(post: PostMeta) {
  return post.headings
}

export function getPostReadMinutes(post: PostMeta) {
  return post.readMinutes
}

export function searchPosts(query: string, lang: Lang = 'ar') {
  const list = postsFor(lang)
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter((p) => {
    // Heading text stands in for the body: it is precomputed, so search still
    // matches the words a reader would actually type without loading articles.
    const haystack = [
      p.title,
      p.excerpt,
      categoryLabel(p.category, lang),
      p.tags.join(' '),
      p.headings.map((h) => h.text).join(' '),
    ]
      .join(' ')
      .toLowerCase()
    return q
      .split(/\s+/)
      .every((term) => haystack.includes(term))
  })
}
