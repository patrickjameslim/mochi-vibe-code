import { describe, it, expect } from 'vitest'
import { getPageItems } from '../getPageItems'

describe('getPageItems', () => {
  it('returns all pages when totalPages is less than or equal to the number of items to display', () => {
    expect(getPageItems({ currentPage: 1, totalPages: 1 })).toEqual([1])
    expect(getPageItems({ currentPage: 1, totalPages: 5 })).toEqual([
      1, 2, 3, 4, 5,
    ])
    expect(getPageItems({ currentPage: 3, totalPages: 7 })).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ])
  })

  it('returns pages with ellipsis before the last page when currentPage is near the beginning', () => {
    expect(getPageItems({ currentPage: 1, totalPages: 10 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      'ellipsis',
      10,
    ])
    expect(getPageItems({ currentPage: 5, totalPages: 10 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      'ellipsis',
      10,
    ])
  })

  it('returns pages with ellipsis after the first page when currentPage is near the end', () => {
    expect(getPageItems({ currentPage: 10, totalPages: 10 })).toEqual([
      1,
      'ellipsis',
      6,
      7,
      8,
      9,
      10,
    ])
    expect(getPageItems({ currentPage: 6, totalPages: 10 })).toEqual([
      1,
      'ellipsis',
      6,
      7,
      8,
      9,
      10,
    ])
  })

  it('shows ellipsis on both sides when currentPage is in the middle', () => {
    expect(getPageItems({ currentPage: 8, totalPages: 15 })).toEqual([
      1,
      'ellipsis',
      7,
      8,
      9,
      'ellipsis',
      15,
    ])
  })

  it('returns a single page item when currentPage is less than or equal to 0', () => {
    expect(getPageItems({ currentPage: 0, totalPages: 15 })).toEqual([1])
    expect(getPageItems({ currentPage: -1, totalPages: 15 })).toEqual([1])
  })

  it('returns a single page item when totalPages is less than or equal to 0', () => {
    expect(getPageItems({ currentPage: 1, totalPages: 0 })).toEqual([1])
    expect(getPageItems({ currentPage: 1, totalPages: -1 })).toEqual([1])
  })
})
