import { createFileRoute } from '@tanstack/react-router'
import { CustomersListPage } from '#/pages/customers/list/page'

export const Route = createFileRoute('/_layout/customers/')({
  component: CustomersListPage,
})
