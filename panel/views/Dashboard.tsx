/** العرض الرئيسي: ترويسة البوت + مؤشرات + إجراءات سريعة + أحدث الرسائل. */
import type { BotState } from '../api'
import { ago, t, type Lang } from '../i18n'
import { IconBag, IconChat, IconPause, IconPin, IconPlay, IconStar, IconUsers } from '../icons'
import { Card, Kpi, Pill, Row } from '../ui'

interface Props {
  lang: Lang
  state: BotState
  busy: boolean
  onTogglePause: () => void
  onInstallMenu: () => void
  onOpenChat: (userId: number) => void
  onGo: (tab: 'users' | 'broadcast' | 'chat') => void
}

export function Dashboard({ lang, state, busy, onTogglePause, onInstallMenu, onOpenChat, onGo }: Props) {
  const { bot, users, inbox } = state
  const waiting = inbox.filter((m) => !m.replied).length
  const live = !bot.paused

  return (
    <>
      <div className="kpis">
        <Kpi tile="#4f46e5" icon={<IconUsers />} value={String(users.length)} label={t(lang, 'kpiUsers')} />
        <Kpi tile="#0891b2" icon={<IconBag />} value={String(bot.orders)} label={t(lang, 'kpiOrders')} />
        <Kpi tile="#d97706" icon={<IconStar />} value={bot.stars.toLocaleString('en-US')} label={t(lang, 'kpiStars')} />
        <Kpi tile="#16a34a" icon={<IconChat />} value={String(waiting)} label={t(lang, 'kpiMessages')} />
      </div>

      <Card title={t(lang, 'tabHome')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={onTogglePause} disabled={busy}>
            {live ? <IconPause /> : <IconPlay />}
            {live ? t(lang, 'pause') : t(lang, 'resume')}
          </button>
          <button type="button" className="btn" onClick={onInstallMenu} disabled={busy}>
            <IconPin />
            {t(lang, 'settingsMenu')}
          </button>
          <button type="button" className="btn" onClick={() => onGo('users')}>
            <IconUsers />
            {t(lang, 'tabUsers')}
          </button>
          <button type="button" className="btn" onClick={() => onGo('broadcast')}>
            <IconChat />
            {t(lang, 'tabBroadcast')}
          </button>
        </div>
        <p className="card-lead" style={{ marginTop: 12, marginBottom: 0 }}>
          {t(lang, 'pauseHint')}
        </p>
      </Card>

      <Card
        title={t(lang, 'chatTitle')}
        lead={waiting ? `${waiting} ${t(lang, 'chatUnanswered')}` : t(lang, 'chatEmpty')}
      >
        {inbox.length === 0 ? (
          <p className="card-lead" style={{ marginBottom: 0 }}>
            {t(lang, 'chatEmpty')}
          </p>
        ) : (
          inbox
            .slice(-4)
            .reverse()
            .map((m) => (
              <Row
                key={m.id}
                avatar={(m.name ?? String(m.from)).slice(0, 2)}
                name={m.name ?? String(m.from)}
                sub={`${m.text.slice(0, 48)} · ${ago(lang, m.at)}`}
                actions={
                  <>
                    {m.replied ? <Pill tone="ok">{t(lang, 'chatReplied')}</Pill> : <Pill tone="warn">{t(lang, 'chatUnanswered')}</Pill>}
                    <button type="button" className="btn btn-sm" onClick={() => onOpenChat(m.from)}>
                      {t(lang, 'chatOpen')}
                    </button>
                  </>
                }
              />
            ))
        )}
      </Card>

      <Card title={t(lang, 'settingsTitle')}>
        <Row
          avatar={String(bot.id).slice(0, 2)}
          name={`@${bot.username}`}
          sub={`${t(lang, 'settingsPlan')}: ${bot.plan} · ${t(lang, 'kpiProducts')}: ${state.items.length}`}
          actions={live ? <Pill tone="ok">{t(lang, 'statusLive')}</Pill> : <Pill tone="off">{t(lang, 'statusPaused')}</Pill>}
        />
        {state.users.some((u) => u.banned) ? (
          <Row
            avatar="🚫"
            name={`${state.users.filter((u) => u.banned).length} ${t(lang, 'banned')}`}
            sub={t(lang, 'bannedNote')}
            actions={
              <button type="button" className="btn btn-sm" onClick={() => onGo('users')}>
                {t(lang, 'tabUsers')}
              </button>
            }
          />
        ) : null}
      </Card>
    </>
  )
}
