/* عقد الـAPI — نفس /api/dash/<id> الذي تخدمه لوحة الويب، بلا استثناء:
   مصادقة واحدة (Bearer) ونقاط نهاية مشتركة. الفرق أن الجلسة هنا تُستبدل
   بتوقيع initData الخاص بلوحة تيليجرام نفسها. */

export interface BotState {
  bot: {
    id: number
    username: string
    paused: boolean
    plan: string
    expires: string | null
    lapsed: boolean
    orders: number
    stars: number
    users: number
    welcome: string
    site: { url: string; verified: boolean } | null
    created: string
    caps: { items: number; faqs: number }
  }
  items: { id: number; title: string; stars: number; desc: string }[]
  sections: { id: number; name: string }[]
  faqs: { q: string; a: string }[]
  files: { id: number; title: string; type: string }[]
  users: { id: number; name?: string; banned: boolean }[]
  inbox: InboxMsg[]
}

export interface InboxMsg {
  id: number
  from: number
  name?: string
  text: string
  at: number
  replied?: boolean
}

export interface Session {
  code: string
  user: { id: number; name?: string }
  bot: { id: number; username: string }
}

const SESSION_KEY = 'tma-session'

export const api = {
  id: '',
  code: '',
  /** كل نداء يمرّ من هنا: العنوان، الترويسة، وتحليل الرد. */
  async call<T>(action: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api/dash/${api.id}/${action}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${api.code}`,
        ...(init?.headers ?? {}),
      },
    })
    if (res.status === 401 || res.status === 403) throw new Error('auth')
    if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`)
    return (await res.json()) as T
  },
  /** توقيع تيليجرام مقابل رمز جلسة — النداء الوحيد قبل المصادقة. */
  async session(initData: string, code: string): Promise<Session> {
    const res = await fetch(`/api/dash/${api.id}/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData, code }),
    })
    if (!res.ok) throw new Error(res.status === 403 ? 'forbidden' : 'session failed')
    const s = (await res.json()) as Session
    api.code = s.code
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: api.id, code: s.code }))
    } catch {
      /* تخزين معطل */
    }
    return s
  },
  state: () => api.call<BotState>('state'),
  saveWelcome: (text: string) => api.call('welcome', { method: 'POST', body: JSON.stringify({ text }) }),
  setPaused: (paused: boolean) => api.call('pause', { method: 'POST', body: JSON.stringify({ paused }) }),
  ban: (user: number, banned: boolean) => api.call('users/ban', { method: 'POST', body: JSON.stringify({ user, banned }) }),
  reply: (to: number, text: string) => api.call('inbox/reply', { method: 'POST', body: JSON.stringify({ to, text }) }),
  broadcast: (text: string) => api.call<{ job: string; total: number; done: number }>('broadcast', { method: 'POST', body: JSON.stringify({ text }) }),
  broadcastTick: (job: string, text: string) =>
    api.call<{ done: number; total: number; failed: number }>('broadcast/tick', { method: 'POST', body: JSON.stringify({ job, text }) }),
  installMenu: () => api.call<{ ok: boolean; url: string }>('menu', { method: 'POST', body: '{}' }),
}

/** جلسة محفوظة (رمز لصق من /web، أو جلسة سابقة) تُحمّل بلا تيليجرام. */
export const storedSession = (): { id: string; code: string } | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as { id: string; code: string }) : null
  } catch {
    return null
  }
}

export const forgetSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* لا شيء */
  }
}
