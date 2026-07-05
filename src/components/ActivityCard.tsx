import type { Activity } from '../types/itinerary'

const TYPE_ICONS: Record<string, string> = {
  transport: '🚗',
  attraction: '🏛',
  food: '🍴',
  accommodation: '🏨',
  nature: '🌿',
}

interface Props {
  activity: Activity
  isActive: boolean
  destColor: string
  onHover?: (activity: Activity | null) => void
}

export function ActivityCard({ activity, isActive, destColor, onHover }: Props) {
  return (
    <div
      className={`flex gap-3 py-2 px-3 rounded-xl transition-all ${
        isActive ? 'opacity-100' : 'opacity-25'
      } ${activity.lat ? 'cursor-pointer hover:bg-white/5' : ''}`}
      onMouseEnter={() => onHover?.(activity)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Left: color dot + time */}
      <div className="flex flex-col items-center gap-1 min-w-[52px] flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
          style={{ background: destColor }}
        />
        <span className="text-muted text-xs text-center leading-tight">{activity.time}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1">
          <span className="text-sm flex-shrink-0">{TYPE_ICONS[activity.type]}</span>
          <span
            className={`text-sm font-medium leading-tight ${
              isActive ? 'text-white' : 'text-muted line-through'
            }`}
          >
            {activity.title}
          </span>
        </div>
        {activity.description && (
          <p className="text-muted text-xs mt-0.5 leading-relaxed">{activity.description}</p>
        )}
      </div>
    </div>
  )
}
