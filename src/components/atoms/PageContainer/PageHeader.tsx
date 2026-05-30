import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'
import { createContext, useContext } from 'react'
import { usePageContainerContext } from './PageContainer'

const pageHeaderVariants = cva(
  'sticky top-0 z-2 border-b bg-sidebar p-4 min-h-md items-center justify-between ',
  {
    variants: {
      variant: {
        default: `
          grid gap-x-4 gap-y-2
          [grid-template-areas:'left_._right'_'center_center_center']
          lg:[grid-template-areas:'left_center_right']
          [grid-template-columns:1fr_auto_1fr]
          lg:[grid-template-columns:1fr_auto_1fr]
        `,
        // Add more layout here as necessary
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const PageHeaderContext = createContext<boolean | null>(null)

const usePageHeaderContext = () => {
  const context = useContext(PageHeaderContext)
  if (context === null) {
    throw new Error(
      'PageHeader compound components cannot be rendered outside the PageHeader component'
    )
  }
  return context
}

interface PageHeaderProps
  extends React.PropsWithChildren<{ className?: string }>,
    VariantProps<typeof pageHeaderVariants> {}

/**
 * @description sticky responsive page header
 */
const PageHeader = ({ children, className, variant }: PageHeaderProps) => {
  usePageContainerContext('PageHeader')
  return (
    <PageHeaderContext.Provider value={true}>
      <div className="flex flex-col">
        <header className={cn(pageHeaderVariants({ variant, className }))}>
          {children}
        </header>
      </div>
    </PageHeaderContext.Provider>
  )
}

const PageHeaderLeft = ({ children }: React.PropsWithChildren) => {
  usePageHeaderContext()
  return <div className="[grid-area:left]">{children}</div>
}

const PageHeaderCenter = ({ children }: React.PropsWithChildren) => {
  usePageHeaderContext()
  return (
    <div className="[grid-area:center] flex justify-center">{children}</div>
  )
}

const PageHeaderRight = ({ children }: React.PropsWithChildren) => {
  usePageHeaderContext()
  return (
    <div className="[grid-area:right] flex gap-2 justify-end">{children}</div>
  )
}

export { PageHeader, PageHeaderLeft, PageHeaderCenter, PageHeaderRight }
