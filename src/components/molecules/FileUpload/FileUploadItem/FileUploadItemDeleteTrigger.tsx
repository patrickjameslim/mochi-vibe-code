import { FC, ReactNode } from 'react'
import { useFileUploadItemContext } from './FileUploadItemContext'
import { cn } from '../../../utils'
import { TrashIcon } from '@phosphor-icons/react'
import { ButtonVariantProps, buttonVariants } from '../../../atoms/Button'

interface FileUploadItemDeleteTriggerProps extends ButtonVariantProps {
  children?: ReactNode
  className?: string
}
export const FileUploadItemDeleteTrigger: FC<
  FileUploadItemDeleteTriggerProps
> = ({
  children,
  className,
  variant = 'ghost',
  size = null,
  colorScheme = 'destructive',
}) => {
  const {
    file: { s3Key },
    handleRemove,
  } = useFileUploadItemContext()

  return (
    <button
      type="button"
      className={cn(
        'relative size-6',
        buttonVariants({ variant, size, colorScheme }),
        className
      )}
      onClick={() => handleRemove(s3Key)}
    >
      {children ?? <TrashIcon />}
    </button>
  )
}
