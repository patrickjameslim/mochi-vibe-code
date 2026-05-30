import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

/**
 * Pass-through layout. Each prototype page renders its own full-screen shell
 * (AppSidebar + header + content), so the layout route only provides the
 * Outlet. When pages are later refactored to content-only, move the shared
 * AppSidebar here.
 */
function LayoutComponent() {
  return <Outlet />
}
