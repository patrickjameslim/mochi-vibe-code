import dayjs from 'dayjs'
import { useState, type KeyboardEvent } from 'react'
import { z } from 'zod'

interface UseDatePickerInputActionsProps {
  onChange: (date: string) => void
  onBlur?: () => void
  value: string
}

export const useDatePickerInputActions = ({
  onChange,
  value,
  onBlur,
}: UseDatePickerInputActionsProps) => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(
    isValidDate(value) ? dayjs(value).toDate() : undefined
  )

  const handleBlur = (): void => {
    if (onBlur) onBlur()

    if (!value.trim()) {
      onChange('')
      return
    }

    if (isValidDate(value)) {
      onChange(formatDate(dayjs(value).toDate()))
    }
  }

  const handleChange = (inputValue: string): void => {
    if (!open) setOpen(true)

    onChange(inputValue)
    if (isValidDate(inputValue)) {
      setDate(dayjs(inputValue).toDate())
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
    }

    if (e.key === 'Enter') {
      if (isValidDate(value)) {
        onChange(formatDate(dayjs(value).toDate()))
      }
      setOpen(false)
    }
  }

  const handleMonthChange = (month: Date): void => setDate(month)

  const handleOpenChange = (isOpen: boolean): void => setOpen(isOpen)

  const handleSelect = (selectedDate?: Date): void => {
    if (selectedDate) {
      onChange(formatDate(selectedDate))
      setDate(selectedDate)
    }
    setOpen(false)
  }

  return {
    handleBlur,
    handleChange,
    handleKeyDown,
    handleMonthChange,
    handleOpenChange,
    handleSelect,
    open,
    date,
  }
}

const formatDate = (date: Date): string => stringToDateCodec.encode(date)

const isValidDate = (value?: string): value is string => {
  if (!value?.trim()) {
    return false
  }

  return stringToDateCodec.safeDecode(value).success
}

export const stringToDateCodec = z.codec(z.string(), z.date().optional(), {
  decode: (string) => (string.trim() ? dayjs(string).toDate() : undefined),
  encode: (date) => dayjs(date).format(DATE_PICKER_INPUT_DATE_FORMAT),
})

const DATE_PICKER_INPUT_DATE_FORMAT = 'MM/DD/YYYY' as const
