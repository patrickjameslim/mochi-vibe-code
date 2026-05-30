import { createFileRoute } from '@tanstack/react-router'
import { CreateBillingPage } from '#/pages/billings/create/page'

export const Route = createFileRoute('/_layout/billings/create')({
  component: CreateBillingPage,
})
