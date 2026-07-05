import { useRef, useCallback } from 'react'
import { itinerary } from '../data/itinerary'
import type { Activity, Day } from '../types/itinerary'

// Type alias for the Google Map instance (avoid importing the full library at module level)
type GoogleMapInstance = {
  panTo: (latLng: { lat: number; lng: number }) => void
  setZoom: (zoom: number) => void
  fitBounds: (bounds: google.maps.LatLngBounds, padding: number) => void
}

export function useMapSync() {
  const mapRef = useRef<GoogleMapInstance | null>(null)

  const onMapLoad = useCallback((map: GoogleMapInstance) => {
    mapRef.current = map
  }, [])

  /**
   * Pan and zoom the map to encompass all activities of a given day.
   */
  const panToDay = useCallback((dayId: string) => {
    const map = mapRef.current
    if (!map) return

    const activities = getActivitiesForDay(dayId).filter(a => a.lat && a.lng)
    if (activities.length === 0) return

    if (activities.length === 1) {
      map.panTo({ lat: activities[0].lat!, lng: activities[0].lng! })
      map.setZoom(13)
      return
    }

    // Fit bounds to all activities in the day
    const bounds = new window.google.maps.LatLngBounds()
    activities.forEach(a => bounds.extend({ lat: a.lat!, lng: a.lng! }))
    map.fitBounds(bounds, 80)
  }, [])

  /**
   * Pan the map to a specific activity's location.
   */
  const panToActivity = useCallback((activity: Activity) => {
    const map = mapRef.current
    if (!map || !activity.lat || !activity.lng) return
    map.panTo({ lat: activity.lat, lng: activity.lng })
    map.setZoom(14)
  }, [])

  return { onMapLoad, panToDay, panToActivity }
}

function getActivitiesForDay(dayId: string): Activity[] {
  for (const dest of itinerary.destinations) {
    const day: Day | undefined = dest.days.find(d => d.id === dayId)
    if (day) return day.activities
  }
  return []
}
