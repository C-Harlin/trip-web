import { HeroSection } from './components/HeroSection'
import { DestinationCards } from './components/DestinationCards'
import { useItineraryState } from './hooks/useItineraryState'

export default function App() {
  const { skipped, isDestinationActive } = useItineraryState()

  return (
    <div className="min-h-screen bg-bg text-white">
      <HeroSection skipped={skipped} />
      <DestinationCards
        isDestinationActive={isDestinationActive}
        onDestinationClick={(id) => console.log('clicked', id)}
      />
    </div>
  )
}
