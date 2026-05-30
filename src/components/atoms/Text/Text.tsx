import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const textVariants = cva('', {
  variants: {
    as: {
      h1: 'scroll-m-20 text-4xl font-bold tracking-tight text-balance font-heading',
      h2: 'scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 font-heading',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight font-heading',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight font-heading',
      h5: 'scroll-m-20 text-lg font-semibold tracking-tight font-heading',
      p: 'leading-6',
      span: 'inline',
      muted: 'text-muted-foreground text-sm font-semibold',
    },
  },
  defaultVariants: {
    as: 'p',
  },
})

const Text = ({
  className,
  as,
  asChild = false,
  ...props
}: React.ComponentProps<'p'> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean
  }) => {
  const Comp = asChild ? Slot : 'p'

  return (
    <Comp
      data-slot="text"
      className={cn(textVariants({ as, className }))}
      {...props}
    />
  )
}

export { Text }
