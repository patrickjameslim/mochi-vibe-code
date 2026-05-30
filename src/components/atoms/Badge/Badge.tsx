import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

/**
 * Adapted from shadcn/ui's Badge component with customizations for our design system needs.
 *
 * **Key Modifications from shadcn Badge:**
 * - Added `colorScheme` variant with predefined color options
 * - Simplified `variant` options (removed outline, secondary from shadcn's original variants)
 *
 * **Reference:** https://ui.shadcn.com/docs/components/badge
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
      },
      colorScheme: {
        primary:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        panda: 'bg-white text-black border-gray-300',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-700',
        red: 'bg-red-100 text-red-700 border-red-700',
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-700',
        blue: 'bg-blue-100 text-blue-700 border-blue-700',
        amber: 'bg-amber-100 text-amber-700 border-amber-700',
        violet: 'bg-violet-100 text-violet-700 border-violet-700',
      },
    },
    defaultVariants: {
      variant: 'default',
      colorScheme: 'primary',
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>

export const Badge = ({
  className,
  variant,
  colorScheme,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & BadgeVariants & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ colorScheme, variant }), className)}
      {...props}
    />
  )
}
