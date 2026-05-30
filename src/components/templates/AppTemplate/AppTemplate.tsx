import React, { JSX } from 'react'
import { SidebarInset, SidebarProvider, TopNav } from '../../molecules'
import { AppSidebar, type Route } from '../../organisms'

interface PageProps {
  routes: readonly Route[]
  sidebarHeader?: JSX.Element
  topNavContent?: JSX.Element
  isEmbedded?: boolean
}

export const AppTemplate = ({
  routes,
  sidebarHeader,
  topNavContent,
  children,
  isEmbedded,
}: React.PropsWithChildren<PageProps>) => {
  return (
    <SidebarProvider>
      {!isEmbedded && <AppSidebar routes={routes} header={sidebarHeader} />}
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {!isEmbedded && <TopNav>{topNavContent}</TopNav>}
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
