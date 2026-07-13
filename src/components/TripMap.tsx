import { useMemo, useState, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow, MarkerF } from '@react-google-maps/api'
import type { Activity, Itinerary } from '../types/itinerary'
import { useMapSync } from '../hooks/useMapSync'
import { MapPinned } from 'lucide-react'

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_CENTER = { lat: -37.0, lng: 145.5 }
const DEFAULT_ZOOM = 6
const LIBRARIES: ('marker' | 'places')[] = ['marker']
const MAP_ID_PLACEHOLDERS = new Set(['your_map_style_id_here', 'your_map_id_here'])
const MAP_AUTH_FAILURE_EVENT = 'trip-map-auth-failure'
let googleMapsAuthFailed = false

declare global {
  interface Window {
    gm_authFailure?: () => void
  }
}

if (typeof window !== 'undefined') {
  const previousAuthFailure = window.gm_authFailure
  window.gm_authFailure = () => {
    previousAuthFailure?.()
    googleMapsAuthFailed = true
    window.dispatchEvent(new Event(MAP_AUTH_FAILURE_EVENT))
  }
}

interface Props {
  itinerary: Itinerary
  isActivityActive: (id: string) => boolean
  activeDayId: string | null
  onMarkerClick: (activity: Activity) => void
  hoveredActivity?: Activity | null
  focusedActivity?: Activity | null
  focusSignal?: number
}

interface MarkerData {
  activity: Activity
  color: string
  isActiveDay: boolean
  sequence: number
}

interface RouteLine {
  id: string
  color: string
  isActiveDay: boolean
  path: { lat: number; lng: number }[]
}

/** 截断标注文字，中文约 7 个字符 */
function truncateLabel(text: string, max = 7): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

