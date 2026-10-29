/* ------------------------------------------------------------------ *
 * Downloadable programs. Add an entry here and it shows up on the home
 * dashboard, the /programs page, and in search — nothing else to wire.
 * ------------------------------------------------------------------ */
import type { GlyphName } from '@/components/ui/Glyphs'

/**
 * One mirror of the same build. A program can have several: a media host
 * goes down, or a file is large enough that people want a second source.
 * The first entry is the primary — the one the card leads with.
 */
export type ProgramDownload = {
  href: string
  /** Host shown next to the file name, e.g. "MediaFire". */
  host: string
  file: string
  size: string
  /** Shown on the button when a mirror needs explaining, e.g. a CDN. */
  note?: string
}

/**
 * Program groups. The keys are the whole API: adding a third platform is
 * one entry here plus a `kind` on the programs that belong to it, and the
 * /programs page grows a section on its own.
 */
export const programKinds = {
  microsoft: {
    label: 'تطبيقات ميكروسوفت (بدائل Office)',
    labelEn: 'Microsoft Office Apps',
    hint: 'بدائل مجانية وسريعة لبرامج Word و Excel و PowerPoint مبنية بلغة Rust',
    hintEn: 'Fast, open-source Rust alternatives for Word, Excel, and PowerPoint',
    glyph: 'doc',
  },
  premium: {
    label: 'حزمة البرامج الإبداعية والاحترافية (Premium Suite)',
    labelEn: 'Creative & Pro Suite (Premium)',
    hint: 'بدائل برامج أدوبي والتصميم والمونتاج والهندسة مفتوحة المصدر وبلا اشتراكات',
    hintEn: 'Open-source alternatives for Adobe, design, video editing & CAD',
    glyph: 'spark',
  },
  windows: {
    label: 'تطبيقات ويندوز والأنظمة المؤسسية',
    labelEn: 'Windows & Enterprise Systems',
    hint: 'أنظمة إدارة المحاسبة والأوقاف والجمعيات الخيرية وإدارة الوثائق والأرشفة المكتبية',
    hintEn: 'Fund accounting, Awqaf, and document management systems',
    glyph: 'grid',
  },
  android: {
    label: 'تطبيقات أندرويد',
    labelEn: 'Android apps',
    hint: 'تطبيقات جوّال تعمل على جهازك مباشرة دون اتصال بخوادم خارجية',
    hintEn: 'Mobile apps that run directly on your own device',
    glyph: 'package',
  },
} as const

export type ProgramKind = keyof typeof programKinds

export type Program = {
  slug: string
  name: string
  nameEn: string
  tagline: string
  taglineEn: string
  version: string
  /** Human platform string for the facts row, e.g. "Android 8.0+". */
  platform: string
  kind: ProgramKind
  downloads: ProgramDownload[]
  /** Slug of the blog post that documents it, if any. */
  post?: string
  /** External documentation, for programs documented outside this blog. */
  docs?: string
  /** Key into the Glyphs registry — a drawn mark, not an emoji. */
  glyph: GlyphName
  date: string
}

