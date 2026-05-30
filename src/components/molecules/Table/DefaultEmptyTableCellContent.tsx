import { Text } from '../../atoms'
import { cn } from '../../utils'

interface DefaultEmptyTableCellContentProps {
  emptyValue?: string
  className?: string
}
export const DefaultEmptyTableCellContent = ({
  emptyValue = '—',
  className,
}: DefaultEmptyTableCellContentProps) => (
  <Text className={cn('text-muted-foreground/50', className)}>
    {emptyValue}
  </Text>
)
