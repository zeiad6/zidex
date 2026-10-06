import { Bot, Search, ShoppingBag, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { botLink, type Catalog } from '@/lib/store'
import { HoverCard, SweepLink } from '@/components/ui/Motion'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Organism: the bot's command surface, as documentation the buyer can read
 * before opening Telegram.
 *
 * It earns its space because `/search` is the answer to the question a
 * buyer actually has inside the chat — "does this bot have what I need?" —
 * and a bot that can only be browsed by tapping two levels deep loses
 * buyers who never tapped twice. Every command shown here is the literal
 * string the bot accepts, so copying one out of this list works.
 */
export function BotCommands({ catalog }: { catalog: Catalog }) {
  const { t } = useI18n()

  const commands = [
    {
      cmd: '/start',
      Icon: Sparkles,
      label: t('القائمة الرئيسية', 'Main menu'),
      note: t('يعرض المنتجات والأسئلة وطريقة التواصل.', 'Shows the products, the FAQs and how to reach the owner.'),
    },
    {
      cmd: '/search',
      Icon: Search,
      label: t('بحث بالكلمات', 'Search by word'),
      note: t(
        'اكتب كلمة من اسم المنتج فيجده، مع تجاهل الهمزات والتشكيل والأرقام العربية.',
        'Type any word from a product name and it finds it — hamzas, harakat and Arabic-Indic digits are all ignored.',
      ),
    },
    {
      cmd: '/catalog',
      Icon: ShoppingBag,
      label: t('كل المنتجات دفعة واحدة', 'Every product at once'),
      note: t('قائمة كاملة دون تنقّل بين الأزرار.', 'The full list without tapping through menus.'),
    },
    {
      cmd: '/help',
      Icon: Bot,
      label: t('المساعدة', 'Help'),
      note: t('الأوامر المتاحة وكيف تعمل.', 'The available commands and how they work.'),
    },
  ]

  return (
    <Reveal>
      <HoverCard className="bg-elevated shadow-app-md border-app border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-app text-xl font-black">{t('ابحث في البوت بدل التصفّح', 'Search the bot instead of scrolling it')}</h2>
            <p className="text-muted mt-1.5 max-w-[58ch] text-[14px] leading-relaxed">
              {t(
                'أرسل أي كلمة من اسم ما تبحث عنه إلى البوت، أو اكتبها هكذا مباشرة. لا يحتاج البوت إلى فتح القوائم.',
                'Send the bot any word from the name of what you are after — or just type it. No menus to open.',
              )}
            </p>
          </div>
          <a
            href={botLink(catalog)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary press h-10 shrink-0 cursor-pointer px-4 text-[13px] font-bold"
          >
            <Bot className="size-4" aria-hidden="true" />
            {t('افتح البوت', 'Open the bot')}
          </a>
        </div>

        <dl className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {commands.map(({ cmd, Icon, label, note }) => (
            <div key={cmd} className="group/cmd bg-sunken rounded-2xl p-3.5 transition-colors duration-300 hover:bg-(--bg-elevated) hover:shadow-app">
              <dt className="flex items-center gap-2">
                <Icon className="text-accent size-4 shrink-0" aria-hidden="true" />
                <code className="text-app font-mono text-[13px] font-bold" dir="ltr">
                  {cmd}
                </code>
                <span className="link-underline text-subtle ms-auto text-[12px] font-semibold">{label}</span>
              </dt>
              <dd className="text-subtle mt-1.5 text-[12.5px] leading-relaxed">{note}</dd>
            </div>
          ))}
        </dl>

        <p className="text-subtle mt-4 text-[12.5px]">
          {t(
            'مثال: اكتب «قمة» لتظهر كل بوتات القمة، أو «متجر» لتظهر بوتات المتاجر.',
            'For example: type “group” for every group bot, or “store” for every store bot.',
          )}{' '}
          <SweepLink href={botLink(catalog)} target="_blank" rel="noopener noreferrer" className="text-accent font-bold">
            {t('جرّبها الآن', 'Try it now')}
          </SweepLink>
        </p>
      </HoverCard>
    </Reveal>
  )
}