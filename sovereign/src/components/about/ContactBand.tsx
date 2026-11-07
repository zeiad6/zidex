import { ArrowUpLeft, Github, MessageCircle, Send } from 'lucide-react'
import { site } from '@/lib/content'
import { useLang } from '@/lib/i18n'
import { Reveal } from '@/components/ui/Reveal'

const icons = { bot: Send, whatsapp: MessageCircle, github: Github } as const
const tones = [
  'border-tg/22 bg-tg/[0.045] text-tg-2 hover:border-tg/45',
  'border-jade/22 bg-jade/[0.045] text-jade-2 hover:border-jade/45',
  'border-aurum/22 bg-aurum/[0.045] text-aurum-2 hover:border-aurum/45',
] as const
const hrefs: Record<string, string> = { bot: site.bot, whatsapp: site.whatsapp, github: site.github }

/** Three real doors, no ticket form: a form promises a queue, a link promises a person. */
export function ContactBand({ compact = false }: { compact?: boolean }) {
  const { c } = useLang()

  return (
    <section
      id="contact"
      className={compact ? 'relative scroll-mt-28' : 'relative scroll-mt-28 pb-24 pt-6 sm:pt-8'}
    >
      <div className="shell">
        <div className="border-t border-hair-soft pt-10">
          <div className="max-w-[54rem]">
            <div className="flex items-center gap-3">
              <span className="mono-label text-jade/80">{c.contact.eyebrow}</span>
              <span className="h-px w-8 bg-hair-2" aria-hidden="true" />
            </div>
            <h2 className="mt-3 text-[clamp(1.35rem,2.4vw,1.75rem)] font-semibold text-ink">
              {c.contact.title}
            </h2>
            <p className="mt-2 max-w-[54ch] text-[13px] leading-[1.85] text-muted">{c.contact.lead}</p>

            {/* The action follows the promise instead of floating in the far
                margin: read the sentence, then press the button. */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              <a
                href={site.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full sm:w-auto"
              >
                {c.contact.cta}
                <ArrowUpLeft className="arrow-rtl size-4" aria-hidden="true" />
              </a>
              <span className="mono-label hidden text-[8.5px] text-subtle/60 sm:inline">DIRECT LINE · NO QUEUE</span>
            </div>
          </div>

          <Reveal className="mt-7 grid gap-3 sm:grid-cols-3" stagger={0.07}>
            {c.contact.channels.map((channel, index) => {
              const Icon = icons[channel.id as keyof typeof icons] ?? Send
              return (
                <a
                  key={channel.id}
                  data-reveal-item
                  href={hrefs[channel.id] ?? site.bot}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`card group flex flex-col gap-4 rounded-card border p-4 transition-[transform,border-color,background-color] duration-500 ease-expo hover:-translate-y-0.5 ${tones[index] ?? tones[0]}`}
                >
                  {/* Icon and arrow bookend the card; the words get the full
                      width underneath. Side by side, a short label left a
                      hole in the middle of every card. */}
                  <span className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-lg border border-hair bg-sunken">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <ArrowUpLeft
                      className="size-3.5 opacity-55 transition-[transform,opacity] duration-300 group-hover:-translate-y-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">{channel.label}</span>
                    <span className="mt-1 block truncate font-mono text-[10.5px] opacity-85">
                      {channel.value}
                    </span>
                    <span className="mono-label mt-2 block text-[8px] opacity-55">{channel.note}</span>
                  </span>
                </a>
              )
            })}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
