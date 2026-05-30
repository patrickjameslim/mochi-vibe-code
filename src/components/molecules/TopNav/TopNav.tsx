import React from 'react'
import { SidebarTrigger } from '../Sidebar'

export const TopNav = ({ children }: React.PropsWithChildren) => (
  <header className="bg-sidebar sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 z-1 w-full">
    <SidebarTrigger className="-ml-2" colorScheme="secondary" />
    {children}
  </header>
)
