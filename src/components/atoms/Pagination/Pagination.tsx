import * as React from 'react'
import {
  CaretLeftIcon,
  CaretRightIcon,
  DotsThreeIcon,
} from '@phosphor-icons/react'

import { cn } from '../../utils'
import { Button, buttonVariants } from '../Button'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

const PaginationContent = ({
  className,
  ...props
}: React.ComponentProps<'ul'>) => {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

const PaginationItem = ({ ...props }: React.ComponentProps<'li'>) => {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size' | 'colorScheme'> &
  React.ComponentProps<'a'>

const PaginationLink = ({
  className,
  isActive,
  colorScheme = 'secondary',
  size = 'icon',
  ...props
}: PaginationLinkProps) => {
  return (
    /**
     * Linter disabled because <a> content (children) is passed via props from parent components (see usages below),
     * so this component intentionally renders <a> without direct children here.
     */
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
          colorScheme,
        }),
        'hover:cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="icon"
      className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <CaretLeftIcon />
    </PaginationLink>
  )
}

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="icon"
      className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <CaretRightIcon />
    </PaginationLink>
  )
}

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <DotsThreeIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
