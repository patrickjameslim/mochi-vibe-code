import { createFileRoute } from '@tanstack/react-router'
import { RecurringBillInfoPage } from '#/pages/billings/recurring/bill-info/page'

export const Route = createFileRoute('/_layout/billings/recurring/$billId')({
  component: RecurringBillInfoPage,
})
