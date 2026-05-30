import dayjs from 'dayjs'
import type { DateRange } from 'react-day-picker'

export const getDateRangeLabel = (range?: DateRange) => {
  const from = range?.from
    ? dayjs(range.from).format(DEFAULT_DATE_RANGE_FORMAT)
    : DATE_RANGE_PLACEHOLDER

  const to = range?.to
    ? dayjs(range.to).format(DEFAULT_DATE_RANGE_FORMAT)
    : DATE_RANGE_PLACEHOLDER

  return `${from} - ${to}`
}

const DEFAULT_DATE_RANGE_FORMAT = 'MM/DD/YYYY'
const DATE_RANGE_PLACEHOLDER = 'mm/dd/yyyy'
