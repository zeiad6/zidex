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
    visits: number
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

/** Sample state for the pre-purchase preview (panel/#id=demo). Entirely client-side — no API
 *  call, no auth, no real bot — so a prospective buyer explores the control app without touching
 *  anyone's data. Writes are blocked in demo mode (see App.act). */
const now = Date.now()
export const DEMO_STATE: BotState = {
  bot: {
    id: 0,
    username: 'your_store_bot',
    paused: false,
    plan: 'paid',
    expires: null,
    lapsed: false,
    orders: 42,
    stars: 1680,
    users: 3,
    visits: 128,
    welcome: 'أهلاً بك في متجري 👋 تصفّح المنتجات واطلب بضغطة.',
    site: null,
    created: new Date(now - 1000 * 60 * 60 * 24 * 21).toISOString(),
    caps: { items: 50, faqs: 20 },
  },
  items: [
    { id: 1, title: 'اشتراك شهري Pro', stars: 350, desc: 'كل المزايا لمدة شهر.' },
    { id: 2, title: 'حزمة 100 تصميم', stars: 500, desc: 'قوالب جاهزة للتحميل الفوري.' },
    { id: 3, title: 'استشارة خاصة', stars: 800, desc: 'جلسة 30 دقيقة واحد لواحد.' },
  ],
  sections: [
    { id: 1, name: 'اشتراكات' },
    { id: 2, name: 'منتجات رقمية' },
  ],
  faqs: [
    { q: 'كيف أستلم المنتج؟', a: 'فوراً بعد الدفع داخل المحادثة.' },
    { q: 'ما طرق الدفع؟', a: 'نجوم تيليجرام مباشرة.' },
  ],
  files: [{ id: 1, title: 'دليل الاستخدام.pdf', type: 'document' }],
  users: [
    { id: 101, name: 'أحمد', banned: false },
    { id: 102, name: 'سارة', banned: false },
    { id: 103, name: 'Omar', banned: true },
  ],
  inbox: [
    { id: 1, from: 101, name: 'أحمد', text: 'هل الاشتراك يشمل التحديثات؟', at: now - 1000 * 60 * 18, replied: false },
    { id: 2, from: 102, name: 'سارة', text: 'شكراً، وصلني المنتج ✅', at: now - 1000 * 60 * 90, replied: true },
  ],
}

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
