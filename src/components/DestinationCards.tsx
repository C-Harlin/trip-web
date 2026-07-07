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
      className={`group flex-1 min-w-[220px] overflow-hidden text-left rounded-lg border transition-all cursor-pointer ${
        isActive ? 'shadow-[0_18px_45px_rgba(42,68,82,0.13)]' : 'opacity-70'
      }`}
      style={{
        borderColor: isActive ? dest.color + '45' : '#D6E4EA',
        background: '#FAFCFC',
      }}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
        <img
          src={dest.photoUrl}
          alt={dest.photoAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/8 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: dest.color }}>
              {dest.nameEn}
            </div>
            <div className="text-lg font-bold text-white leading-tight">{dest.name}</div>
          </div>
          <span className="rounded-lg border border-white/16 bg-black/36 px-2.5 py-1 text-xs text-white/85 backdrop-blur-sm">
            {dest.days.length} 天
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ background: dest.color }}
          />
          <span className="text-xs text-slate-400">{dest.photoCredit}</span>
        </div>
        <div className="text-muted text-sm leading-relaxed line-clamp-3">
          {dest.coverDescription}
        </div>
      </div>
    </button>
  )
}

export function DestinationCards({ isDestinationActive, onDestinationClick }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-5">
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
