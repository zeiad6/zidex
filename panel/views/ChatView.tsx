/** الدعم الفني: قائمة المحادثات + ردّ كأنك البوت.
 *  كل رسالة واردة تظهر في خيط عميلها؛ الرد يذهب من البوت نفسه (توكنه)،
 *  فيصل العميل من البوت لا من حساب المالك. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, type BotState, type InboxMsg } from '../api'
import { ago, t, type Lang } from '../i18n'
import { IconChat, IconSend } from '../icons'
import { Card, Empty, Pill } from '../ui'

interface Props {
  lang: Lang
  state: BotState
  busy: boolean
  onToast: (text: string) => void
  /** عميل مفتوح مسبقاً (من شاشة العملاء). */
  focusUser: number | null
  onFocusHandled: () => void
}

interface Thread {
  from: number
  name?: string
  messages: InboxMsg[]
  waiting: number
}

export function ChatView({ lang, state, busy, onToast, focusUser, onFocusHandled }: Props) {
  const threads = useMemo(() => {
    const map = new Map<number, Thread>()
    for (const m of state.inbox) {
      const th = map.get(m.from) ?? { from: m.from, name: m.name, messages: [] as InboxMsg[], waiting: 0 }
      th.messages.push(m)
      th.name = m.name ?? th.name
      if (!m.replied) th.waiting += 1
      map.set(m.from, th)
    }
    return [...map.values()].sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0))
  }, [state.inbox])

  const [open, setOpen] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusUser) {
      setOpen(focusUser)
      onFocusHandled()
    }
  }, [focusUser, onFocusHandled])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [open, state.inbox.length])

  const active = threads.find((th) => th.from === open) ?? null

  const reply = async () => {
    const body = draft.trim()
    if (!active || !body || sending) return
    setSending(true)
    try {
      await api.reply(active.from, body)
      setDraft('')
      onToast(t(lang, 'chatSent'))
      // إعادة الجلب مسؤولية الأب (App) — هنا نكتفي بتفريغ الحقل
    } catch {
      onToast(t(lang, 'networkError'))
    } finally {
      setSending(false)
    }
  }

  if (threads.length === 0) {
    return (
      <Card title={t(lang, 'chatTitle')} lead={t(lang, 'chatLead')}>
        <Empty text={t(lang, 'chatEmpty')} />
      </Card>
    )
  }

  return (
    <div className="chat-grid">
      <Card title={t(lang, 'chatTitle')}>
        {threads.map((th) => (
          <button
            key={th.from}
            type="button"
            className="row"
            style={{ width: '100%', background: 'none', border: 0, borderBlockEnd: '1px solid var(--line)', cursor: 'pointer', textAlign: 'start' }}
            onClick={() => setOpen(th.from)}
          >
            <span className="avatar" aria-hidden="true">
              {(th.name ?? String(th.from)).slice(0, 2)}
            </span>
            <span className="row-main">
              <span className="row-name truncate">{th.name ?? th.from}</span>
              <span className="row-sub truncate">{th.messages.at(-1)?.text.slice(0, 40)}</span>
            </span>
            {th.waiting ? <Pill tone="warn">{th.waiting}</Pill> : <Pill tone="ok">{t(lang, 'chatReplied')}</Pill>}
          </button>
        ))}
      </Card>

      {active ? (
        <Card
          title={active.name ?? String(active.from)}
          lead={`ID ${active.from} · ${ago(lang, active.messages.at(-1)?.at ?? Date.now())}`}
        >
          <div className="thread">
            {active.messages.map((m) => (
              <div key={m.id} style={{ display: 'grid', gap: 3 }}>
                <div className="bubble in">{m.text}</div>
                <span className="bubble-meta">
                  {t(lang, 'chatCustomer')} · {ago(lang, m.at)}
                  {m.replied ? ` · ${t(lang, 'chatReplied')}` : ''}
                </span>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input
              className="field"
              placeholder={t(lang, 'chatReply')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void reply()
              }}
              aria-label={t(lang, 'chatReply')}
              disabled={busy}
            />
            <button type="button" className="btn btn-primary" onClick={reply} disabled={sending || busy}>
              <IconSend />
              {t(lang, 'chatSend')}
            </button>
          </div>
          <p className="card-lead" style={{ marginTop: 10, marginBottom: 0 }}>
            <IconChat width={14} style={{ verticalAlign: '-2px' }} aria-hidden="true" /> {t(lang, 'chatLead')}
          </p>
        </Card>
      ) : (
        <Card>
          <Empty text={t(lang, 'chatOpen')} />
        </Card>
      )}
    </div>
  )
}
