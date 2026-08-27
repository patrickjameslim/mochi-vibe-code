import { createFileRoute } from '@tanstack/react-router'
import { BillInfoPage } from '#/pages/billings/info/page'

export const Route = createFileRoute('/_layout/billings/$id/info')({
  component: BillInfoPage,
})
