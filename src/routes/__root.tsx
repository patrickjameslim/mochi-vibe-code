import { createRootRoute, Outlet } from '@tanstack/react-router'
import { CustomFieldsProvider } from '#/context/CustomFieldsContext'
import { CustomersProvider } from '#/context/CustomersContext'
import { TooltipProvider } from '#/components/atoms/Tooltip'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <CustomFieldsProvider>
      <CustomersProvider>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
      </CustomersProvider>
    </CustomFieldsProvider>
  )
}
