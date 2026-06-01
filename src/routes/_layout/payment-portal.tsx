import { createFileRoute } from '@tanstack/react-router'
import CustomerPaymentPortalPage from '#/pages/payment-portal/page'

export const Route = createFileRoute('/_layout/payment-portal')({
  component: CustomerPaymentPortalPage,
})
