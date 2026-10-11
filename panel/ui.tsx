/** عناصر واجهة مشتركة — بطاقات، مؤشرات، صفوف، حالات فارغة، وإشعار. */
import type { ReactNode } from 'react'
import { IconInbox } from './icons'

export function Card({ title, lead, children }: { title?: string; lead?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title ? <h2 className="card-t">{title}</h2> : null}
      {lead ? <p className="card-lead">{lead}</p> : null}
      {children}
    </section>
  )
}

/** بطاقة مؤشر: بلاطة أيقونة ملوّنة + رقم عريض (نمط مراجع Dribbble). */
export function Kpi({ tile, icon, value, label }: { tile: string; icon: ReactNode; value: string; label: string }) {
  return (
    <div className="kpi">
      <span className="kpi-tile" style={{ ['--tile' as string]: tile }}>
        {icon}
      </span>
      <span>
        <b className="kpi-v">{value}</b>
        <span className="kpi-l">{label}</span>
      </span>
    </div>
  )
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" className={`switch${on ? ' on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={onChange}>
      <span className="knob" />
    </button>
  )
}

export function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'off' | 'mute'; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

export function Empty({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="empty">
      {icon ?? <IconInbox />}
      <div>{text}</div>
    </div>
  )
}

export function Spinner() {
  return <div className="spin" role="status" aria-label="loading" />
}

export function Toast({ text }: { text: string }) {
  return <div className="toast">{text}</div>
}

/** صف قائمة: صورة رمزية + اسم + سطر ثانوي + إجراءات. */
export function Row({
  avatar,
  name,
  sub,
  actions,
}: {
  avatar: string
  name: string
  sub: string
  actions?: ReactNode
}) {
  return (
    <div className="row">
      <span className="avatar" aria-hidden="true">
        {avatar}
      </span>
      <span className="row-main">
        <span className="row-name truncate">{name}</span>
        <span className="row-sub truncate">{sub}</span>
      </span>
      {actions ? <span className="row-acts">{actions}</span> : null}
    </div>
  )
}
