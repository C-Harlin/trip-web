import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, getBookingRequirement } from '../data/booking'
import { TRIP_YEAR } from '../data/tripConfig'
import type { Activity, BookingStatus, Day, Destination, Itinerary } from '../types/itinerary'

interface Props {
  itinerary: Itinerary
  isActivityActive: (id: string) => boolean
  getBookingStatus: (activityId: string) => BookingStatus | undefined
  onJumpToDay: (dayId: string) => void
  onFocusActivity: (activity: Activity) => void
}

interface DayContext {
  day: Day
  destination: Destination
  isoDate: string
}

export function TodayView({
  itinerary,
  isActivityActive,
  getBookingStatus,
  onJumpToDay,
  onFocusActivity,
}: Props) {
  const days = getDayContexts(itinerary)
  const todayIso = getTodayIso()
  const exactDay = days.find(item => item.isoDate === todayIso)
  const upcomingDay = days.find(item => item.isoDate >= todayIso) ?? days[days.length - 1]
  const current = exactDay ?? upcomingDay
  const activeActivities = current.day.activities.filter(activity => isActivityActive(activity.id))
  const locatedActivities = activeActivities.filter(activity => activity.lat != null && activity.lng != null)
  const nextBookings = getUpcomingBookings(days, todayIso, getBookingStatus, isActivityActive)
  const modeLabel = exactDay ? 'Today' : todayIso < days[0].isoDate ? 'Next Up' : 'Trip Wrap'
  const headline = exactDay ? '今日行程' : todayIso < days[0].isoDate ? '下一站预览' : '行程回顾'
  const subline = exactDay
    ? '旅途中打开这里，可以直接看当天重点、预订提醒和地图定位。'
    : todayIso < days[0].isoDate
      ? `距离出发还有 ${getDayDiff(todayIso, days[0].isoDate)} 天，先把第一天和待预订事项捋顺。`
      : '旅行已结束，保留这份路线作为复盘和再次出发的底稿。'

  return (
    <section className="max-w-7xl mx-auto px-6 pb-6">
      <div className="overflow-hidden rounded-lg border border-[#D6E4EA] bg-[#F7FBFC] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative p-5">
            <div
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: current.destination.color }}
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {modeLabel}
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{headline}</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">{subline}</p>
              </div>
              <div className="rounded-lg bg-card px-3 py-2 text-right shadow-sm">
                <div className="text-sm font-bold text-slate-900">{current.day.date}</div>
                <div className="text-xs text-slate-500">{current.day.weekday}</div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#D6E4EA] bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: current.destination.color }}
                />
                <span className="text-sm font-bold text-slate-900">{current.day.label}</span>
                <span className="ml-auto text-xs text-slate-400">{current.destination.name}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Metric label="安排" value={`${activeActivities.length} 项`} />
                <Metric label="地图点位" value={`${locatedActivities.length} 个`} />
                <Metric label="预订提醒" value={`${nextBookings.length} 项`} />
              </div>
              <button
                onClick={() => onJumpToDay(current.day.id)}
                className="mt-4 w-full rounded-lg border border-[#D6E4EA] bg-[#EEF5F8] px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-card"
              >
                跳到这一天
              </button>
            </div>
          </div>

          <div className="border-t border-[#D6E4EA] bg-card/75 p-5 lg:border-l lg:border-t-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">当天重点</h3>
              <span className="text-xs text-slate-400">点击可联动地图</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {activeActivities.slice(0, 6).map(activity => (
                <button
                  key={activity.id}
                  onClick={() => onFocusActivity(activity)}
                  className="group rounded-lg border border-[#D6E4EA] bg-[#F7FBFC] p-3 text-left transition-colors hover:bg-card"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: current.destination.color }}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-400">{activity.time}</span>
                      <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">
                        {activity.title}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {nextBookings.length > 0 && (
              <div className="mt-4 rounded-lg border border-[#D6E4EA] bg-[#F7FBFC] p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Booking Alerts
                </div>
                <div className="space-y-2">
                  {nextBookings.slice(0, 3).map(item => (
                    <button
                      key={item.activity.id}
                      onClick={() => onFocusActivity(item.activity)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#EEF5F8]"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: BOOKING_STATUS_COLORS[item.status] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                        {item.day.date} · {item.requirement.label}
                      </span>
                      <span className="text-xs text-slate-400">{BOOKING_STATUS_LABELS[item.status]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#EEF5F8] px-3 py-2">
      <div className="text-base font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

function getDayContexts(itinerary: Itinerary): DayContext[] {
  return itinerary.destinations.flatMap(destination =>
    destination.days.map(day => ({
      day,
      destination,
      isoDate: getIsoDate(day.date),
    }))
  )
}

function getUpcomingBookings(
  days: DayContext[],
  todayIso: string,
  getBookingStatus: Props['getBookingStatus'],
  isActivityActive: Props['isActivityActive']
) {
  return days
    .filter(item => item.isoDate >= todayIso)
    .flatMap(item =>
      item.day.activities
        .filter(activity => isActivityActive(activity.id))
        .map(activity => {
          const requirement = getBookingRequirement(activity.id)
          if (!requirement) return null
          const status = getBookingStatus(activity.id) ?? requirement.status
          if (status !== 'todo' && status !== 'optional') return null
          return { ...item, activity, requirement, status }
        })
    )
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function getIsoDate(dateLabel: string) {
  const [month, day] = dateLabel.split('/').map(Number)
  return `${TRIP_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getTodayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayDiff(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T00:00:00`)
  const to = Date.parse(`${toIso}T00:00:00`)
  return Math.max(0, Math.ceil((to - from) / 86400000))
}
