import { ReactElement } from 'react'
import { type ButtonProps, Button } from '../../atoms'

interface ResponsiveButtonProps extends ButtonProps {
  icon: ReactElement
  text: string
}

/**
 * @description displays the icon on smaller screens and only the text on large screens
 */
const ResponsiveButton = ({
  icon,
  text,
  loadingText,
  ...props
}: ResponsiveButtonProps) => (
  <>
    <Button {...props} title={text} className="xs:hidden flex">
      {!props.isLoading && icon}
    </Button>

    <Button {...props} loadingText={loadingText} className="hidden xs:flex">
      {text}
    </Button>
  </>
)

export { ResponsiveButton }
