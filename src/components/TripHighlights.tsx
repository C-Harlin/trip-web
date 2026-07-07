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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map(day => (
          <article
            key={day.id}
            className="group overflow-hidden rounded-lg border border-[#D6E4EA] bg-card/92 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-[0_18px_42px_rgba(42,68,82,0.12)]"
          >
            <div className="relative h-16 overflow-hidden">
              <img
                src={day.destination.photoUrl}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/58 to-transparent" />
              <div className="absolute left-4 top-3 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: day.destination.color + '20', color: day.destination.color }}
                >
                  {day.date}
                </span>
                <span className="text-xs font-medium text-slate-500">{day.weekday}</span>
              </div>
              <div
                className="absolute bottom-0 left-0 h-1 w-full"
                style={{ background: day.destination.color }}
              />
            </div>

            <div className="p-4">
              <div className="text-sm font-semibold leading-snug text-slate-900">
                {day.label}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {day.highlights.map(highlight => (
                  <span
                    key={highlight.title}
                    className="inline-flex items-center gap-1 rounded-full bg-[#E7F0F4] px-2 py-1 text-xs leading-tight text-slate-600"
                  >
                    <span style={{ color: day.destination.color }}>
                      {HIGHLIGHT_ICONS[highlight.type]}
                    </span>
                    {highlight.title}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
