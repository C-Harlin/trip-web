import { useEffect, useMemo, useState } from 'react'
import type { Activity, Day, Destination } from '../types/itinerary'
import { getDayWeather, type DayWeather } from '../services/weather'
import { getOutfitAdvice } from '../utils/outfitAdvice'

interface Props {
  day: Day
  destination: Destination
  activities: Activity[]
}

export function WeatherPanel({ day, destination, activities }: Props) {
  const [weather, setWeather] = useState<DayWeather | null>(null)
  const [loading, setLoading] = useState(true)
  const activityKey = activities.map(a => a.id).join('|')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const requestActivities = activities

    getDayWeather({
      dateLabel: day.date,
      destinationId: destination.id,
      destinationName: destination.nameEn,
      activities: requestActivities,
    }).then(data => {
      if (!cancelled) {
        setWeather(data)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityKey, day.date, destination.id, destination.nameEn])

  const advice = useMemo(
    () => weather ? getOutfitAdvice(weather, activities) : null,
    [activities, weather]
  )

  if (loading || !weather || !advice) {
    return (
      <div className="mx-2 mb-2 rounded-lg border border-[#D6E4EA] bg-card/80 p-2 text-xs text-muted md:mx-3 md:mb-3 md:p-3">
        天气与穿搭加载中...
      </div>
    )
  }

  const sourceLabel = weather.source === 'forecast' ? '实时预报' : '季节参考'

  return (
    <div
      className="mx-2 mb-2 overflow-hidden rounded-lg border border-[#D6E4EA] bg-gradient-to-br from-card via-[#F7FBFC] to-[#EAF4F7] shadow-sm md:mx-3 md:mb-3"
      style={{ boxShadow: `0 12px 32px ${destination.color}12` }}
    >
      <div
        className="h-1 w-full"
        style={{ background: destination.color }}
      />
      <div className="flex items-start gap-2 p-2.5 md:gap-3 md:p-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-base shadow-sm md:h-12 md:w-12 md:text-xl"
          style={{ background: destination.color + '22', color: destination.color }}
          aria-hidden="true"
        >
          {getWeatherIcon(weather.weatherCode)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-slate-900 md:text-sm">今日旅行提示</span>
            <span
              className="hidden rounded-full border px-1.5 py-0.5 text-[10px] sm:inline-flex"
              style={{ borderColor: destination.color + '55', color: destination.color }}
            >
              {sourceLabel}
            </span>
            <span className="text-xs text-muted ml-auto">{weather.date.slice(5)}</span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 md:mt-1 md:gap-x-3 md:gap-y-1">
            <span className="text-base font-bold text-slate-900 md:text-lg">
              {weather.tempMin}-{weather.tempMax}°C
            </span>
            <span className="text-xs text-muted">
              体感 {weather.apparentMin}-{weather.apparentMax}°C · {weather.summary}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] text-muted md:mt-3 md:gap-2 md:text-[11px]">
            <Metric label="降雨" value={`${weather.precipitationProbability}%`} />
            <Metric label="风速" value={`${weather.windSpeedMax}km/h`} />
            <Metric label="UV" value={String(weather.uvIndexMax)} />
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-700 md:mt-3 md:line-clamp-none">
            {advice.summary}
          </p>

          <div className="mt-1.5 hidden flex-wrap gap-1 md:mt-2 md:flex md:gap-1.5">
            {advice.tags.map(tag => (
              <span
                key={tag}
                  className="rounded-full bg-[#E7F0F4] px-1.5 py-0.5 text-[10px] text-slate-600 md:px-2 md:py-1"
              >
                {tag}
              </span>
            ))}
          </div>

          {weather.note && (
            <div className="mt-1.5 hidden text-[10px] text-muted md:mt-2 md:block">
              {weather.note} · 数据源 Open-Meteo
            </div>
          )}
          {!weather.note && (
            <div className="mt-1.5 hidden text-[10px] text-muted md:mt-2 md:block">数据源 Open-Meteo</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white/55 px-1.5 py-1 md:px-2 md:py-1.5">
      <div className="text-slate-400">{label}</div>
      <div className="text-slate-700 font-medium truncate">{value}</div>
    </div>
  )
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫'
  if (code <= 67) return '🌧'
  if (code <= 77) return '❄'
  if (code <= 82) return '🌦'
  return '⛈'
}
