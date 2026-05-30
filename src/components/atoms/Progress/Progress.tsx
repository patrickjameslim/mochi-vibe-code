import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '../../utils'
import { ComponentProps, FC } from 'react'
import { cva, VariantProps } from 'class-variance-authority'

const progressVariants = cva('h-full w-full flex-1 transition-all', {
  variants: {
    color: {
      success: 'bg-success',
      danger: 'bg-destructive',
    },
  },
  defaultVariants: {
    color: 'success',
  },
})

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants>

export const Progress: FC<ProgressProps> = ({
  className,
  value,
  color,
  ...props
}) => (
  <ProgressPrimitive.Root
    data-slot="progress"
    className={cn(
      'bg-muted relative h-2 w-full overflow-hidden rounded-full',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(progressVariants({ color }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
)
