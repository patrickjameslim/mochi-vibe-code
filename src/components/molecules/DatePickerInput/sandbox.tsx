import { useState } from 'react'

import { DatePickerInput } from './DatePickerInput'
import { stringToDateCodec } from './hooks/useDatePickerInputActions'
import { Text } from '../../atoms'

export const DatePickerInputSandbox = () => {
  const [value, setValue] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(true)

  return (
    <div className="flex flex-col gap-5">
      <Text as="h3">Date Picker With Input</Text>

      <DatePickerInput
        onChange={(inputValue: string) => setValue(inputValue)}
        value={value}
        onBlur={() => setIsValid(stringToDateCodec.safeDecode(value).success)}
      />

      {!isValid && (
        <Text className="text-red-500">Please enter a valid date</Text>
      )}
    </div>
  )
}
