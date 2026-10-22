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
  windows: {
    label: 'تطبيقات ويندوز',
    labelEn: 'Windows apps',
    /** One line under the section title, so the split explains itself. */
    hint: 'برامج سطح مكتب لنظام ويندوز',
    hintEn: 'Desktop programs for Windows',
    glyph: 'grid',
  },
  android: {
    label: 'تطبيقات أندرويد',
    labelEn: 'Android apps',
    hint: 'تطبيقات جوّال تعمل على جهازك مباشرة',
    hintEn: 'Mobile apps that run on your own device',
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
  {
    slug: 'artcraft',
    name: 'ArtCraft — محرّك الإبداع للفنانين',
    nameEn: 'ArtCraft — Creative Engine',
    tagline:
      'بيئة إبداع مفتوحة المصدر للفنانين والمصممين وصنّاع الأفلام: لوحة دقيقة تجمع التصميم والرسم وأدوات الذكاء الاصطناعي في مكان واحد، بتحكم كامل في كل عنصر. تعمل محلياً على جهازك.',
    taglineEn:
      'An open-source creative environment for artists, designers and filmmakers: a precise canvas that unites design, drawing and AI tools in one place, with full control over every element. Runs locally on your machine.',
    version: '0.41.0',
    platform: 'Windows x64',
    kind: 'windows',
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
    slug: 'photocraft',
    name: 'PhotoCraft — محرّر الصور الاحترافي',
    nameEn: 'PhotoCraft — Pro Image Editor',
    tagline:
      'محرّر صور مفتوح المصدر، إعادة بناء نظيفة لـ Adobe Photoshop: طبقات، أقنعة، مرشّحات، أدوات تحديد ذكية، دعم PSD، وتحرير غير متلف — بديل مجاني كامل بلا اشتراك. يعمل محلياً على جهازك.',
    taglineEn:
      'An open-source image editor, a clean-room reimplementation of Adobe Photoshop: layers, masks, filters, smart selection, PSD support and non-destructive editing — a full free alternative with no subscription. Runs locally on your machine.',
    version: '0.7.0',
    platform: 'Windows x64',
    kind: 'windows',
    downloads: [
      {
        href: 'https://github.com/storytold/photocraft/releases/download/v0.7.0/photocraft-0.7.0-windows-x64.msi',
        host: 'GitHub',
        file: 'photocraft-0.7.0-windows-x64.msi',
        size: '61.6 MB',
        note: 'مثبّت (موصى به)',
      },
      {
        href: 'https://github.com/storytold/photocraft/releases/download/v0.7.0/photocraft-0.7.0-windows-x64-portable.zip',
        host: 'GitHub',
        file: 'photocraft-0.7.0-windows-x64-portable.zip',
        size: '73.3 MB',
        note: 'نسخة محمولة (بلا تثبيت)',
      },
    ],
    docs: 'https://github.com/storytold/photocraft',
    glyph: 'layers',
    date: '2026-10-11',
  },
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
      {
        href: 'https://github.com/zeiad6/zeidex-convert-android/releases/download/v1.2.0/zeidex-convert-v1.2.0.apk',
        host: 'GitHub',
        file: 'zeidex-convert-v1.2.0.apk',
        size: '10.8 MB',
        note: 'نسخة رسمية موقعة',
      },
    ],
    post: 'zeidex-convert-android',
    docs: 'https://github.com/zeiad6/zeidex-convert-android',
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
      'تطبيق أندرويد يكشف التزييف العميق في الصور والفيديو والنصوص والصوت بـ 5 نماذج ذكاء اصطناعي محلية + خوارزميات طب شرعي رقمي (ELA, FFT, noise) — كل شيء على الجهاز، بياناتك لا تغادر.',
    taglineEn:
      'Android app that detects deepfakes in images, video, text and audio using 5 on-device AI models + digital forensic algorithms (ELA, FFT, noise) — everything runs locally, your data never leaves.',
    version: '0.4.0',
    platform: 'Android 8.0+',
    kind: 'android',
    downloads: [
      {
        href: 'https://www.mediafire.com/file/0taluz31zdblh8y/VerityScope-v0.4.0-release.apk/file',
        host: 'MediaFire',
        file: 'VerityScope-v0.4.0-release.apk',
        size: '80.4 MB',
      },
      {
        href: 'https://drive.google.com/file/d/1skhcwx208qWlxhQinNK7lU_XZuCjSC5_/view?usp=drivesdk',
        host: 'Google Drive',
        file: 'VerityScope-v0.4.0-release.apk',
        size: '80.4 MB',
        note: 'نسخة احتياطية',
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
