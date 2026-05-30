import { CalendarBlankIcon } from '@phosphor-icons/react'

import {
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../atoms'
import { useDatePickerInputActions } from './hooks/useDatePickerInputActions'
import { InputGroup, InputRightElement } from '../InputGroup'

interface DatePickerInputProps {
  /** The last month/year that can be displayed in the calendar dropdown (e.g., Oct 2025). */
  endMonth?: Date
  /** HTML id attribute for the input element. */
  id?: string
  /** HTML name attribute for the input element. */
  name?: string
  /** Callback function called when the input loses focus. */
  onBlur?: () => void
  /** Callback function called when the input date value changes. Receives the new date string. */
  onChange: (date: string) => void
  /** Placeholder text for the input field. Defaults to "Enter or select date". */
  placeholder?: string
  /** The first month/year that can be displayed in the calendar dropdown (e.g., Jan 2020). */
  startMonth?: Date
  /**
   * The current date value. Accepts flexible date formats including but not limited to:
   *   - ISO format: "2025-12-05"
   *   - US format: "12-05-2025" or "12/05/2025"
   *   - European format: "05/12/2025"
   *   - Natural language: "Dec 5, 2025", "December 5, 2025"
   *   - Abbreviated: "5 Dec 2025", "Dec 5 2025"
   *   - Empty string for no selection: ""
   */
  value: string
  isInvalid?: boolean
}

/**
 * Adapted from Shadcn UI's Date Picker with Input example
 *
 * Key Differences:
 * - Accepts onChange and value props to control the input value instead of internal state
 * - Move actions into a hook
 * - Transforms the input value into a standard format on blur if the input is a valid date
 * - Utilize zod for validating and formatting the date inputs
 * - Allows setting the start and end month of the calendar
 *
 * Reference: https://ui.shadcn.com/docs/components/date-picker#picker-with-input
 */
export const DatePickerInput = ({
  endMonth,
  id,
  name,
  onBlur,
  onChange,
  placeholder,
  startMonth,
  value,
  isInvalid,
}: DatePickerInputProps) => {
  const {
    handleBlur,
    handleChange,
    handleKeyDown,
    handleMonthChange,
    handleOpenChange,
    handleSelect,
    open,
    date,
  } = useDatePickerInputActions({ onChange, onBlur, value })

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <InputGroup aria-invalid={isInvalid}>
          <Input
            id={id}
            name={name}
            value={value}
            placeholder={placeholder || 'Enter or select date'}
            className="bg-white pr-10"
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />

          <InputRightElement>
            <Button
              variant="ghost"
              colorScheme="secondary"
              type="button"
              size="icon"
            >
              <CalendarBlankIcon className="size-4" />
              <span className="sr-only">Select date</span>
            </Button>
          </InputRightElement>
        </InputGroup>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto overflow-hidden p-0"
        align="end"
        alignOffset={-8}
        sideOffset={10}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          month={date}
          onMonthChange={handleMonthChange}
          onSelect={handleSelect}
          startMonth={startMonth}
          endMonth={endMonth}
        />
      </PopoverContent>
    </Popover>
  )
}
