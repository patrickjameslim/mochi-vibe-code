import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import {
  destructiveCompoundVariants,
  primaryCompoundVariants,
  secondaryCompoundVariants,
  orangeCompoundVariants,
} from './styles'
import { cn } from '../../utils'
import { Spinner } from '../Spinner'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        filled: '',
        ghost: '',
        outline: 'bg-white',
        link: 'max-h-fit focus-visible:ring-offset-3 underline-offset-3 hover:underline',
        roundIcon:
          'bg-black/60 hover:bg-black rounded-full! text-white focus-visible:ring-white/50 focus-visible:ring-[2px]',
      },
      colorScheme: {
        primary: '',
        secondary: '',
        destructive: '',
        orange: '',
      },
      size: {
        xs: 'h-xs text-xs rounded-md gap-1 px-2.5 has-[>svg]:px-2',
        sm: 'h-sm rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        md: 'h-md px-4 py-2 has-[>svg]:px-3',
        lg: 'h-lg text-base rounded-md px-6 has-[>svg]:px-4',
        xl: 'h-xl text-base rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-7',
      },
    },
    defaultVariants: {
      variant: 'filled',
      colorScheme: 'primary',
      size: 'md',
    },
    compoundVariants: [
      ...primaryCompoundVariants,
      ...secondaryCompoundVariants,
      ...destructiveCompoundVariants,
      ...orangeCompoundVariants,
    ],
  }
)

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface ButtonProps
  extends React.ComponentProps<'button'>,
    ButtonVariantProps {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
}

const Button = ({
  className,
  variant,
  size,
  colorScheme,
  asChild = false,
  children,
  isLoading,
  loadingText,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      disabled={isLoading || props?.disabled}
      className={cn(buttonVariants({ variant, size, colorScheme }), className)}
      {...props}
    >
      <div className="flex flex-row items-center gap-2">
        {isLoading && <Spinner className="text-inherit" />}
        {isLoading && loadingText ? loadingText : children}
      </div>
    </Comp>
  )
}

export { Button, type ButtonVariantProps, type ButtonProps }
