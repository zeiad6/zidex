/** قشرة اللوحة: مصادقة initData، ثيم تيليجرام، تنقّل، وجلب الحالة. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, forgetSession, storedSession, DEMO_STATE, type BotState } from './api'
import { ago, t, type Lang } from './i18n'
import {
  inTelegram,
  initData,
  onThemeChange,
  ready,
  telegramLang,
  telegramScheme,
} from './tg'
import { haptic } from './tg'
import { Dashboard } from './views/Dashboard'
import { UsersView } from './views/UsersView'
import { BroadcastView } from './views/BroadcastView'
import { ChatView } from './views/ChatView'
import { SettingsView } from './views/SettingsView'
import {
  IconBan,
  IconChat,
  IconGear,
  IconHome,
  IconLang,
  IconLogout,
  IconMegaphone,
  IconUsers,
} from './icons'
import { Spinner, Toast } from './ui'

type Tab = 'home' | 'users' | 'broadcast' | 'chat' | 'settings'

const TABS: { id: Tab; icon: typeof IconHome; ar: string; en: string }[] = [
  { id: 'home', icon: IconHome, ar: 'الرئيسية', en: 'Home' },
  { id: 'users', icon: IconUsers, ar: 'العملاء', en: 'Customers' },
  { id: 'broadcast', icon: IconMegaphone, ar: 'الإرسال', en: 'Broadcast' },
  { id: 'chat', icon: IconChat, ar: 'الدعم', en: 'Support' },
  { id: 'settings', icon: IconGear, ar: 'الإعدادات', en: 'Settings' },
]

type Phase = 'booting' | 'signin' | 'denied' | 'ready'

export function App() {
  const [lang, setLang] = useState<Lang>('ar')
  const [phase, setPhase] = useState<Phase>('booting')
  const [tab, setTab] = useState<Tab>('home')
  const [state, setState] = useState<BotState | null>(null)
  const [demo, setDemo] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [focusUser, setFocusUser] = useState<number | null>(null)
  const toastTimer = useRef(0)

  const say = useCallback((text: string) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2600)
  }, [])

  /* ── الثيم: ثيم تيليجرام أولاً، ثم إعداد النظام في المتصفح ───────── */
  useEffect(() => {
    const paint = () => {
      const mode = telegramScheme() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      document.documentElement.dataset.theme = mode
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#0b1020' : '#f1f5ff')
    }
    paint()
    onThemeChange(paint)
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', paint)
  }, [])

  /* ── اللغة: لغة حساب تيليجرام، ثم ما اختاره الزائر ───────────────── */
  useEffect(() => {
    const saved = localStorage.getItem('tma-lang')
    if (saved === 'ar' || saved === 'en') setLang(saved)
    else setLang(telegramLang())
  }, [])

  const flipLang = () => {
    const next: Lang = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    try {
      localStorage.setItem('tma-lang', next)
    } catch {
      /* لا شيء */
    }
    document.documentElement.lang = next
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    haptic('tap')
  }

  /* ── الجلسة: initData تيليجرام، أو رمز /web الملصوق ──────────────── */
  const boot = useCallback(async () => {
    ready()
    const route = new URLSearchParams(location.hash.replace(/^#\/?/, ''))
    const id = (route.get('id') ?? '').trim()
    if (!id) {
      setPhase('signin')
      return
    }
    // Pre-purchase preview: panel/#id=demo renders sample data entirely client-side — no
    // session, no API, no writes — so the store's buy card can show the control app to buyers.
    if (id === 'demo') {
      api.id = 'demo'
      setDemo(true)
      setState(DEMO_STATE)
      setPhase('ready')
      return
    }
    api.id = id
    const signed = initData()
    const pasted = (route.get('k') ?? '').trim()
    const saved = storedSession()
    const code = pasted || (saved && saved.id === id ? saved.code : '')
    if (!signed && !code) {
      setPhase('signin')
      return
    }
    try {
      if (signed) await api.session(signed, '')
      else api.code = code
      setPhase('ready')
    } catch {
      forgetSession()
      setPhase(signed ? 'denied' : 'signin')
    }
  }, [])

  useEffect(() => {
    void boot()
  }, [boot])

  /* ── الحالة: نداء واحد يرسم كل شيء، ويتحدث كل 12 ثانية ────────────── */
  const load = useCallback(async () => {
    if (phase !== 'ready' || demo) return
    try {
      setState(await api.state())
    } catch (e) {
      if ((e as Error).message === 'auth') setPhase('signin')
    }
  }, [phase, demo])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 12000)
    return () => window.clearInterval(timer)
  }, [load])

  /* ── إجراءات ─────────────────────────────────────────────────────── */
  const act = useCallback(
    async (fn: () => Promise<unknown>, done?: () => void) => {
      if (demo) {
        say(t(lang, 'demoLocked'))
        haptic('warn')
        return
      }
      setBusy(true)
      try {
        await fn()
        await load()
        done?.()
      } catch (e) {
        say((e as Error).message === 'auth' ? t(lang, 'denied') : t(lang, 'networkError'))
      } finally {
        setBusy(false)
      }
    },
    [load, say, lang, demo],
  )

  if (phase === 'booting') {
    return (
      <div className="auth">
        <div className="auth-card" style={{ justifyItems: 'center' }}>
          <Spinner />
          <p className="card-lead" style={{ margin: 0 }}>
            {t(lang, 'loading')}
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'signin' || phase === 'denied') return <SignIn lang={lang} denied={phase === 'denied'} onDone={boot} />

  if (!state) {
    return (
      <div className="auth">
        <div className="auth-card" style={{ justifyItems: 'center' }}>
          <Spinner />
        </div>
      </div>
    )
  }

  const waiting = state.inbox.filter((m) => !m.replied).length
  const live = !state.bot.paused

  return (
    <div className="shell">
      <aside className="rail">
        <div className="rail-brand">
          <span className="rail-mark">
            <IconHome width={20} />
          </span>
          <span>
            {t(lang, 'appName')}
            <br />
            <span className="row-sub">@{state.bot.username}</span>
          </span>
        </div>
        {TABS.map(({ id, icon: Icon, ar, en }) => (
          <button
            key={id}
            type="button"
            className={`rail-item${tab === id ? ' on' : ''}`}
            onClick={() => {
              setTab(id)
              haptic('tap')
            }}
          >
            <Icon />
            <span style={{ flex: 1 }}>{lang === 'ar' ? ar : en}</span>
            {id === 'chat' && waiting ? <span className="pill pill-warn">{waiting}</span> : null}
          </button>
        ))}
        <div className="rail-foot">
          <button type="button" className="rail-item" onClick={flipLang}>
            <IconLang />
            {t(lang, 'langBtn')}
          </button>
          <button
            type="button"
            className="rail-item"
            onClick={() => {
              forgetSession()
              setPhase('signin')
            }}
          >
            <IconLogout />
            {t(lang, 'settingsLogout')}
          </button>
        </div>
      </aside>

      <main>
        {demo ? (
          <div className="pill pill-warn" style={{ margin: '12px 16px 0', display: 'block', textAlign: 'center', padding: '8px 12px' }}>
            {t(lang, 'demoBanner')}
          </div>
        ) : null}
        <header className="hero">
          <div className="hero-in">
            <span className="hero-avatar" aria-hidden="true">
              {state.bot.username.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1>@{state.bot.username}</h1>
              <p className="hero-sub">
                {state.users.length} {t(lang, 'kpiUsers')} · {state.items.length} {t(lang, 'kpiProducts')}
              </p>
            </div>
            <div className="hero-side">
              <span className={`hero-chip${live ? '' : ' off'}`}>
                <i aria-hidden="true" />
                {live ? t(lang, 'statusLive') : t(lang, 'statusPaused')}
              </span>
              <button type="button" className="hero-btn" onClick={flipLang}>
                <IconLang />
                {lang === 'ar' ? 'EN' : 'ع'}
              </button>
            </div>
          </div>
        </header>

        <div className="page">
          {tab === 'home' ? (
            <Dashboard
              lang={lang}
              state={state}
              busy={busy}
              onTogglePause={() =>
                void act(async () => {
                  await api.setPaused(live)
                })
              }
              onInstallMenu={() =>
                void act(async () => {
                  await api.installMenu()
                  haptic('done')
                  say(t(lang, 'installDone'))
                })
              }
              onOpenChat={(u) => {
                setFocusUser(u)
                setTab('chat')
              }}
              onGo={(next) => setTab(next)}
            />
          ) : null}

          {tab === 'users' ? (
            <UsersView
              lang={lang}
              state={state}
              busy={busy}
              onBan={(user, banned) =>
                void act(async () => {
                  await api.ban(user, banned)
                  haptic(banned ? 'warn' : 'done')
                })
              }
              onOpenChat={(u) => {
                setFocusUser(u)
                setTab('chat')
              }}
            />
          ) : null}

          {tab === 'broadcast' ? <BroadcastView lang={lang} audience={state.users.length} onToast={say} /> : null}

          {tab === 'chat' ? (
            <ChatView
              lang={lang}
              state={state}
              busy={busy}
              onToast={say}
              focusUser={focusUser}
              onFocusHandled={() => setFocusUser(null)}
            />
          ) : null}

          {tab === 'settings' ? (
            <SettingsView
              lang={lang}
              state={state}
              busy={busy}
              onSaveWelcome={(text) =>
                void act(async () => {
                  await api.saveWelcome(text)
                  say(t(lang, 'saved'))
                })
              }
              onTogglePause={() =>
                void act(async () => {
                  await api.setPaused(live)
                })
              }
              onInstallMenu={() =>
                void act(async () => {
                  await api.installMenu()
                  haptic('done')
                  say(t(lang, 'installDone'))
                })
              }
              onLogout={() => {
                forgetSession()
                setPhase('signin')
              }}
            />
          ) : null}

          <p className="row-sub" style={{ textAlign: 'center' }}>
            ZeidexSoft · {t(lang, 'appName')} ·{' '}
            {state.inbox.length ? `${ago(lang, state.inbox.at(-1)?.at ?? Date.now())}` : t(lang, 'chatEmpty')}
          </p>
        </div>
      </main>

      <nav className="tabbar" aria-label="tabs">
        <div className="tabbar-in">
          {TABS.map(({ id, icon: Icon, ar, en }) => (
            <button
              key={id}
              type="button"
              className={`tab${tab === id ? ' on' : ''}`}
              onClick={() => {
                setTab(id)
                haptic('tap')
              }}
            >
              <Icon />
              <span>{lang === 'ar' ? ar : en}</span>
            </button>
          ))}
        </div>
      </nav>

      {toast ? <Toast text={toast} /> : null}
    </div>
  )
}

/** شاشة الدخول: تعمل داخل تيليجرام تلقائياً، وفي المتصفح تقبل رمز /web. */
function SignIn({ lang, denied, onDone }: { lang: Lang; denied: boolean; onDone: () => void }) {
  const [id, setId] = useState('')
  const [code, setCode] = useState('')
  const route = useMemo(() => new URLSearchParams(location.hash.replace(/^#\/?/, '')), [])

  const submit = () => {
    const botId = id.trim() || (route.get('id') ?? '').trim()
    const k = code.trim() || (route.get('k') ?? '').trim()
    if (!botId || !k) return
    location.hash = `#id=${botId}&k=${k}`
    api.id = botId
    api.code = k
    try {
      sessionStorage.setItem('tma-session', JSON.stringify({ id: botId, code: k }))
    } catch {
      /* لا شيء */
    }
    onDone()
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <span className="auth-mark">
          <IconBan width={24} />
        </span>
        <h1>{t(lang, 'authTitle')}</h1>
        <p className="card-lead" style={{ margin: 0 }}>
          {denied ? t(lang, 'denied') : t(lang, 'authLead')}
        </p>
        {!inTelegram() ? (
          <>
            <label>
              <span className="label">{t(lang, 'authId')}</span>
              <input className="field" value={id} onChange={(e) => setId(e.target.value)} inputMode="numeric" />
            </label>
            <label>
              <span className="label">{t(lang, 'authCode')}</span>
              <input className="field" value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <button type="button" className="btn btn-primary" onClick={submit}>
              {t(lang, 'authSubmit')}
            </button>
            <p className="row-sub" style={{ margin: 0 }}>
              {t(lang, 'authHint')}
            </p>
          </>
        ) : (
          <p className="card-lead" style={{ margin: 0 }}>
            {t(lang, 'denied')}
          </p>
        )}
      </div>
    </div>
  )
}
