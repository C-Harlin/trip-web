import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { itinerary as baseItinerary } from '../data/itinerary'
import { isSupabaseConfigured } from '../services/supabaseConfig'
import type { DayActivities, TripInvite, TripMember } from '../services/tripRepository'
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
  isAnonymous: boolean
  role: TripMember['role'] | null
  members: TripMember[]
  invites: TripInvite[]
  magicLinkSent: boolean
  error: string | null
  requestMagicLink: (email: string) => Promise<void>
  createInvite: (label: string) => Promise<string>
  revokeInvite: (inviteId: string) => Promise<void>
  removeMember: (userId: string) => Promise<void>
  refreshCollaboration: () => Promise<void>
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

function attachTripToUrl(tripId: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('trip', tripId)
  url.searchParams.delete('invite')
  url.hash = ''
  window.history.replaceState({}, '', url)
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [role, setRole] = useState<TripMember['role'] | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [invites, setInvites] = useState<TripInvite[]>([])
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(consumeAuthError)
  const versionRef = useRef<number | null>(null)
  const userReadyRef = useRef(false)
  const saveQueueRef = useRef(Promise.resolve())
  const editsRef = useRef(edits)

  useEffect(() => { editsRef.current = edits }, [edits])

  // Resolve an owner session or claim a one-time guest invitation before loading a trip.
  useEffect(() => {
    if (!isSupabaseConfigured) return

    let active = true
    const inviteToken = getInviteTokenFromUrl()

    import('../services/tripRepository')
      .then(async repository => {
        let user = await repository.getCurrentUser()

        // Existing owners/members may still have the legacy reusable invite in
        // their bookmarked URL. Keep the trip and silently remove that token.
        if (inviteToken && tripId && user) {
          try {
            await repository.loadCloudTrip(tripId)
            if (!active) return
            setCurrentUserId(user.id)
            setUserEmail(user.email ?? null)
            setIsAnonymous(Boolean(user.is_anonymous))
            attachTripToUrl(tripId)
            return
          } catch {
            // Not a member yet; continue with the one-time invitation claim.
          }
        }

        if (inviteToken) {
          if (!user) user = await repository.signInAsGuest()
          if (!user) throw new Error('guest_session_failed')
          const acceptedTripId = await repository.acceptTripInvite(inviteToken)
          if (!active) return
          setCurrentUserId(user.id)
          setUserEmail(user.email ?? null)
          setIsAnonymous(Boolean(user.is_anonymous))
          attachTripToUrl(acceptedTripId)
          setTripId(acceptedTripId)
          return
        }

        if (tripId || !user) {
          if (!user) setStatus('sign-in')
          return
        }

        if (user.is_anonymous) {
          setSyncError('此访客会话没有可加入的邀请，请向行程所有者索取新链接。')
          setStatus('error')
          return
        }

        const configuredOwnerEmail = import.meta.env.VITE_OWNER_EMAIL?.trim().toLowerCase()
        if (configuredOwnerEmail && user.email?.toLowerCase() !== configuredOwnerEmail) {
          setSyncError('该邮箱不是此行程的所有者，请使用邀请链接加入。')
          setStatus('error')
          return
        }

        let trip = await repository.findOwnedCloudTrip(user.id)
        if (!trip) trip = await repository.createCloudTrip(baseItinerary.title, editsRef.current)
        if (!active) return
        setCurrentUserId(user.id)
        setUserEmail(user.email ?? null)
        setIsAnonymous(false)
        attachTripToUrl(trip.id)
        setTripId(trip.id)
      })
      .catch(error => {
        if (!active) return
        const message = error instanceof Error ? error.message : String(error)
        const friendlyMessage = message.includes('Anonymous sign-ins are disabled')
          ? '访客加入尚未启用，请在 Supabase Auth 中开启 Anonymous Sign-Ins。'
          : message.includes('invite_')
            ? '邀请链接无效、已使用或已过期，请联系行程所有者重新邀请。'
            : message
        setSyncError(friendlyMessage)
        setStatus('error')
      })

    return () => { active = false }
  // The initial URL/session is the source of truth for this bootstrap.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        setCurrentUserId(user.id)
        setUserEmail(user.email ?? null)
        setIsAnonymous(Boolean(user.is_anonymous))
        const trip = await repository.loadCloudTrip(tripId)
        const nextMembers = await repository.listTripMembers(tripId)
        if (!active) return
        const nextRole = nextMembers.find(member => member.user_id === user.id)?.role
          ?? (trip.owner_id === user.id ? 'owner' : null)
        if (!nextRole) throw new Error('membership_required')
        versionRef.current = trip.version
        setEdits(trip.document)
        writeEdits(trip.document)
        setMembers(nextMembers)
        setRole(nextRole)
        setInvites(nextRole === 'owner' ? await repository.listTripInvites(tripId) : [])
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

  const refreshCollaboration = useCallback(async () => {
    if (!tripId || !currentUserId) return
    const repository = await import('../services/tripRepository')
    const nextMembers = await repository.listTripMembers(tripId)
    const nextRole = nextMembers.find(member => member.user_id === currentUserId)?.role ?? null
    setMembers(nextMembers)
    setRole(nextRole)
    setInvites(nextRole === 'owner' ? await repository.listTripInvites(tripId) : [])
  }, [currentUserId, tripId])

  const createInvite = useCallback(async (label: string) => {
    if (!tripId || role !== 'owner') throw new Error('仅行程所有者可以邀请成员。')
    const repository = await import('../services/tripRepository')
    const invite = await repository.createTripInvite(tripId, label)
    await refreshCollaboration()
    const url = new URL(window.location.origin + window.location.pathname)
    url.searchParams.set('invite', invite.token)
    return url.toString()
  }, [refreshCollaboration, role, tripId])

  const revokeInvite = useCallback(async (inviteId: string) => {
    const repository = await import('../services/tripRepository')
    await repository.revokeTripInvite(inviteId)
    await refreshCollaboration()
  }, [refreshCollaboration])

  const removeMember = useCallback(async (userId: string) => {
    if (!tripId) return
    const repository = await import('../services/tripRepository')
    await repository.removeTripMember(tripId, userId)
    await refreshCollaboration()
  }, [refreshCollaboration, tripId])

  const leaveCloudTrip = useCallback(async () => {
    const { signOut } = await import('../services/tripRepository')
    await signOut()
    const url = new URL(window.location.href)
    url.searchParams.delete('trip')
    url.searchParams.delete('invite')
    window.history.replaceState({}, '', url)
    setTripId(null)
    setCurrentUserId(null)
    setUserEmail(null)
    setIsAnonymous(false)
    setRole(null)
    setMembers([])
    setInvites([])
    setStatus('sign-in')
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
      isAnonymous,
      role,
      members,
      invites,
      magicLinkSent,
      error: syncError,
      requestMagicLink,
      createInvite,
      revokeInvite,
      removeMember,
      refreshCollaboration,
      leaveCloudTrip,
    },
  }
}
