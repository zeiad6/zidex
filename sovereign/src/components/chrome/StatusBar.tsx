import { useEffect, useState } from 'react'
import { site } from '@/lib/content'
import { useLang } from '@/lib/i18n'

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Aden',
})

/**
 * StatusBar — the instrument strip.
 *
 * It says one true thing (the edge is reachable over TLS 1.3), one useful
 * thing (the trial needs no card), and one live thing (Sanaa time). The
 * pulse is the only looping animation above the fold; everything else on
 * this bar is static, so the eye is not competing with four blinking dots.
 */
export function StatusBar() {
  const { c } = useLang()
  const [time, setTime] = useState(() => timeFormat.format(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setTime(timeFormat.format(new Date())), 20_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-9 border-b border-hair-soft bg-void/80 backdrop-blur-xl">
      <div className="shell flex h-full items-center gap-3">
        <span className="flex items-center gap-2" dir="ltr">
          <span className="relative grid size-1.5 place-items-center">
            <span className="size-1.5 rounded-full bg-jade-2 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            <span className="absolute inset-0 pulse-ring rounded-full bg-jade-2/70" />
          </span>
          <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-jade-2">
            EDGE GLOBAL
          </span>
          <span className="font-mono text-[10.5px] text-subtle">:</span>
          <span className="font-mono text-[10.5px] tracking-[0.14em] text-ink/85">{c.status.online}</span>
          <span className="hidden font-mono text-[10px] text-subtle sm:inline">(TLS 1.3)</span>
        </span>

        <span aria-hidden="true" className="h-3 w-px bg-hair" />

        <span className="hidden truncate text-[11px] text-muted sm:inline">{c.status.trial}</span>

        <span className="flex-1" />

        <span className="hidden items-center gap-2 md:flex" dir="ltr">
          <span className="mono-label text-[9.5px]">{c.status.city}</span>
          <time className="font-mono text-[10.5px] tabular-nums text-muted">{time}</time>
          <span className="font-mono text-[9.5px] text-subtle">{c.status.zone}</span>
        </span>

        <span className="chip border-jade/20 bg-jade/[0.06] !px-2 !py-1 !text-[9.5px] text-jade-2/90">
          {site.version}
        </span>
      </div>
    </div>
  )
}