export const programs: Program[] = [
  /* ------------------------------------------------------------------ *
   * 1. Microsoft Office Suite Alternatives (تطبيقات ميكروسوفت)
   * ------------------------------------------------------------------ */
  {
    slug: 'wordcraft',
    name: 'WordCraft — بديل ميكروسوفت وورد الاحترافي',
    nameEn: 'WordCraft — Pro Word Processor',
    tagline:
      'معالج نصوص متقدم ومفتوح المصدر، إعادة بناء نظيفة لـ Microsoft Word بلغة Rust: تنسيق متقدم، جداول، دعم كامل لملفات DOCX، وتصدير PDF بدون اشتراك أو قيود.',
    taglineEn:
      'An open-source clean-room reimplementation of Microsoft Word in pure Rust: rich typography, tables, full DOCX compatibility, and instant PDF export with zero subscription.',
    version: '0.12.0',
    platform: 'Windows x64',
    kind: 'microsoft',
    downloads: [
      {
        href: 'https://github.com/storytold/wordcraft/releases/download/v0.12.0/wordcraft-0.12.0-windows-x64.msi',
        host: 'GitHub',
        file: 'wordcraft-0.12.0-windows-x64.msi',
        size: '84.6 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/wordcraft/releases/download/v0.12.0/wordcraft-0.12.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'wordcraft-0.12.0-windows-x64-portable.zip',
        size: '103.9 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/wordcraft',
    glyph: 'doc',
    date: '2026-10-28',
  },
  {
    slug: 'gridcraft',
    name: 'GridCraft — جداول البيانات السريعة (بديل إكسيل)',
    nameEn: 'GridCraft — High-Performance Spreadsheet',
    tagline:
      'جداول بيانات متطورة ومفتوحة المصدر كبديل كامل لـ Microsoft Excel: سرعة فائقة في معالجة مئات آلاف الصفوف، صيغ ودوال حسابية، رسوم بيانية تفاعلية، ودعم صيغ XLSX.',
    taglineEn:
      'Fast open-source spreadsheet editor and clean-room Microsoft Excel alternative in pure Rust: handles massive datasets effortlessly with built-in formulas, charts, and XLSX support.',
    version: '0.13.0',
    platform: 'Windows x64',
    kind: 'microsoft',
    downloads: [
      {
        href: 'https://github.com/storytold/gridcraft/releases/download/v0.13.0/gridcraft-0.13.0-windows-x64.msi',
        host: 'GitHub',
        file: 'gridcraft-0.13.0-windows-x64.msi',
        size: '36.3 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/gridcraft/releases/download/v0.13.0/gridcraft-0.13.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'gridcraft-0.13.0-windows-x64-portable.zip',
        size: '44.8 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/gridcraft',
    glyph: 'grid',
    date: '2026-10-28',
  },
  {
    slug: 'deckcraft',
    name: 'DeckCraft — العروض التقديمية والشرائح (بديل باوربوينت)',
    nameEn: 'DeckCraft — Presentation & Slide Deck Studio',
    tagline:
      'تصميم وتقديم العروض التفاعلية كبديل نظيف لـ Microsoft PowerPoint: انتقالات سلسة بمعدل إطارات مرتفع، قوالب عصرية، تصدير PDF وفيديو، ودعم ملفات PPTX بلغة Rust.',
    taglineEn:
      'Clean-room presentation suite alternative to Microsoft PowerPoint in pure Rust: high frame-rate transitions, modern layouts, PPTX compatibility, and presenter mode.',
    version: '0.12.0',
    platform: 'Windows x64',
    kind: 'microsoft',
    downloads: [
      {
        href: 'https://github.com/storytold/deckcraft/releases/download/v0.12.0/deckcraft-0.12.0-windows-x64.msi',
        host: 'GitHub',
        file: 'deckcraft-0.12.0-windows-x64.msi',
        size: '78.6 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/deckcraft/releases/download/v0.12.0/deckcraft-0.12.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'deckcraft-0.12.0-windows-x64-portable.zip',
        size: '98.6 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/deckcraft',
    glyph: 'spark',
    date: '2026-10-28',
  },

  /* ------------------------------------------------------------------ *
   * 2. Premium Creative & Pro Suite (حزمة البرامج الإبداعية والاحترافية)
   * ------------------------------------------------------------------ */
  {
    slug: 'photocraft',
    name: 'PhotoCraft — محرّر الصور الاحترافي (بديل فوتوشوب)',
    nameEn: 'PhotoCraft — Pro Image Editor',
    tagline:
      'محرّر صور مفتوح المصدر، إعادة بناء نظيفة لـ Adobe Photoshop: طبقات، أقنعة، مرشّحات، أدوات تحديد ذكية، دعم PSD، وتحرير غير متلف — بديل مجاني كامل بلا اشتراك يعمل محلياً.',
    taglineEn:
      'An open-source image editor, a clean-room reimplementation of Adobe Photoshop: layers, masks, filters, smart selection, PSD support and non-destructive editing — free with no subscription.',
    version: '0.17.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/photocraft/releases/download/v0.17.0/photocraft-0.17.0-windows-x64.msi',
        host: 'GitHub',
        file: 'photocraft-0.17.0-windows-x64.msi',
        size: '100.7 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/photocraft/releases/download/v0.17.0/photocraft-0.17.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'photocraft-0.17.0-windows-x64-portable.zip',
        size: '120.5 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/photocraft',
    glyph: 'layers',
    date: '2026-10-28',
  },
  {
    slug: 'artcraft',
    name: 'ArtCraft — محرّك الإبداع للفنانين والمصممين',
    nameEn: 'ArtCraft — Creative Engine',
    tagline:
      'بيئة إبداع متكاملة للفنانين والمصممين وصنّاع الأفلام: لوحة دقيقة تجمع التصميم والرسم وأدوات الذكاء الاصطناعي في مكان واحد، بتحكم كامل في كل عنصر. تعمل محلياً على جهازك.',
    taglineEn:
      'An open-source creative environment for artists, designers and filmmakers: a precise canvas uniting design, drawing and AI tools with complete control. Runs locally on your machine.',
    version: '0.41.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/artcraft/releases/download/artcraft-v0.41.0/ArtCraft_0.41.0_x64-setup.exe',
        host: 'GitHub',
        file: 'ArtCraft_0.41.0_x64-setup.exe',
        size: '39.9 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/artcraft/releases/download/artcraft-v0.41.0/ArtCraft_0.41.0_x64_en-US.msi',
        host: 'GitHub',
        file: 'ArtCraft_0.41.0_x64_en-US.msi',
        size: '44.7 MB',
        note: 'حزمة MSI',
      },
    ],
    docs: 'https://github.com/storytold/artcraft',
    glyph: 'spark',
    date: '2026-09-26',
  },
  {
    slug: 'filmcraft',
    name: 'FilmCraft — محرّر ومونتير الفيديو (بديل بريمير)',
    nameEn: 'FilmCraft — Non-Linear Video Editor',
    tagline:
      'محرّر ومونتير فيديو احترافي غير خطي (بديل Adobe Premiere Pro): مسارات صوت وفيديو غير محدودة، تصحيح ألوان سينمائي، مؤثرات انتقالية، وتصدير عالي السرعة بلغة Rust.',
    taglineEn:
      'Open-source non-linear video editor (clean-room Adobe Premiere Pro alternative): multi-track timeline, color grading, transitions, and hardware-accelerated rendering in pure Rust.',
    version: '0.14.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/filmcraft/releases/download/v0.14.0/filmcraft-0.14.0-windows-x64.msi',
        host: 'GitHub',
        file: 'filmcraft-0.14.0-windows-x64.msi',
        size: '84.4 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/filmcraft/releases/download/v0.14.0/filmcraft-0.14.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'filmcraft-0.14.0-windows-x64-portable.zip',
        size: '101.7 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/filmcraft',
    glyph: 'video',
    date: '2026-10-28',
  },
  {
    slug: 'vectorcraft',
    name: 'VectorCraft — تصميم الرسوميات المتجهية (بديل إليستريتور)',
    nameEn: 'VectorCraft — Vector Graphics & SVG Studio',
    tagline:
      'استوديو الرسم الشعاعي والمتجهي (بديل Adobe Illustrator): مسارات بيزيه فائقة الدقة، دعم كامل وتصدير لملفات SVG و EPS، وأدوات تصميم شعارات ورسوم توضيحية متقدمة.',
    taglineEn:
      'Vector graphics and illustration editor in pure Rust (Adobe Illustrator alternative): sub-pixel precision paths, full SVG/EPS compatibility, and modern vector design tools.',
    version: '0.18.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/vectorcraft/releases/download/v0.18.0/vectorcraft-0.18.0-windows-x64.msi',
        host: 'GitHub',
        file: 'vectorcraft-0.18.0-windows-x64.msi',
        size: '106.8 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/vectorcraft/releases/download/v0.18.0/vectorcraft-0.18.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'vectorcraft-0.18.0-windows-x64-portable.zip',
        size: '132.6 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/vectorcraft',
    glyph: 'compass',
    date: '2026-10-28',
  },
  {
    slug: 'designcraft',
    name: 'DesignCraft — تصميم المطبوعات والنشر المكتبي (بديل إن ديزاين)',
    nameEn: 'DesignCraft — Page Layout & Publishing Studio',
    tagline:
      'استوديو تنسيق الصفحات والنشر المكتبي (بديل Adobe InDesign): تخطيط شبكي متقن للكتب والمجلات والبروشورات، طباعة رقمية وفصل ألوان CMYK، وتصدير PDF عالي الجودة للطباعة.',
    taglineEn:
      'Desktop publishing & page layout editor (clean-room Adobe InDesign alternative): multi-page layouts, typography grids, CMYK print preparation, and press-ready PDF export.',
    version: '0.14.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/designcraft/releases/download/v0.14.0/designcraft-0.14.0-windows-x64.msi',
        host: 'GitHub',
        file: 'designcraft-0.14.0-windows-x64.msi',
        size: '92.8 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/designcraft/releases/download/v0.14.0/designcraft-0.14.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'designcraft-0.14.0-windows-x64-portable.zip',
        size: '117.0 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/designcraft',
    glyph: 'book',
    date: '2026-10-28',
  },
  {
    slug: 'effectcraft',
    name: 'EffectCraft — الموشن جرافيكس والمؤثرات البصرية (بديل أفتر إفكتس)',
    nameEn: 'EffectCraft — Motion Graphics & VFX Compositor',
    tagline:
      'محرك المؤثرات البصرية والرسوم المتحركة (بديل Adobe After Effects): تحريك الإطارات المفتاحية Keyframes، تركيب طبقات متعددة، ومؤثرات سينمائية بصرية مسرعة عتادياً بلغة Rust.',
    taglineEn:
      'Motion design & VFX compositing suite (clean-room After Effects alternative): node & layer compositing, curve keyframing, and GPU-accelerated motion graphics in pure Rust.',
    version: '0.18.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/effectcraft/releases/download/v0.18.0/effectcraft-0.18.0-windows-x64.msi',
        host: 'GitHub',
        file: 'effectcraft-0.18.0-windows-x64.msi',
        size: '53.9 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/effectcraft/releases/download/v0.18.0/effectcraft-0.18.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'effectcraft-0.18.0-windows-x64-portable.zip',
        size: '71.1 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/effectcraft',
    glyph: 'spark',
    date: '2026-10-28',
  },
  {
    slug: 'soundcraft',
    name: 'SoundCraft — الهندسة الصوتية والتوزيع الرقمي (بديل برو تولز)',
    nameEn: 'SoundCraft — Digital Audio Workstation',
    tagline:
      'محطة عمل صوت رقمية احترافية DAW (بديل Avid Pro Tools و Adobe Audition): تسجيل ومكساج متعدد المسارات، تحرير موجات الصوت بدقة زمنية متناهية، وماسترنج نقي دون تأخير.',
    taglineEn:
      'Pro DAW audio workstation in pure Rust (clean-room Avid Pro Tools & Audition alternative): multi-track recording, waveform editing, low-latency DSP mixing, and mastering.',
    version: '0.14.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/soundcraft/releases/download/v0.14.0/soundcraft-0.14.0-windows-x64.msi',
        host: 'GitHub',
        file: 'soundcraft-0.14.0-windows-x64.msi',
        size: '13.7 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/soundcraft/releases/download/v0.14.0/soundcraft-0.14.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'soundcraft-0.14.0-windows-x64-portable.zip',
        size: '17.7 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/soundcraft',
    glyph: 'tiktok',
    date: '2026-10-28',
  },
  {
    slug: 'lightcraft',
    name: 'LightCraft — تحميض ومعالجة صور RAW (بديل لايتروم)',
    nameEn: 'LightCraft — Non-Destructive RAW Photo Studio',
    tagline:
      'معمل تظهير وتعديل ألوان الصور الفوتوغرافية (بديل Adobe Lightroom): تحرير غير متلف لملفات الكاميرا الخام RAW، تدرج لوني سينمائي، تعديل التعريض والتباين، وتنظيم مكتبات الصور.',
    taglineEn:
      'Non-destructive RAW photo developer and clean-room Adobe Lightroom alternative: color grading, tone curve adjustment, exposure balance, and batch photo export.',
    version: '0.15.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/lightcraft/releases/download/v0.15.0/lightcraft-0.15.0-windows-x64.msi',
        host: 'GitHub',
        file: 'lightcraft-0.15.0-windows-x64.msi',
        size: '92.7 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/lightcraft/releases/download/v0.15.0/lightcraft-0.15.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'lightcraft-0.15.0-windows-x64-portable.zip',
        size: '113.4 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/lightcraft',
    glyph: 'sun',
    date: '2026-10-28',
  },
  {
    slug: 'figcraft',
    name: 'FigCraft — تصميم واجهات المستخدم والنماذج الأولية (بديل فيجما)',
    nameEn: 'FigCraft — UI/UX Interface Design & Prototyping',
    tagline:
      'بيئة تصميم تجربة وواجهة المستخدم والنماذج التفاعلية (بديل Figma): مكونات قابلة لإعادة الاستخدام، تخطيط تلقائي Auto-Layout، نماذج أولية تفاعلية، يعمل محلياً بالكامل بلا اتصال وبأعلى درجات الخصوصية.',
    taglineEn:
      'Interface design and interactive prototyping suite (clean-room Figma alternative): auto-layout frames, interactive component variants, and 100% offline local privacy.',
    version: '0.12.1',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/figcraft/releases/download/v0.12.1/figcraft-0.12.1-windows-x64.msi',
        host: 'GitHub',
        file: 'figcraft-0.12.1-windows-x64.msi',
        size: '71.5 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/figcraft/releases/download/v0.12.1/figcraft-0.12.1-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'figcraft-0.12.1-windows-x64-portable.zip',
        size: '89.4 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/figcraft',
    glyph: 'layers',
    date: '2026-10-28',
  },
  {
    slug: 'pdfcraft',
    name: 'PdfCraft — قارئ ومحرّر مستندات PDF الاحترافي (بديل أكروبات)',
    nameEn: 'PdfCraft — PDF Reader, Editor & Studio',
    tagline:
      'أداة متكاملة لقراءة وتحرير وإدارة ملفات PDF (بديل Adobe Acrobat Pro): دمج الصفحات وتقسيمها، التوقيع الرقمي، التعليقات التوضيحية، وتحويل المستندات بسرعة فائقة وأمان تام.',
    taglineEn:
      'Comprehensive PDF editor and clean-room Adobe Acrobat alternative in Rust: merge, split, annotate, digital signatures, OCR readiness, and instant export with full privacy.',
    version: '0.15.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/pdfcraft/releases/download/v0.15.0/pdfcraft-0.15.0-windows-x64.msi',
        host: 'GitHub',
        file: 'pdfcraft-0.15.0-windows-x64.msi',
        size: '87.1 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/pdfcraft/releases/download/v0.15.0/pdfcraft-0.15.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'pdfcraft-0.15.0-windows-x64-portable.zip',
        size: '106.3 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/pdfcraft',
    glyph: 'doc',
    date: '2026-10-28',
  },
  {
    slug: 'cadcraft',
    name: 'CadCraft — التصميم الهندسي والمعماري CAD (بديل أوتوكاد)',
    nameEn: 'CadCraft — 2D/3D CAD & Drafting Studio',
    tagline:
      'برنامج التصميم بمساعدة الحاسوب والنمذجة الهندسية والمعمارية (بديل AutoCAD): قياسات دقيقة بالميليمتر، طبقات رسم معمارية، دعم ملفات DWG و DXF، وأداء عالي بلغة Rust.',
    taglineEn:
      'Computer-aided drafting & design in pure Rust (clean-room AutoCAD alternative): precision 2D drawing, architectural snapping, DWG/DXF support, and zero subscription fee.',
    version: '0.14.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/cadcraft/releases/download/v0.14.0/cadcraft-0.14.0-windows-x64.msi',
        host: 'GitHub',
        file: 'cadcraft-0.14.0-windows-x64.msi',
        size: '54.1 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/cadcraft/releases/download/v0.14.0/cadcraft-0.14.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'cadcraft-0.14.0-windows-x64-portable.zip',
        size: '67.7 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/cadcraft',
    glyph: 'grid',
    date: '2026-10-28',
  },
  {
    slug: 'craft-launcher',
    name: 'Craft Launcher — المشغّل الموحّد لحزمة البرامج',
    nameEn: 'Craft Launcher — Unified Suite Manager',
    tagline:
      'المشغل والمثبّت الموحد لكافة تطبيقات وحزم Craft الإبداعية والمكتبية: تثبيت بضغطة زر، تحديث تلقائي آمن، تشغيل مباشر، وإدارة مركزية لجميع الأدوات على جهازك.',
    taglineEn:
      'Unified application manager and installer for the entire Craft suite: one-click installation, centralized updates, launch control, and offline tool management.',
    version: '0.9.0',
    platform: 'Windows x64',
    kind: 'premium',
    downloads: [
      {
        href: 'https://github.com/storytold/craft-launcher/releases/download/v0.9.0/artcraft-launcher-0.9.0-windows-x64.msi',
        host: 'GitHub',
        file: 'artcraft-launcher-0.9.0-windows-x64.msi',
        size: '9.4 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/craft-launcher/releases/download/v0.9.0/artcraft-launcher-0.9.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'artcraft-launcher-0.9.0-windows-x64-portable.zip',
        size: '10.4 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/craft-launcher',
    glyph: 'package',
    date: '2026-10-28',
  },

  /* ------------------------------------------------------------------ *
   * 3. Windows & Desktop Systems (تطبيقات ويندوز والأنظمة المؤسسية)
   * ------------------------------------------------------------------ */
  {
    slug: 'yusr',
    name: 'يُسر — نظام المحاسبة وإدارة الأوقاف والجمعيات الخيرية',
    nameEn: 'Yusr — Fund Accounting & Management Suite for Charities',
    tagline:
      'نظام مالي وإداري سيادي متكامل للمنظمات غير الربحية والجمعيات الخيرية ولجان الزكاة والأوقاف: دفتر أستاذ مشفّر بسلسلة SHA-256 لمنع التلاعب، مستشار ذكي محلي (AI Advisor)، دعم فوترة ZATCA المرحلة الثانية، نسخ احتياطي تلقائي، وتوافق شبكي LAN مع عمل مستقل 100% بدون إنترنت.',
    taglineEn:
      'Sovereign fund accounting & back-office suite for charities, Awqaf, and Zakat committees: tamper-evident SHA-256 ledger, local AI advisor, ZATCA Phase 2 e-invoicing, multi-target backup, and 100% offline-first architecture.',
    version: '0.2.1',
    platform: 'Windows x64 / Linux',
    kind: 'windows',
    downloads: [
      {
        href: 'https://github.com/zeiad6/yusr/releases/download/v0.2.1/Yusr-Lite_0.2.1_x64_en-US.msi',
        host: 'GitHub',
        file: 'Yusr-Lite_0.2.1_x64_en-US.msi',
        size: '255.8 MB',
        note: 'مثبّت ويندوز Lite (موصى به)',
      },
      {
        href: 'https://github.com/zeiad6/yusr/releases/download/v0.2.1/Yusr_0.2.1_amd64.deb',
        host: 'GitHub',
        file: 'Yusr_0.2.1_amd64.deb',
        size: '7.2 MB',
        note: 'حزمة دبيان / أوبونتو (.deb)',
      },
    ],
    post: 'yusr',
    docs: 'https://github.com/zeiad6/yusr',
    glyph: 'shield',
    date: '2026-10-29',
  },
  {
    slug: 'edms-archive-pro',
    name: 'أرشيف برو EDMS',
    nameEn: 'Archive Pro EDMS',
    tagline: 'نظام إدارة وثائق إلكترونية: بحث نصي كامل، إصدارات غير قابلة للاستبدال، سير عمل، وتوقيع رقمي.',
    taglineEn: 'Electronic document management: full-text search, immutable versions, workflows, and digital signatures.',
    version: '1.0.6',
    platform: 'Windows x64',
    kind: 'windows',
    downloads: [
      {
        href: 'https://github.com/zeiad6/Edms-archive/releases/download/v1.0.6/EDMS-Archive-1.0.6-Setup-x64.exe',
        host: 'GitHub',
        file: 'EDMS-Archive-1.0.6-Setup-x64.exe',
        size: '238.6 MB',
      },
      {
        href: 'https://www.mediafire.com/file/cezytgi4hqxmorc/EDMS-Archive-1.0.6-Setup-x64.exe/file',
        host: 'MediaFire',
        file: 'EDMS-Archive-1.0.6-Setup-x64.exe',
        size: '238.6 MB',
      },
      {
        href: 'https://drive.google.com/file/d/1AkBwaNUwlovtOPS4SyCvkz0LSU7hvDbn/view?usp=drivesdk',
        host: 'Google Drive',
        file: 'EDMS-Archive-1.0.6-Setup-x64.exe',
        size: '238.6 MB',
        note: 'نسخة احتياطية',
      },
    ],
    post: 'archive-1-0-6',
    glyph: 'archive',
    date: '2026-10-04',
  },

  /* ------------------------------------------------------------------ *
   * 4. Android Mobile Apps (تطبيقات أندرويد)
   * ------------------------------------------------------------------ */
  {
    slug: 'zeidex-convert-android',
    name: 'محوّل الملفات Zeidex Convert — أندرويد',
    nameEn: 'Zeidex Convert — Android File Converter',
    tagline:
      'تطبيق أندرويد محلي 100% لتحويل واستخراج الملفات: استخراج فيديو الصور الحية (Pixel و Samsung و Apple Live Photo)، تحسين جودة الفيديو والصور، ضغط الوسائط، دمج PDF، وتوليد QR — كل شيء على جهازك دون اتصال.',
    taglineEn:
      '100% offline Android file converter & enhancer: extract Motion Photos and Apple Live Photos to MP4, boost video/image quality, compress media, merge PDFs, and generate QR codes — all executed locally.',
    version: '1.2.0',
    platform: 'Android 8.0+',
    kind: 'android',
    downloads: [
      {
        href: 'https://www.mediafire.com/file/vikc6vaxcd64vyd/zeidex-convert-v1.2.0.apk/file',
        host: 'MediaFire',
        file: 'zeidex-convert-v1.2.0.apk',
        size: '10.8 MB',
        note: 'تحميل مباشر (MediaFire)',
      },
    ],
    post: 'zeidex-convert-android',
    glyph: 'spark',
    date: '2026-10-22',
  },
  {
    slug: 'edms-archive-android',
    name: 'أرشيف برو EDMS — أندرويد',
    nameEn: 'Archive Pro EDMS — Android',
    tagline:
      'عميل أندرويد أصلي لنظام الأرشفة نفسه: يعمل كاملاً على الجهاز بقاعدة بيانات وملفات محلية، أو يتصل بالنسخة المكتبية عبر بوابة HTTPS بشهادة مثبّتة. نقل القاعدة وكلمات المرور والملفات في الاتجاهين بلا تحويل.',
    taglineEn:
      'The native Android client for the same system: run it fully on-device with a local database and file store, or pair with the desktop build over a certificate-pinned HTTPS gateway. Database, passwords and files move both ways with no conversion.',
    version: '1.0.1',
    platform: 'Android 8.0+',
    kind: 'android',
    downloads: [
      {
        href: 'https://www.mediafire.com/file/inn8lf6tznv95nx/app-debug.apk/file',
        host: 'MediaFire',
        file: 'app-debug.apk',
        size: '16.6 MB',
      },
      {
        href: 'https://drive.google.com/uc?export=download&id=1FxWSMfMpix-uE33fNSd3layuidLGIbQu',
        host: 'Google Drive',
        file: 'app-debug.apk',
        size: '16.6 MB',
        note: 'نسخة احتياطية',
      },
    ],
    post: 'edms-archive-android',
    docs: 'https://github.com/zeiad6/Edms-archive-Android',
    glyph: 'package',
    date: '2026-09-30',
  },
  {
    slug: 'verityscope',
    name: 'VerityScope — كاشف التزييف العميق',
    nameEn: 'VerityScope — AI Deepfake Detector',
    tagline:
      'تطبيق أندرويد يكشف التزييف العميق في الصور والفيديو والنصوص بـ 5 نماذج ذكاء اصطناعي محلية + فحص بيانات المصدر (C2PA, EXIF) — كل شيء على الجهاز، بياناتك لا تغادر. حزمة واحدة شاملة تعمل على كل الأجهزة (arm64-v8a, armeabi-v7a, x86, x86_64).',
    taglineEn:
      'Android app that detects deepfakes in images, video and text using 5 on-device AI models + source-metadata forensics (C2PA, EXIF) — everything runs locally, your data never leaves. One universal APK for every device (arm64-v8a, armeabi-v7a, x86, x86_64).',
    version: '0.4.0',
    platform: 'Android 8.0+',
    kind: 'android',
    downloads: [
      {
        href: 'https://www.mediafire.com/file/38z57gqtgndpioy/VerityScope-v0.4.0-universal.apk/file',
        host: 'MediaFire',
        file: 'VerityScope-v0.4.0-universal.apk',
        size: '240.1 MB',
      },
    ],
    post: 'ai-fake-detector-android',
    glyph: 'shield',
    date: '2026-10-02',
  },
]

export function getProgram(slug: string) {
  return programs.find((p) => p.slug === slug)
}

export function programForPost(postSlug: string) {
  return programs.find((p) => p.post === postSlug)
}

/** The mirror a card leads with. Every program is guaranteed one. */
export function primaryDownload(p: Program): ProgramDownload {
  return p.downloads[0]
}