/** 创建带序号和中文标注的标记 DOM 元素 */
function createMarkerElement(
  color: string,
  label: string,
  isActiveDay: boolean,
  sequence: number
): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.15s ease;
  `

  // 当前天显示清晰序号，非当前天保留低干扰点位。
  const dot = document.createElement('div')
  const dotSize = isActiveDay ? 28 : 8
  dot.style.cssText = `
    width: ${dotSize}px;
    height: ${dotSize}px;
    background: ${color};
    color: #fff;
    border: ${isActiveDay ? '2' : '1'}px solid rgba(255,255,255,${isActiveDay ? '1' : '0.38'});
    border-radius: 50%;
    box-shadow: 0 0 ${isActiveDay ? '14' : '3'}px ${color}${isActiveDay ? 'cc' : '50'};
    flex-shrink: 0;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 800;
    line-height: 1;
    opacity: ${isActiveDay ? '1' : '0.42'};
  `
  dot.textContent = isActiveDay ? String(sequence) : ''

  // 中文标注
  const lbl = document.createElement('div')
  lbl.style.cssText = `
    display: ${isActiveDay ? 'block' : 'none'};
    background: rgba(255,255,255,0.94);
    color: #172033;
    font-size: 12px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
    white-space: nowrap;
    border: 1px solid ${color}70;
    line-height: 1.4;
    letter-spacing: 0.02em;
  `
  lbl.textContent = truncateLabel(label)

  wrap.appendChild(dot)
  wrap.appendChild(lbl)
  return wrap
}

function getGoogleMapsUrl(activity: Activity): string {
  if (activity.googleMapsUrl) return activity.googleMapsUrl

  const query = activity.lat != null && activity.lng != null
    ? `${activity.title} ${activity.lat},${activity.lng}`
    : activity.title

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function TripMap({
  itinerary,
  isActivityActive,
  activeDayId,
  onMarkerClick,
  hoveredActivity,
  focusedActivity,
  focusSignal = 0,
}: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''
  const rawMapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '').trim()
  const mapId = MAP_ID_PLACEHOLDERS.has(rawMapId) ? '' : rawMapId

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    mapIds: mapId ? [mapId] : [],
    libraries: LIBRARIES,
  })

  const { onMapLoad, panToDay, panToActivity } = useMapSync()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [authFailed, setAuthFailed] = useState(googleMapsAuthFailed)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const prevDayId = useRef<string | null>(null)

  useEffect(() => {
    const handleAuthFailure = () => setAuthFailed(true)
    window.addEventListener(MAP_AUTH_FAILURE_EVENT, handleAuthFailure)
    return () => window.removeEventListener(MAP_AUTH_FAILURE_EVENT, handleAuthFailure)
  }, [])

  // Pan to day when activeDayId changes
  useEffect(() => {
    if (!activeDayId) {
      prevDayId.current = null
      return
    }
    if (activeDayId && activeDayId !== prevDayId.current && isLoaded) {
      prevDayId.current = activeDayId
      panToDay(activeDayId)
    }
  }, [activeDayId, isLoaded, panToDay])

  // Pan to a specific activity when cards, booking alerts, or today view focus it.
  useEffect(() => {
    if (
      focusedActivity &&
      focusedActivity.lat != null &&
      focusedActivity.lng != null &&
      isLoaded
    ) {
      setSelectedActivity(focusedActivity)
      panToActivity(focusedActivity)
    }
  }, [focusedActivity, focusSignal, isLoaded, panToActivity])

  // Build one route per day so the map can focus on the active day's sequence.
  const dayRoutes = useMemo<RouteLine[]>(
    () =>
      itinerary.destinations.flatMap(dest =>
        dest.days.map(day => ({
          id: day.id,
          color: dest.color,
          isActiveDay: day.id === activeDayId,
          path: day.activities
            .filter(a => isActivityActive(a.id) && a.lat != null && a.lng != null)
            .map(a => ({ lat: a.lat!, lng: a.lng! })),
        }))
      ),
    [itinerary.destinations, isActivityActive, activeDayId]
  )

  const visibleRoutes = useMemo(
    () => activeDayId ? dayRoutes.filter(line => line.isActiveDay) : dayRoutes,
    [activeDayId, dayRoutes]
  )

  // Build markers list (active activities with coordinates)
  const markers = useMemo<MarkerData[]>(
    () =>
      itinerary.destinations.flatMap(dest =>
        dest.days.flatMap(day =>
          day.activities
            .filter(a => a.lat != null && a.lng != null && isActivityActive(a.id))
            .map((a, index) => ({
              activity: a,
              color: dest.color,
              isActiveDay: day.id === activeDayId,
              sequence: index + 1,
            }))
        )
      ),
    [itinerary.destinations, isActivityActive, activeDayId]
  )

  const activeMarkerIds = useMemo(
    () => new Set(markers.filter(m => m.isActiveDay).map(m => m.activity.id)),
    [markers]
  )

  // Highlight hovered marker without losing active-day stacking priority.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const isHovered = hoveredActivity?.id === id
      const isFocused = focusedActivity?.id === id
      if (isHovered || isFocused) {
        marker.zIndex = 999
        if (marker.element) {
          ;(marker.element as HTMLElement).style.transform = isHovered ? 'scale(1.35)' : 'scale(1.22)'
        }
      } else {
        marker.zIndex = activeMarkerIds.has(id) ? 20 : 1
        if (marker.element) {
          ;(marker.element as HTMLElement).style.transform = 'scale(1)'
        }
      }
    })
  }, [activeMarkerIds, focusedActivity, hoveredActivity])

  // 目的地间转场虚线（悉尼→大洋路→墨尔本）
  const transitPolylines = useMemo(() => {
    const lines: { id: string; path: { lat: number; lng: number }[] }[] = []
    for (let i = 0; i < itinerary.destinations.length - 1; i++) {
      const destA = itinerary.destinations[i]
      const destB = itinerary.destinations[i + 1]
      const allActA = destA.days.flatMap(d => d.activities)
      const allActB = destB.days.flatMap(d => d.activities)
      const lastA = [...allActA].reverse().find(a =>
        isActivityActive(a.id) && a.lat != null && a.lng != null
      )
      const firstB = allActB.find(a =>
        isActivityActive(a.id) && a.lat != null && a.lng != null
      )
      if (lastA && firstB) {
        lines.push({
          id: `${destA.id}-to-${destB.id}`,
          path: [{ lat: lastA.lat!, lng: lastA.lng! }, { lat: firstB.lat!, lng: firstB.lng! }],
        })
      }
    }
    return lines
  }, [itinerary.destinations, isActivityActive])

  const visibleTransitPolylines = activeDayId ? [] : transitPolylines

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMapLoad(map as any)
  }

  // Render Advanced Markers imperatively after map loads
  const renderMarkersOnMap = (map: google.maps.Map) => {
    // Clear old markers
    markersRef.current.forEach(m => { m.map = null })
    markersRef.current.clear()

    // 当天标记排在最前（zIndex 更高）
    const sorted = [...markers].sort((a, b) =>
      Number(b.isActiveDay) - Number(a.isActiveDay)
    )

    sorted.forEach(({ activity, color, isActiveDay, sequence }) => {
      if (activity.lat == null || activity.lng == null) return

      const content = createMarkerElement(
        color,
        activity.mapLabel ?? activity.title,
        isActiveDay,
        sequence
      )

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: activity.lat, lng: activity.lng },
        title: activity.mapLabel ?? activity.title,
        content,
        zIndex: isActiveDay ? 20 : 1,
      })

      marker.addListener('click', () => {
        setSelectedActivity(activity)
        onMarkerClick(activity)
      })

      markersRef.current.set(activity.id, marker)
    })
  }

  // Re-render markers when markers list or activeDayId changes
  useEffect(() => {
    const markerStore = markersRef.current

    if (mapId && mapRef.current && isLoaded) {
      // Advanced markers are used only when a cloud Map ID is configured.
      if (typeof google !== 'undefined' && google.maps.marker?.AdvancedMarkerElement) {
        renderMarkersOnMap(mapRef.current)
      }
    }
    // Cleanup on unmount
    return () => {
      markerStore.forEach(m => { m.map = null })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, isLoaded, activeDayId, mapId])

  if (!apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card text-muted text-sm gap-4">
        <MapPinned size={36} strokeWidth={1.5} className="text-slate-400" />
        <div className="text-center">
          <div className="font-medium mb-1">Google Maps 未配置</div>
          <div className="text-xs opacity-70">请在 .env.local 中设置 VITE_GOOGLE_MAPS_KEY</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-3 bg-[#E8F0F2] px-6 text-center text-sm text-slate-600">
        <MapPinned size={34} strokeWidth={1.5} className="text-slate-500" />
        <div>
          <div className="font-semibold text-slate-800">地图加载失败</div>
          <div className="mt-1 text-xs text-slate-500">请检查 API Key、网站来源限制和 Maps JavaScript API</div>
        </div>
      </div>
    )
  }

  if (authFailed) {
    const allowedOrigin = `${window.location.origin}/*`

    return (
      <div className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-3 bg-[#E8F0F2] px-6 text-center text-sm text-slate-600">
        <MapPinned size={34} strokeWidth={1.5} className="text-slate-500" />
        <div>
          <div className="font-semibold text-slate-800">当前网址未获地图授权</div>
          <div className="mt-1 text-xs text-slate-500">请将以下来源加入 Google Maps API Key 的网站限制</div>
          <code className="mt-2 block break-all rounded bg-white/80 px-2 py-1 text-[11px] text-slate-700">
            {allowedOrigin}
          </code>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card text-muted text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
          地图加载中...
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      onLoad={handleMapLoad}
      options={{
        mapId: mapId || undefined,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: mapId ? undefined : [
          { elementType: 'geometry', stylers: [{ color: '#EAF0F1' }] },
          { elementType: 'labels.icon', stylers: [{ saturation: -45 }, { lightness: 8 }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#53636B' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#F7FAFA' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#DDE9E4' }] },
          { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#D3DEE2' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9E0E8' }] },
        ],
      }}
    >
      {/* Map ID is optional. Standard markers keep the map usable without cloud styling. */}
      {!mapId && markers.map(({ activity, color, isActiveDay, sequence }) => (
        <MarkerF
          key={activity.id}
          position={{ lat: activity.lat!, lng: activity.lng! }}
          title={activity.mapLabel ?? activity.title}
          zIndex={isActiveDay ? 20 : 1}
          label={isActiveDay ? {
            text: String(sequence),
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: '800',
          } : undefined}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: isActiveDay ? 1 : 0.48,
            strokeColor: '#FFFFFF',
            strokeOpacity: isActiveDay ? 1 : 0.7,
            strokeWeight: isActiveDay ? 2 : 1,
            scale: isActiveDay ? 11 : 5,
          }}
          onClick={() => {
            setSelectedActivity(activity)
            onMarkerClick(activity)
          }}
        />
      ))}

      {/* 当前天路线（带方向箭头）；未选择日期时显示全部天路线 */}
      {visibleRoutes.map(line => {
        const isPrimary = Boolean(activeDayId && line.isActiveDay)

        return line.path.length >= 2 ? (
          <Polyline
            key={line.id}
            path={line.path}
            options={{
              strokeColor: line.color,
              strokeOpacity: isPrimary ? 0.88 : 0.24,
              strokeWeight: isPrimary ? 4 : 2,
              geodesic: true,
              zIndex: isPrimary ? 10 : 1,
              icons: [
                {
                  icon: {
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    strokeColor: line.color,
                    strokeOpacity: isPrimary ? 0.95 : 0.28,
                    fillColor: line.color,
                    fillOpacity: isPrimary ? 0.95 : 0.28,
                    scale: isPrimary ? 3 : 2,
                  },
                  offset: '28px',
                  repeat: isPrimary ? '72px' : '120px',
                },
              ],
            }}
          />
        ) : null
      })}

      {/* 目的地间转场路线（灰色虚线：悉尼→大洋路→墨尔本） */}
      {visibleTransitPolylines.map(line => (
        <Polyline
          key={line.id}
          path={line.path}
          options={{
            strokeColor: '#6B7280',
            strokeOpacity: 0,
            strokeWeight: 2,
            geodesic: true,
            icons: [
              {
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 0.6,
                  strokeColor: '#9CA3AF',
                  scale: 3,
                },
                offset: '0',
                repeat: '12px',
              },
              {
                icon: {
                  path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  strokeOpacity: 0.55,
                  strokeColor: '#CBD5E1',
                  fillOpacity: 0.55,
                  fillColor: '#CBD5E1',
                  scale: 2.4,
                },
                offset: '50%',
              },
            ],
          }}
        />
      ))}

      {/* InfoWindow for selected marker */}
      {selectedActivity?.lat && selectedActivity?.lng && (
        <InfoWindow
          position={{ lat: selectedActivity.lat, lng: selectedActivity.lng }}
          onCloseClick={() => setSelectedActivity(null)}
          options={{ pixelOffset: new window.google.maps.Size(0, -14) }}
        >
          <div style={{ color: '#111827', maxWidth: 260, padding: '4px 6px 6px' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15, lineHeight: 1.35 }}>
              {selectedActivity.title}
            </div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.45 }}>
              {selectedActivity.description || selectedActivity.mapLabel}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
              {selectedActivity.time}
            </div>
            <a
              href={getGoogleMapsUrl(selectedActivity)}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                marginTop: 8,
                color: '#1A73E8',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              View Details on Google Maps
            </a>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
