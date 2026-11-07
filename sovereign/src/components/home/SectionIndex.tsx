import { Link } from 'react-router-dom'
import { ArrowUpLeft } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { routes } from '@/lib/routes'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'

/**
 * SectionIndex — the map of the site, as an editorial masthead.
 *
 * Two columns, not one: the statement holds the reading edge and the
 * explanation sits opposite it at the baseline, which is how a printed
 * contents page is set. Each row then reads as a numbered entry — big
 * figure, hairline, title, arrow — instead of four stacked chips.
 */
export function SectionIndex() {
  const { c } = useLang()

  return (
    <section className="relative pb-20 pt-16 sm:pb-28 sm:pt-20">
      <div className="shell">
        {/* One column, like every other section head on the site: the
            statement holds the reading edge and the explanation sits
            directly under it, so the eye never has to jump across a
            gutter to find the second half of the sentence. */}
        <div className="max-w-[54rem]">
          <SectionHeading eyebrow={c.home.indexEyebrow} title={c.home.indexTitle} lead={c.home.indexLead} />
          <div className="mt-5 flex items-center gap-2.5">
            <span className="font-mono text-[11px] tabular-nums text-jade-2">08</span>
            <span className="h-px w-10 bg-hair" aria-hidden="true" />
            <span className="mono-label text-[8.5px] text-subtle/70">DOORS · ONE PAGE EACH</span>
          </div>
        </div>

        <Reveal className="mt-12 grid gap-2.5 sm:grid-cols-2">
          {c.home.doors.map((door) => {
            const route = routes.find((item) => item.id === door.id)
            if (!route) return null
            return (
              <Link
                key={door.id}
                to={route.path}
                data-reveal-item
                className="card spot group relative flex items-center gap-4 overflow-hidden rounded-card border border-hair-soft bg-panel/60 p-4 transition-[border-color,background-color,transform] duration-500 ease-expo hover:-translate-y-0.5 hover:border-hair hover:bg-panel sm:gap-5 sm:p-5"
              >
                {/* the entry number is the element, not a badge */}
                <span className="font-mono text-[1.65rem] font-medium leading-none tabular-nums text-subtle/25 transition-colors duration-500 group-hover:text-jade/45 sm:text-[1.9rem]">
                  {route.index}
                </span>

                <span className="min-w-0 flex-1 border-s border-hair-soft ps-4 sm:ps-5">
                  <span className="block text-[13.5px] font-semibold text-ink transition-colors group-hover:text-jade-2 sm:text-[14px]">
                    {door.title}
                  </span>
                  <span className="mt-1 block text-[11.5px] leading-[1.75] text-muted">{door.desc}</span>
                </span>

                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-hair text-subtle transition-[border-color,background-color,color] duration-500 ease-expo group-hover:border-jade/40 group-hover:bg-jade/[0.09] group-hover:text-jade-2">
                  <ArrowUpLeft
                    className="arrow-rtl size-3.5 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
