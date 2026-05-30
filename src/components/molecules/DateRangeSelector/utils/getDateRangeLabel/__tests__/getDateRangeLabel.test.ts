import dayjs from 'dayjs'
import { describe, it, expect } from 'vitest'

import { getDateRangeLabel } from '../getDateRangeLabel'

describe('getDateRangeLabel', () => {
  it('should return placeholder when no range is provided', () => {
    expect(getDateRangeLabel(undefined)).toBe('mm/dd/yyyy - mm/dd/yyyy')
  })

  it('should return placeholder for from and to when range is undefined', () => {
    expect(getDateRangeLabel({ from: undefined, to: undefined })).toBe(
      'mm/dd/yyyy - mm/dd/yyyy'
    )
  })

  it('should return formatted from date and placeholder for to date when only from is defined', () => {
    expect(getDateRangeLabel({ from: dayjs('01/15/2023').toDate() })).toBe(
      '01/15/2023 - mm/dd/yyyy'
    )
  })

  it('should return placeholder for from date and formatted to date when only to is defined', () => {
    expect(
      getDateRangeLabel({ from: undefined, to: dayjs('01/31/2023').toDate() })
    ).toBe('mm/dd/yyyy - 01/31/2023')
  })

  it('should return formatted from and to dates', () => {
    expect(
      getDateRangeLabel({
        from: dayjs('01/15/2023').toDate(),
        to: dayjs('01/31/2023').toDate(),
      })
    ).toBe('01/15/2023 - 01/31/2023')
  })
})
