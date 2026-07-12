export type ActivityType =
  | 'transport'
  | 'attraction'
  | 'food'
  | 'accommodation'
  | 'nature'

export type BookingStatus =
  | 'todo'
  | 'booked'
  | 'optional'
  | 'not_needed'

export interface BookingRequirement {
  activityId: string
  status: BookingStatus
  label: string
  bookingUrl?: string
  sourceName?: string
  deadline?: string
  note: string
}

export interface BookingDetail {
  reference?: string
  note?: string
  updatedAt?: string
}

export interface Activity {
  id: string           // 格式: {dest}-d{n}-a{n}，如 "syd-d1-a1"
  time: string         // "19:00" 或 "上午" 等
  title: string
  description: string
  type: ActivityType
  lat?: number         // 有值时在地图显示标记
  lng?: number
  mapLabel?: string    // 地图标注文字，默认用 title
  googleMapsUrl?: string
  isAlternative?: boolean
}

export interface Day {
  id: string           // 格式: {dest}-d{n}，如 "syd-d1"
  date: string         // "9/25"
  weekday: string      // "周五"
  label: string        // "抵达悉尼"
  activities: Activity[]
}

export interface Destination {
  id: string           // "sydney" | "gor" | "melbourne"
  name: string         // "悉尼 Sydney"
  nameEn: string       // "Sydney"
  color: string        // "#3B82F6"
  coverDescription: string
  photoUrl: string
  photoAlt: string
  photoCredit: string
  days: Day[]
}

export interface Itinerary {
  title: string
  subtitle: string
  dateRange: string
  destinations: Destination[]
}
