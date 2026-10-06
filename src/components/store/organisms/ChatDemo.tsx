import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Check, CheckCheck, RotateCcw, Star } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { STORE_LOGO, formatStars } from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * The purchase, replayed as the bot's real conversation: /shop, the invoice,
 * the receipt and the first intake question. Copy is the bot's own (bot/shop.py),
 * so the page shows what a buyer will actually see, not a marketing paraphrase.
 *
 * This is the page's one authored motion moment. It starts when scrolled into
 * view, runs once, and offers a replay; reduced motion shows the whole thread.
 */
type Line = { from: 'me' | 'bot'; body: ReactNode; pause: number }

export function ChatDemo({ stars, title }: { stars: number; title: string }) {
  const { t } = useI18n()
  const reduce = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState(false)
  const [run, setRun] = useState(0)
  const [paid, setPaid] = useState(false)

  const lines: Line[] = [
    { from: 'me', body: '/shop', pause: 500 },
    {
      from: 'bot',
      pause: 900,
      body: (
        <>
          <b>{t('🛒 المتجر — الدفع بالنجوم', '🛒 Store — paid in Stars')}</b>
          <span className="mt-1 block opacity-80">
            {t('النجوم عملة تيليجرام الرسمية: تدفع من رصيدك داخل التطبيق.', "Stars are Telegram's own currency: you pay from your in-app balance.")}
          </span>
        </>
      ),
    },
    {
      from: 'bot',
      pause: 1100,
      body: (
        <span className="block">
          <span className="block font-bold">{title}</span>
          <span className="mt-1 flex items-center gap-1 text-[13px] opacity-80">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {formatStars(stars)}
          </span>
          <span
            className={cn(
              'mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-white transition-colors duration-500',
              paid ? 'bg-emerald-600' : 'bg-ghost-500',
            )}
          >
            {paid ? <Check className="size-4" aria-hidden="true" /> : <Star className="size-3.5 fill-current" aria-hidden="true" />}
            {paid ? t('مدفوع', 'Paid') : t(`ادفع ${formatStars(stars)}`, `Pay ${formatStars(stars)}`)}
          </span>
        </span>
      ),
    },
    {
      from: 'bot',
      pause: 1500,
      body: (
        <>
          <b>{t('✅ تم الدفع بنجاح', '✅ Payment received')}</b>
          <span className="mt-1 block opacity-80">
            {t('لنبدأ التنفيذ — ثلاثة أسئلة قصيرة وتصل إجاباتك إلى المشرف مباشرة.', "Let's get started — three short questions, answers go straight to the admin.")}
          </span>
        </>
      ),
    },
    { from: 'bot', pause: 900, body: t('1/3 — ما اسم متجرك؟', '1/3 — What is your store called?') },
    { from: 'me', pause: 1100, body: t('متجر نور الرقمي', 'Noor Digital') },
  ]

  useEffect(() => {
    if (reduce) {
      setShown(lines.length)
      setPaid(true)
      return
    }
    if (!inView) return
    setShown(0)
    setPaid(false)
    let i = 0
    let timer = 0
    const next = () => {
      if (i >= lines.length) return
      const line = lines[i]
      if (line.from === 'bot') setTyping(true)
      timer = window.setTimeout(() => {
        setTyping(false)
        i += 1
        setShown(i)
        // The receipt arrives right after the button turns green.
        if (i === 3) setPaid(true)
        next()
      }, line.pause)
    }
    next()
    return () => window.clearTimeout(timer)
    // lines is rebuilt each render from stable inputs; the run counter restarts it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, run])

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[22rem]">
      <div className="border-app bg-elevated shadow-app-lg overflow-hidden rounded-[2rem] border">
        <div className="border-app flex items-center gap-3 border-b px-4 py-3">
          <img src={STORE_LOGO} alt="" className="size-9 rounded-full" width={36} height={36} />
          <div className="min-w-0 flex-1">
            <p className="text-app truncate text-[14px] font-bold">ZeidexSoft</p>
            <p className="text-subtle text-[11px]">
              {typing ? t('يكتب…', 'typing…') : t('بوت', 'bot')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="text-subtle hover:text-accent grid size-8 cursor-pointer place-items-center rounded-full transition-colors"
            aria-label={t('إعادة العرض', 'Replay')}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-sunken flex min-h-[25rem] flex-col justify-end gap-2 px-3 py-4" aria-live="polite">
          <AnimatePresence initial={false}>
            {lines.slice(0, shown).map((line, i) => (
              <motion.div
                key={`${run}-${i}`}
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-app',
                  line.from === 'me'
                    ? 'bg-ghost-500 self-end rounded-se-md text-white'
                    : 'bg-elevated text-app self-start rounded-ss-md',
                )}
              >
                {line.body}
                {line.from === 'me' && (
                  <CheckCheck className="ms-1 inline size-3.5 align-[-2px] opacity-80" aria-hidden="true" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <div className="bg-elevated text-subtle shadow-app flex w-fit gap-1 self-start rounded-2xl px-3.5 py-3" aria-hidden="true">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="size-1.5 rounded-full bg-current"
                  animate={{ opacity: [0.25, 0.9, 0.25] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-subtle mt-3 text-center text-[11px]">
        {t('محاكاة لمحادثة حقيقية — النصوص من البوت نفسه.', 'A replay of a real conversation — the text is the bot’s own.')}
      </p>
    </div>
  )
}
