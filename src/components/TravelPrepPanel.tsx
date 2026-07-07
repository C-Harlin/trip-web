import { useEffect, useMemo, useState } from 'react'
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  getBookingRequirements,
} from '../data/booking'
import { itinerary } from '../data/itinerary'
import { generatePackingList } from '../utils/packingList'
import type {
  Activity,
  BookingDetail,
  BookingRequirement,
  BookingStatus,
  Day,
  Destination,
} from '../types/itinerary'

interface BookingState {
  getStatus: (activityId: string) => BookingStatus | undefined
  getDetail: (activityId: string) => BookingDetail
  setStatus: (activityId: string, status: BookingStatus) => void
  setDetail: (activityId: string, detail: BookingDetail) => void
  resetBookingStatus: () => void
}

interface Props {
  isActivityActive: (id: string) => boolean
  bookingState: BookingState
  onJumpToDay?: (dayId: string) => void
  onFocusActivity?: (activity: Activity) => void
  mode?: 'summary' | 'booking' | 'packing' | 'full'
  onNavigate?: (view: 'home' | 'booking' | 'packing') => void
}

interface BookingItem {
  requirement: BookingRequirement
  status: BookingStatus
  activity: Activity
  day: Day
  destination: Destination
}

const PACKING_STORAGE_KEY = 'trip-packing-checked-v1'
const STATUS_ORDER: BookingStatus[] = ['todo', 'optional', 'booked', 'not_needed']
type BookingFilter = BookingStatus | 'all'

