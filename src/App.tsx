import { useEffect, useState, useCallback } from 'react'
import { HeroSection } from './components/HeroSection'
import { DestinationCards } from './components/DestinationCards'
import { TripHighlights } from './components/TripHighlights'
import { TodayView } from './components/TodayView'
import { TravelPrepPanel } from './components/TravelPrepPanel'
import { DestinationChapterCovers } from './components/DestinationChapterCovers'
import { ItineraryLayout } from './components/ItineraryLayout'
import { DayList } from './components/DayList'
import { TripMap } from './components/TripMap'
import { CustomizerDrawer } from './components/CustomizerDrawer'
import { useItineraryState } from './hooks/useItineraryState'
import { useBookingState } from './hooks/useBookingState'
import { itinerary } from './data/itinerary'
import type { Activity } from './types/itinerary'

type AppView = 'home' | 'booking' | 'packing'

function readViewFromHash(): AppView {
  if (typeof window === 'undefined') return 'home'
  if (window.location.hash === '#booking') return 'booking'
  if (window.location.hash === '#packing') return 'packing'
  return 'home'
}

export default function App() {
  const itineraryState = useItineraryState()
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

  const [activeDayId, setActiveDayId] = useState<string | null>('syd-d1')
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [hoveredActivity, setHoveredActivity] = useState<Activity | null>(null)
  const [focusedActivity, setFocusedActivity] = useState<Activity | null>(null)
  const [view, setView] = useState<AppView>(readViewFromHash)

  useEffect(() => {
    const handleHashChange = () => setView(readViewFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = useCallback((nextView: AppView) => {
    const nextHash = nextView === 'home' ? '' : `#${nextView}`
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    } else {
      setView(nextView)
    }
    if (nextView === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const scrollToDay = useCallback((dayId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-day-id="${dayId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [])

  // When a destination card is clicked, scroll to its first day
  const handleDestinationClick = useCallback((destId: string) => {
    const dest = itinerary.destinations.find(d => d.id === destId)
    const firstDay = dest?.days[0]?.id ?? null
    if (firstDay) {
      setActiveDayId(firstDay)
      scrollToDay(firstDay)
    }
  }, [scrollToDay])

  // When a map marker is clicked, highlight its day and scroll left panel
  const handleMarkerClick = useCallback((activity: Activity) => {
    // Extract dayId from activityId: e.g. "syd-d1-a2" → "syd-d1"
    const dayId = activity.id.replace(/-a\d+$/, '')
    setActiveDayId(dayId)
    setFocusedActivity(activity)
    scrollToDay(dayId)
  }, [scrollToDay])

  const handleDayJump = useCallback((dayId: string) => {
    setActiveDayId(dayId)
    scrollToDay(dayId)
  }, [scrollToDay])

  const handleActivityFocus = useCallback((activity: Activity) => {
    const dayId = activity.id.replace(/-a\d+$/, '')
    setActiveDayId(dayId)
    setFocusedActivity(activity)
    if (view !== 'home') {
      navigate('home')
    }
    scrollToDay(dayId)
  }, [navigate, scrollToDay, view])

  if (view !== 'home') {
    return (
      <div className="min-h-screen bg-[#EEF5F8] text-slate-900">
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
    <div className="min-h-screen bg-[#EEF5F8] text-slate-900">
      <HeroSection skipped={skipped} />

      <DestinationCards
        isDestinationActive={isDestinationActive}
        onDestinationClick={handleDestinationClick}
      />

      <TripHighlights />

      <TodayView
        isActivityActive={isActivityActive}
        getBookingStatus={bookingState.getStatus}
        onJumpToDay={handleDayJump}
        onFocusActivity={handleActivityFocus}
      />

      <TravelPrepPanel
        mode="summary"
        isActivityActive={isActivityActive}
        bookingState={bookingState}
        onJumpToDay={handleDayJump}
        onFocusActivity={handleActivityFocus}
        onNavigate={navigate}
      />

      <DestinationChapterCovers />

      <ItineraryLayout
        left={
          <DayList
            isActivityActive={isActivityActive}
            activeDayId={activeDayId}
            onDayClick={setActiveDayId}
            onOpenCustomizer={() => setCustomizerOpen(true)}
            getBookingStatus={bookingState.getStatus}
            onActivityHover={setHoveredActivity}
            onActivityClick={handleActivityFocus}
            focusedActivityId={focusedActivity?.id ?? null}
          />
        }
        right={
          <TripMap
            isActivityActive={isActivityActive}
            activeDayId={activeDayId}
            onMarkerClick={handleMarkerClick}
            hoveredActivity={hoveredActivity}
            focusedActivity={focusedActivity}
          />
        }
      />

      <CustomizerDrawer
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
    </div>
  )
}
