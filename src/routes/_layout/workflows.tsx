import { createFileRoute } from '@tanstack/react-router'
import { WorkflowsPage } from '#/pages/workflows/page'

export const Route = createFileRoute('/_layout/workflows')({
  component: WorkflowsPage,
})
