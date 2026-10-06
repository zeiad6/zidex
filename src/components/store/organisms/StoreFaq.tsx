import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { site } from '@/lib/site'

/** Organism: the questions buyers ask before paying, as native disclosure widgets. */
export function StoreFaq() {
  const { t } = useI18n()
  const items: [string, string][] = [
    [
      t('كيف أدفع؟', 'How do I pay?'),
      t(
        'داخل تيليجرام بنجوم تيليجرام (تشحنها بالبطاقة أو Apple/Google Pay أو TON عبر Fragment). وعلى هذا الموقع أيضاً بحوالة إلى حساباتنا في بنك الكريمي بالدولار أو الريال اليمني أو السعودي.',
        'Inside Telegram with Stars (top up by card, Apple/Google Pay, or TON via Fragment). On this site you can also transfer to our Kuraimi Bank accounts in USD, YER or SAR.',
      ),
    ],
    [
      t('هل أستطيع تجربة البوت قبل الشراء؟', 'Can I try the bot first?'),
      t('نعم. كل نوع بوت له تجربة مجانية داخل تيليجرام: اضغط «جرّبه مجاناً» أو أرسل /demo للبوت.', 'Yes. Every bot type has a free demo inside Telegram: tap “Try it free” or send /demo to the bot.'),
    ],
    [
      t('متى أستلم البوت؟', 'When do I get it?'),
      t('الأساسي خلال 3 أيام، والاحترافي خلال 7 أيام، ويبدأ العدّ بعد استلام تفاصيل مشروعك.', 'Basic in 3 days, Pro in 7, counted from when we receive your project details.'),
    ],
    [
      t('من يستضيف البوت؟', 'Who hosts the bot?'),
      t('يمكنك استضافته بنفسك، أو تشترك في «استضافة وصيانة بوتك» الشهرية ونتولى التشغيل والتحديثات.', 'Host it yourself, or take the monthly “hosting & upkeep” plan and we run and update it.'),
    ],
    [
      t('هل يمكن الاسترداد؟', 'Can I get a refund?'),
      t('مدفوعات النجوم قابلة للاسترداد قبل بدء التنفيذ. تواصل عبر /support أو واتساب واذكر رقم العملية.', 'Stars payments can be refunded before work starts. Contact /support or WhatsApp with your transaction ID.'),
    ],
  ]
  return (
    <div className="grid gap-2.5">
      {items.map(([q, a]) => (
        <details key={q} className="group border-app bg-elevated shadow-app open:shadow-app-md rounded-2xl border transition-shadow">
          <summary className="text-app flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold [&::-webkit-details-marker]:hidden">
            {q}
            <ChevronDown className="text-subtle size-4 shrink-0 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="text-muted px-4 pb-4 text-[14px] leading-relaxed">{a}</p>
        </details>
      ))}
      <p className="text-subtle mt-2 text-[13px]">
        {t('سؤالك غير موجود؟', 'Question not here?')}{' '}
        <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="font-bold text-[#1a8f48] hover:underline hover:underline-offset-4 dark:text-[#3ddc84]">
          {t('اسألنا على واتساب', 'Ask us on WhatsApp')}
        </a>
      </p>
    </div>
  )
}
