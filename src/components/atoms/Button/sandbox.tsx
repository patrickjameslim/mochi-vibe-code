import { CheckIcon, DotsThreeIcon, XIcon } from '@phosphor-icons/react'
import { Button } from './Button'
import { Text } from '../Text'
import { JSX } from 'react'
import { ButtonColorScheme, ButtonSize, ButtonVariant } from './styles'

const buttonVariants = Object.values(ButtonVariant)
const colorSchemes = Object.entries(ButtonColorScheme)
const buttonSizes = Object.values(ButtonSize)

export const ButtonSandbox = (): JSX.Element => (
  <div className="flex flex-col gap-4">
    <Text as="h3">Buttons</Text>

    <Text as="h4">Size Variations</Text>

    {buttonVariants.map((variant) => (
      <div key={variant} className="flex gap-2 items-center">
        {buttonSizes.map((size) =>
          variant === 'link' && size === 'icon' ? null : (
            <Button
              key={size}
              variant={variant}
              size={variant === ButtonVariant.ROUND_ICON ? 'icon' : size}
            >
              {size === 'icon' ? (
                <DotsThreeIcon className="size-5" />
              ) : variant === ButtonVariant.ROUND_ICON ? (
                <XIcon />
              ) : (
                variant.charAt(0).toUpperCase() +
                variant.slice(1) +
                ` - ${size}`
              )}
            </Button>
          )
        )}
      </div>
    ))}

    <Text as="h4">Color Schemes</Text>

    {colorSchemes.map(([key, colorScheme]) => (
      <div key={colorScheme} className="flex flex-col gap-2">
        <Text className="font-semibold">{key}</Text>

        <div key={colorScheme} className="flex gap-2 items-center">
          {buttonVariants.map((variant) => (
            <Button
              key={variant}
              variant={variant}
              colorScheme={colorScheme}
              size={variant === ButtonVariant.ROUND_ICON ? 'icon' : undefined}
            >
              {variant === ButtonVariant.ROUND_ICON ? (
                <XIcon />
              ) : (
                variant.charAt(0).toUpperCase() + variant.slice(1)
              )}
            </Button>
          ))}
        </div>
      </div>
    ))}

    <div className="flex flex-col gap-2">
      <Text as="h4">States</Text>
      <div className="flex gap-2 items-center">
        <Button isLoading>Loading</Button>
        <Button isLoading loadingText="Loading text">
          Loading with text
        </Button>
        <Button>
          <CheckIcon />
          With Icon
        </Button>
      </div>
    </div>
  </div>
)
