import { describe, it, expect, beforeEach } from 'vitest'
import { getSkippedFromUrl, setSkippedToUrl, encodeSkipped, decodeSkipped } from './urlState'

describe('encodeSkipped / decodeSkipped', () => {
  it('encodes empty set to empty string', () => {
    expect(encodeSkipped(new Set())).toBe('')
  })

  it('encodes set to comma-separated string', () => {
    const result = encodeSkipped(new Set(['syd-d1-a1', 'gor-d2-a3']))
    expect(result.split(',')).toContain('syd-d1-a1')
    expect(result.split(',')).toContain('gor-d2-a3')
  })

  it('decodes empty string to empty set', () => {
    expect(decodeSkipped('')).toEqual(new Set())
  })

  it('decodes comma-separated string to set', () => {
    const result = decodeSkipped('syd-d1-a1,gor-d2-a3')
    expect(result).toEqual(new Set(['syd-d1-a1', 'gor-d2-a3']))
  })

  it('round-trips: encode then decode returns same set', () => {
    const original = new Set(['syd-d1-a1', 'mel-d3-a2'])
    expect(decodeSkipped(encodeSkipped(original))).toEqual(original)
  })
})

describe('getSkippedFromUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('returns empty set when no skip param', () => {
    expect(getSkippedFromUrl()).toEqual(new Set())
  })

  it('returns decoded set when skip param present', () => {
    window.history.replaceState({}, '', '/?skip=syd-d1-a1,gor-d2-a3')
    expect(getSkippedFromUrl()).toEqual(new Set(['syd-d1-a1', 'gor-d2-a3']))
  })
})

describe('setSkippedToUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('removes skip param when set is empty', () => {
    window.history.replaceState({}, '', '/?skip=syd-d1-a1')
    setSkippedToUrl(new Set())
    expect(window.location.search).toBe('')
  })

  it('sets skip param when set has items', () => {
    setSkippedToUrl(new Set(['syd-d1-a1']))
    expect(window.location.search).toContain('skip=')
    expect(window.location.search).toContain('syd-d1-a1')
  })
})
