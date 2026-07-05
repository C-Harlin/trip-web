import { itinerary } from '../data/itinerary'
import type { Destination } from '../types/itinerary'

interface Props {
  isDestinationActive: (destId: string) => boolean
  onDestinationClick: (destId: string) => void
}

function DestinationCard({
  dest,
  isActive,
  onClick,
}: {
  dest: Destination
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[200px] text-left p-5 rounded-2xl border transition-all cursor-pointer ${
        isActive ? '' : 'opacity-40'
      }`}
      style={{
        borderColor: isActive ? dest.color + '50' : 'rgba(255,255,255,0.08)',
        background: dest.color + '12',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: dest.color }}
        />
        <span className="font-semibold text-sm" style={{ color: dest.color }}>
          {dest.nameEn}
        </span>
        <span className="text-muted text-xs ml-auto">{dest.days.length} 天</span>
      </div>

      {/* Chinese name */}
      <div className="text-base font-bold mb-2">{dest.name}</div>

      {/* Description */}
      <div className="text-muted text-xs leading-relaxed line-clamp-3">
        {dest.coverDescription}
      </div>
    </button>
  )
}

export function DestinationCards({ isDestinationActive, onDestinationClick }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex gap-4 flex-wrap md:flex-nowrap">
        {itinerary.destinations.map(dest => (
          <DestinationCard
            key={dest.id}
            dest={dest}
            isActive={isDestinationActive(dest.id)}
            onClick={() => onDestinationClick(dest.id)}
          />
        ))}
      </div>
    </div>
  )
}
