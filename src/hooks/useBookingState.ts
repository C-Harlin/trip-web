import { useCallback, useState } from 'react'
import { bookingRequirements } from '../data/booking'
import type { BookingStatus } from '../types/itinerary'

const STORAGE_KEY = 'trip-booking-status-v1'

type BookingStatusOverrides = Record<string, BookingStatus>

function readBookingOverrides(): BookingStatusOverrides {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as BookingStatusOverrides : {}
  } catch {
    return {}
  }
}

function writeBookingOverrides(overrides: BookingStatusOverrides) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function useBookingState() {
  const [overrides, setOverrides] = useState<BookingStatusOverrides>(readBookingOverrides)

  const getStatus = useCallback(
    (activityId: string): BookingStatus | undefined =>
      overrides[activityId] ?? bookingRequirements[activityId]?.status,
    [overrides]
  )

  const setStatus = useCallback((activityId: string, status: BookingStatus) => {
    setOverrides(prev => {
      const next = { ...prev, [activityId]: status }
      writeBookingOverrides(next)
      return next
    })
  }, [])

  const resetBookingStatus = useCallback(() => {
    setOverrides({})
    writeBookingOverrides({})
  }, [])

  return {
    getStatus,
    setStatus,
    resetBookingStatus,
  }
}
