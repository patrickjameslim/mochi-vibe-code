import { CircleNotchIcon } from '@phosphor-icons/react'
import { cn } from '../../utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <CircleNotchIcon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin text-primary', className)}
      {...props}
    />
  )
}

export { Spinner }
