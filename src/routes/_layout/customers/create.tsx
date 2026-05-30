import { createFileRoute } from '@tanstack/react-router'
import { CreateCustomerPage } from '#/pages/customers/create/page'

export const Route = createFileRoute('/_layout/customers/create')({
  component: CreateCustomerPage,
})
