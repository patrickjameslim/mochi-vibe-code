import { type AvatarProps, Text } from '../../atoms'
import { ProfileAvatar } from './ProfileAvatar'

const SIZES: AvatarProps['size'][] = ['xs', 'sm', 'md', 'lg', 'xl']
const VARIANTS: AvatarProps['variant'][] = ['circle', 'rounded']
const NAMES = [
  'Lee do-hyun',
  'John Doe',
  'Choo Young Woo',
  'Mary Williams',
  'Sarah Miller',
] as const

export const ProfileAvatarSandbox = () => {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Text as="h3">Profile Avatar</Text>
        <Text>
          Uses {`<Avatar>`} component but background and text color is computed
          based on the name provided within the "pastel" color range
        </Text>
      </div>

      <Text as="h4">Using image</Text>
      <div className="flex flex-col gap-3">
        {VARIANTS.map((variant) => (
          <div key={variant} className="flex gap-3 items-center">
            {SIZES.map((size) => (
              <ProfileAvatar
                key={size}
                imgSrc="https://github.com/shadcn.png"
                name="shad cn"
                size={size}
                variant={variant}
              />
            ))}
          </div>
        ))}
      </div>

      <Text as="h4">Using initials as fallback</Text>
      <div className="flex flex-col gap-3">
        {VARIANTS.map((variant) => (
          <div key={variant} className="flex gap-3 items-center">
            {SIZES.map((size, index) => (
              <ProfileAvatar
                key={size}
                name={NAMES[index] || NAMES[0]}
                size={size}
                variant={variant}
              />
            ))}
          </div>
        ))}
      </div>

      <Text as="h4">Using className</Text>
      <div className="flex gap-3 items-center">
        <ProfileAvatar name="Mochi labs" className="size-20 text-[30px]" />
        <ProfileAvatar
          imgSrc="https://github.com/shadcn.png"
          name="Mochi labs"
          className="size-20 text-[30px]"
        />
      </div>
    </div>
  )
}
