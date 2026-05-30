import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cva, VariantProps } from 'class-variance-authority'

import { cn } from '../../utils'

const avatarVariants = cva('relative flex shrink-0 overflow-hidden', {
  variants: {
    size: {
      xs: 'size-8 text-xs',
      sm: 'size-10 text-sm',
      md: 'size-12 text-base',
      lg: 'size-14 text-lg',
      xl: 'size-16 text-xl',
    },
    variant: {
      circle: 'rounded-full',
      rounded: 'rounded-md',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'circle',
  },
})

export interface AvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

function Avatar({ className, size, variant, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size, variant }), className)}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center',
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
