import { Link } from 'react-router-dom'
import { Glyph } from '@/components/ui/Glyphs'
import {
  Accessibility,
  Gauge,
  Lock,
  Moon,
  Palette,
  Ruler,
  Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { site, socials, tiktok } from '@/lib/site'
import { allPosts } from '@/data/posts'
import { AuroraBackdrop } from '@/components/ui/AuroraBackdrop'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/Primitives'
import { Magnetic } from '@/components/ui/Interactive'
import { useI18n } from '@/lib/i18n'
import { usePageMeta } from '@/hooks/usePageMeta'

const principles = [
  {
    icon: Palette,
    title: 'لونان فقط',
    titleEn: 'Two colours only',
    body: 'لون أساسي وأخر للتباين، لا ثالث. الألوان مرتبطة بدلالات (accent, fg, line) فتتبدّل مع الوضع دون أن تتكرر في الكود.',
    bodyEn: 'One primary colour and one for contrast, never a third. Colours are bound to meanings (accent, fg, line), so they swap with the theme without being repeated in code.',
  },
  {
    icon: Ruler,
    title: 'مسافات على مقياس',
    titleEn: 'Spacing on a scale',
    body: 'كل المسافات مضاعفات لـ ٤ بكسل، وكل أنصاف الأقطار مأخوذة من متغيّر واحد — فيبدو التصميم متماسكاً دون جهد.',
    bodyEn: 'Every gap is a multiple of 4px and every radius comes from one variable — so the design holds together without effort.',
  },
  {
    icon: Type,
    title: 'خط واحد بوزنين',
    titleEn: 'One typeface, two weights',
    body: 'Alexandria للعناوين مع دعم كامل للتشكيل، و IBM Plex Sans Arabic للنص. لا خطوط احتياطية سيئة.',
    bodyEn: 'Alexandria for headings, with full Arabic diacritics support, and IBM Plex Sans Arabic for text. No ugly fallback fonts.',
  },
  {
    icon: Moon,
    title: 'ليلي بلا وميض',
    titleEn: 'Dark mode without a flash',
    body: 'سكربت متزامن في head يطبّق الوضع قبل أول تلوين، فلا تومض بيضاء عند التحميل مهما كان بطء الشبكة.',
    bodyEn: 'A synchronous script in the head applies the theme before first paint, so there is no white flash on load however slow the network.',
  },
  {
    icon: Accessibility,
    title: 'يمكن استخدامه بالكيبورد',
    titleEn: 'Keyboard friendly',
    body: 'حلقة تركيز واضحة، ترتيب منطقي للتبويب، ونصوص بديلة لكل عنصر رسومي.',
    bodyEn: 'A clear focus ring, a logical tab order, and alt text for every graphic.',
  },
  {
    icon: Gauge,
    title: 'خفيف على الجوال',
    titleEn: 'Light on mobile',
    body: 'لا خطوط ثقيلة بلا فائدة، ولا صور بلا أبعاد (CLS = 0)، ومشغّل تيك توك لا يُحمَّل حتى الوصول إليه.',
    bodyEn: 'No heavy fonts for nothing, no images without dimensions (CLS = 0), and nothing from TikTok loads until you ask for it.',
  },
]

const stack = [
  { k: 'الإطار', kEn: 'Framework', v: 'React 19 + TypeScript' },
  { k: 'التنسيق', kEn: 'Styling', v: 'Tailwind CSS v4' },
  { k: 'الحركة', kEn: 'Motion', v: 'Framer Motion' },
  { k: 'التوجيه', kEn: 'Routing', v: 'React Router 7' },
  { k: 'الخلفية', kEn: 'Backdrop', v: 'Canvas + pure CSS' },
  { k: 'الاستضافة', kEn: 'Hosting', v: 'Netlify' },
]

export default function About() {
  const { t } = useI18n()

  usePageMeta(
    `${t('عن المنصة', 'About')} — ${site.name}`,
    t('عن تصميم وتقنية ZeidexSoft، وسياسة الخصوصية.', 'About ZeidexSoft’s design, tech stack, and privacy policy.'),
    '/about',
  )

  return (
    <>
      <section className="relative overflow-hidden pt-24 pb-10 sm:pt-28 sm:pb-12">
        <AuroraBackdrop intensity="md" className="opacity-70" />
        <div className="container-app relative">
          <Reveal>
            <span className="chip bg-accent-soft text-accent mb-5 w-fit">
              <Glyph name="spark" size={13} aria-hidden="true" />
              {t('عن المنصة', 'About')}
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {t(
                <>
                  بوابة واحدة، <span className="gradient-text">مبنيّة بعناية</span>
                </>,
                <>
                  One hub, <span className="gradient-text">built with care</span>
                </>,
              )}
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-muted mt-6 max-w-2xl text-lg leading-relaxed">
              {t(
                `هذا الموقع هو الوجهة الرسمية لحساب ${site.handle} على تيك توك. يجمع ثلاثة أشياء كان يجب أن تكون في ثلاثة أماكن: الفيديوهات، والروابط، والمقالات — في واجهة واحدة سريعة تعمل في الوضعين النهاري والليلي.`,
                `This site is the official home of ${site.handle} on TikTok. It brings together three things that would otherwise live in three places — videos, links, and articles — in one fast interface that works in both light and dark mode.`,
              )}
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <a
                  href={tiktok.profile}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn tiktok-gradient h-12 cursor-pointer px-7 text-white shadow-md"
                >
                  {t('الحساب على تيك توك', 'The account on TikTok')}
                </a>
              </Magnetic>
              <Link to="/blog" className="btn btn-ghost h-12 cursor-pointer px-7">
                {t('اقرأ المدونة', 'Read the blog')} ({allPosts.length})
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Principles */}
      <section className="container-app py-12 sm:py-14">
        <Reveal>
          <SectionHeading
            eyebrow={t('قرارات التصميم', 'Design decisions')}
            title={t('ستة مبادئ لا تُخالَف', 'Six rules, never broken')}
            description={t(
              'القواعد التي اتُّبعت طوال البناء. كل منها قابلة للتحقق بالنظر إلى الكود.',
              'The rules followed throughout the build. Each one can be checked by reading the code.',
            )}
          />
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map(({ icon: Icon, title, titleEn, body, bodyEn }, i) => (
            <Reveal key={title} delay={Math.min(i * 0.05, 0.3)} className="h-full">
              <div className="bg-elevated/70 hover:border-strong group flex h-full flex-col gap-3 rounded-3xl border border-app p-6 transition-colors">
                <span className="bg-accent-soft text-accent grid size-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-app font-bold">{t(title, titleEn)}</h3>
                <p className="text-muted text-sm leading-relaxed">{t(body, bodyEn)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="container-app py-6 sm:py-8">
        <Reveal>
          <div className="bg-elevated/70 overflow-hidden rounded-4xl border border-app">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3">
              {stack.map((s, i) => (
                <div
                  key={s.k}
                  className={cn(
                    'hover:bg-sunken/50 relative flex min-w-0 items-center justify-between gap-4 px-5 py-4 transition-colors',
                    // hairline divider that stops at the cell edge
                    'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[var(--line)]',
                    i % 2 === 0 ? 'before:hidden sm:before:block' : '',
                    i % 3 === 0 && 'before:hidden lg:before:block',
                    i % 3 === 2 && 'lg:before:hidden',
                    i >= 3 && 'before:hidden',
                  )}
                >
                  <span className="text-subtle text-xs">{t(s.k, s.kEn)}</span>
                  <span className="text-app truncate text-sm font-semibold" dir="ltr">
                    {s.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Privacy */}
      <section id="privacy" className="container-app scroll-mt-24 py-12 sm:py-14">
        <Reveal>
          <div className="border-app overflow-hidden rounded-4xl border">
            <div className="border-app flex items-center gap-3 border-b px-7 py-5">
              <span className="bg-accent-soft text-accent grid size-10 place-items-center rounded-2xl">
                <Lock className="size-4.5" aria-hidden="true" />
              </span>
              <h2 className="text-app text-lg font-bold">{t('الخصوصية', 'Privacy')}</h2>
            </div>
            <div className="prose-ghost px-7 py-6!">
              {t(
                <ul>
                  <li>لا يوجد خادم خلفي ولا حساب ولا تسجيل دخول. لا نخزّن أي بيانات عنك.</li>
                  <li>
                    الخياران الوحيدان المحفوظان في متصفحك هما المظهر (نهاري أو ليلي) واللغة،
                    ويُحفظان محلياً في <code>localStorage</code> ولا يُرسلان لأي جهة.
                  </li>
                  <li>
                    وعند الضغط على «متابعة» ينقلك تيك توك إلى موقعهم، ومن هناك يخضع كل سلوك لسياسة الخصوصية الخاصة بمنصة تيك توك.
                  </li>
                  <li>
                    لا يوجد مشغّل فيديو مدمج في هذه النسخة. أي فيديو يوصلك إليه زر
                    «تابع» أو «افتح الحساب» يُفتح في تيك توك مباشرة، فتطبّق سياستهم على
                    الجلسة بأكملها.
                  </li>
                  <li>لا توجد أدوات تتبّع إعلانية ولا بكسلات قياس على هذه النسخة.</li>
                </ul>,
                <ul>
                  <li>There is no backend, no account, and no sign-in. Nothing about you is stored.</li>
                  <li>
                    The only two choices saved in your browser are the theme (light or dark) and the
                    language. Both live locally in <code>localStorage</code> and are never sent anywhere.
                  </li>
                  <li>
                    Tapping “Follow” takes you to TikTok’s own site, where everything is governed by
                    TikTok’s privacy policy.
                  </li>
                  <li>
                    There is no embedded video player in this version. Any video a “Follow” or “Open
                    account” button leads to opens on TikTok directly, so their policy applies to the
                    whole session.
                  </li>
                  <li>There are no ad trackers and no measurement pixels on this version.</li>
                </ul>,
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Socials */}
      <section className="container-app pb-8">
        <Reveal>
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="text-subtle text-sm">{t('أين تجدني أيضاً', 'Where else to find me')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="chip text-muted hover:text-app hover:border-strong px-4 py-2 text-sm transition-colors"
                >
                  <span aria-hidden="true">{s.emoji}</span>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
