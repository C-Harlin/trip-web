import { itinerary } from '../data/itinerary'
import type { Activity } from '../types/itinerary'

const HIGHLIGHT_TYPES = new Set<Activity['type']>(['attraction', 'nature', 'food'])
const HIGHLIGHT_ICONS: Record<Activity['type'], string> = {
  transport: '→',
  attraction: '◇',
  food: '◐',
  accommodation: '⌂',
  nature: '✦',
}

function getHighlights(activities: Activity[]) {
  const preferred = activities.filter(activity => HIGHLIGHT_TYPES.has(activity.type))
  const fallback = activities.filter(activity => activity.type !== 'transport')

  const candidates = preferred.length > 0 ? preferred : fallback.length > 0 ? fallback : activities

  return candidates
    .slice(0, 2)
    .map(activity => ({
      title: activity.title,
      type: activity.type,
    }))
}

export function TripHighlights() {
  const days = itinerary.destinations.flatMap(destination =>
    destination.days.map(day => ({
      ...day,
      destination,
      highlights: getHighlights(day.activities),
    }))
  )

  return (
    <section className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Highlights
          </div>
          <h2 className="text-lg font-bold text-slate-900">行程高光</h2>
        </div>
        <div className="hidden text-sm text-slate-500 md:block">{itinerary.dateRange}</div>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 pb-2">
        <div className="flex min-w-max gap-3">
        {days.map(day => (
          <article
            key={day.id}
            className="group relative w-[260px] flex-shrink-0 overflow-hidden rounded-lg border border-[#D6E4EA] bg-card/92 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_14px_32px_rgba(42,68,82,0.12)]"
          >
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ background: day.destination.color }}
            />
            <div className="pl-2">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: day.destination.color + '18', color: day.destination.color }}
                >
                  {day.date}
                </span>
                <span className="text-xs text-slate-500">{day.weekday}</span>
                <span
                  className="ml-auto h-2 w-2 rounded-full"
                  style={{ background: day.destination.color }}
                />
              </div>

              <div className="text-sm font-semibold leading-snug text-slate-900">
                {day.label}
              </div>

              {day.highlights[0] && (
                <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-[#E7F0F4] px-2 py-1 text-xs leading-tight text-slate-600">
                  <span
                    className="flex-shrink-0"
                    style={{ color: day.destination.color }}
                  >
                    {HIGHLIGHT_ICONS[day.highlights[0].type]}
                  </span>
                  <span className="truncate">{day.highlights[0].title}</span>
                </div>
              )}
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}
