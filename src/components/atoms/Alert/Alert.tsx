import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils'
import {
  Icon,
  InfoIcon,
  WarningIcon,
  WarningOctagonIcon,
} from '@phosphor-icons/react'

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>

interface AlertContextValue {
  variant: AlertVariant
}

const AlertContext = React.createContext<AlertContextValue | null>(null)

const useAlert = () => {
  const context = React.useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an <Alert> component')
  }
  return context
}

const alertVariants = cva(
  'relative w-full border rounded-lg px-4 py-3 text-sm grid has-[>[data-slot=alert-icon]]:grid-cols-[calc(var(--spacing)*4)_1fr_auto] grid-cols-[0_1fr_auto] has-[>[data-slot=alert-icon]]:gap-x-2 gap-y-0.5 items-start [&>[data-slot=alert-icon]>svg]:size-4 [&>[data-slot=alert-icon]>svg]:translate-y-0.5 [&>[data-slot=alert-icon]>svg]:text-current',
  {
    variants: {
      variant: {
        destructive:
          'border-destructive-600/20 text-destructive bg-red-50 *:data-[slot=alert-description]:text-destructive/90',
        info: 'bg-blue-50 border-blue-200 text-blue-500 *:data-[slot=alert-description]:text-blue-500/90',
        warning:
          'bg-orange-50 border-amber-600/25 text-amber-600 *:data-[slot=alert-description]:text-amber-600/90',
        neutral:
          'border-foreground/10 text-foreground bg-transparent *:data-[slot=alert-description]:text-foreground/90',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

const AlertIcon = ({ className, ...props }: React.ComponentProps<'div'>) => {
  const { variant } = useAlert()
  const icons: Record<AlertVariant, Icon> = {
    destructive: WarningOctagonIcon,
    info: InfoIcon,
    warning: WarningIcon,
    neutral: InfoIcon,
  }

  const IconComponent = icons[variant]
  return (
    <div data-slot="alert-icon" className={cn(className)} {...props}>
      {IconComponent && <IconComponent weight="bold" />}
    </div>
  )
}

/**
 * Alert component for displaying important messages to users.
 *
 * - Variants: info (default), destructive, warning and neutral
 * - Automatic icon rendering based on variant
 * - Grid-based layout for consistent alignment
 **/

interface AlertProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof alertVariants> {
  noIcon?: boolean
}

const Alert = ({
  className,
  variant,
  children,
  noIcon,
  ...props
}: AlertProps) => {
  const alertVariant = variant ?? 'info'

  return (
    <AlertContext.Provider value={{ variant: alertVariant }}>
      <div
        data-slot="alert"
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {!noIcon && <AlertIcon />}
        {children}
      </div>
    </AlertContext.Provider>
  )
}

const AlertTitle = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className
      )}
      {...props}
    />
  )
}

const AlertDescription = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed break-words',
        className
      )}
      {...props}
    />
  )
}

const AlertAction = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        'col-start-3 row-start-1 row-span-2 flex items-center p-0 h-full',
        className
      )}
      {...props}
    />
  )
}
export { Alert, AlertTitle, AlertDescription, AlertAction }
