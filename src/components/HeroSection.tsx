import { itinerary } from '../data/itinerary'
import { ShareButton } from './ShareButton'

interface Props {
  skipped: Set<string>
}

export function HeroSection({ skipped }: Props) {
  const destinations = itinerary.destinations

  // Count total active days
  const totalDays = destinations.reduce((sum, d) => sum + d.days.length, 0)
  const totalActivities = destinations
    .flatMap(d => d.days.flatMap(day => day.activities))
    .filter(a => !skipped.has(a.id)).length

  return (
    <div className="relative bg-gradient-to-b from-[#0D1117] via-[#0D1117] to-[#161B22] border-b border-white/10">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute right-0 top-0 opacity-5 w-96 h-96"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Abstract Australia outline shape */}
          <path
            d="M200 50 C250 60 320 80 350 130 C380 180 370 230 340 270 C310 310 260 330 220 350 C180 370 150 360 120 340 C90 320 70 290 60 250 C50 210 60 170 80 140 C100 110 140 90 180 70 Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Top bar */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-muted text-xs tracking-widest uppercase mb-2">旅行攻略</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{itinerary.title}</h1>
            <p className="text-muted mt-1 text-sm">{itinerary.subtitle}</p>
          </div>
          <div className="mt-1">
            <ShareButton skipped={skipped} />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalDays}</div>
            <div className="text-muted text-xs">天行程</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold">{destinations.length}</div>
            <div className="text-muted text-xs">个目的地</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold">{totalActivities}</div>
            <div className="text-muted text-xs">项活动</div>
          </div>
          <div className="w-px h-8 bg-white/20 hidden md:block" />
          <div className="text-muted text-sm hidden md:block">{itinerary.dateRange}</div>
        </div>

        {/* Destination pills */}
        <div className="flex gap-3 flex-wrap">
          {destinations.map(dest => (
            <div
              key={dest.id}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm"
              style={{
                borderColor: dest.color + '50',
                background: dest.color + '15',
                color: dest.color,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: dest.color }}
              />
              <span className="font-semibold">{dest.nameEn}</span>
              <span style={{ opacity: 0.7 }}>{dest.days.length}天</span>
            </div>
          ))}
          <div className="text-muted text-sm flex items-center md:hidden">
            {itinerary.dateRange}
          </div>
        </div>
      </div>
    </div>
  )
}
