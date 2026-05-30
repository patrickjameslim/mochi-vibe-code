import React from 'react'
import { forwardRef } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'
import { PlusIcon, MinusIcon } from '@phosphor-icons/react'
import { Button, type ButtonProps, Input, type InputProps } from '../../atoms'
import { cn } from '../../utils'
import { cva, type VariantProps } from 'class-variance-authority'

export const quantitySelectorVariants = cva('flex items-center', {
  variants: {
    size: {
      xs: 'space-x-1.5',
      sm: 'space-x-2',
      md: 'space-x-2',
      lg: 'space-x-2.5',
      xl: 'space-x-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

type QuantitySelectorSize = Exclude<
  NonNullable<ButtonProps['size']> & NonNullable<InputProps['size']>,
  'icon'
>

export interface QuantitySelectorProps
  extends Omit<React.ComponentProps<'input'>, 'size' | 'onChange'>,
    VariantProps<typeof quantitySelectorVariants> {
  value?: number | string
  onChange?: (value: number | string) => void
  size?: QuantitySelectorSize
  'aria-label'?: string
}

const iconSize: Record<QuantitySelectorSize, string> = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-4',
  lg: 'size-5',
  xl: 'size-5',
}

export const QuantitySelector = forwardRef<
  HTMLInputElement,
  QuantitySelectorProps
>(
  (
    {
      value,
      onChange,
      onBlur,
      name,
      min: minProp = 1,
      max: maxProp = 999,
      step: stepProp = 1,
      disabled = false,
      placeholder,
      size = 'md',
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const min = Number(minProp)
    const max = Number(maxProp)
    const step = Number(stepProp)
    const clamp = (n: number) => Math.max(min, Math.min(max, n))

    const setQty = (n: number) => {
      const clampedValue = clamp(n)
      onChange?.(clampedValue)
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      if (inputValue === '') {
        onChange?.(inputValue)
        return
      }

      const numericValue = Number(inputValue)
      if (!isNaN(numericValue)) {
        onChange?.(numericValue)
      }
    }

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      if (inputValue === '' || isNaN(Number(inputValue))) {
        onChange?.(min)
      } else {
        onChange?.(clamp(Number(inputValue)))
      }
      onBlur?.(e)
    }

    const currentValue =
      typeof value === 'number' ? value : Number(value) || min
    const increment = () => setQty(currentValue + step)
    const decrement = () => setQty(currentValue - step)

    return (
      <div className={cn(quantitySelectorVariants({ size }))}>
        <Button
          type="button"
          colorScheme="secondary"
          variant="outline"
          onClick={decrement}
          disabled={disabled || currentValue <= min}
          aria-label="Decrease quantity"
          size={size}
        >
          <MinusIcon className={iconSize[size ?? 'md']} />
        </Button>
        <Input
          ref={ref}
          type="number"
          min={min}
          max={max}
          step={step}
          name={name}
          value={value === undefined || value === null ? '' : value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          inputMode="numeric"
          placeholder={placeholder || String(min)}
          className={cn(
            '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] w-full',
            className
          )}
          aria-label={ariaLabel}
          size={size}
          {...props}
        />
        <Button
          type="button"
          colorScheme="secondary"
          variant="outline"
          onClick={increment}
          disabled={disabled || currentValue >= max}
          aria-label="Increase quantity"
          size={size}
        >
          <PlusIcon className={iconSize[size ?? 'md']} />
        </Button>
      </div>
    )
  }
)
