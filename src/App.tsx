import { useEffect, useState, useCallback } from 'react'
import { HeroSection } from './components/HeroSection'
import { DestinationCards } from './components/DestinationCards'
import { TripHighlights } from './components/TripHighlights'
import { TodayView } from './components/TodayView'
import { TravelPrepPanel } from './components/TravelPrepPanel'
import { ItineraryLayout } from './components/ItineraryLayout'
import { DayList } from './components/DayList'
import { TripMap } from './components/TripMap'
import { MapErrorBoundary } from './components/MapErrorBoundary'
import { CustomizerDrawer } from './components/CustomizerDrawer'
import { MobileBottomNav } from './components/MobileBottomNav'
import { OfflineStatus } from './components/OfflineStatus'
import { useItineraryState } from './hooks/useItineraryState'
import { useBookingState } from './hooks/useBookingState'
import { useEditableItinerary } from './hooks/useEditableItinerary'
import type { Activity } from './types/itinerary'

type AppView = 'home' | 'booking' | 'packing'
type HomeSection = 'overview' | 'today' | 'itinerary' | 'prep'

const HOME_SCROLL_KEY = 'trip-home-scroll-v1'

function readViewFromHash(): AppView {
  if (typeof window === 'undefined') return 'home'
  if (window.location.hash === '#booking') return 'booking'
  if (window.location.hash === '#packing') return 'packing'
  return 'home'
}

