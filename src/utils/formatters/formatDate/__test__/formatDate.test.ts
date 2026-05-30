import { formatDate } from '../formatDate.js'

describe('formatDate', () => {
  it('should format date string to MM DD, YYYY', () => {
    expect(formatDate('10/25/2025')).toBe('Oct 25, 2025')
    expect(formatDate('October 25, 2025')).toBe('Oct 25, 2025')
    expect(formatDate('2025-10-25T08:00:00')).toBe('Oct 25, 2025')
  })

  it('should format date object to MM DD, YYYY', () => {
    expect(formatDate(new Date('10/25/2025'))).toBe('Oct 25, 2025')
  })

  it('should format date in millisecond to MM DD, YYYY', () => {
    expect(formatDate(new Date(1763015465636))).toBe('Nov 13, 2025')
  })
})
