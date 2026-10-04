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
        size: 'APK',
      },
      {
        href: 'https://drive.google.com/uc?export=download&id=1FxWSMfMpix-uE33fNSd3layuidLGIbQu',
        host: 'Google Drive',
        file: 'app-debug.apk',
        size: 'APK',
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
        size: '81 MB',
      },
      {
        href: 'https://drive.google.com/file/d/1skhcwx208qWlxhQinNK7lU_XZuCjSC5_/view?usp=drivesdk',
        host: 'Google Drive',
        file: 'VerityScope-v0.4.0-release.apk',
        size: '81 MB',
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
