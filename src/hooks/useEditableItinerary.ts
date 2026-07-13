import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { itinerary as baseItinerary } from '../data/itinerary'
import { isSupabaseConfigured } from '../services/supabaseConfig'
import type { DayActivities } from '../services/tripRepository'
import type { Activity, Itinerary } from '../types/itinerary'

const STORAGE_KEY = 'trip-itinerary-edits-v1'

export type CollaborationStatus =
  | 'local'
  | 'sign-in'
  | 'loading'
  | 'synced'
  | 'saving'
  | 'conflict'
  | 'error'

export interface CollaborationController {
  configured: boolean
  tripId: string | null
  status: CollaborationStatus
  userEmail: string | null
  magicLinkSent: boolean
  error: string | null
  requestMagicLink: (email: string) => Promise<void>
  createSharedTrip: () => Promise<string | null>
  leaveCloudTrip: () => Promise<void>
}

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

function getTripIdFromUrl() {
  return new URLSearchParams(window.location.search).get('trip')
}

function getInviteTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('invite')
}

function consumeAuthError(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const errorCode = params.get('error_code')
  if (!params.get('error') && !errorCode) return null

  window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`)
  if (errorCode === 'otp_expired') {
    return '登录链接已失效或已被使用，请重新发送并只打开最新一封邮件。'
  }
  return params.get('error_description')?.replaceAll('+', ' ') ?? '邮箱登录失败，请重新发送登录链接。'
}

function getBaseActivities(dayId: string) {
  return baseItinerary.destinations
    .flatMap(destination => destination.days)
    .find(day => day.id === dayId)?.activities ?? []
}

export function useEditableItinerary() {
  const [edits, setEdits] = useState<DayActivities>(readEdits)
  const [tripId, setTripId] = useState<string | null>(getTripIdFromUrl)
  const [status, setStatus] = useState<CollaborationStatus>('local')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(consumeAuthError)
  const versionRef = useRef<number | null>(null)
  const userReadyRef = useRef(false)
  const saveQueueRef = useRef(Promise.resolve())
  const editsRef = useRef(edits)

  useEffect(() => { editsRef.current = edits }, [edits])

  useEffect(() => {
    if (!isSupabaseConfigured || !tripId) {
      setStatus('local')
      return
    }

    let active = true
    let unsubscribe: (() => void) | undefined
    setStatus('loading')

    import('../services/tripRepository')
      .then(async repository => {
        const user = await repository.getCurrentUser()
        if (!active) return
        if (!user) {
          setStatus('sign-in')
          return
        }
        userReadyRef.current = true
        setUserEmail(user.email ?? null)
        const inviteToken = getInviteTokenFromUrl()
        if (inviteToken) await repository.joinCloudTrip(tripId, inviteToken)
        const trip = await repository.loadCloudTrip(tripId)
        if (!active) return
        versionRef.current = trip.version
        setEdits(trip.document)
        writeEdits(trip.document)
        setStatus('synced')
        unsubscribe = repository.subscribeToCloudTrip(tripId, next => {
          if (next.version <= (versionRef.current ?? 0)) return
          versionRef.current = next.version
          setEdits(next.document)
          writeEdits(next.document)
          setStatus('synced')
        })
      })
      .catch(error => {
        if (!active) return
        setSyncError(error instanceof Error ? error.message : '云端行程加载失败')
        setStatus('error')
      })

    return () => {
      active = false
      userReadyRef.current = false
      unsubscribe?.()
    }
  }, [tripId])

  const queueCloudSave = useCallback((next: DayActivities) => {
    if (!tripId || !userReadyRef.current || versionRef.current == null) return
    setStatus('saving')
    saveQueueRef.current = saveQueueRef.current
      .then(async () => {
        const { saveCloudTrip } = await import('../services/tripRepository')
        const saved = await saveCloudTrip(tripId, versionRef.current!, next)
        versionRef.current = saved.version
        setStatus('synced')
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : String(error)
        setSyncError(message)
        setStatus(message.includes('version_conflict') ? 'conflict' : 'error')
      })
  }, [tripId])

  const updateDay = useCallback((dayId: string, updater: (activities: Activity[]) => Activity[]) => {
    setEdits(current => {
      const source = current[dayId] ?? getBaseActivities(dayId)
      const next = { ...current, [dayId]: updater(source) }
      writeEdits(next)
      queueCloudSave(next)
      return next
    })
  }, [queueCloudSave])

  const updateActivity = useCallback((dayId: string, activityId: string, patch: Partial<Activity>) => {
    updateDay(dayId, activities => activities.map(activity =>
      activity.id === activityId ? { ...activity, ...patch } : activity
    ))
  }, [updateDay])

  const addActivity = useCallback((dayId: string, activity: Omit<Activity, 'id'>) => {
    updateDay(dayId, activities => [
      ...activities,
      { ...activity, id: `${dayId}-custom-${crypto.randomUUID()}` },
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
    queueCloudSave({})
  }, [queueCloudSave])

  const requestMagicLink = useCallback(async (email: string) => {
    const { sendMagicLink } = await import('../services/tripRepository')
    setSyncError(null)
    await sendMagicLink(email)
    setMagicLinkSent(true)
  }, [])

  const createSharedTrip = useCallback(async () => {
    const { createCloudTrip, getCurrentUser } = await import('../services/tripRepository')
    const user = await getCurrentUser()
    if (!user) {
      setStatus('sign-in')
      return null
    }
    const trip = await createCloudTrip(baseItinerary.title, editsRef.current)
    const url = new URL(window.location.href)
    url.searchParams.set('trip', trip.id)
    if (trip.invite_token) url.searchParams.set('invite', trip.invite_token)
    window.history.replaceState({}, '', url)
    setTripId(trip.id)
    return trip.id
  }, [])

  const leaveCloudTrip = useCallback(async () => {
    const { signOut } = await import('../services/tripRepository')
    await signOut()
    setUserEmail(null)
    setStatus(tripId ? 'sign-in' : 'local')
  }, [tripId])

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

  return {
    itinerary,
    updateActivity,
    addActivity,
    moveActivity,
    removeActivity,
    resetEdits,
    collaboration: {
      configured: isSupabaseConfigured,
      tripId,
      status,
      userEmail,
      magicLinkSent,
      error: syncError,
      requestMagicLink,
      createSharedTrip,
      leaveCloudTrip,
    },
  }
}
