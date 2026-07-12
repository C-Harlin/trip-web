import { useState } from 'react'
import type { Activity, ActivityType, Itinerary } from '../types/itinerary'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'

interface DrawerState {
  isActivityActive: (id: string) => boolean
  isDayActive: (dayId: string) => boolean
  isDestinationActive: (destId: string) => boolean
  toggleActivity: (id: string) => void
  toggleDay: (dayId: string) => void
  toggleDestination: (destId: string) => void
  resetAll: () => void
}

interface EditorActions {
  updateActivity: (dayId: string, activityId: string, patch: Partial<Activity>) => void
  addActivity: (dayId: string, activity: Omit<Activity, 'id'>) => void
  moveActivity: (dayId: string, activityId: string, direction: -1 | 1) => void
  resetEdits: () => void
}

interface Props {
  isOpen: boolean
  onClose: () => void
  state: DrawerState
  itinerary: Itinerary
  editor: EditorActions
}

interface Draft {
  dayId: string
  activityId?: string
  time: string
  title: string
  description: string
  type: ActivityType
  isAlternative: boolean
}

const ACTIVITY_TYPES: Array<{ value: ActivityType; label: string }> = [
  { value: 'attraction', label: '景点' },
  { value: 'nature', label: '自然' },
  { value: 'food', label: '餐饮' },
  { value: 'transport', label: '交通' },
  { value: 'accommodation', label: '住宿' },
]

export function CustomizerDrawer({ isOpen, onClose, state, itinerary, editor }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const { isActivityActive, isDayActive, isDestinationActive } = state

  const openEditor = (dayId: string, activity?: Activity) => {
    setDraft({
      dayId,
      activityId: activity?.id,
      time: activity?.time ?? '',
      title: activity?.title ?? '',
      description: activity?.description ?? '',
      type: activity?.type ?? 'attraction',
      isAlternative: activity?.isAlternative ?? false,
    })
  }

  const saveDraft = () => {
    if (!draft?.title.trim() || !draft.time.trim()) return
    const activity = {
      time: draft.time.trim(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      type: draft.type,
      isAlternative: draft.isAlternative,
    }
    if (draft.activityId) {
      editor.updateActivity(draft.dayId, draft.activityId, activity)
    } else {
      editor.addActivity(draft.dayId, activity)
    }
    setDraft(null)
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="关闭行程编辑器"
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-[#D6E4EA] bg-card text-slate-900 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#D6E4EA] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">编辑行程</h2>
            <p className="text-xs text-slate-500">调整顺序、内容或加入备选安排</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {itinerary.destinations.map(destination => (
            <section key={destination.id} className="overflow-hidden rounded-lg border border-[#D6E4EA]">
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3" style={{ background: `${destination.color}18` }}>
                <input
                  type="checkbox"
                  checked={isDestinationActive(destination.id)}
                  onChange={() => state.toggleDestination(destination.id)}
                  style={{ accentColor: destination.color }}
                />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: destination.color }} />
                <span className="flex-1 text-sm font-semibold" style={{ color: destination.color }}>{destination.name}</span>
                <span className="text-xs text-slate-500">{destination.days.length} 天</span>
              </label>

              {destination.days.map(day => (
                <div key={day.id} className="border-t border-[#D6E4EA]">
                  <div className="flex items-center gap-2 bg-[#EEF5F8] px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`${day.date} 是否启用`}
                      checked={isDayActive(day.id)}
                      onChange={() => state.toggleDay(day.id)}
                      style={{ accentColor: destination.color }}
                    />
                    <span className="text-xs font-semibold">{day.date}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{day.label}</span>
                    <button type="button" onClick={() => openEditor(day.id)} className="rounded-md border border-[#CADAE2] bg-card px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white">
                      <span className="inline-flex items-center gap-1"><Plus size={13} />景点</span>
                    </button>
                  </div>

                  <div className="divide-y divide-[#E8F0F3]">
                    {day.activities.map((activity, index) => (
                      <div key={activity.id} className="flex items-center gap-2 px-3 py-2 hover:bg-[#F5F9FA]">
                        <input
                          type="checkbox"
                          aria-label={`${activity.title} 是否启用`}
                          checked={isActivityActive(activity.id)}
                          onChange={() => state.toggleActivity(activity.id)}
                          style={{ accentColor: destination.color }}
                        />
                        <button type="button" onClick={() => openEditor(day.id, activity)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400">{activity.time}</span>
                            {activity.isAlternative && <span className="rounded bg-amber-50 px-1 text-[10px] font-semibold text-amber-700">备选</span>}
                          </div>
                          <div className={`truncate text-xs ${isActivityActive(activity.id) ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{activity.title}</div>
                        </button>
                        <div className="flex flex-shrink-0">
                          <MoveButton label="上移" disabled={index === 0} onClick={() => editor.moveActivity(day.id, activity.id, -1)}><ArrowUp size={14} /></MoveButton>
                          <MoveButton label="下移" disabled={index === day.activities.length - 1} onClick={() => editor.moveActivity(day.id, activity.id, 1)}><ArrowDown size={14} /></MoveButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className="space-y-2 border-t border-[#D6E4EA] px-4 py-3">
          <button type="button" onClick={onClose} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">完成编辑</button>
          <button type="button" onClick={() => { state.resetAll(); editor.resetEdits() }} className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-900">恢复默认行程</button>
        </div>
      </aside>

      {draft && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-slate-900/30 p-0 sm:place-items-center sm:p-5">
          <div className="w-full rounded-t-lg border border-[#D6E4EA] bg-card p-5 shadow-2xl sm:max-w-md sm:rounded-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{draft.activityId ? '编辑安排' : '新增安排'}</h3>
              <button type="button" onClick={() => setDraft(null)} aria-label="关闭编辑表单" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <Field label="时间"><input value={draft.time} onChange={event => setDraft({ ...draft, time: event.target.value })} placeholder="09:30" className="input" /></Field>
              <Field label="类型"><select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as ActivityType })} className="input">{ACTIVITY_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Field>
            </div>
            <Field label="名称"><input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="景点或安排名称" className="input" /></Field>
            <Field label="说明"><textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} rows={3} placeholder="交通、停留时间或注意事项" className="input resize-none" /></Field>
            <label className="mt-3 flex items-center gap-2 rounded-lg bg-[#EEF5F8] px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={draft.isAlternative} onChange={event => setDraft({ ...draft, isAlternative: event.target.checked })} />
              标记为备选安排
            </label>
            <button type="button" disabled={!draft.title.trim() || !draft.time.trim()} onClick={saveDraft} className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">保存安排</button>
          </div>
        </div>
      )}
    </>
  )
}

function MoveButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="h-7 w-7 rounded text-sm text-slate-500 hover:bg-[#E7F0F4] disabled:opacity-20">{children}</button>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-3 block text-xs font-semibold text-slate-600"><span className="mb-1 block">{label}</span>{children}</label>
}
