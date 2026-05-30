import { CheckIcon, CopyIcon, type Icon } from '@phosphor-icons/react'
import { AnimatePresence, HTMLMotionProps, motion } from 'motion/react'
import * as React from 'react'

import { Button, ButtonVariantProps } from '../../atoms'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components'

/**
 * Based on the community-driven shadcn/ui resource for a copy button
 *
 * **Key Modifications from shadcn copy button:**
 * - Integrated with our existing Button component for consistent styling and behavior
 * - Removed buttonVariants and used ButtonVariantProps for variant and colorScheme props
 *
 * Reference: https://www.shadcn.io/button/copy
 */

type CopyButtonProps = Omit<HTMLMotionProps<'button'>, 'children' | 'onCopy'> &
  ButtonVariantProps & {
    content?: string
    onCopy?: (content: string) => void
    CustomIcon?: Icon
    isCopied?: boolean
    onCopyChange?: (isCopied: boolean) => void
    tooltipContent?: string
  }

export const CopyButton = ({
  content,
  className,
  size,
  variant,
  colorScheme,
  onClick,
  onCopy,
  CustomIcon = CopyIcon,
  isCopied,
  onCopyChange,
  tooltipContent = 'Copy to clipboard',
  ...props
}: CopyButtonProps) => {
  const { isCopied: localIsCopied, handleCopy } = useCopyToClipboard({
    isCopied,
    onCopyChange,
  })

  const [open, setOpen] = React.useState(false)

  const Icon = localIsCopied ? CheckIcon : CustomIcon

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (content) {
        handleCopy({ content, onCopy })
        setOpen(true)
      }
      onClick?.(e)
    },
    [handleCopy, content, onCopy, onClick]
  )

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <MotionButton
          data-slot="copy-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={className}
          onClick={handleClick}
          variant={variant}
          colorScheme={colorScheme}
          size={size}
          {...props}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={localIsCopied ? 'check' : 'copy'}
              data-slot="copy-button-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Icon />
            </motion.span>
          </AnimatePresence>
        </MotionButton>
      </TooltipTrigger>
      <TooltipContent>
        <p>{localIsCopied ? 'Copied' : tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  )
}

const MotionButton = motion.create(Button)
