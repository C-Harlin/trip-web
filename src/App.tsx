import { HeroSection } from './components/HeroSection'
import { useItineraryState } from './hooks/useItineraryState'

export default function App() {
  const { skipped } = useItineraryState()

  return (
    <div className="min-h-screen bg-bg text-white">
      <HeroSection skipped={skipped} />
    </div>
  )
}
