/** العملاء: بحث، حظر/رفع حظر، وفتح محادثة أي عميل. */
import { useMemo, useState } from 'react'
import type { BotState } from '../api'
import { t, type Lang } from '../i18n'
import { IconBan, IconChat, IconCheck } from '../icons'
import { Card, Empty, Pill, Row, Switch } from '../ui'

interface Props {
  lang: Lang
  state: BotState
  busy: boolean
  onBan: (userId: number, banned: boolean) => void
  onOpenChat: (userId: number) => void
}

export function UsersView({ lang, state, busy, onBan, onOpenChat }: Props) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const rows = [...state.users].sort((a, b) => Number(b.banned) - Number(a.banned))
    if (!needle) return rows
    return rows.filter((u) => (u.name ?? '').toLowerCase().includes(needle) || String(u.id).includes(needle))
  }, [state.users, q])

  return (
    <Card title={t(lang, 'usersTitle')} lead={t(lang, 'bannedNote')}>
      <input
        className="field"
        style={{ marginBottom: 12 }}
        placeholder={t(lang, 'usersSearch')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={t(lang, 'usersSearch')}
      />
      {list.length === 0 ? (
        <Empty text={t(lang, 'usersEmpty')} />
      ) : (
        list.map((u) => (
          <Row
            key={u.id}
            avatar={(u.name ?? String(u.id)).slice(0, 2)}
            name={u.name ?? String(u.id)}
            sub={`ID ${u.id}`}
            actions={
              <>
                <button type="button" className="btn btn-sm" onClick={() => onOpenChat(u.id)} title={t(lang, 'message')}>
                  <IconChat />
                  {t(lang, 'message')}
                </button>
                {u.banned ? <Pill tone="off">{t(lang, 'banned')}</Pill> : null}
                <Switch
                  on={u.banned}
                  label={u.banned ? t(lang, 'unban') : t(lang, 'ban')}
                  onChange={() => onBan(u.id, !u.banned)}
                />
                {u.banned ? (
                  <IconCheck color="var(--off)" width={16} aria-hidden="true" />
                ) : (
                  <IconBan color="var(--muted)" width={16} aria-hidden="true" />
                )}
              </>
            }
          />
        ))
      )}
      {busy ? <p className="card-lead" style={{ marginTop: 10, marginBottom: 0 }}>…</p> : null}
    </Card>
  )
}
