import { useRef } from 'react'
import { itinerary } from '../data/itinerary'
import { ActivityCard } from './ActivityCard'
import type { Activity } from '../types/itinerary'

interface Props {
  isActivityActive: (id: string) => boolean
  activeDayId: string | null
  onDayClick: (dayId: string) => void
  onOpenCustomizer: () => void
  onActivityHover?: (activity: Activity | null) => void
}

export function DayList({
  isActivityActive,
  activeDayId,
  onDayClick,
  onOpenCustomizer,
  onActivityHover,
}: Props) {
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Expose scroll function via scrollToDay helper
  const scrollToDay = (dayId: string) => {
    const el = dayRefs.current[dayId]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Expose via data attribute for external access
  void scrollToDay

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {itinerary.destinations.map(dest => (
        <div key={dest.id} className="mb-4">
          {/* Destination group header */}
          <div
            className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest"
            style={{
              background: '#0D1117',
              color: dest.color,
              borderBottom: `1px solid ${dest.color}20`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: dest.color }}
            />
            {dest.nameEn}
            <span className="text-muted font-normal normal-case tracking-normal ml-1">
              {dest.days.length}天
            </span>
          </div>

          {/* Days */}
          {dest.days.map(day => {
            const isActive = day.id === activeDayId
            return (
              <div
                key={day.id}
                ref={el => { dayRefs.current[day.id] = el }}
                data-day-id={day.id}
                className={`mx-2 mb-1 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'border-white/15 bg-card'
                    : 'border-transparent hover:border-white/8 hover:bg-white/3'
                }`}
                onClick={() => onDayClick(day.id)}
              >
                {/* Day header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <div
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: dest.color + '20', color: dest.color }}
                  >
                    {day.date}
                  </div>
                  <span className="text-muted text-xs">{day.weekday}</span>
                  <span className="text-sm font-medium ml-auto truncate">{day.label}</span>
                  <span className="text-muted text-xs flex-shrink-0 ml-1">
                    {isActive ? '▲' : '▼'}
                  </span>
                </div>

                {/* Activities (shown when this day is selected) */}
                {isActive && (
                  <div className="pb-2">
                    {day.activities.map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        isActive={isActivityActive(activity.id)}
                        destColor={dest.color}
                        onHover={onActivityHover}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Customizer trigger */}
      <div className="p-4 mt-auto border-t border-white/10">
        <button
          onClick={e => {
            e.stopPropagation()
            onOpenCustomizer()
          }}
          className="w-full py-3 rounded-2xl border border-white/15 text-sm font-medium hover:bg-white/5 transition-all"
        >
          ⚙ 定制行程
        </button>
      </div>
    </div>
  )
}
