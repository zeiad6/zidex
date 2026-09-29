import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { Glyph } from '@/components/ui/Glyphs'
import { Copy } from 'lucide-react'
import type { Block, Post } from '@/data/posts'
import { cn, copyText } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

/**
 * Minimal inline formatter: **bold**, *italic*, `code`, [text](url).
 * Deliberately tiny — posts only use these four marks, and a full
 * markdown pipeline would ship far more bytes for the same output.
 */
/**
 * Only these schemes ever become an href. Post bodies are authored in this
 * repo today, but the moment a post can come from a CMS or a file upload,
 * an unfiltered href is a `javascript:` execution sink.
 */
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i

function safeHref(href: string): string | undefined {
  const trimmed = href.trim()
  return SAFE_HREF.test(trimmed) ? trimmed : undefined
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      out.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      out.push(<code key={key++}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('[')) {
      const label = token.slice(1, token.indexOf(']'))
      const href = safeHref(token.slice(token.indexOf('(') + 1, -1))
      if (href === undefined) {
        // Rejected scheme: render the label as plain text, never as a link.
        out.push(<span key={key++}>{label}</span>)
      } else {
        const external = /^https?:/i.test(href)
        out.push(
          <a
            key={key++}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer nofollow' : undefined}
          >
            {label}
          </a>,
        )
      }
    } else {
      out.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Copy-to-clipboard for a single code block, with RTL-safe confirmation. */
function CodeCopy({ value }: { value: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return (
    <button
      type="button"
      onClick={async () => {
        if (!(await copyText(value))) return
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 2000)
      }}
      aria-label={copied ? t('تم نسخ الأمر', 'Copied') : t('نسخ الأمر', 'Copy code')}
      className={cn(
        'focus-visible:ring-accent flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
        copied ? 'text-emerald-500' : 'text-subtle hover:text-app hover:bg-elevated',
      )}
    >
      {copied ? (
        <>
          <Glyph name="check" size={12} aria-hidden="true" />
          {t('تم النسخ', 'Copied')}
        </>
      ) : (
        <>
          <Copy className="size-3" aria-hidden="true" />
          {t('نسخ', 'Copy')}
        </>
      )}
    </button>
  )
}

const calloutStyles = {
  tip: {
    wrap: 'border-emerald-500/30 bg-emerald-500/[0.06]',
    icon: 'text-emerald-500',
    dot: 'bg-emerald-500',
    title: 'text-emerald-600 dark:text-emerald-400',
    glyph: 'bulb' as const,
  },
  warn: {
    wrap: 'border-amber-500/30 bg-amber-500/[0.06]',
    icon: 'text-amber-500',
    dot: 'bg-amber-500',
    title: 'text-amber-600 dark:text-amber-400',
    glyph: 'warning' as const,
  },
  info: {
    wrap: 'border-ghost-400/30 bg-ghost-500/[0.07]',
    icon: 'text-ghost-500',
    dot: 'bg-ghost-500',
    title: 'text-ghost-600 dark:text-ghost-300',
    glyph: 'info' as const,
  },
} as const

export function Prose({ blocks }: { blocks: Post['body'] }) {
  const { t } = useI18n()
  return (
    <div className="prose-ghost">
      {blocks.map((block: Block, i) => {
        const key = `${block.type}-${i}`

        switch (block.type) {
          case 'h2':
            return (
              <h2 key={key} id={block.id} className="group scroll-mt-28">
                <a
                  href={`#${block.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(block.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    history.replaceState(null, '', `#${block.id}`)
                  }}
                  className="decoration-accent/40 hover:decoration-accent flex items-center gap-2 no-underline transition-colors"
                >
                  <span className="text-accent/0 group-hover:text-accent/70 -ms-6 text-lg transition-colors">
                    #
                  </span>
                  {block.text}
                </a>
              </h2>
            )

          case 'h3':
            return (
              <h3 key={key} id={block.id} className="scroll-mt-28">
                {block.text}
              </h3>
            )

          case 'p':
            return <p key={key}>{inline(block.text)}</p>

          case 'ul':
            return (
              <ul key={key}>
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ul>
            )

          case 'ol':
            return (
              <ol key={key}>
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ol>
            )

          case 'quote':
            return (
              <blockquote key={key}>
                <p className="text-app text-lg font-medium italic">“{block.text}”</p>
                {block.by ? <footer className="text-subtle mt-2 text-sm not-italic">— {block.by}</footer> : null}
              </blockquote>
            )

          case 'callout': {
            const s = calloutStyles[block.tone]
            return (
              <aside key={key} className={cn('not-prose shadow-app my-8 rounded-2xl border p-5', s.wrap)}>
                <div className="flex items-center gap-2">
                  <Glyph name={s.glyph} size={18} className={cn('shrink-0', s.icon)} aria-hidden="true" />
                  <h4 className={cn('text-sm font-bold', s.title)}>{block.title}</h4>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {block.items.map((item, j) => (
                    <li key={j} className="text-app flex gap-2.5 text-sm leading-relaxed">
                      <span className={cn('mt-2 size-1.5 shrink-0 rounded-full', s.dot)} aria-hidden="true" />
                      {inline(item)}
                    </li>
                  ))}
                </ul>
              </aside>
            )
          }

          case 'code':
            return (
              <div key={key} className="not-prose group relative my-8">
                <div className="border-app bg-sunken flex items-center justify-between gap-3 rounded-t-xl border border-b-0 px-3 py-2">
                  <span className="text-subtle flex items-center gap-2.5">
                    <span className="flex gap-1.5" aria-hidden="true">
                      {['#fe2c55', '#25f4ee', '#f5a524'].map((c) => (
                        <span key={c} className="size-2.5 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider" dir="ltr">
                      {block.lang}
                    </span>
                  </span>
                  <CodeCopy value={block.code} />
                </div>
                <pre className="!m-0 !rounded-t-none">
                  <code>{block.code}</code>
                </pre>
              </div>
            )

          case 'stats':
            return (
              <div
                key={key}
                className={cn(
                  'not-prose shadow-app my-8 grid gap-3',
                  // Four figures wrapped 3 + 1 on a phone; 2 × 2 keeps the row even.
                  block.items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3',
                )}
              >
                {block.items.map((s) => (
                  <div
                    key={s.label}
                    className="shadow-app bg-elevated rounded-2xl border border-app p-4 text-center"
                  >
                    <div className="gradient-text text-2xl font-extrabold tabular-nums sm:text-3xl">
                      {s.value}
                    </div>
                    <div className="text-subtle mt-1.5 text-[11px] leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            )

          case 'checklist':
            return (
              <ul key={key} className="not-prose my-8 flex flex-col gap-2.5">
                {block.items.map((item, j) => (
                  <li key={j} className="border-app shadow-app bg-elevated flex items-start gap-3 rounded-xl border p-3.5">
                    <span
                      className="border-accent/40 text-accent mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="size-3">
                        <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-app text-sm leading-relaxed">{inline(item)}</span>
                  </li>
                ))}
              </ul>
            )

          case 'table':
            return (
              <div key={key} className="not-prose my-8">
                {block.caption ? (
                  <p className="text-subtle mb-2.5 text-xs font-medium">{block.caption}</p>
                ) : null}
                {/* Scrolls horizontally on a phone rather than forcing the whole
                    page to overflow — the table keeps its own scroll context. */}
                <div className="border-app overflow-x-auto rounded-2xl border">
                  <table className="w-full min-w-[26rem] border-collapse text-sm">
                    <thead>
                      <tr className="bg-sunken/60">
                        {block.head.map((h, j) => (
                          <th
                            key={j}
                            scope="col"
                            className="text-app border-app border-b px-3.5 py-2.5 text-start text-xs font-bold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, i) => (
                        <tr key={i} className="border-app hover:bg-sunken/40 border-b transition-colors last:border-b-0">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="text-muted px-3.5 py-2.5 align-top text-[13px] leading-relaxed"
                            >
                              {inline(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )

          case 'divider':
            return <hr key={key} />

          case 'image':
            return (
              <figure key={key} className="not-prose my-10">
                <div className="shadow-app overflow-hidden rounded-2xl border border-app bg-sunken">
                  <picture>
                    <source srcSet={block.src} type="image/webp" />
                    <img
                      src={block.fallback}
                      alt={block.alt}
                      loading="lazy"
                      decoding="async"
                      width={720}
                      height={1466}
                      className="block h-auto w-full"
                    />
                  </picture>
                </div>
                {block.caption ? (
                  <figcaption className="text-subtle mt-3 text-center text-xs">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            )

          case 'hub':
            return (
              <figure key={key} className="not-prose my-10">
                <div className="bg-sunken shadow-app relative overflow-hidden rounded-3xl border border-app p-5 sm:p-8">
                  <span className="dot-grid absolute inset-0 opacity-40" aria-hidden="true" />

                  {/* Centre node: gradient hairline frame around an elevated card. */}
                  <div className="tiktok-gradient shadow-app-lg relative mx-auto w-fit max-w-full rounded-2xl p-[1.5px]">
                    <div className="bg-elevated rounded-[calc(1rem-1.5px)] px-6 py-4 text-center">
                      <p className="text-app font-mono text-base font-bold" dir="ltr">
                        {block.center.title}
                      </p>
                      <p className="text-muted mt-1 text-xs">{block.center.sub}</p>
                    </div>
                  </div>

                  <span className="bg-strong relative mx-auto block h-8 w-px" aria-hidden="true" />

                  <ul className="relative grid gap-4 sm:auto-cols-fr sm:grid-flow-col sm:gap-3">
                    {/* Rail joining the first and last column centres (desktop only). */}
                    <span
                      aria-hidden="true"
                      className="bg-strong absolute top-0 hidden h-px sm:block"
                      style={{ insetInline: `calc(50% / ${block.nodes.length})` }}
                    />
                    {block.nodes.map((n) => (
                      <li key={n.title} className="relative pt-5 sm:pt-6">
                        <span
                          aria-hidden="true"
                          className="bg-strong absolute top-0 left-1/2 h-5 w-px -translate-x-1/2 sm:h-6"
                        />
                        <div className="shadow-app bg-elevated h-full rounded-2xl border border-app p-4 text-center">
                          <p className="text-app text-sm font-semibold" dir="ltr">
                            {n.title}
                          </p>
                          <p className="text-subtle mt-1 text-xs leading-relaxed">{inline(n.sub)}</p>
                          <span className="bg-accent-soft text-accent mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                            {n.role}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {block.caption ? (
                  <figcaption className="text-subtle mt-3 text-center text-xs">{block.caption}</figcaption>
                ) : null}
              </figure>
            )

          case 'download':
            return (
              <div
                key={key}
                className="not-prose shadow-app-md hover:shadow-app-lg my-8 flex flex-col gap-4 rounded-2xl border border-app bg-elevated p-5 transition-[box-shadow,transform] duration-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-app text-sm font-semibold">{block.label}</p>
                  <p className="text-subtle mt-1 font-mono text-xs" dir="ltr">
                    {block.meta}
                  </p>
                </div>
                <a
                  href={safeHref(block.href)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn btn-primary h-11 shrink-0 cursor-pointer px-6 text-base"
                >
                  <Glyph name="download" size={16} aria-hidden="true" />
                  {t('تحميل', 'Download')}
                </a>
              </div>
            )

          default:
            return <Fragment key={key} />
        }
      })}
    </div>
  )
}
