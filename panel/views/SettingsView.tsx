/** الإعدادات: الترحيب، الإيقاف للصيانة، تثبيت زر القائمة، والخروج. */
import { useEffect, useState } from 'react'
import type { BotState } from '../api'
import { t, type Lang } from '../i18n'
import { IconCheck, IconLogout, IconPin } from '../icons'
import { Card, Pill, Switch } from '../ui'

interface Props {
  lang: Lang
  state: BotState
  busy: boolean
  onSaveWelcome: (text: string) => void
  onTogglePause: () => void
  onInstallMenu: () => void
  onLogout: () => void
}

export function SettingsView({ lang, state, busy, onSaveWelcome, onTogglePause, onInstallMenu, onLogout }: Props) {
  const [welcome, setWelcome] = useState(state.bot.welcome)

  // المالك قد يعدّل الترحيب من بوت آخر — نتابع ما وصل من الخادم
  useEffect(() => setWelcome(state.bot.welcome), [state.bot.welcome])

  const save = () => {
    if (!welcome.trim()) return
    onSaveWelcome(welcome.trim())
  }

  return (
    <>
      <Card title={t(lang, 'welcome')} lead={t(lang, 'welcomeHint')}>
        <textarea className="field" rows={4} maxLength={500} value={welcome} onChange={(e) => setWelcome(e.target.value)} aria-label={t(lang, 'welcome')} />
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>
            <IconCheck />
            {t(lang, 'save')}
          </button>
          <span className="row-sub">{welcome.length}/500</span>
        </div>
      </Card>

      <Card title={t(lang, 'tabSettings')}>
        <div className="row">
          <span className="row-main">
            <span className="row-name">{t(lang, 'pause')}</span>
            <span className="row-sub">{t(lang, 'pauseHint')}</span>
          </span>
          <Switch on={state.bot.paused} label={t(lang, 'pause')} onChange={onTogglePause} />
        </div>

        <div className="row">
          <span className="row-main">
            <span className="row-name">{t(lang, 'settingsMenu')}</span>
            <span className="row-sub">{t(lang, 'settingsMenuHint')}</span>
          </span>
          <button type="button" className="btn" onClick={onInstallMenu} disabled={busy}>
            <IconPin />
            {t(lang, 'installMenu')}
          </button>
        </div>

        <div className="row">
          <span className="row-main">
            <span className="row-name">@{state.bot.username}</span>
            <span className="row-sub">
              {t(lang, 'settingsPlan')}: {state.bot.plan} · ID {state.bot.id} · {t(lang, 'settingsSince')} {state.bot.created.slice(0, 10)}
            </span>
          </span>
          {state.bot.paused ? <Pill tone="off">{t(lang, 'statusPaused')}</Pill> : <Pill tone="ok">{t(lang, 'statusLive')}</Pill>}
        </div>

        <div className="row">
          <span className="row-main">
            <span className="row-name">{t(lang, 'settingsLogout')}</span>
            <span className="row-sub">{t(lang, 'authHint')}</span>
          </span>
          <button type="button" className="btn btn-danger" onClick={onLogout}>
            <IconLogout />
            {t(lang, 'settingsLogout')}
          </button>
        </div>
      </Card>
    </>
  )
}
