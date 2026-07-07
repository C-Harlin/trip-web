import { useCallback, useState } from 'react'
import { bookingRequirements } from '../data/booking'
import type { BookingDetail, BookingStatus } from '../types/itinerary'

const STATUS_STORAGE_KEY = 'trip-booking-status-v1'
const DETAIL_STORAGE_KEY = 'trip-booking-detail-v1'

type BookingStatusOverrides = Record<string, BookingStatus>
type BookingDetails = Record<string, BookingDetail>

function readBookingOverrides(): BookingStatusOverrides {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STATUS_STORAGE_KEY)
    return raw ? JSON.parse(raw) as BookingStatusOverrides : {}
  } catch {
    return {}
  }
}

function writeBookingOverrides(overrides: BookingStatusOverrides) {
  window.localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(overrides))
}

function readBookingDetails(): BookingDetails {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(DETAIL_STORAGE_KEY)
    return raw ? JSON.parse(raw) as BookingDetails : {}
  } catch {
    return {}
  }
}

function writeBookingDetails(details: BookingDetails) {
  window.localStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify(details))
}

export function useBookingState() {
  const [overrides, setOverrides] = useState<BookingStatusOverrides>(readBookingOverrides)
  const [details, setDetails] = useState<BookingDetails>(readBookingDetails)

  const getStatus = useCallback(
    (activityId: string): BookingStatus | undefined =>
      overrides[activityId] ?? bookingRequirements[activityId]?.status,
    [overrides]
  )

  const getDetail = useCallback(
    (activityId: string): BookingDetail => details[activityId] ?? {},
    [details]
  )

  const setStatus = useCallback((activityId: string, status: BookingStatus) => {
    setOverrides(prev => {
      const next = { ...prev, [activityId]: status }
      writeBookingOverrides(next)
      return next
    })
  }, [])

  const setDetail = useCallback((activityId: string, detail: BookingDetail) => {
    setDetails(prev => {
      const next = {
        ...prev,
        [activityId]: {
          ...prev[activityId],
          ...detail,
          updatedAt: new Date().toISOString(),
        },
      }
      writeBookingDetails(next)
      return next
    })
  }, [])

  const resetBookingStatus = useCallback(() => {
    setOverrides({})
    setDetails({})
    writeBookingOverrides({})
    writeBookingDetails({})
  }, [])

  return {
    getStatus,
    getDetail,
    setStatus,
    setDetail,
    resetBookingStatus,
  }
}
