import React from 'react'

import {
  Link as ReactRouterLink,
  LinkProps as ReactRouterLinkProps,
} from '@tanstack/react-router'
import { Slot } from '@radix-ui/react-slot'

export interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
  isExternal?: boolean
  search?: ReactRouterLinkProps['search']
  asChild?: boolean
  openInNewTab?: boolean
  target?: string
}

export const Link = ({
  href,
  children,
  isExternal = false,
  search,
  asChild,
  openInNewTab = true,
  ...props
}: LinkProps) => {
  if (isExternal) {
    const Comp = asChild ? Slot : 'a'
    const openInNewTabProps = { rel: 'noopener noreferrer', target: '_blank ' }

    return (
      <Comp href={href} {...props} {...(openInNewTab && openInNewTabProps)}>
        {children}
      </Comp>
    )
  } else {
    const Comp = asChild ? Slot : ReactRouterLink

    return (
      <Comp to={href} search={search} {...props}>
        {children}
      </Comp>
    )
  }
}
