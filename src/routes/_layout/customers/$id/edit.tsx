import { createFileRoute } from '@tanstack/react-router'
import { CustomerEditPage } from '#/pages/customers/edit/page'

export const Route = createFileRoute('/_layout/customers/$id/edit')({
  component: CustomerEditPage,
})
