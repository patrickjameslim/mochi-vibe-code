import { Text } from '../../atoms'
import { cn } from '../../utils'

interface RootFileUploadItemSizeProps {
  size: number
  className?: string
}

export const RootFileUploadItemSize = ({
  size,
  className,
}: RootFileUploadItemSizeProps) => {
  return (
    <Text as="muted" className={cn('text-xs font-normal', className)}>
      {renderBytes(size)}
    </Text>
  )
}

const renderBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)}${units[unitIndex]}`
}
