import { createRootRoute, Outlet } from '@tanstack/react-router'
import { CustomFieldsProvider } from '#/context/CustomFieldsContext'
import { CustomersProvider } from '#/context/CustomersContext'
import { TooltipProvider } from '#/components/atoms/Tooltip'
import { Toast } from '#/components/atoms/Toast'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <CustomFieldsProvider>
      <CustomersProvider>
        <TooltipProvider>
          <Outlet />
          <Toast position="bottom-left" />
        </TooltipProvider>
      </CustomersProvider>
    </CustomFieldsProvider>
  )
}
