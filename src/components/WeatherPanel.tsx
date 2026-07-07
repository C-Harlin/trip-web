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
      <div className="mx-3 mb-2 border-y border-[#D6E4EA] py-3 text-xs text-muted">
        天气与穿搭加载中...
      </div>
    )
  }

  const sourceLabel = weather.source === 'forecast' ? '实时预报' : '季节参考'

  return (
    <div className="mx-3 mb-2 border-y border-[#D6E4EA] py-3">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: destination.color + '22', color: destination.color }}
          aria-hidden="true"
        >
          {getWeatherIcon(weather.weatherCode)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-900">天气与穿搭</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full border"
              style={{ borderColor: destination.color + '55', color: destination.color }}
            >
              {sourceLabel}
            </span>
            <span className="text-xs text-muted ml-auto">{weather.date.slice(5)}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg font-bold text-slate-900">
              {weather.tempMin}-{weather.tempMax}°C
            </span>
            <span className="text-xs text-muted">
              体感 {weather.apparentMin}-{weather.apparentMax}°C · {weather.summary}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted">
            <Metric label="降雨" value={`${weather.precipitationProbability}%`} />
            <Metric label="风速" value={`${weather.windSpeedMax}km/h`} />
            <Metric label="UV" value={String(weather.uvIndexMax)} />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-700">
            {advice.summary}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {advice.tags.map(tag => (
              <span
                key={tag}
                  className="text-[10px] px-2 py-1 rounded-full bg-[#E7F0F4] text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>

          {weather.note && (
            <div className="mt-2 text-[10px] text-muted">
              {weather.note} · 数据源 Open-Meteo
            </div>
          )}
          {!weather.note && (
            <div className="mt-2 text-[10px] text-muted">数据源 Open-Meteo</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
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
