import type { ReactNode } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
  isMobile?: boolean
}

/**
 * Two-column layout: left 35% (day list), right 65% (map).
 * On mobile, the map is rendered inside the expanded day for local context.
 */
export function ItineraryLayout({ left, right, isMobile = false }: Props) {
  if (isMobile) {
    return (
      <div className="flex flex-col md:hidden">
        <div className="flex-1 overflow-hidden">
          {left}
        </div>
      </div>
    )
  }

  return (
    <div className="hidden border-y border-[#D6E4EA] bg-card shadow-[0_-1px_0_rgba(214,228,234,0.8)] md:flex" style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>
      {/* Desktop: side-by-side */}
      {/* Left panel — day list */}
      <div className="w-[35%] min-w-[280px] border-r border-[#D6E4EA] overflow-hidden">
        {left}
      </div>
      {/* Right panel — map */}
      <div className="flex-1 overflow-hidden" data-trip-map-panel="true">
        {right}
      </div>
    </div>
  )
}
