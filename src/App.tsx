import { useState } from 'react'
import { HeroSection } from './components/HeroSection'
import { DestinationCards } from './components/DestinationCards'
import { DayList } from './components/DayList'
import { useItineraryState } from './hooks/useItineraryState'

export default function App() {
  const { skipped, isActivityActive, isDestinationActive } = useItineraryState()
  const [activeDayId, setActiveDayId] = useState<string | null>('syd-d1')

  return (
    <div className="min-h-screen bg-bg text-white">
      <HeroSection skipped={skipped} />
      <DestinationCards
        isDestinationActive={isDestinationActive}
        onDestinationClick={(id) => console.log('clicked', id)}
      />
      <div className="max-w-7xl mx-auto flex" style={{ height: 'calc(100vh - 280px)' }}>
        <div className="w-96 border-r border-white/10 overflow-hidden">
          <DayList
            isActivityActive={isActivityActive}
            activeDayId={activeDayId}
            onDayClick={setActiveDayId}
            onOpenCustomizer={() => console.log('open customizer')}
          />
        </div>
        <div className="flex-1 flex items-center justify-center text-muted">
          地图区域（开发中）
        </div>
      </div>
    </div>
  )
}
