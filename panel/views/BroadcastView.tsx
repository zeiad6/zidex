/** الإرسال الجماعي: نص واحد، جمهور كل العملاء، وشريط تقدّم حقيقي.
 *  الشريط يتقدّم لأن الخادم يعمل دفعات: كل نداء tick يرسل حتى 20 رسالة
 *  ويُعيد ما أُنجز — فأي انقطاع يكمل من حيث توقف لا من البداية. */
import { useRef, useState } from 'react'
import { api } from '../api'
import { t, type Lang } from '../i18n'
import { IconMegaphone, IconSend } from '../icons'
import { Card, Pill } from '../ui'

interface Props {
  lang: Lang
  audience: number
  onToast: (text: string) => void
}

export function BroadcastView({ lang, audience, onToast }: Props) {
  const [text, setText] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null)
  const stopped = useRef(false)

  const send = async () => {
    const body = text.trim()
    if (!body) {
      onToast(t(lang, 'broadcastEmpty'))
      return
    }
    stopped.current = false
    setRunning(true)
    setProgress(null)
    try {
      const job = await api.broadcast(body)
      setProgress({ done: 0, total: job.total, failed: 0 })
      // الدورات تتوقف عند الاكتمال أو عند إلغاء المستخدم (إغلاق العرض يُ cancel)
      for (let guard = 0; guard < 500 && !stopped.current; guard++) {
        const s = await api.broadcastTick(job.job, body)
        setProgress({ done: s.done, total: s.total, failed: s.failed })
        if (s.done >= s.total) break
      }
      onToast(t(lang, 'broadcastDone'))
    } catch {
      onToast(t(lang, 'broadcastStopped'))
    } finally {
      setRunning(false)
    }
  }

  const pct = progress ? Math.round((progress.done / Math.max(1, progress.total)) * 100) : 0

  return (
    <Card title={t(lang, 'broadcastTitle')} lead={t(lang, 'broadcastLead')}>
      <textarea
        className="field"
        rows={4}
        maxLength={1000}
        placeholder={t(lang, 'broadcastPlaceholder')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={t(lang, 'broadcastPlaceholder')}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={send} disabled={running}>
          {running ? <IconMegaphone /> : <IconSend />}
          {running ? t(lang, 'broadcastSending') : t(lang, 'broadcastSend')}
        </button>
        <span className="row-sub">
          {audience} {t(lang, 'kpiUsers')}
        </span>
        {progress ? (
          <Pill tone={progress.failed ? 'warn' : 'ok'}>
            {progress.done}/{progress.total}
            {progress.failed ? ` · ${progress.failed} ${t(lang, 'broadcastFailed')}` : ''}
          </Pill>
        ) : null}
      </div>

      {progress ? (
        <div style={{ marginTop: 14 }}>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="row-sub">
              {progress.done} / {progress.total}
            </span>
            <span className="row-sub">{pct}%</span>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
