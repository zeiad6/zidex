import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Compass, Home as HomeIcon, Music2 } from 'lucide-react'
import { site, tiktok } from '@/lib/site'
import { allPosts } from '@/data/posts'
import { useI18n } from '@/lib/i18n'
import { AuroraBackdrop } from '@/components/ui/AuroraBackdrop'
import { Reveal } from '@/components/ui/Reveal'

export default function NotFound() {
  const { t } = useI18n()
  const paths = [
    { to: '/', label: t('الرئيسية', 'Home'), icon: HomeIcon, desc: t('العودة إلى نقطة البداية', 'Back to the start') },
    { to: '/links', label: t('الروابط', 'Links'), icon: Compass, desc: t('كل الوجهات في مكان واحد', 'Every destination in one place') },
    {
      to: '/blog',
      label: t('المدونة', 'Blog'),
      icon: BookOpen,
      desc: t(`${allPosts.length} مقالات بانتظارك`, `${allPosts.length} articles waiting for you`),
    },
  ]

  return (
    <section className="relative flex min-h-[72svh] items-center overflow-hidden pt-24 pb-16 sm:pt-28">
      <AuroraBackdrop intensity="lg" className="opacity-50" />

      <div className="container-app relative">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Reveal>
            <p
              aria-hidden="true"
              className="gradient-text text-6xl leading-none font-extrabold tracking-tighter sm:text-8xl"
            >
              404
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t('هذه الصفحة غير موجودة', 'This page does not exist')}
            </h1>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="text-muted mt-4 max-w-md text-base leading-relaxed">
              {t(
                `الرابط الذي وصلت منه لم يعد موجوداً. جرّب أحد المسارات أدناه، أو ارجع إلى حساب ${site.handle}.`,
                `The link you followed no longer exists. Try one of the paths below, or head back to ${site.handle}.`,
              )}
            </p>
          </Reveal>

          <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-3">
            {paths.map(({ to, label, icon: Icon, desc }, i) => (
              <Reveal key={to} delay={0.18 + i * 0.06}>
                <Link
                  to={to}
                  className="bg-elevated/80 hover:border-strong hover:text-accent group flex h-full min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-app p-4 text-center transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="bg-accent-soft text-accent grid size-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-app text-sm font-semibold">{label}</span>
                  <span className="text-subtle text-[11px] leading-tight">{desc}</span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <a
              href={tiktok.profile}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn btn-ghost mt-6 h-11 cursor-pointer px-6"
            >
              <Music2 className="size-4" aria-hidden="true" />
              {t('حساب تيك توك', 'TikTok account')}
              <ArrowLeft className="size-4" aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
