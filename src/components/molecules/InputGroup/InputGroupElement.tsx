import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'
import {
  useInputGroupContext,
  inputGroupSizeVariants,
  defaultInputGroupSize,
} from './context'

const inputGroupElementVariants = cva(
  ' relative h-full items-center inline-flex shrink-0 justify-center text-muted-foreground px-3 py-1 [&>button]:h-full ',
  {
    variants: {
      size: {
        xs: `${inputGroupSizeVariants.xs} [&>button]:text-xs has-[button]:p-1.25`,
        sm: `${inputGroupSizeVariants.sm} [&>button]:text-xs has-[button]:p-1.5`,
        md: `${inputGroupSizeVariants.md} [&>button]:text-sm has-[button]:p-1.5`,
        lg: `${inputGroupSizeVariants.lg} [&>button]:text-base has-[button]:p-1.5`,
        xl: `${inputGroupSizeVariants.xl} [&>button]:text-lg has-[button]:p-2`,
      },
    },
    defaultVariants: {
      size: defaultInputGroupSize,
    },
  }
)

const InputLeftElement = ({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof inputGroupElementVariants> & {
    asChild?: boolean
  }) => {
  const ctx = useInputGroupContext()
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      data-slot="input-left-element"
      className={cn(
        'peer/left-element',
        inputGroupElementVariants({ size: ctx?.size }),
        'has-[button]:pr-3',
        className
      )}
      {...props}
    />
  )
}

const InputRightElement = ({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof inputGroupElementVariants> & {
    asChild?: boolean
  }) => {
  const ctx = useInputGroupContext()
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      data-slot="input-right-element"
      className={cn(
        'peer/right-element',
        inputGroupElementVariants({ size: ctx?.size }),
        className
      )}
      {...props}
    />
  )
}

export { InputLeftElement, InputRightElement }
