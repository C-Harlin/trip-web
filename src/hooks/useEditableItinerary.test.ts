import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEditableItinerary } from './useEditableItinerary'

describe('useEditableItinerary', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(Date, 'now').mockReturnValue(123456)
  })

  it('updates and persists an activity', () => {
    const { result } = renderHook(() => useEditableItinerary())

    act(() => result.current.updateActivity('syd-d1', 'syd-d1-a1', { time: '18:30' }))

    const activity = result.current.itinerary.destinations[0].days[0].activities[0]
    expect(activity.time).toBe('18:30')
    expect(window.localStorage.getItem('trip-itinerary-edits-v1')).toContain('18:30')
  })

  it('adds and reorders a custom activity', () => {
    const { result } = renderHook(() => useEditableItinerary())

    act(() => result.current.addActivity('syd-d1', {
      time: '22:00',
      title: '夜间散步',
      description: '酒店附近',
      type: 'attraction',
      isAlternative: true,
    }))

    const added = result.current.itinerary.destinations[0].days[0].activities.at(-1)!
    expect(added.title).toBe('夜间散步')

    act(() => result.current.moveActivity('syd-d1', added.id, -1))
    const activities = result.current.itinerary.destinations[0].days[0].activities
    expect(activities.at(-2)?.id).toBe(added.id)
  })

  it('restores the base itinerary', () => {
    const { result } = renderHook(() => useEditableItinerary())
    act(() => result.current.updateActivity('syd-d1', 'syd-d1-a1', { title: '已修改' }))
    act(() => result.current.resetEdits())

    expect(result.current.itinerary.destinations[0].days[0].activities[0].title).toBe('悉尼机场抵达')
    expect(window.localStorage.getItem('trip-itinerary-edits-v1')).toBeNull()
  })
})
