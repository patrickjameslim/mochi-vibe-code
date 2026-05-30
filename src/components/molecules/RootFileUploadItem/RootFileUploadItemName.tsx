import mime from 'mime'
import { Text } from '../../atoms'
import { cn } from '../../utils'

interface RootFileUploadItemNameProps {
  className?: string
  name: string
  type: string
}

export const RootFileUploadItemName = ({
  className,
  name,
  type,
}: RootFileUploadItemNameProps) => {
  return (
    <Text title={name} className={cn('font-medium leading-5', className)}>
      {truncateFilename(name, type)}
    </Text>
  )
}

const truncateFilename = (filename: string, type: string): string =>
  filename.length > 30
    ? filename.substring(0, 30) + `...${mime.getExtension(type)}`
    : filename
