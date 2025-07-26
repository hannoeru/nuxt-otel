import { describe, expect, it } from 'vitest'
import { getFilter } from '../../src/runtime/utils'

describe('getFilter', () => {
  it('returns false function when no ignorePath provided', () => {
    const filter = getFilter()
    expect(filter('/any/path')).toBe(false)
  })

  it('creates regex filter when valid regex provided', () => {
    const filter = getFilter('^/api')
    expect(filter('/api/test')).toBe(true)
    expect(filter('/home')).toBe(false)
  })

  it('creates string filter when invalid regex provided', () => {
    const filter = getFilter('api')
    expect(filter('/api/test')).toBe(true)
    expect(filter('/home')).toBe(false)
  })

  it('handles empty string', () => {
    const filter = getFilter('')
    expect(filter('')).toBe(false)
    expect(filter('/any/path')).toBe(false)
  })
})
