import { ReactNode } from 'react'
import { cn } from '../../utils'

interface RootFileUploadItemProps {
  className?: string
  children: ReactNode
}

export const RootFileUploadItem = ({
  children,
  className,
}: RootFileUploadItemProps) => {
  return (
    <div
      className={cn(
        'outline outline-border flex flex-col justify-between rounded-md p-3 w-full gap-2 bg-white',
        className
      )}
    >
      {children}
    </div>
  )
}
