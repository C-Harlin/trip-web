import { TRIP_YEAR } from '../data/tripConfig'
import type { Activity } from '../types/itinerary'

export type WeatherSource = 'forecast' | 'seasonal'

export interface DayWeather {
  source: WeatherSource
  date: string
  locationName: string
  weatherCode: number
  summary: string
  tempMin: number
  tempMax: number
  apparentMin: number
  apparentMax: number
  precipitationProbability: number
  precipitationSum: number
  windSpeedMax: number
  uvIndexMax: number
  note?: string
}

interface WeatherRequest {
  dateLabel: string
  destinationId: string
  destinationName: string
  activities: Activity[]
}

interface WeatherPoint {
  lat: number
  lng: number
}

interface OpenMeteoDailyResponse {
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    apparent_temperature_max?: number[]
    apparent_temperature_min?: number[]
    precipitation_probability_max?: number[]
    precipitation_sum?: number[]
    wind_speed_10m_max?: number[]
    uv_index_max?: number[]
  }
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const FORECAST_WINDOW_DAYS = 16

const DESTINATION_POINTS: Record<string, WeatherPoint> = {
  sydney: { lat: -33.8688, lng: 151.2093 },
  gor: { lat: -38.681, lng: 143.391 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
}

const SPRING_REFERENCES: Record<string, Omit<DayWeather, 'date' | 'locationName' | 'source'>> = {
  sydney: {
    weatherCode: 2,
    summary: '春季海港天气，白天温和，早晚偏凉',
    tempMin: 14,
    tempMax: 23,
    apparentMin: 13,
    apparentMax: 22,
    precipitationProbability: 28,
    precipitationSum: 0.8,
    windSpeedMax: 22,
    uvIndexMax: 6,
  },
  gor: {
    weatherCode: 3,
    summary: '大洋路春季多风，海边体感会比温度更凉',
    tempMin: 10,
    tempMax: 18,
    apparentMin: 8,
    apparentMax: 16,
    precipitationProbability: 38,
    precipitationSum: 1.2,
    windSpeedMax: 32,
    uvIndexMax: 5,
  },
  melbourne: {
    weatherCode: 3,
    summary: '墨尔本春季温差明显，晴雨变化较快',
    tempMin: 10,
    tempMax: 20,
    apparentMin: 8,
    apparentMax: 18,
    precipitationProbability: 35,
    precipitationSum: 1,
    windSpeedMax: 26,
    uvIndexMax: 5,
  },
}

export async function getDayWeather(request: WeatherRequest): Promise<DayWeather> {
  const date = getTripIsoDate(request.dateLabel)
  const point = getWeatherPoint(request.activities, request.destinationId)

  if (!point || !isForecastDateAvailable(date)) {
    return getSeasonalWeather(request, date)
  }

  const cacheKey = `weather:${request.destinationId}:${date}:${point.lat.toFixed(3)}:${point.lng.toFixed(3)}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  try {
    const params = new URLSearchParams({
      latitude: String(point.lat),
      longitude: String(point.lng),
      timezone: 'auto',
      start_date: date,
      end_date: date,
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'apparent_temperature_max',
        'apparent_temperature_min',
        'precipitation_probability_max',
        'precipitation_sum',
        'wind_speed_10m_max',
        'uv_index_max',
      ].join(','),
    })

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`)

    const json = await res.json() as OpenMeteoDailyResponse
    const daily = json.daily
    if (!daily?.time?.length) throw new Error('Open-Meteo response has no daily data')

    const weather: DayWeather = {
      source: 'forecast',
      date,
      locationName: request.destinationName,
      weatherCode: daily.weather_code?.[0] ?? 0,
      summary: getWeatherSummary(daily.weather_code?.[0] ?? 0),
      tempMin: round(daily.temperature_2m_min?.[0]),
      tempMax: round(daily.temperature_2m_max?.[0]),
      apparentMin: round(daily.apparent_temperature_min?.[0]),
      apparentMax: round(daily.apparent_temperature_max?.[0]),
      precipitationProbability: round(daily.precipitation_probability_max?.[0]),
      precipitationSum: round(daily.precipitation_sum?.[0], 1),
      windSpeedMax: round(daily.wind_speed_10m_max?.[0]),
      uvIndexMax: round(daily.uv_index_max?.[0], 1),
    }

    writeCache(cacheKey, weather)
    return weather
  } catch {
    return getSeasonalWeather(request, date, '实时预报暂时不可用，先显示季节参考')
  }
}

export function getWeatherSummary(code: number): string {
  if (code === 0) return '晴朗'
  if (code <= 3) return '多云间晴'
  if (code <= 48) return '雾或低云'
  if (code <= 67) return '有雨'
  if (code <= 77) return '降雪'
  if (code <= 82) return '阵雨'
  if (code <= 99) return '雷阵雨'
  return '天气变化'
}

function getTripIsoDate(dateLabel: string): string {
  const [month, day] = dateLabel.split('/').map(Number)
  return `${TRIP_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getWeatherPoint(activities: Activity[], destinationId: string): WeatherPoint | null {
  const coords = activities.filter((a): a is Activity & { lat: number; lng: number } =>
    a.lat != null && a.lng != null
  )

  if (coords.length === 0) return DESTINATION_POINTS[destinationId] ?? null

  const total = coords.reduce(
    (sum, activity) => ({
      lat: sum.lat + activity.lat,
      lng: sum.lng + activity.lng,
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: total.lat / coords.length,
    lng: total.lng / coords.length,
  }
}

function isForecastDateAvailable(date: string): boolean {
  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const target = Date.parse(`${date}T00:00:00Z`)
  const diffDays = Math.floor((target - todayUtc) / 86_400_000)
  return diffDays >= 0 && diffDays <= FORECAST_WINDOW_DAYS
}

function getSeasonalWeather(
  request: WeatherRequest,
  date: string,
  note = '距离出行较久，先显示澳洲春季参考'
): DayWeather {
  const reference = SPRING_REFERENCES[request.destinationId] ?? SPRING_REFERENCES.sydney
  return {
    ...reference,
    source: 'seasonal',
    date,
    locationName: request.destinationName,
    note,
  }
}

function round(value: number | undefined, digits = 0): number {
  if (value == null || Number.isNaN(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function readCache(key: string): DayWeather | null {
  try {
    const value = window.localStorage.getItem(key)
    if (!value) return null
    const parsed = JSON.parse(value) as { expiresAt: number; data: DayWeather }
    if (parsed.expiresAt < Date.now()) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(key: string, data: DayWeather): void {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, data })
    )
  } catch {
    // Cache is a performance nicety; the UI should not depend on it.
  }
}
