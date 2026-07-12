import type { Activity } from '../types/itinerary'
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  getBookingRequirement,
} from '../data/booking'
import type { BookingStatus } from '../types/itinerary'
import { Building2, CarFront, Hotel, Leaf, Utensils, type LucideIcon } from 'lucide-react'

const TYPE_ICONS: Record<string, LucideIcon> = {
  transport: CarFront,
  attraction: Building2,
  food: Utensils,
  accommodation: Hotel,
  nature: Leaf,
}

interface Props {
  activity: Activity
  isActive: boolean
  destColor: string
  bookingStatus?: BookingStatus
  sequence?: number
  isFirst?: boolean
  isLast?: boolean
  onHover?: (activity: Activity | null) => void
  onClick?: (activity: Activity) => void
  isFocused?: boolean
}

export function ActivityCard({
  activity,
  isActive,
  destColor,
  bookingStatus,
  sequence,
  isFirst = false,
  isLast = false,
  onHover,
  onClick,
  isFocused = false,
}: Props) {
  const booking = getBookingRequirement(activity.id)
  const status = bookingStatus ?? booking?.status
  const TypeIcon = TYPE_ICONS[activity.type]

  return (
    <div
      className={`group flex gap-3 rounded-xl px-3 py-2 transition-all duration-200 ${
        isActive ? 'opacity-100' : 'opacity-25'
      } ${
        isFocused
          ? 'bg-card shadow-[0_0_0_2px_rgba(59,130,246,0.18),0_10px_24px_rgba(42,68,82,0.10)]'
          : ''
      } ${activity.lat ? 'cursor-pointer hover:bg-[#E7F0F4]' : ''}`}
      onMouseEnter={() => onHover?.(activity)}
      onMouseLeave={() => onHover?.(null)}
      onClick={event => {
        event.stopPropagation()
        onClick?.(activity)
      }}
    >
      <div className="relative flex min-w-[58px] flex-shrink-0 flex-col items-center gap-1">
        {!isFirst && (
          <div
            className="absolute top-0 h-3 w-px opacity-35"
            style={{ background: destColor }}
          />
        )}
        {!isLast && (
          <div
            className="absolute bottom-0 top-7 w-px opacity-35"
            style={{ background: destColor }}
          />
        )}
        <div
          className="z-10 mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border-2 bg-card text-[10px] font-bold shadow-sm transition-transform group-hover:scale-110"
          style={{ borderColor: destColor, color: destColor }}
        >
          {sequence ?? ''}
        </div>
        <span className="text-muted text-xs text-center leading-tight">{activity.time}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1">
          <TypeIcon size={15} strokeWidth={1.9} className="mt-0.5 flex-shrink-0 text-slate-500" />
          <span
            className={`text-sm font-medium leading-tight ${
              isActive ? 'text-slate-900' : 'text-muted line-through'
            }`}
          >
            {activity.title}
          </span>
          {activity.isAlternative && (
            <span className="ml-1 flex-shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              备选
            </span>
          )}
          {booking && status && (
            <span
              className="ml-1 flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                background: BOOKING_STATUS_COLORS[status] + '18',
                color: BOOKING_STATUS_COLORS[status],
              }}
            >
              {BOOKING_STATUS_LABELS[status]}
            </span>
          )}
        </div>
        {activity.description && (
          <p className="text-muted text-xs mt-0.5 leading-relaxed">{activity.description}</p>
        )}
      </div>
    </div>
  )
}
