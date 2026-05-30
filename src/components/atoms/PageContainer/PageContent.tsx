import React from 'react'
import { cn } from '../../utils'
import { usePageContainerContext } from './PageContainer'

interface PageContentProps {
  className?: string
  style?: React.CSSProperties
}

const PageContent = ({
  children,
  className,
  style,
}: React.PropsWithChildren<PageContentProps>) => {
  usePageContainerContext('PageContent')
  return (
    <main
      className={cn(
        'overflow-y-auto p-6 gap-5 flex flex-col flex-1 w-full',
        className
      )}
      style={style}
    >
      {children}
    </main>
  )
}

export { PageContent }
