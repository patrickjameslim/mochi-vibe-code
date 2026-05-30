import { Text } from '../../atoms'
import { cn } from '../../utils'
import { useFileUploadContext } from './FileUploadContext'

export const FileUploadErrorMessage = ({
  className,
}: {
  className?: string
}) => {
  const { errors } = useFileUploadContext()

  if (!errors || !errors.length) {
    return null
  }

  if (errors?.length === 1 && errors?.at(0)) {
    return (
      <Text className={cn('text-destructive leading-3', className)}>
        {errors.at(0)}
      </Text>
    )
  }

  return (
    <ul className="ml-4 flex list-disc flex-col gap-2">
      {errors.map((error) => (
        <li key={error} className={cn('text-destructive leading-3', className)}>
          {error}
        </li>
      ))}
    </ul>
  )
}
