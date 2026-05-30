import {
  Badge,
  Button,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../atoms'
import { BadgeVariants } from '../../atoms/Badge/Badge'
import { cn } from '../../utils'

interface TagListProps {
  tags: string[]
  maxVisible?: number
  emptyText?: string
  badgeColorScheme?: BadgeVariants['colorScheme']
  className?: string
}

/**
 * A reusable component that displays a list of tags with overflow handling.
 * Shows only a specified number of tags and displays remaining tags in a tooltip.
 */
export const TagList = ({
  tags,
  maxVisible = 2,
  emptyText = '—',
  badgeColorScheme = 'panda',
  className,
}: TagListProps) => {
  if (!tags || tags.length === 0) {
    return <Text className="text-muted-foreground/50">{emptyText}</Text>
  }

  const visibleTags = tags.slice(0, maxVisible)
  const remainingTags = tags.slice(maxVisible)
  const hasMoreTags = remainingTags.length > 0

  return (
    <div className={cn('gap-2 flex items-center', className)}>
      {visibleTags.map((tag, index) => (
        <Badge key={index} colorScheme={badgeColorScheme}>
          {tag}
        </Badge>
      ))}
      {hasMoreTags && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="link" colorScheme="secondary" size="xs">
              <Text className="text-muted-foreground">
                +{remainingTags.length} more
              </Text>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-50">
            <Text className="text-sm whitespace-pre-wrap break-words">
              {remainingTags.join(', ')}
            </Text>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
