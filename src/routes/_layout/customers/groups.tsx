import { createFileRoute } from '@tanstack/react-router'
import { CustomerGroupsPage } from '#/pages/customers/groups/page'

export const Route = createFileRoute('/_layout/customers/groups')({
  component: CustomerGroupsPage,
})
