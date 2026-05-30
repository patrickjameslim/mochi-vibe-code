import { Text } from '../../../atoms'
import { cn } from '../../../utils'
import { useFileUploadItemContext } from './FileUploadItemContext'

export const FileUploadItemErrorMessage = ({
  className,
}: {
  className?: string
}) => {
  const {
    file: { errors },
  } = useFileUploadItemContext()

  return errors?.map((errorMessage) => (
    <Text
      className={cn('text-destructive leading-3', className)}
      key={errorMessage}
    >
      {errorMessage}
    </Text>
  ))
}
