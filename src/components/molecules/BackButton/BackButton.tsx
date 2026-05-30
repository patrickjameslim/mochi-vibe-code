import { useNavigate } from '@tanstack/react-router'
import { Button, type ButtonProps } from '../../atoms'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import { ButtonColorScheme, ButtonVariant } from '../../atoms/Button/styles'

interface BackButtonProps extends ButtonProps {
  path?: string
  text?: string
}

/**
 * @description temporary back button component
 */

const BackButton = ({
  path = '..',
  text = 'Go back',
  variant = ButtonVariant.GHOST,
  colorScheme = ButtonColorScheme.SECONDARY,
  ...props
}: BackButtonProps) => {
  const navigate = useNavigate()

  return (
    <Button
      {...props}
      variant={variant}
      colorScheme={colorScheme}
      onClick={() => navigate({ to: path })}
      className="font-bold"
    >
      <ArrowLeftIcon />
      <span className="xs:flex hidden">{text}</span>
    </Button>
  )
}

export { BackButton }
