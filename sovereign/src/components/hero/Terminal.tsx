import { useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { gsap, useGSAP, reducedMotion } from '@/lib/motion'
import { terminal } from '@/lib/content'
import { cn } from '@/lib/cn'
import { useLang } from '@/lib/i18n'

/**
 * Terminal — the proof panel.
 *
 * The typewriter writes into a DOM node directly (textContent), never into
 * React state: 60 keystrokes must not be 60 renders. The reveal of each
 * result line is one timeline, so the green ticks land in sequence rather
 * than all at once — the point is that the checks arrive *after* the work.
 *
 * The full command is the initial DOM content, so with JS disabled or
 * motion reduced the panel still reads as a finished terminal.
 */
export function Terminal() {
  const root = useRef<HTMLDivElement>(null)
  const typed = useRef<HTMLSpanElement>(null)
  const [run, setRun] = useState(0)
  const { lang } = useLang()

  useGSAP(
    () => {
      const el = root.current
      if (!el || !typed.current) return

      const lines = gsap.utils.toArray<HTMLElement>('[data-out]', el)
      const command = terminal.command

      if (reducedMotion()) {
        typed.current.textContent = command
        gsap.set(lines, { opacity: 1, y: 0 })
        return
      }

      typed.current.textContent = ''
      gsap.set(lines, { opacity: 0, y: 7 })

      const state = { n: 0 }
      const tl = gsap.timeline({
        delay: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })

      tl.to(state, {
        n: command.length,
        duration: 0.45,
        ease: 'none',
        onUpdate: () => {
          if (typed.current) typed.current.textContent = command.slice(0, Math.round(state.n))
        },
        onComplete: () => {
          if (typed.current) typed.current.textContent = command
        },
      }, 0)

      // Absolute positions: a line's glow must not push the next line's
      // start. With `>` chaining, each 1.1s yoyo added a second of delay
      // and the last result line did not appear until ~7s.
      const start = 0.4
      lines.forEach((line, index) => {
        const at = start + index * 0.12
        tl.to(line, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, at)
        if (line.dataset.check === 'true') {
          tl.fromTo(
            line,
            { textShadow: '0 0 0px rgba(16,185,129,0)' },
            {
              textShadow: '0 0 16px rgba(16,185,129,0.55)',
              duration: 0.45,
              yoyo: true,
              repeat: 1,
              ease: 'sine.inOut',
            },
            at,
          )
        }
      })

      return () => {
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    },
    { scope: root, dependencies: [run], revertOnUpdate: true },
  )

  return (
    <figure
      ref={root}
      aria-label={
        lang === 'ar'
          ? 'معاينة تشغيل محرك Zeidex السحابي: العامل الحافي نشط، وسلسلة SHA-256 متحقق منها'
          : 'Zeidex cloud engine preview: edge worker active, SHA-256 chain verified'
      }
      data-surface="dark"
      className="panel ticks relative overflow-hidden rounded-card bg-[#070A10]"
    >
      {/* window chrome */}
      <div className="relative flex h-11 items-center gap-3 border-b border-hair-soft px-3.5">
        <span className="flex gap-1.5" dir="ltr" aria-hidden="true">
          <span className="size-2 rounded-full bg-[#FF5F57]/80" />
          <span className="size-2 rounded-full bg-[#FEBC2E]/80" />
          <span className="size-2 rounded-full bg-[#28C840]/80" />
        </span>

        <span className="mono-label truncate text-[9.5px] text-muted" dir="ltr">
          {terminal.title}
        </span>
        <span className="hidden rounded border border-hair bg-wash-2 px-1.5 py-0.5 font-mono text-[9px] text-subtle sm:inline">
          {terminal.flag}
        </span>

        <span className="flex-1" />

        <span className="flex items-center gap-1.5" dir="ltr">
          <span className="size-1 rounded-full bg-jade-2 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
          <span className="font-mono text-[9px] tracking-[0.2em] text-jade-2/90">LIVE</span>
        </span>

        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          aria-label={lang === 'ar' ? 'إعادة تشغيل المعاينة' : 'Replay the preview'}
          title={lang === 'ar' ? 'إعادة التشغيل' : 'Replay'}
          className="grid size-7 cursor-pointer place-items-center rounded-md text-subtle transition-colors hover:bg-wash-2 hover:text-ink"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* body */}
      <div className="relative px-4 py-4 font-mono text-[12px] leading-[1.95] sm:px-5 sm:py-5 sm:text-[12.5px]">
        <div className="flex flex-wrap items-baseline gap-x-2" dir="ltr">
          <span className="text-jade-2">zeidex@edge</span>
          <span className="text-subtle">:~$</span>
          <span ref={typed} className="min-w-0 break-all text-ink/90">
            {terminal.command}
          </span>
          <span className="caret" aria-hidden="true" />
        </div>

        <div className="mt-3.5 space-y-1.5" dir="ltr">
          {terminal.output.map((line) => (
            <p
              key={line.text}
              data-out
              data-check={'check' in line && line.check ? 'true' : undefined}
              className={cn(
                'break-words',
                line.tone === 'jade' ? 'text-jade-2' : 'text-muted/80',
              )}
            >
              {line.text}
            </p>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-subtle/70" dir="ltr">
          <span className="text-jade-2/70">zeidex@edge</span>
          <span>:~$</span>
          <span className="caret" aria-hidden="true" />
        </div>
      </div>

      {/* footer telemetry */}
      <div className="grid grid-cols-3 divide-x divide-hair-soft border-t border-hair-soft rtl:divide-x-reverse" dir="ltr">
        {[
          ['REGION', 'GLOBAL'],
          ['NODES', '310'],
          ['UPTIME', '99.98%'],
        ].map(([k, v]) => (
          <div key={k} className="px-3.5 py-2.5" dir="ltr">
            <p className="mono-label text-[8.5px] text-subtle/80">{k}</p>
            <p className="mt-1 font-mono text-[11px] tabular-nums text-ink/85">{v}</p>
          </div>
        ))}
      </div>

      <span className="term-scan" aria-hidden="true" />
    </figure>
  )
}
