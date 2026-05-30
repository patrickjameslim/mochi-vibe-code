import { CalendarBlankIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '../../atoms'
import { getDateRangeLabel } from './utils/getDateRangeLabel/getDateRangeLabel'

interface DateRangeSelectorProps {
  dateRange?: DateRange
  onSelect: (range?: DateRange) => void
}

/**
 * Adapted from shadcn/ui's Range Calendar component examples
 *
 * **Key differences:**
 * - Added button trigger to open the calendar in a popover
 * - Integrated `getDateRangeLabel` for displaying selected date range
 *
 * **Reference:** https://ui.shadcn.com/docs/components/calendar#range-calendar
 */
export const DateRangeSelector = ({
  dateRange,
  onSelect,
}: DateRangeSelectorProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="justify-between"
          colorScheme="secondary"
        >
          <CalendarBlankIcon />
          <Text
            data-placeholder={!dateRange?.from && !dateRange?.to}
            className="data-[placeholder=true]:text-muted-foreground"
          >
            {getDateRangeLabel(dateRange)}
          </Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onSelect}
          numberOfMonths={2}
          className="rounded-lg border shadow-sm"
          showOutsideDays={false}
        />
      </PopoverContent>
    </Popover>
  )
}
