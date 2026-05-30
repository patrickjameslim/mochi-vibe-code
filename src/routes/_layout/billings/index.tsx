import { createFileRoute } from '@tanstack/react-router'
import { BillingsListPage } from '#/pages/billings/list/page'

export const Route = createFileRoute('/_layout/billings/')({
  component: BillingsListPage,
})
