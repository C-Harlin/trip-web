import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Activity } from '../types/itinerary'
import { supabase } from './supabase'

export type DayActivities = Record<string, Activity[]>

export interface CloudTrip {
  id: string
  title: string
  document: DayActivities
  version: number
  updated_at: string
  invite_token?: string
}

function requireClient() {
  if (!supabase) throw new Error('supabase_not_configured')
  return supabase
}

export async function getCurrentUser() {
  const { data, error } = await requireClient().auth.getUser()
  if (error && error.name !== 'AuthSessionMissingError') throw error
  return data.user
}

export async function sendMagicLink(email: string) {
  const redirectUrl = new URL(window.location.href)
  redirectUrl.hash = ''
  const { error } = await requireClient().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl.toString() },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut()
  if (error) throw error
}

export async function createCloudTrip(title: string, document: DayActivities) {
  const { data, error } = await requireClient().rpc('create_trip', {
    trip_title: title,
    trip_document: document,
  }).single()
  if (error) throw error
  return data as CloudTrip
}

export async function loadCloudTrip(tripId: string) {
  const { data, error } = await requireClient()
    .from('trips')
    .select('id,title,document,version,updated_at')
    .eq('id', tripId)
    .single()
  if (error) throw error
  return data as CloudTrip
}

export async function joinCloudTrip(tripId: string, inviteToken: string) {
  const { error } = await requireClient().rpc('join_trip', {
    target_trip_id: tripId,
    target_invite_token: inviteToken,
  })
  if (error) throw error
}

export async function saveCloudTrip(tripId: string, version: number, document: DayActivities) {
  const { data, error } = await requireClient().rpc('update_trip_document', {
    target_trip_id: tripId,
    expected_version: version,
    next_document: document,
  }).single()
  if (error) throw error
  return data as CloudTrip
}

export function subscribeToCloudTrip(tripId: string, onChange: (trip: CloudTrip) => void) {
  const client = requireClient()
  const channel: RealtimeChannel = client
    .channel(`trip:${tripId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'trips',
      filter: `id=eq.${tripId}`,
    }, payload => onChange(payload.new as CloudTrip))
    .subscribe()

  return () => { void client.removeChannel(channel) }
}
