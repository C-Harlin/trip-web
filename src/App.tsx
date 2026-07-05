import { useState, useCallback } from 'react'
import { HeroSection } from './components/HeroSection'
import { DestinationCards } from './components/DestinationCards'
import { ItineraryLayout } from './components/ItineraryLayout'
import { DayList } from './components/DayList'
import { TripMap } from './components/TripMap'
import { CustomizerDrawer } from './components/CustomizerDrawer'
import { useItineraryState } from './hooks/useItineraryState'
import { itinerary } from './data/itinerary'
import type { Activity } from './types/itinerary'

export default function App() {
  const itineraryState = useItineraryState()
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

  // When a destination card is clicked, scroll to its first day
  const handleDestinationClick = useCallback((destId: string) => {
    const dest = itinerary.destinations.find(d => d.id === destId)
    const firstDay = dest?.days[0]?.id ?? null
    if (firstDay) {
      setActiveDayId(firstDay)
      // Scroll left panel to that day
      setTimeout(() => {
        const el = document.querySelector(`[data-day-id="${firstDay}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }, [])

  // When a map marker is clicked, highlight its day and scroll left panel
  const handleMarkerClick = useCallback((activity: Activity) => {
    // Extract dayId from activityId: e.g. "syd-d1-a2" → "syd-d1"
    const dayId = activity.id.replace(/-a\d+$/, '')
    setActiveDayId(dayId)
    setTimeout(() => {
      const el = document.querySelector(`[data-day-id="${dayId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [])

  return (
    <div className="min-h-screen bg-bg text-white">
      <HeroSection skipped={skipped} />

      <DestinationCards
        isDestinationActive={isDestinationActive}
        onDestinationClick={handleDestinationClick}
      />

      <ItineraryLayout
        left={
          <DayList
            isActivityActive={isActivityActive}
            activeDayId={activeDayId}
            onDayClick={setActiveDayId}
            onOpenCustomizer={() => setCustomizerOpen(true)}
            onActivityHover={setHoveredActivity}
          />
        }
        right={
          <TripMap
            isActivityActive={isActivityActive}
            activeDayId={activeDayId}
            onMarkerClick={handleMarkerClick}
            hoveredActivity={hoveredActivity}
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
