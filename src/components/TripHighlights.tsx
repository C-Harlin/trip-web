import { itinerary } from '../data/itinerary'
import type { Activity } from '../types/itinerary'

const HIGHLIGHT_TYPES = new Set<Activity['type']>(['attraction', 'nature', 'food'])

function getHighlights(activities: Activity[]) {
  const preferred = activities.filter(activity => HIGHLIGHT_TYPES.has(activity.type))
  const fallback = activities.filter(activity => activity.type !== 'transport')

  const candidates = preferred.length > 0 ? preferred : fallback.length > 0 ? fallback : activities

  return candidates
    .slice(0, 2)
    .map(activity => activity.title)
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map(day => (
          <article
            key={day.id}
            className="rounded-lg border border-[#D6E4EA] bg-card/92 p-4 shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-card"
          >
            <div className="mb-3 flex items-center gap-2">
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

            <div className="mt-3 flex flex-wrap gap-1.5">
              {day.highlights.map(highlight => (
                <span
                  key={highlight}
                  className="rounded-full bg-[#E7F0F4] px-2 py-1 text-xs leading-tight text-slate-600"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