export function TravelPrepPanel({
  isActivityActive,
  bookingState,
  onJumpToDay,
  onFocusActivity,
  mode = 'full',
  onNavigate,
}: Props) {
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all')
  const bookingItems = useMemo(
    () => getBookingRequirements()
      .map(requirement => {
        const context = findActivityContext(requirement.activityId)
        if (!context) return null

        return {
          requirement,
          status: bookingState.getStatus(requirement.activityId) ?? requirement.status,
          ...context,
        }
      })
      .filter((item): item is BookingItem =>
        item !== null && isActivityActive(item.requirement.activityId)
      )
      .sort((a, b) => {
        const statusDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
        if (statusDiff !== 0) return statusDiff
        return a.day.id.localeCompare(b.day.id)
      }),
    [bookingState, isActivityActive]
  )

  const filteredBookingItems = bookingFilter === 'all'
    ? bookingItems
    : bookingItems.filter(item => item.status === bookingFilter)

  const bookingCounts = STATUS_ORDER.reduce<Record<BookingStatus, number>>((acc, status) => {
    acc[status] = bookingItems.filter(item => item.status === status).length
    return acc
  }, {
    todo: 0,
    booked: 0,
    optional: 0,
    not_needed: 0,
  })

  const resolvedCount = bookingCounts.booked + bookingCounts.not_needed
  const completion = bookingItems.length > 0
    ? Math.round((resolvedCount / bookingItems.length) * 100)
    : 100
  const nextActionItems = bookingItems
    .filter(item => item.status === 'todo' || item.status === 'optional')
    .slice(0, 3)

  const packingItems = useMemo(() => generatePackingList(), [])
  const [checkedPacking, setCheckedPacking] = useState<Set<string>>(readCheckedPacking)

  useEffect(() => {
    window.localStorage.setItem(PACKING_STORAGE_KEY, JSON.stringify([...checkedPacking]))
  }, [checkedPacking])

  const togglePacking = (itemId: string) => {
    setCheckedPacking(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const packingGroups = groupPackingItems(packingItems)
  const mustCount = packingItems.filter(item => item.priority === 'must').length
  const checkedMustCount = packingItems.filter(item =>
    item.priority === 'must' && checkedPacking.has(item.id)
  ).length
  const visiblePackingGroups = mode === 'summary'
    ? Object.entries(packingGroups).map(([category, items]) => [
      category,
      items.filter(item => item.priority === 'must' && !checkedPacking.has(item.id)).slice(0, 2),
    ] as const).filter(([, items]) => items.length > 0).slice(0, 2)
    : Object.entries(packingGroups)

  if (mode === 'summary') {
    return (
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[#D6E4EA] bg-card/92 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(42,68,82,0.10)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Booking
                </div>
                <h2 className="text-lg font-bold text-slate-900">预订状态</h2>
              </div>
              <div className="rounded-lg bg-[#EEF5F8] px-3 py-2 text-right">
                <div className="text-sm font-bold text-slate-900">{completion}%</div>
                <div className="text-xs text-slate-500">完成度</div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-2">
              {STATUS_ORDER.map(status => (
                <div key={status} className="rounded-lg bg-[#EEF5F8] px-3 py-2">
                  <div
                    className="text-lg font-bold"
                    style={{ color: BOOKING_STATUS_COLORS[status] }}
                  >
                    {bookingCounts[status]}
                  </div>
                  <div className="text-xs text-slate-500">{BOOKING_STATUS_LABELS[status]}</div>
                </div>
              ))}
            </div>

            <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#E4EEF3]">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="space-y-2">
              {nextActionItems.map(item => (
                <button
                  key={item.requirement.activityId}
                  onClick={() => {
                    onFocusActivity?.(item.activity)
                    onJumpToDay?.(item.day.id)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg bg-[#F7FBFC] px-3 py-2 text-left transition-colors hover:bg-[#EEF5F8]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: BOOKING_STATUS_COLORS[item.status] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                    {item.day.date} · {item.requirement.label}
                  </span>
                  <span className="text-xs text-slate-400">{BOOKING_STATUS_LABELS[item.status]}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigate?.('booking')}
              className="mt-4 w-full rounded-lg border border-[#D6E4EA] bg-[#EEF5F8] px-3 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-sm"
            >
              查看完整预订
            </button>
          </div>

          <div className="rounded-lg border border-[#D6E4EA] bg-card/92 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(42,68,82,0.10)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Packing
                </div>
                <h2 className="text-lg font-bold text-slate-900">Packing List</h2>
              </div>
              <div className="rounded-lg bg-[#EEF5F8] px-3 py-2 text-right">
                <div className="text-sm font-bold text-slate-900">
                  {checkedMustCount}/{mustCount}
                </div>
                <div className="text-xs text-slate-500">必带完成</div>
              </div>
            </div>

            <div className="space-y-3">
              {visiblePackingGroups.length > 0 ? visiblePackingGroups.map(([category, items]) => (
                <div key={category}>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    {category}
                  </div>
                  <div className="space-y-2">
                    {items.map(item => {
                      const checked = checkedPacking.has(item.id)
                      return (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg bg-[#F7FBFC] p-3 transition-colors hover:bg-[#EEF5F8]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePacking(item.id)}
                            className="mt-1 h-4 w-4 rounded"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {item.reason}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )) : (
                <div className="rounded-lg bg-[#F7FBFC] p-4 text-sm text-slate-500">
                  必带项都已完成，剩下可以按心情慢慢收尾。
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate?.('packing')}
              className="mt-4 w-full rounded-lg border border-[#D6E4EA] bg-[#EEF5F8] px-3 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-sm"
            >
              查看完整清单
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate?.('home')}
          className="rounded-lg border border-[#D6E4EA] bg-card px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-[#EEF5F8]"
        >
          返回总览
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate?.('booking')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              mode === 'booking' || mode === 'full'
                ? 'bg-slate-900 text-white'
                : 'border border-[#D6E4EA] bg-card text-slate-600 hover:bg-[#EEF5F8]'
            }`}
          >
            Booking
          </button>
          <button
            onClick={() => onNavigate?.('packing')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              mode === 'packing'
                ? 'bg-slate-900 text-white'
                : 'border border-[#D6E4EA] bg-card text-slate-600 hover:bg-[#EEF5F8]'
            }`}
          >
            Packing
          </button>
        </div>
      </div>

      <div className={`grid items-start gap-4 ${
        mode === 'full' ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-1'
      }`}>
        {mode !== 'packing' && (
        <div className="rounded-lg border border-[#D6E4EA] bg-card/92 p-5 shadow-sm transition-shadow duration-300 hover:shadow-[0_18px_42px_rgba(42,68,82,0.10)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Booking
              </div>
              <h2 className="text-lg font-bold text-slate-900">预订状态追踪</h2>
            </div>
            <button
              onClick={bookingState.resetBookingStatus}
              className="rounded-lg border border-[#D6E4EA] px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-[#E7F0F4]"
            >
              恢复默认
            </button>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-2">
            {STATUS_ORDER.map(status => (
              <button
                key={status}
                onClick={() => setBookingFilter(bookingFilter === status ? 'all' : status)}
                className={`rounded-lg px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  bookingFilter === status ? 'bg-card shadow-sm ring-1 ring-[#B8C9D3]' : 'bg-[#EEF5F8]'
                }`}
              >
                <div
                  className="text-lg font-bold"
                  style={{ color: BOOKING_STATUS_COLORS[status] }}
                >
                  {bookingCounts[status]}
                </div>
                <div className="text-xs text-slate-500">{BOOKING_STATUS_LABELS[status]}</div>
              </button>
            ))}
          </div>

          <div className="mb-4 rounded-lg border border-[#D6E4EA] bg-[#F7FBFC] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">预订完成度</span>
              <button
                onClick={() => setBookingFilter('all')}
                className="text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
              >
                显示全部
              </button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E4EEF3]">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{resolvedCount}/{bookingItems.length} 已处理</span>
              <span>{completion}%</span>
            </div>
            {nextActionItems.length > 0 && (
              <div className="mt-3 space-y-1">
                {nextActionItems.map(item => (
                  <button
                    key={item.requirement.activityId}
                    onClick={() => {
                      onFocusActivity?.(item.activity)
                      onJumpToDay?.(item.day.id)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#EEF5F8]"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: BOOKING_STATUS_COLORS[item.status] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                      下一步：{item.requirement.label}
                    </span>
                    <span className="text-xs text-slate-400">{item.requirement.deadline ?? '待确认'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {filteredBookingItems.map(item => {
              const detail = bookingState.getDetail(item.requirement.activityId)

              return (
              <div
                key={item.requirement.activityId}
                className="rounded-lg border border-[#D6E4EA] bg-[#F7FBFC] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{
                          background: item.destination.color + '18',
                          color: item.destination.color,
                        }}
                      >
                        {item.day.date}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {item.requirement.label}
                      </span>
                      {item.requirement.deadline && (
                        <span className="text-xs text-slate-400">
                          {item.requirement.deadline}
                        </span>
                      )}
                    </div>
                    <div className="text-xs leading-relaxed text-slate-500">
                      {item.requirement.note}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {item.requirement.bookingUrl && (
                        <a
                          href={item.requirement.bookingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
                        >
                          {item.requirement.sourceName ?? '打开预订页面'}
                        </a>
                      )}
                      <button
                        onClick={() => {
                          onFocusActivity?.(item.activity)
                          onJumpToDay?.(item.day.id)
                        }}
                        className="text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                      >
                        定位行程
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input
                        value={detail.reference ?? ''}
                        onChange={event =>
                          bookingState.setDetail(item.requirement.activityId, {
                            reference: event.target.value,
                          })
                        }
                        placeholder="预订号 / 确认码"
                        className="rounded-lg border border-[#D6E4EA] bg-card px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#B8C9D3]"
                      />
                      <input
                        value={detail.note ?? ''}
                        onChange={event =>
                          bookingState.setDetail(item.requirement.activityId, {
                            note: event.target.value,
                          })
                        }
                        placeholder="备注：人数、场次、取票点"
                        className="rounded-lg border border-[#D6E4EA] bg-card px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#B8C9D3]"
                      />
                    </div>
                  </div>

                  <select
                    value={item.status}
                    onChange={event =>
                      bookingState.setStatus(
                        item.requirement.activityId,
                        event.target.value as BookingStatus
                      )
                    }
                    className="rounded-lg border border-[#D6E4EA] bg-card px-2 py-1.5 text-xs font-medium text-slate-700 outline-none"
                    aria-label={`${item.requirement.label} 预订状态`}
                  >
                    {STATUS_ORDER.map(status => (
                      <option key={status} value={status}>
                        {BOOKING_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              )
            })}
          </div>
        </div>
        )}

        {mode !== 'booking' && (
        <div className="rounded-lg border border-[#D6E4EA] bg-card/92 p-5 shadow-sm transition-shadow duration-300 hover:shadow-[0_18px_42px_rgba(42,68,82,0.10)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Packing
              </div>
              <h2 className="text-lg font-bold text-slate-900">Packing List</h2>
            </div>
            <div className="rounded-lg bg-[#EEF5F8] px-3 py-2 text-right">
              <div className="text-sm font-bold text-slate-900">
                {checkedMustCount}/{mustCount}
              </div>
              <div className="text-xs text-slate-500">必带完成</div>
            </div>
          </div>

          <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1">
            {Object.entries(packingGroups).map(([category, items]) => (
              <div key={category}>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  {category}
                </div>
                <div className="space-y-2">
                  {items.map(item => {
                    const checked = checkedPacking.has(item.id)
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#D6E4EA] bg-[#F7FBFC] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EEF5F8] hover:shadow-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePacking(item.id)}
                          className="mt-1 h-4 w-4 rounded"
                        />
                        <span className="min-w-0">
                          <span
                            className={`block text-sm font-semibold ${
                              checked ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}
                          >
                            {item.label}
                            {item.priority === 'must' && (
                              <span className="ml-2 text-[10px] text-rose-600">必带</span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                            {item.reason}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </section>
  )
}

function findActivityContext(activityId: string) {
  for (const destination of itinerary.destinations) {
    for (const day of destination.days) {
      const activity = day.activities.find(activity => activity.id === activityId)
      if (activity) return { activity, day, destination }
    }
  }
  return null
}

function groupPackingItems(items: ReturnType<typeof generatePackingList>) {
  return items.reduce<Record<string, typeof items>>((groups, item) => {
    groups[item.category] = groups[item.category] ?? []
    groups[item.category].push(item)
    return groups
  }, {})
}

function readCheckedPacking() {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const raw = window.localStorage.getItem(PACKING_STORAGE_KEY)
    return new Set<string>(raw ? JSON.parse(raw) as string[] : [])
  } catch {
    return new Set<string>()
  }
}
