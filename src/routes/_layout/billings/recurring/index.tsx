import { createFileRoute } from '@tanstack/react-router'
import { RecurringBillingPage } from '#/pages/billings/recurring/page'

export const Route = createFileRoute('/_layout/billings/recurring/')({
  component: RecurringBillingPage,
})
