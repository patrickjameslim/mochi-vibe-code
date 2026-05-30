import { cva, VariantProps } from 'class-variance-authority'
import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '../../utils'

const Tabs = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) => {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2 group/tabs', className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  'rounded-md p-[4px] group-data-horizontal/tabs:h-8 data-[variant=line]:rounded-none group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'bg-muted h-md',
        line: 'bg-transparent border-b p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const TabsList = ({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) => {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-sm border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Line variant: extend border to overlap with TabsList border
        'group-data-[variant=line]/tabs-list:mb-[-1px]',
        // Line variant: remove shadow and rounded corners
        'group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none group-data-[variant=line]/tabs-list:rounded-none',
        // Line variant: hide top, left, and right borders
        'group-data-[variant=line]/tabs-list:border-t-0 group-data-[variant=line]/tabs-list:border-x-0',
        // Line variant: show bottom border
        'group-data-[variant=line]/tabs-list:border-b group-data-[variant=line]/tabs-list:border-b-border',
        // Line variant: active state
        'group-data-[variant=line]/tabs-list:data-[state=active]:border-b-primary group-data-[variant=line]/tabs-list:data-[state=active]:text-primary',
        className
      )}
      {...props}
    />
  )
}

const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
