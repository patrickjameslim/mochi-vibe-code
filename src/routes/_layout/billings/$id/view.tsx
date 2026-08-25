import { createFileRoute } from '@tanstack/react-router'
import { BillDetailsPage } from '#/pages/billings/view/page'

export const Route = createFileRoute('/_layout/billings/$id/view')({
  component: BillDetailsPage,
})
