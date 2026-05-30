import React, { createContext, useContext } from 'react'
import { cn } from '../../utils'

const PageContainerContext = createContext<boolean | null>(null)

const usePageContainerContext = (componentName: string) => {
  const context = useContext(PageContainerContext)
  if (context === null) {
    throw new Error(
      `${componentName} cannot be rendered outside the PageContainer component`
    )
  }
  return context
}

interface PageContainerProps {
  className?: string
}

/**
 * @description Applies responsiveness to children
 * @caveat this component expects children to handle overflow
 */

const PageContainer = ({
  children,
  className,
}: React.PropsWithChildren<PageContainerProps>) => (
  <PageContainerContext.Provider value={true}>
    <div className={cn('flex flex-1 flex-col overflow-hidden', className)}>
      {children}
    </div>
  </PageContainerContext.Provider>
)

export { PageContainer, usePageContainerContext }
