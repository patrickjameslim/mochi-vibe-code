import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'
import {
  useInputGroupContext,
  inputGroupSizeVariants,
  defaultInputGroupSize,
} from './context'

const inputGroupAddonVariants = cva(
  'inline-flex shrink-0 items-center justify-center bg-muted text-muted-foreground px-3 py-1',
  {
    variants: {
      size: inputGroupSizeVariants,
    },
    defaultVariants: {
      size: defaultInputGroupSize,
    },
  }
)

const InputLeftAddon = ({
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof inputGroupAddonVariants>) => {
  const ctx = useInputGroupContext()
  return (
    <div
      data-slot="input-left-addon"
      className={cn(
        inputGroupAddonVariants({ size: ctx?.size }),
        'rounded-l-md border-r',
        className
      )}
      {...props}
    />
  )
}

const InputRightAddon = ({
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof inputGroupAddonVariants>) => {
  const ctx = useInputGroupContext()

  return (
    <div
      data-slot="input-right-addon"
      className={cn(
        inputGroupAddonVariants({ size: ctx?.size }),
        'rounded-r-md border-l',
        className
      )}
      {...props}
    />
  )
}

export { InputLeftAddon, InputRightAddon }
