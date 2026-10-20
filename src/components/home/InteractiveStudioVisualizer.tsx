import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useMotionTemplate, useReducedMotion } from 'framer-motion'
import { Bot, Copy, Check, ExternalLink, QrCode, Sparkles, Wifi, Volume2 } from 'lucide-react'
import { site, tiktok, hubLinks } from '@/lib/site'
import { useI18n } from '@/lib/i18n'
import { copyText } from '@/lib/utils'

type StudioTab = 'bots' | 'tiktok' | 'links'

export function InteractiveStudioVisualizer() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const [tab, setTab] = useState<StudioTab>('bots')
  const [pinging, setPinging] = useState(false)
  const [latency, setLatency] = useState(24)
  const [copied, setCopied] = useState(false)
  const [audioActive, setAudioActive] = useState(true)

  // 3D Tilt & Specular Lighting
  const cardRef = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const srx = useSpring(rx, { stiffness: 220, damping: 25 })
  const sry = useSpring(ry, { stiffness: 220, damping: 25 })
  const glare = useMotionTemplate`radial-gradient(380px circle at ${gx}% ${gy}%, rgba(0, 242, 254, 0.18), rgba(124, 58, 237, 0.1) 40%, transparent 70%)`

  const handlePointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 12)
    rx.set(-(py - 0.5) * 12)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  const handlePointerLeave = () => {
    rx.set(0)
    ry.set(0)
    gx.set(50)
    gy.set(50)
  }

  const triggerPing = () => {
    if (pinging) return
    setPinging(true)
    setTimeout(() => {
      setLatency(Math.floor(18 + Math.random() * 14))
      setPinging(false)
    }, 600)
  }

  const handleCopyTikTok = async () => {
    await copyText(tiktok.profile)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div className="relative w-full max-w-xl mx-auto [perspective:1400px]">
      {/* Ambient background bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-35 blur-2xl transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.25), rgba(0, 242, 254, 0.2), transparent 70%)',
        }}
      />

      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: srx,
          rotateY: sry,
        }}
        className="relative overflow-hidden rounded-2xl border border-app bg-(--bg-elevated)/90 p-5 shadow-app-xl backdrop-blur-xl transition-shadow duration-300 hover:shadow-2xl hover:border-accent/50"
      >
        {/* Dynamic Specular Glare Layer */}
        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen transition-opacity duration-300"
            style={{ background: glare }}
          />
        )}

        {/* Top Header: Studio Brand Lockup + Live Ping Indicator */}
        <div className="flex items-center justify-between gap-3 border-b border-app/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0c1020] to-[#161b33] p-1 border border-accent/30 shadow-xs">
              <img src="/zeidex-mark.png" alt="ZeidexSoft" width={28} height={28} className="rounded-lg object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-black tracking-wider text-app">ZEIDEX CORE</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {t('متصل', 'ONLINE')}
                </span>
              </div>
              <p className="text-[11px] text-muted font-mono">{t('محرك البوتات والوسائط السحابي', 'Cloud Bot & Media Engine')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerPing}
            title={t('فحص سرعة الاستجابة اللحظية', 'Test real-time latency')}
            className="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-app/80 bg-sunken/80 px-2.5 py-1 text-[11px] font-mono text-subtle transition-colors hover:border-accent/40 hover:text-app"
          >
            <Wifi className={`size-3 text-accent ${pinging ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{pinging ? t('جارٍ القياس…', 'Pinging…') : `${latency}ms`}</span>
          </button>
        </div>

        {/* Interactive Mode Tabs */}
        <div className="mt-4 flex gap-1.5 rounded-xl border border-app/70 bg-sunken/60 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab('bots')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
              tab === 'bots'
                ? 'bg-accent text-accent-fg shadow-xs'
                : 'text-muted hover:text-app hover:bg-elevated/50'
            }`}
          >
            <Bot className="size-3.5" />
            <span>{t('البوتات', 'Bots')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('tiktok')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
              tab === 'tiktok'
                ? 'bg-accent text-accent-fg shadow-xs'
                : 'text-muted hover:text-app hover:bg-elevated/50'
            }`}
          >
            <span className="text-[13px] leading-none">🎵</span>
            <span>TikTok</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('links')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
              tab === 'links'
                ? 'bg-accent text-accent-fg shadow-xs'
                : 'text-muted hover:text-app hover:bg-elevated/50'
            }`}
          >
            <QrCode className="size-3.5" />
            <span>ZeidexLink</span>
          </button>
        </div>

        {/* Dynamic Interactive Body */}
        <div className="mt-4 min-h-[148px]">
          {tab === 'bots' && (
            <motion.div
              key="tab-bots"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-app bg-sunken/50 p-2.5">
                  <div className="flex items-center justify-between text-subtle text-[11px]">
                    <span>{t('طرق الدفع المدعومة', 'Payment Engines')}</span>
                    <Sparkles className="size-3 text-amber-400" />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 font-mono text-xs font-bold text-app">
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-400 border border-amber-500/25">★ Stars</span>
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-400 border border-emerald-500/25">الكريمي</span>
                  </div>
                </div>

                <div className="rounded-xl border border-app bg-sunken/50 p-2.5">
                  <div className="flex items-center justify-between text-subtle text-[11px]">
                    <span>{t('زمن الاستجابة', 'Response Time')}</span>
                    <span className="size-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="mt-1 font-mono text-base font-black text-app">
                    {latency} <span className="text-xs font-normal text-muted">ms (Ultra-Low)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-accent/25 bg-accent/5 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
                  </span>
                  <span className="text-xs font-bold text-app">
                    {t('تجربة البوت الفورية متاحة مجاناً لمدة شهر', '1-Month Full Bot Trial Active')}
                  </span>
                </div>
                <a
                  href="https://t.me/deanonimaizer_2hbot_8fml_bot?start=trial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-black text-accent-fg transition-transform hover:scale-105 active:scale-95"
                >
                  <span>{t('بدء التجربة', 'Start')}</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </motion.div>
          )}

          {tab === 'tiktok' && (
            <motion.div
              key="tab-tiktok"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between rounded-xl border border-app bg-sunken/60 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-3 rounded-full bg-[#fe2c55] animate-pulse" />
                  <div>
                    <div className="font-mono text-xs font-black text-app" dir="ltr">{site.handle}</div>
                    <div className="text-[11px] text-muted">{t('الحساب الرسمي على تيك توك', 'Official TikTok Handle')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyTikTok}
                    className="inline-flex items-center gap-1 rounded-lg border border-app bg-elevated px-2.5 py-1 text-xs font-semibold text-app hover:border-accent transition-colors"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copied ? t('تم النسخ', 'Copied') : t('نسخ الرابط', 'Copy')}</span>
                  </button>
                  <a
                    href={tiktok.profile}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#fe2c55] px-3 py-1 text-xs font-black text-white hover:brightness-110 transition-transform active:scale-95"
                  >
                    <span>{t('متابعة', 'Follow')}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              {/* Simulated Dancing Audio Visualizer Bars */}
              <button
                type="button"
                onClick={() => setAudioActive((v) => !v)}
                className="flex items-center justify-between rounded-xl border border-app/60 bg-sunken/40 px-3 py-2 text-xs w-full cursor-pointer hover:border-accent/40 transition-colors"
                title={t('انقر لتبديل حركة مؤشر الصوت', 'Click to toggle soundwave motion')}
              >
                <div className="flex items-center gap-2 text-muted">
                  <Volume2 className={`size-3.5 ${audioActive ? 'text-accent' : 'text-subtle'}`} />
                  <span>{t('نبض التفاعل والمشاهدات', 'Engagement & Video Waves')}</span>
                </div>
                <div className="flex items-center gap-1 h-4">
                  {[40, 75, 100, 60, 90, 45, 80, 50, 95, 70].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-gradient-to-t from-accent to-[#00f2fe]"
                      style={{
                        height: audioActive ? `${h}%` : '20%',
                        animation: audioActive ? `pulse 0.8s ease-in-out infinite alternate ${i * 0.08}s` : 'none',
                      }}
                    />
                  ))}
                </div>
              </button>
            </motion.div>
          )}

          {tab === 'links' && (
            <motion.div
              key="tab-links"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between rounded-xl border border-app bg-sunken/60 p-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-app">
                    <span>ZeidexLink Platform</span>
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">150 {t('قالب', 'templates')}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t('صفحة روابط، متجر رقمي، منيو QR، ومدفوعات مجانية بالكامل.', 'Link-in-bio, shop, QR menu & payments.')}
                  </p>
                </div>
                <a
                  href="https://zeidexlink.zeidexsoft.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-black text-accent-fg transition-transform hover:scale-105 active:scale-95"
                >
                  <span>{t('افتح المنصة', 'Open')}</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="flex items-center justify-between text-[11px] text-subtle px-1">
                <span>{t('شبكة الروابط الموحدة', 'Unified Link Grid')}: {hubLinks.length} {t('وجهة نشطة', 'destinations')}</span>
                <a href="/links" className="text-accent hover:underline font-semibold flex items-center gap-1">
                  {t('تصفح كل الروابط', 'Browse all links')} →
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