export default function App() {
  const editableItinerary = useEditableItinerary()
  const { itinerary } = editableItinerary
  const itineraryState = useItineraryState(itinerary)
  const bookingState = useBookingState()
  const {
    skipped,
    isActivityActive,
    isDayActive,
    isDestinationActive,
    toggleActivity,
    toggleDay,
    toggleDestination,
    resetAll,
  } = itineraryState

  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [hoveredActivity, setHoveredActivity] = useState<Activity | null>(null)
  const [focusedActivity, setFocusedActivity] = useState<Activity | null>(null)
  const [focusSignal, setFocusSignal] = useState(0)
  const [view, setView] = useState<AppView>(readViewFromHash)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleHashChange = () => setView(readViewFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (view !== 'home') return
    const savedScroll = Number(window.sessionStorage.getItem(HOME_SCROLL_KEY) ?? 0)
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedScroll, behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [view])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const navigate = useCallback((nextView: AppView) => {
    if (nextView !== 'home' && view === 'home') {
      window.sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY))
    }
    const nextHash = nextView === 'home' ? '' : `#${nextView}`
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    } else {
      setView(nextView)
    }
  }, [view])

  const navigateHomeSection = useCallback((sectionId: HomeSection) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const scrollToDay = useCallback((dayId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-day-id="${dayId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [])

  const scrollToMap = useCallback((dayId?: string) => {
    setTimeout(() => {
      const scoped = dayId
        ? document.querySelector(`[data-day-id="${dayId}"] [data-trip-map-panel="true"]`)
        : null
      const el = scoped ?? Array.from(document.querySelectorAll('[data-trip-map-panel="true"]')).find(panel => {
        const rect = panel.getBoundingClientRect()
        const style = window.getComputedStyle(panel)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      })
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 90)
  }, [])

  // When a destination card is clicked, scroll to its first day
  const handleDestinationClick = useCallback((destId: string) => {
    const dest = itinerary.destinations.find(d => d.id === destId)
    const firstDay = dest?.days[0]?.id ?? null
    if (firstDay) {
      setActiveDayId(firstDay)
      scrollToMap(firstDay)
    }
  }, [itinerary.destinations, scrollToMap])

  // When a map marker is clicked, highlight its day and scroll left panel
  const handleMarkerClick = useCallback((activity: Activity) => {
    // Extract dayId from activityId: e.g. "syd-d1-a2" → "syd-d1"
    const dayId = activity.id.replace(/-a\d+$/, '')
    setActiveDayId(dayId)
    setFocusedActivity(activity)
    setFocusSignal(signal => signal + 1)
    scrollToDay(dayId)
  }, [scrollToDay])

  const handleDayJump = useCallback((dayId: string) => {
    setActiveDayId(dayId)
    scrollToDay(dayId)
  }, [scrollToDay])

  const handleDayClick = useCallback((dayId: string) => {
    setActiveDayId(current => current === dayId ? null : dayId)
  }, [])

  const handleActivityFocus = useCallback((activity: Activity) => {
    const dayId = activity.id.replace(/-a\d+$/, '')
    setActiveDayId(dayId)
    setFocusedActivity(activity)
    setFocusSignal(signal => signal + 1)
    if (view !== 'home') {
      navigate('home')
    }
    if (isMobile) {
      scrollToMap(dayId)
    } else {
      scrollToDay(dayId)
    }
  }, [isMobile, navigate, scrollToDay, scrollToMap, view])

  const renderTripMap = () => (
    <MapErrorBoundary>
      <TripMap
        itinerary={itinerary}
        isActivityActive={isActivityActive}
        activeDayId={activeDayId}
        onMarkerClick={handleMarkerClick}
        hoveredActivity={hoveredActivity}
        focusedActivity={focusedActivity}
        focusSignal={focusSignal}
      />
    </MapErrorBoundary>
  )

  if (view !== 'home') {
    return (
      <div className="min-h-screen bg-[#EEF5F8] text-slate-900">
        <OfflineStatus />
        <div className="border-b border-[#D6E4EA] bg-card/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Trip Prep
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {view === 'booking' ? '预订状态追踪' : 'Packing List'}
              </h1>
            </div>
            <button
              onClick={() => navigate('home')}
              className="rounded-lg border border-[#D6E4EA] bg-[#EEF5F8] px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-card"
            >
              返回总览
            </button>
          </div>
        </div>

        <TravelPrepPanel
          itinerary={itinerary}
          mode={view}
          isActivityActive={isActivityActive}
          bookingState={bookingState}
          onJumpToDay={handleDayJump}
          onFocusActivity={handleActivityFocus}
          onNavigate={navigate}
        />
      </div>
    )
  }

  return (
    <div id="overview" className="min-h-screen scroll-mt-3 bg-[#EEF5F8] pb-24 text-slate-900 md:pb-0">
      <OfflineStatus />
      <HeroSection itinerary={itinerary} skipped={skipped} collaboration={editableItinerary.collaboration} />

      <DestinationCards
        itinerary={itinerary}
        isDestinationActive={isDestinationActive}
        onDestinationClick={handleDestinationClick}
      />

      <TripHighlights itinerary={itinerary} />

      <div id="today" className="scroll-mt-3">
        <TodayView
          itinerary={itinerary}
          isActivityActive={isActivityActive}
          getBookingStatus={bookingState.getStatus}
          onJumpToDay={handleDayJump}
          onFocusActivity={handleActivityFocus}
        />
      </div>

      <div id="itinerary" className="scroll-mt-3">
        <ItineraryLayout
          isMobile={isMobile}
          left={
          <DayList
              itinerary={itinerary}
              isActivityActive={isActivityActive}
              activeDayId={activeDayId}
              onDayClick={handleDayClick}
              onOpenCustomizer={() => setCustomizerOpen(true)}
              getBookingStatus={bookingState.getStatus}
              onActivityHover={setHoveredActivity}
              onActivityClick={handleActivityFocus}
              focusedActivityId={focusedActivity?.id ?? null}
              mobileMap={isMobile ? renderTripMap() : undefined}
            />
          }
          right={
            isMobile ? null : renderTripMap()
          }
        />
      </div>

      <div id="prep" className="scroll-mt-3 pt-6">
        <TravelPrepPanel
          itinerary={itinerary}
          mode="summary"
          isActivityActive={isActivityActive}
          bookingState={bookingState}
          onJumpToDay={handleDayJump}
          onFocusActivity={handleActivityFocus}
          onNavigate={navigate}
        />
      </div>

      <CustomizerDrawer
        itinerary={itinerary}
        editor={editableItinerary}
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        state={{
          isActivityActive,
          isDayActive,
          isDestinationActive,
          toggleActivity,
          toggleDay,
          toggleDestination,
          resetAll,
        }}
      />

      <MobileBottomNav onNavigate={navigateHomeSection} />
    </div>
  )
}
