import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'
import {
  useInputGroupContext,
  defaultInputGroupSize,
  inputGroupSizeVariants,
} from '../../molecules/InputGroup'

const inputVariants = cva(
  'placeholder:text-muted-foreground transition-[color,box-shadow] w-full min-w-0 outline-none px-3 py-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: inputGroupSizeVariants,
      variant: {
        outline: 'border bg-white rounded-[8px]',
        unstyled: 'border-0 bg-transparent h-full',
      },
    },
    defaultVariants: {
      size: defaultInputGroupSize,
      variant: 'outline',
    },
  }
)

interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, readOnly, ...props }, ref) => {
    const ctx = useInputGroupContext()
    const appliedVariant = ctx ? 'unstyled' : variant

    return (
      <input
        ref={ref}
        className={cn(
          inputVariants({ size: size ?? ctx?.size, variant: appliedVariant }),
          'file:text-foreground dark:bg-input/30 file:h-full file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:pr-2',
          'focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[0.5px]',
          'aria-invalid:ring-destructive dark:aria-invalid:ring-destructive aria-invalid:border-destructive aria-invalid:focus-visible:ring-[0.5px]',
          'group-focus-within/input:focus:ring-0 group-focus-within/input:focus:shadow-none group-focus-within/input:focus:border-transparent',
          'group-has-[[data-slot=input-left-element]]/input:pl-0',
          'group-has-[[data-slot=input-right-element]]/input:pr-0',
          className
        )}
        readOnly={readOnly}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input, type InputProps }
