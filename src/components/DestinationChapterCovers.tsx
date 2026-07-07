import { itinerary } from '../data/itinerary'

export function DestinationChapterCovers() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Chapters
          </div>
          <h2 className="text-lg font-bold text-slate-900">目的地章节</h2>
        </div>
        <div className="hidden text-sm text-slate-500 md:block">按城市和路段进入详细行程</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {itinerary.destinations.map((destination, index) => {
          const firstDay = destination.days[0]
          const lastDay = destination.days[destination.days.length - 1]

          return (
            <article
              key={destination.id}
              className="group relative min-h-[220px] overflow-hidden rounded-lg border border-[#D6E4EA] bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(42,68,82,0.16)]"
            >
              <img
                src={destination.photoUrl}
                alt={destination.photoAlt}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/32 to-white/12" />
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{ background: destination.color }}
              />

              <div className="relative flex h-full min-h-[220px] flex-col justify-between p-5 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/18 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                    0{index + 1}
                  </span>
                  <span className="rounded-full bg-white/18 px-2.5 py-1 text-xs backdrop-blur">
                    {firstDay.date} - {lastDay.date}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-white/72">
                    {destination.nameEn}
                  </div>
                  <h3 className="mt-1 text-2xl font-bold leading-tight">{destination.name}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/82">
                    {destination.coverDescription}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {destination.days.slice(0, 3).map(day => (
                      <span
                        key={day.id}
                        className="rounded-full bg-white/16 px-2.5 py-1 text-xs text-white/85 backdrop-blur"
                      >
                        {day.date} {day.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
