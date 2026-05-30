import { createFileRoute } from '@tanstack/react-router'
import { CustomerViewPage } from '#/pages/customers/view/page'

export const Route = createFileRoute('/_layout/customers/$id/view')({
  component: CustomerViewPage,
})
