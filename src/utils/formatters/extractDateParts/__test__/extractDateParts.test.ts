import { extractDateParts } from '../extractDateParts.js'

describe('extractDateParts', () => {
  it('should extract month as uppercased 3-letter abbreviation', () => {
    expect(extractDateParts('2025-10-25T08:00:00').month).toBe('OCT')
    expect(extractDateParts('2025-01-01').month).toBe('JAN')
    expect(extractDateParts('2025-12-31').month).toBe('DEC')
  })

  it('should extract the correct day of the month', () => {
    expect(extractDateParts('2025-10-25T08:00:00').day).toBe(25)
    expect(extractDateParts('2025-01-01').day).toBe(1)
    expect(extractDateParts('2025-03-07').day).toBe(7)
  })

  it('should extract the correct year', () => {
    expect(extractDateParts('2025-10-25T08:00:00').year).toBe(2025)
    expect(extractDateParts('1999-06-15').year).toBe(1999)
    expect(extractDateParts('2000-01-01').year).toBe(2000)
  })

  it('should parse ISO 8601 date strings', () => {
    expect(extractDateParts('2025-10-25T08:00:00')).toEqual({
      month: 'OCT',
      day: 25,
      year: 2025,
    })
  })

  it('should parse slash-separated date strings', () => {
    expect(extractDateParts('10/25/2025')).toEqual({
      month: 'OCT',
      day: 25,
      year: 2025,
    })
  })

  it('should parse long-form date strings', () => {
    expect(extractDateParts('October 25, 2025')).toEqual({
      month: 'OCT',
      day: 25,
      year: 2025,
    })
  })
})
