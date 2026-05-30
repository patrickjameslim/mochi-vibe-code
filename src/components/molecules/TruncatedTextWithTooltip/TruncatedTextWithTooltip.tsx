import { useCallback, useState } from 'react'
import { cn } from '../../utils'
import { Text, Tooltip, TooltipTrigger, TooltipContent } from '../../atoms'

interface TruncatedTextWithTooltipProps {
  text: string
  className?: string
  tooltipClassName?: string
  emptyText?: string
}

export const TruncatedTextWithTooltip = ({
  text,
  className,
  tooltipClassName,
  emptyText = '—',
}: TruncatedTextWithTooltipProps) => {
  const [isTruncated, setIsTruncated] = useState(false)
  const textClassName = cn('truncate max-w-55 line-clamp-1', className)

  const textRef = useCallback((node: HTMLParagraphElement | null) => {
    if (node) {
      const truncated = node.scrollWidth > node.clientWidth
      setIsTruncated(truncated)
    }
  }, [])

  if (!text) {
    return <Text className="text-muted-foreground/50">{emptyText}</Text>
  }

  if (!isTruncated) {
    return (
      <Text
        ref={textRef}
        className={cn(
          className?.includes('max-w-full')
            ? 'max-w-full'
            : 'truncate max-w-55 line-clamp-1',
          className
        )}
      >
        {text}
      </Text>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Text ref={textRef} className={textClassName}>
          {text}
        </Text>
      </TooltipTrigger>
      <TooltipContent className={cn('max-w-60', tooltipClassName)}>
        <Text className="whitespace-pre-wrap break-words leading-4 text-sm">
          {text}
        </Text>
      </TooltipContent>
    </Tooltip>
  )
}
