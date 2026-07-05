import { describe, it, expect } from 'vitest'
import { itinerary } from './itinerary'

describe('itinerary data', () => {
  it('has 3 destinations', () => {
    expect(itinerary.destinations).toHaveLength(3)
  })

  it('has 12 days total', () => {
    const total = itinerary.destinations.reduce((sum, d) => sum + d.days.length, 0)
    expect(total).toBe(12)
  })

  it('all activity IDs are unique', () => {
    const ids = itinerary.destinations
      .flatMap(d => d.days)
      .flatMap(day => day.activities)
      .map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sydney has 5 days', () => {
    const syd = itinerary.destinations.find(d => d.id === 'sydney')!
    expect(syd.days).toHaveLength(5)
  })

  it('gor has 3 days', () => {
    const gor = itinerary.destinations.find(d => d.id === 'gor')!
    expect(gor.days).toHaveLength(3)
  })

  it('melbourne has 4 days', () => {
    const mel = itinerary.destinations.find(d => d.id === 'melbourne')!
    expect(mel.days).toHaveLength(4)
  })

  it('all activity IDs match format {dest}-d{n}-a{n}', () => {
    const ids = itinerary.destinations
      .flatMap(d => d.days)
      .flatMap(day => day.activities)
      .map(a => a.id)
    const pattern = /^[a-z]+-d\d+-a\d+$/
    ids.forEach(id => {
      expect(id).toMatch(pattern)
    })
  })

  it('all destinations have required color field', () => {
    itinerary.destinations.forEach(dest => {
      expect(dest.color).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })
})
