import type { ReactNode } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
}

/**
 * Two-column layout: left 35% (day list), right 65% (map).
 * On mobile, stacks vertically with map collapsing to a fixed height block.
 */
export function ItineraryLayout({ left, right }: Props) {
  return (
    <>
      {/* Desktop: side-by-side */}
      <div className="hidden md:flex" style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>
        {/* Left panel — day list */}
        <div className="w-[35%] min-w-[280px] border-r border-white/10 overflow-hidden">
          {left}
        </div>
        {/* Right panel — map */}
        <div className="flex-1 overflow-hidden">
          {right}
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="flex flex-col md:hidden">
        {/* Map (fixed height) */}
        <div className="h-64 w-full border-b border-white/10">
          {right}
        </div>
        {/* Day list (scrollable) */}
        <div className="flex-1 overflow-hidden">
          {left}
        </div>
      </div>
    </>
  )
}
