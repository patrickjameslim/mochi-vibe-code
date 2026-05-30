import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Text,
  type AvatarProps,
} from '../../atoms'
import { generateAvatarColor, getInitials } from './utils'

interface ProfileAvatarProps {
  imgSrc?: string
  name: string
  size?: AvatarProps['size']
  variant?: AvatarProps['variant']
  className?: string
}

export const ProfileAvatar = ({
  imgSrc,
  name,
  size,
  variant,
  className,
}: ProfileAvatarProps) => {
  const initials = getInitials({ name })
  const avatarColor = generateAvatarColor(name)

  return (
    <Avatar size={size} variant={variant} className={className}>
      <AvatarImage
        src={imgSrc}
        className="object-contain w-auto h-auto aspect-auto max-h-16"
      />
      <AvatarFallback style={{ backgroundColor: avatarColor.backgroundColor }}>
        <Text style={{ color: avatarColor.textColor }}>{initials}</Text>
      </AvatarFallback>
    </Avatar>
  )
}
