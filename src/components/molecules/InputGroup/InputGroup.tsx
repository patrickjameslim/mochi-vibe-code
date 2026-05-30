import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'
import {
  inputGroupSizeVariants,
  InputGroupSize,
  InputGroupContext,
  defaultInputGroupSize,
} from './context'

const inputGroupVariants = cva(
  'flex w-full items-center border overflow-hidden min-w-0 outline-none rounded-md bg-white',
  {
    variants: {
      size: inputGroupSizeVariants,
    },
    defaultVariants: {
      size: defaultInputGroupSize,
    },
  }
)

const InputGroup = ({
  className,
  size,
  asChild = false,
  grow = false,
  children,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof inputGroupVariants> & {
    size?: InputGroupSize
    asChild?: boolean
    children: React.ReactNode
    grow?: boolean
  }) => {
  const Comp = asChild ? Slot : 'div'
  const value = React.useMemo(() => ({ size }), [size])

  return (
    <InputGroupContext.Provider value={value}>
      <Comp
        role="group"
        data-slot="input-group"
        className={cn(
          inputGroupVariants({ size }),
          'group/input focus-within:border-ring focus-within:ring-ring focus-within:ring-[0.5px]',
          'aria-invalid:ring-destructive dark:aria-invalid:ring-destructive aria-invalid:border-destructive aria-invalid:focus-visible:ring-[0.5px]',
          grow &&
            '!h-auto grid grid-cols-[auto_1fr] gap-1 flex-wrap overflow-visible',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    </InputGroupContext.Provider>
  )
}

export { InputGroup }
