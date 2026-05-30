import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { DateRangeSelector } from './DateRangeSelector'
import { Text } from '../../atoms'

export const DateRangeSelectorSandbox = () => {
  const [dateRange, setDateRange] = useState<DateRange>()

  return (
    <div className="flex flex-col gap-4">
      <Text as="h4">Date Range Selector</Text>

      <DateRangeSelector dateRange={dateRange} onSelect={setDateRange} />
    </div>
  )
}
