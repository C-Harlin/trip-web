import { useEffect, useState, type ComponentType } from 'react'
import { CalendarDays, ClipboardCheck, Home, Route } from 'lucide-react'

type SectionId = 'overview' | 'today' | 'itinerary' | 'prep'

interface Props {
  onNavigate: (sectionId: SectionId) => void
}

const items: Array<{ id: SectionId; icon: ComponentType<{ size?: number; strokeWidth?: number }>; label: string }> = [
  { id: 'overview', icon: Home, label: '总览' },
  { id: 'today', icon: CalendarDays, label: '今日' },
  { id: 'itinerary', icon: Route, label: '行程' },
  { id: 'prep', icon: ClipboardCheck, label: '准备' },
]

export function MobileBottomNav({ onNavigate }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  useEffect(() => {
    const update = () => {
      const target = window.scrollY + window.innerHeight * 0.38
      const visible = items
        .map(item => ({ id: item.id, top: document.getElementById(item.id)?.offsetTop ?? 0 }))
        .filter(item => item.top <= target)
        .at(-1)
      setActiveSection(visible?.id ?? 'overview')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <nav
      aria-label="页面导航"
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 grid h-16 grid-cols-4 rounded-lg border border-[#CADAE2] bg-[#FAFCFC]/95 px-1 shadow-[0_12px_34px_rgba(42,68,82,0.16)] backdrop-blur-md md:hidden"
    >
      {items.map(item => {
        const Icon = item.icon
        const active = activeSection === item.id
        return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setActiveSection(item.id)
            onNavigate(item.id)
          }}
          aria-current={active ? 'page' : undefined}
          className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-md transition-colors ${active ? 'text-blue-700' : 'text-slate-500 active:bg-[#E7F0F4] active:text-slate-950'}`}
        >
          {active && <span className="absolute top-0 h-0.5 w-6 rounded-full bg-blue-600" />}
          <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
          <span className="text-[11px] font-semibold leading-4">{item.label}</span>
        </button>
        )
      })}
    </nav>
  )
}
