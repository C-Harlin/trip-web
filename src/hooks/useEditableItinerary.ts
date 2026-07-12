import { useCallback, useMemo, useState } from 'react'
import { itinerary as baseItinerary } from '../data/itinerary'
import type { Activity, Itinerary } from '../types/itinerary'

const STORAGE_KEY = 'trip-itinerary-edits-v1'
type DayActivities = Record<string, Activity[]>

function readEdits(): DayActivities {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as DayActivities
  } catch {
    return {}
  }
}

function writeEdits(edits: DayActivities) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(edits))
}

function getBaseActivities(dayId: string) {
  return baseItinerary.destinations
    .flatMap(destination => destination.days)
    .find(day => day.id === dayId)?.activities ?? []
}

export function useEditableItinerary() {
  const [edits, setEdits] = useState<DayActivities>(readEdits)

  const updateDay = useCallback((dayId: string, updater: (activities: Activity[]) => Activity[]) => {
    setEdits(current => {
      const source = current[dayId] ?? getBaseActivities(dayId)
      const next = { ...current, [dayId]: updater(source) }
      writeEdits(next)
      return next
    })
  }, [])

  const updateActivity = useCallback((dayId: string, activityId: string, patch: Partial<Activity>) => {
    updateDay(dayId, activities => activities.map(activity =>
      activity.id === activityId ? { ...activity, ...patch } : activity
    ))
  }, [updateDay])

  const addActivity = useCallback((dayId: string, activity: Omit<Activity, 'id'>) => {
    updateDay(dayId, activities => [
      ...activities,
      { ...activity, id: `${dayId}-custom-${Date.now().toString(36)}` },
    ])
  }, [updateDay])

  const moveActivity = useCallback((dayId: string, activityId: string, direction: -1 | 1) => {
    updateDay(dayId, activities => {
      const index = activities.findIndex(activity => activity.id === activityId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= activities.length) return activities
      const next = [...activities]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [updateDay])

  const removeActivity = useCallback((dayId: string, activityId: string) => {
    updateDay(dayId, activities => activities.filter(activity => activity.id !== activityId))
  }, [updateDay])

  const resetEdits = useCallback(() => {
    setEdits({})
    window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  const itinerary = useMemo<Itinerary>(() => ({
    ...baseItinerary,
    destinations: baseItinerary.destinations.map(destination => ({
      ...destination,
      days: destination.days.map(day => ({
        ...day,
        activities: edits[day.id] ?? day.activities,
      })),
    })),
  }), [edits])

  return { itinerary, updateActivity, addActivity, moveActivity, removeActivity, resetEdits }
}
