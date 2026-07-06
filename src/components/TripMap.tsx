import { useMemo, useState, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow } from '@react-google-maps/api'
import { itinerary } from '../data/itinerary'
import type { Activity } from '../types/itinerary'
import { useMapSync } from '../hooks/useMapSync'

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_CENTER = { lat: -37.0, lng: 145.5 }
const DEFAULT_ZOOM = 6
const LIBRARIES: ('marker' | 'places')[] = ['marker']
const MAP_ID_PLACEHOLDERS = new Set(['your_map_style_id_here', 'your_map_id_here'])

interface Props {
  isActivityActive: (id: string) => boolean
  activeDayId: string | null
  onMarkerClick: (activity: Activity) => void
  hoveredActivity?: Activity | null
}

interface MarkerData {
  activity: Activity
  color: string
  isActiveDay: boolean
}

/** 截断标注文字，中文约 7 个字符 */
function truncateLabel(text: string, max = 7): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

/** 创建带中文标注的标记 DOM 元素 */
function createMarkerElement(color: string, label: string, isActiveDay: boolean): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.15s ease;
  `

  // 彩色圆点
  const dot = document.createElement('div')
  const dotSize = isActiveDay ? 13 : 9
  dot.style.cssText = `
    width: ${dotSize}px;
    height: ${dotSize}px;
    background: ${color};
    border: 2px solid rgba(255,255,255,${isActiveDay ? '1' : '0.65'});
    border-radius: 50%;
    box-shadow: 0 0 ${isActiveDay ? '10' : '4'}px ${color}${isActiveDay ? 'cc' : '60'};
    flex-shrink: 0;
  `

  // 中文标注
  const lbl = document.createElement('div')
  lbl.style.cssText = `
    background: rgba(13,17,23,${isActiveDay ? '0.92' : '0.75'});
    color: ${isActiveDay ? '#fff' : 'rgba(255,255,255,0.6)'};
    font-size: ${isActiveDay ? '12' : '10'}px;
    font-weight: ${isActiveDay ? '600' : '400'};
    font-family: system-ui, -apple-system, sans-serif;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
    white-space: nowrap;
    border: 1px solid ${color}${isActiveDay ? '70' : '30'};
    line-height: 1.4;
    letter-spacing: 0.02em;
  `
  lbl.textContent = truncateLabel(label)

  wrap.appendChild(dot)
  wrap.appendChild(lbl)
  return wrap
}

export function TripMap({ isActivityActive, activeDayId, onMarkerClick, hoveredActivity }: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''
  const rawMapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '').trim()
  const mapId = MAP_ID_PLACEHOLDERS.has(rawMapId) ? '' : rawMapId

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    mapIds: mapId ? [mapId] : [],
    libraries: LIBRARIES,
  })

  const { onMapLoad, panToDay } = useMapSync()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const prevDayId = useRef<string | null>(null)

  // Pan to day when activeDayId changes
  useEffect(() => {
    if (activeDayId && activeDayId !== prevDayId.current && isLoaded) {
      prevDayId.current = activeDayId
      panToDay(activeDayId)
    }
  }, [activeDayId, isLoaded, panToDay])

  // Highlight hovered marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const isHovered = hoveredActivity?.id === id
      if (isHovered) {
        marker.zIndex = 999
        // Scale up if supported
        if (marker.element) {
          ;(marker.element as HTMLElement).style.transform = 'scale(1.4)'
        }
      } else {
        marker.zIndex = 1
        if (marker.element) {
          ;(marker.element as HTMLElement).style.transform = 'scale(1)'
        }
      }
    })
  }, [hoveredActivity])

  // Build polylines for each destination (active activities only)
  const polylines = useMemo(
    () =>
      itinerary.destinations.map(dest => ({
        id: dest.id,
        color: dest.color,
        path: dest.days
          .flatMap(d => d.activities)
          .filter(a => isActivityActive(a.id) && a.lat != null && a.lng != null)
          .map(a => ({ lat: a.lat!, lng: a.lng! })),
      })),
    [isActivityActive]
  )

  // Build markers list (active activities with coordinates)
  const markers = useMemo<MarkerData[]>(
    () =>
      itinerary.destinations.flatMap(dest =>
        dest.days.flatMap(day =>
          day.activities
            .filter(a => a.lat != null && a.lng != null && isActivityActive(a.id))
            .map(a => ({
              activity: a,
              color: dest.color,
              isActiveDay: day.id === activeDayId,
            }))
        )
      ),
    [isActivityActive, activeDayId]
  )

  // 目的地间转场虚线（悉尼→大洋路→墨尔本）
  const transitPolylines = useMemo(() => {
    const lines: { id: string; path: { lat: number; lng: number }[] }[] = []
    for (let i = 0; i < itinerary.destinations.length - 1; i++) {
      const destA = itinerary.destinations[i]
      const destB = itinerary.destinations[i + 1]
      const allActA = destA.days.flatMap(d => d.activities)
      const allActB = destB.days.flatMap(d => d.activities)
      const lastA = [...allActA].reverse().find(a => isActivityActive(a.id) && a.lat && a.lng)
      const firstB = allActB.find(a => isActivityActive(a.id) && a.lat && a.lng)
      if (lastA && firstB) {
        lines.push({
          id: `${destA.id}-to-${destB.id}`,
          path: [{ lat: lastA.lat!, lng: lastA.lng! }, { lat: firstB.lat!, lng: firstB.lng! }],
        })
      }
    }
    return lines
  }, [isActivityActive])

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

    sorted.forEach(({ activity, color, isActiveDay }) => {
      if (!activity.lat || !activity.lng) return

      const content = createMarkerElement(
        color,
        activity.mapLabel ?? activity.title,
        isActiveDay
      )

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: activity.lat, lng: activity.lng },
        title: activity.mapLabel ?? activity.title,
        content,
        zIndex: isActiveDay ? 10 : 1,
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

    if (mapRef.current && isLoaded) {
      // Check if AdvancedMarkerElement is available (requires mapId)
      if (typeof google !== 'undefined' && google.maps.marker?.AdvancedMarkerElement) {
        renderMarkersOnMap(mapRef.current)
      }
    }
    // Cleanup on unmount
    return () => {
      markerStore.forEach(m => { m.map = null })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, isLoaded, activeDayId])

  if (!apiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card text-muted text-sm gap-4">
        <div className="text-4xl">🗺️</div>
        <div className="text-center">
          <div className="font-medium mb-1">Google Maps 未配置</div>
          <div className="text-xs opacity-70">请在 .env.local 中设置 VITE_GOOGLE_MAPS_KEY</div>
        </div>
      </div>
    )
  }

  if (!mapId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card text-muted text-sm gap-4">
        <div className="text-4xl">🗺️</div>
        <div className="text-center">
          <div className="font-medium mb-1">Google Maps Map ID 未配置</div>
          <div className="text-xs opacity-70">地点标记需要在 .env.local 中设置 VITE_GOOGLE_MAPS_MAP_ID</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card text-muted text-sm">
        地图加载失败，请检查 API Key 配置
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
        styles: mapId
          ? undefined
          : [
              { elementType: 'geometry', stylers: [{ color: '#212121' }] },
              { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
              { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
              { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
              { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
            ],
      }}
    >
      {/* 目的地内路线（实线，按目的地颜色） */}
      {polylines.map(line =>
        line.path.length >= 2 ? (
          <Polyline
            key={line.id}
            path={line.path}
            options={{
              strokeColor: line.color,
              strokeOpacity: 0.75,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        ) : null
      )}

      {/* 目的地间转场路线（灰色虚线：悉尼→大洋路→墨尔本） */}
      {transitPolylines.map(line => (
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
          <div style={{ color: '#111', maxWidth: 220, padding: '2px 4px' }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
              {selectedActivity.title}
            </div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.4 }}>
              {selectedActivity.description}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              {selectedActivity.time}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
