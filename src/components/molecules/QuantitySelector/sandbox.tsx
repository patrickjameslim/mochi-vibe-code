import { useState } from 'react'
import { QuantitySelector } from './QuantitySelector'
import { Text } from '../../atoms'

export const QuantitySelectorSandbox = () => {
  const handleChange = (
    value: string | number,
    setter: (n: number) => void
  ) => {
    setter(value === '' || isNaN(Number(value)) ? 1 : Number(value))
  }

  const [xs, setXs] = useState(1)
  const [sm, setSm] = useState(1)
  const [md, setMd] = useState(1)
  const [lg, setLg] = useState(1)
  const [xl, setXl] = useState(1)

  return (
    <div className="flex flex-col gap-4">
      <Text as="h4">Quantity Selector</Text>
      <QuantitySelector
        size="xs"
        value={xs}
        onChange={(value) => handleChange(value, setXs)}
      />
      <QuantitySelector
        size="sm"
        value={sm}
        onChange={(value) => handleChange(value, setSm)}
      />
      <QuantitySelector
        value={md}
        onChange={(value) => handleChange(value, setMd)}
      />
      <QuantitySelector
        size="lg"
        value={lg}
        onChange={(value) => handleChange(value, setLg)}
      />
      <QuantitySelector
        size="xl"
        value={xl}
        onChange={(value) => handleChange(value, setXl)}
      />
    </div>
  )
}
