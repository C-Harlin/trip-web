import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Activity } from '../types/itinerary'
import { supabase } from './supabase'

export type DayActivities = Record<string, Activity[]>

export interface CloudTrip {
  id: string
  title: string
  owner_id: string
  document: DayActivities
  version: number
  updated_at: string
  invite_token?: string
}

export interface TripMember {
  trip_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  display_name: string | null
  created_at: string
}

export interface TripInvite {
  id: string
  trip_id: string
  token: string
  label: string
  created_at: string
  expires_at: string
  accepted_by: string | null
  accepted_at: string | null
  revoked_at: string | null
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

export async function signInAsGuest() {
  const { data, error } = await requireClient().auth.signInAnonymously()
  if (error) throw error
  return data.user
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
    .select('id,title,owner_id,document,version,updated_at')
    .eq('id', tripId)
    .single()
  if (error) throw error
  return data as CloudTrip
}

export async function findOwnedCloudTrip(ownerId: string) {
  const { data, error } = await requireClient()
    .from('trips')
    .select('id,title,owner_id,document,version,updated_at')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as CloudTrip | null
}

export async function joinCloudTrip(tripId: string, inviteToken: string) {
  const { error } = await requireClient().rpc('join_trip', {
    target_trip_id: tripId,
    target_invite_token: inviteToken,
  })
  if (error) throw error
}

export async function acceptTripInvite(inviteToken: string) {
  const { data, error } = await requireClient().rpc('accept_trip_invite', {
    target_invite_token: inviteToken,
  })
  if (error) throw error
  return data as string
}

export async function listTripMembers(tripId: string) {
  const { data, error } = await requireClient()
    .from('trip_members')
    .select('trip_id,user_id,role,display_name,created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TripMember[]
}

export async function listTripInvites(tripId: string) {
  const { data, error } = await requireClient()
    .from('trip_invites')
    .select('id,trip_id,token,label,created_at,expires_at,accepted_by,accepted_at,revoked_at')
    .eq('trip_id', tripId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as TripInvite[]
}

export async function createTripInvite(tripId: string, label: string) {
  const { data, error } = await requireClient().rpc('create_trip_invite', {
    target_trip_id: tripId,
    invite_label: label,
    valid_for_days: 7,
  }).single()
  if (error) throw error
  return data as TripInvite
}

export async function revokeTripInvite(inviteId: string) {
  const { error } = await requireClient().rpc('revoke_trip_invite', {
    target_invite_id: inviteId,
  })
  if (error) throw error
}

export async function removeTripMember(tripId: string, userId: string) {
  const { error } = await requireClient().rpc('remove_trip_member', {
    target_trip_id: tripId,
    target_user_id: userId,
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
