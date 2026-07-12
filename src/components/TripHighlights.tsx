import { Building2, CarFront, Hotel, Leaf, Utensils, type LucideIcon } from 'lucide-react'
import type { Activity, Itinerary } from '../types/itinerary'

const HIGHLIGHT_TYPES = new Set<Activity['type']>(['attraction', 'nature', 'food'])
const HIGHLIGHT_ICONS: Record<Activity['type'], LucideIcon> = {
  transport: CarFront,
  attraction: Building2,
  food: Utensils,
  accommodation: Hotel,
  nature: Leaf,
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

export function TripHighlights({ itinerary }: { itinerary: Itinerary }) {
  const days = itinerary.destinations.flatMap(destination => {
    const selected = [...destination.days]
      .sort((a, b) => getHighlights(b.activities).length - getHighlights(a.activities).length)
      .slice(0, 2)
      .sort((a, b) => destination.days.indexOf(a) - destination.days.indexOf(b))
    return selected.map(day => ({
      ...day,
      destination,
      highlights: getHighlights(day.activities),
    }))
  })

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
            className="group relative w-[270px] flex-shrink-0 overflow-hidden rounded-lg border border-[#D6E4EA] bg-card/92 p-3 shadow-sm transition-colors duration-200 hover:bg-white"
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

              <div className="mt-2 space-y-1.5">
                {day.highlights.map(highlight => {
                  const Icon = HIGHLIGHT_ICONS[highlight.type]
                  return (
                    <div key={highlight.title} className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
                      <Icon size={13} className="flex-shrink-0" style={{ color: day.destination.color }} />
                      <span className="truncate">{highlight.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}
