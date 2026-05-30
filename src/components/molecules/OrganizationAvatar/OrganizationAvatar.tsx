import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '../../components'
import { ProfileAvatar } from '../ProfileAvatar'

const orgAvatarVariants = cva('shrink-0', {
  variants: {
    size: {
      xs: 'h-8',
      sm: 'h-10',
      md: 'h-12',
      lg: 'h-14',
      xl: 'h-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

interface OrganizationAvatarProps {
  name: string
  src?: string
  className?: string
  size?: VariantProps<typeof orgAvatarVariants>['size']
}

export const OrganizationAvatar = ({
  src,
  name,
  className,
  size,
}: OrganizationAvatarProps) => {
  return src ? (
    <div className={cn(orgAvatarVariants({ size }), className)}>
      <img
        src={src}
        height="100%"
        className="h-full object-contain bg-white rounded-md"
        alt={name}
      />
    </div>
  ) : (
    <ProfileAvatar name={name} size={size} />
  )
}
