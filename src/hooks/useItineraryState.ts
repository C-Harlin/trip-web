import { useState, useCallback } from 'react'
import { getSkippedFromUrl, setSkippedToUrl } from '../utils/urlState'
import type { Destination, Day, Itinerary } from '../types/itinerary'

export function useItineraryState(itinerary: Itinerary) {
  const [skipped, setSkipped] = useState<Set<string>>(getSkippedFromUrl)

  const toggleActivity = useCallback((activityId: string) => {
    setSkipped(prev => {
      const next = new Set(prev)
      if (next.has(activityId)) {
        next.delete(activityId)
      } else {
        // 保证至少 1 个活动可见
        const totalActive = getAllActivityIds(itinerary).length - next.size
        if (totalActive <= 1) return prev
        next.add(activityId)
      }
      setSkippedToUrl(next)
      return next
    })
  }, [itinerary])

  const toggleDay = useCallback((dayId: string) => {
    const dayActivityIds = getActivityIdsForDay(itinerary, dayId)
    setSkipped(prev => {
      const allSkipped = dayActivityIds.every(id => prev.has(id))
      const next = new Set(prev)
      if (allSkipped) {
        // 全部取消 → 全部恢复
        dayActivityIds.forEach(id => next.delete(id))
      } else {
        // 有未跳过的 → 全部跳过（但保证总数不为0）
        const remaining = getAllActivityIds(itinerary).length - next.size - dayActivityIds.filter(id => !prev.has(id)).length
        if (remaining <= 0) return prev
        dayActivityIds.forEach(id => next.add(id))
      }
      setSkippedToUrl(next)
      return next
    })
  }, [itinerary])

  const toggleDestination = useCallback((destId: string) => {
    const destActivityIds = getActivityIdsForDestination(itinerary, destId)
    setSkipped(prev => {
      const allSkipped = destActivityIds.every(id => prev.has(id))
      const next = new Set(prev)
      if (allSkipped) {
        // 全部取消 → 全部恢复
        destActivityIds.forEach(id => next.delete(id))
      } else {
        // 有未跳过的 → 全部跳过（但保证总数不为0）
        const otherActive = getAllActivityIds(itinerary)
          .filter(id => !destActivityIds.includes(id))
          .filter(id => !prev.has(id)).length
        if (otherActive <= 0) return prev
        destActivityIds.forEach(id => next.add(id))
      }
      setSkippedToUrl(next)
      return next
    })
  }, [itinerary])

  const resetAll = useCallback(() => {
    setSkipped(new Set())
    setSkippedToUrl(new Set())
  }, [])

  const isActivityActive = (id: string) => !skipped.has(id)

  const isDayActive = (dayId: string) =>
    !getActivityIdsForDay(itinerary, dayId).every(id => skipped.has(id))

  const isDestinationActive = (destId: string) =>
    !getActivityIdsForDestination(itinerary, destId).every(id => skipped.has(id))

  return {
    skipped,
    toggleActivity,
    toggleDay,
    toggleDestination,
    resetAll,
    isActivityActive,
    isDayActive,
    isDestinationActive,
  }
}

// --- Helpers (module-level, not recreated on each render) ---

function getAllActivityIds(itinerary: Itinerary): string[] {
  return itinerary.destinations.flatMap((d: Destination) =>
    d.days.flatMap((day: Day) => day.activities.map(a => a.id))
  )
}

function getActivityIdsForDay(itinerary: Itinerary, dayId: string): string[] {
  for (const dest of itinerary.destinations) {
    const day = dest.days.find(d => d.id === dayId)
    if (day) return day.activities.map(a => a.id)
  }
  return []
}

function getActivityIdsForDestination(itinerary: Itinerary, destId: string): string[] {
  const dest = itinerary.destinations.find(d => d.id === destId)
  if (!dest) return []
  return dest.days.flatMap(day => day.activities.map(a => a.id))
}
