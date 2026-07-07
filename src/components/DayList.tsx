import { useRef } from 'react'
import { itinerary } from '../data/itinerary'
import { ActivityCard } from './ActivityCard'
import { WeatherPanel } from './WeatherPanel'
import type { Activity } from '../types/itinerary'
import type { BookingStatus } from '../types/itinerary'

interface Props {
  isActivityActive: (id: string) => boolean
  activeDayId: string | null
  onDayClick: (dayId: string) => void
  onOpenCustomizer: () => void
  getBookingStatus?: (activityId: string) => BookingStatus | undefined
  onActivityHover?: (activity: Activity | null) => void
  onActivityClick?: (activity: Activity) => void
  focusedActivityId?: string | null
}

export function DayList({
  isActivityActive,
  activeDayId,
  onDayClick,
  onOpenCustomizer,
  getBookingStatus,
  onActivityHover,
  onActivityClick,
  focusedActivityId,
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
    <div className="flex flex-col h-full overflow-y-auto bg-card">
      {itinerary.destinations.map(dest => (
        <div key={dest.id} className="mb-4">
          {/* Destination group header */}
          <div
            className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest"
            style={{
              background: '#FAFCFC',
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
            const activeActivities = day.activities.filter(activity =>
              isActivityActive(activity.id)
            )
            const weatherActivities = activeActivities.length > 0
              ? activeActivities
              : day.activities

            return (
              <div
                key={day.id}
                ref={el => { dayRefs.current[day.id] = el }}
                data-day-id={day.id}
                className={`mx-2 mb-1 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-[#D6E4EA] bg-[#EEF5F8] shadow-sm'
                    : 'border-transparent hover:-translate-y-0.5 hover:border-[#D6E4EA] hover:bg-[#F2F7F9] hover:shadow-sm'
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
                  <span className="text-sm font-medium text-slate-900 ml-auto truncate">{day.label}</span>
                  <span className="text-muted text-xs flex-shrink-0 ml-1">
                    {isActive ? '▲' : '▼'}
                  </span>
                </div>

                {/* Activities (shown when this day is selected) */}
                {isActive && (
                  <div className="pb-2">
                    <WeatherPanel
                      day={day}
                      destination={dest}
                      activities={weatherActivities}
                    />
                    {day.activities.map((activity, index) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        isActive={isActivityActive(activity.id)}
                        destColor={dest.color}
                        bookingStatus={getBookingStatus?.(activity.id)}
                        sequence={index + 1}
                        isFirst={index === 0}
                        isLast={index === day.activities.length - 1}
                        onHover={onActivityHover}
                        onClick={onActivityClick}
                        isFocused={focusedActivityId === activity.id}
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
      <div className="p-4 mt-auto border-t border-[#D6E4EA]">
        <button
          onClick={e => {
            e.stopPropagation()
            onOpenCustomizer()
          }}
          className="w-full py-3 rounded-lg border border-[#D6E4EA] bg-card text-sm font-medium text-slate-700 hover:bg-[#EEF5F8] transition-all"
        >
          ⚙ 定制行程
        </button>
      </div>
    </div>
  )
}
