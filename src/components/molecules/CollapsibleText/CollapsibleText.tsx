import { Button, Text } from '../../components'
import * as React from 'react'
import { cn } from '../../utils'

interface CollapsibleTextProps extends React.ComponentProps<typeof Text> {
  maxChars?: number
  className?: string
  children?: string | null
}

const CollapsibleText = ({
  className,
  maxChars = 255,
  children,
  ...textProps
}: CollapsibleTextProps) => {
  const [showRemaining, setShowRemaining] = React.useState(false)

  if (!children) {
    return null
  }

  const visibleDescription = children?.substring(0, maxChars).trim()
  const remainingDescription = children?.substring(maxChars).trim()

  return (
    <span data-slot="collapsible-text" className={cn('inline w-full')}>
      <Text
        as="span"
        {...textProps}
        className={cn('inline whitespace-pre-wrap break-words', className)}
      >
        {remainingDescription && !showRemaining
          ? visibleDescription + '... '
          : children}
      </Text>

      {remainingDescription &&
        (!showRemaining ? (
          <Button onClick={() => setShowRemaining(true)} variant="link">
            Show more
          </Button>
        ) : (
          <Button
            onClick={() => setShowRemaining(false)}
            variant="link"
            className="ml-1"
          >
            Show less
          </Button>
        ))}
    </span>
  )
}

export { CollapsibleText }
