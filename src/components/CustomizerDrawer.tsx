import { itinerary } from '../data/itinerary'

interface DrawerState {
  isActivityActive: (id: string) => boolean
  isDayActive: (dayId: string) => boolean
  isDestinationActive: (destId: string) => boolean
  toggleActivity: (id: string) => void
  toggleDay: (dayId: string) => void
  toggleDestination: (destId: string) => void
  resetAll: () => void
}

interface Props {
  isOpen: boolean
  onClose: () => void
  state: DrawerState
}

export function CustomizerDrawer({ isOpen, onClose, state }: Props) {
  const {
    isActivityActive,
    isDayActive,
    isDestinationActive,
    toggleActivity,
    toggleDay,
    toggleDestination,
    resetAll,
  } = state

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-[#161B22] border-l border-white/10 z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-base">定制行程</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {itinerary.destinations.map(dest => {
            const destActive = isDestinationActive(dest.id)
            return (
              <div
                key={dest.id}
                className="rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Destination header */}
                <label
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                  style={{ background: dest.color + '18' }}
                >
                  <input
                    type="checkbox"
                    checked={destActive}
                    onChange={() => toggleDestination(dest.id)}
                    className="w-4 h-4 cursor-pointer rounded"
                    style={{ accentColor: dest.color }}
                  />
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: dest.color }}
                  />
                  <span className="font-semibold text-sm flex-1" style={{ color: dest.color }}>
                    {dest.name}
                  </span>
                  <span className="text-muted text-xs">{dest.days.length}天</span>
                </label>

                {/* Days */}
                {dest.days.map(day => {
                  const dayActive = isDayActive(day.id)
                  return (
                    <div key={day.id} className="border-t border-white/5">
                      {/* Day row */}
                      <label className="flex items-center gap-3 px-4 py-2 cursor-pointer select-none bg-white/3 hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={dayActive}
                          onChange={() => toggleDay(day.id)}
                          className="w-3.5 h-3.5 cursor-pointer ml-1"
                          style={{ accentColor: dest.color }}
                        />
                        <span className="text-xs font-medium">{day.date}</span>
                        <span className="text-muted text-xs">{day.weekday}</span>
                        <span className="text-muted text-xs ml-auto truncate">{day.label}</span>
                      </label>

                      {/* Activities */}
                      {day.activities.map(activity => {
                        const actActive = isActivityActive(activity.id)
                        return (
                          <label
                            key={activity.id}
                            className="flex items-start gap-3 px-4 py-1.5 cursor-pointer select-none hover:bg-white/3 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={actActive}
                              onChange={() => toggleActivity(activity.id)}
                              className="w-3 h-3 mt-0.5 cursor-pointer ml-4 flex-shrink-0"
                              style={{ accentColor: dest.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-muted text-xs">{activity.time}</div>
                              <div
                                className={`text-xs leading-tight ${
                                  actActive ? 'text-white' : 'text-muted line-through'
                                }`}
                              >
                                {activity.title}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90"
            style={{ background: '#3B82F6', color: '#fff' }}
          >
            生成我的行程 ✓
          </button>
          <button
            onClick={() => {
              resetAll()
            }}
            className="w-full py-2 text-muted text-xs hover:text-white transition-colors"
          >
            恢复全部默认
          </button>
        </div>
      </div>
    </>
  )
}
