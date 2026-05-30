import {
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  WarningIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toast = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        actionButtonStyle: {
          background: 'var(--primary)',
        },
      }}
      icons={{
        success: <CheckCircleIcon weight="bold" className="size-4" />,
        info: <InfoIcon weight="bold" className="size-4" />,
        warning: <WarningIcon weight="bold" className="size-4" />,
        error: <XCircleIcon weight="bold" className="size-4" />,
        loading: (
          <CircleNotchIcon weight="bold" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toast }
