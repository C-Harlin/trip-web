import { itinerary } from '../data/itinerary'
import { ShareButton } from './ShareButton'

interface Props {
  skipped: Set<string>
}

export function HeroSection({ skipped }: Props) {
  const destinations = itinerary.destinations

  const totalDays = destinations.reduce((sum, d) => sum + d.days.length, 0)
  const totalActivities = destinations
    .flatMap(d => d.days.flatMap(day => day.activities))
    .filter(a => !skipped.has(a.id)).length

  return (
    <div className="relative overflow-hidden border-b border-[#D6E4EA] bg-[#EEF5F8]">
      <img
        src="/images/australia-trip-hero.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(238,245,248,0.96)_0%,rgba(238,245,248,0.80)_42%,rgba(238,245,248,0.28)_72%,rgba(238,245,248,0.08)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#EEF5F8] via-[#EEF5F8]/72 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div className="max-w-3xl rounded-lg border border-white/55 bg-white/42 p-5 shadow-[0_18px_60px_rgba(42,68,82,0.10)] backdrop-blur-[2px]">
            <div className="text-slate-500 text-xs tracking-widest uppercase mb-3">旅行攻略</div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-slate-950">
              {itinerary.title}
            </h1>
            <p className="text-slate-600 mt-3 text-base md:text-lg">{itinerary.subtitle}</p>
          </div>
          <div className="mt-1 flex-shrink-0">
            <ShareButton skipped={skipped} />
          </div>
        </div>

        <div className="flex items-center gap-5 md:gap-6 mb-8 rounded-lg border border-[#D6E4EA] bg-card/86 px-4 py-3 shadow-sm backdrop-blur-sm w-fit max-w-full flex-wrap">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-950">{totalDays}</div>
            <div className="text-slate-500 text-xs">天行程</div>
          </div>
          <div className="w-px h-8 bg-[#D6E4EA]" />
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-950">{destinations.length}</div>
            <div className="text-slate-500 text-xs">个目的地</div>
          </div>
          <div className="w-px h-8 bg-[#D6E4EA]" />
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-950">{totalActivities}</div>
            <div className="text-slate-500 text-xs">项活动</div>
          </div>
          <div className="w-px h-8 bg-[#D6E4EA] hidden md:block" />
          <div className="text-slate-600 text-sm hidden md:block">{itinerary.dateRange}</div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {destinations.map(dest => (
            <div
              key={dest.id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm bg-card/86 shadow-sm backdrop-blur-sm"
              style={{
                borderColor: dest.color + '50',
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
          <div className="flex items-center rounded-lg border border-[#D6E4EA] bg-card/86 px-3 py-2 text-sm text-slate-600 shadow-sm backdrop-blur-sm md:hidden">
            {itinerary.dateRange}
          </div>
        </div>
      </div>
    </div>
  )
}
