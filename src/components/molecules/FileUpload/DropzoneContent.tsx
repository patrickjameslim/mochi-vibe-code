import { FC, PropsWithChildren } from 'react'
import { useDropzoneContext } from './DropzoneContext'
import { cn } from '../../utils'
import { FileUploadItemProvider } from './FileUploadItem'
import { useFileUploadContext } from './FileUploadContext'

interface DropzoneContentProps {
  className?: string
}

export const DropzoneContent: FC<PropsWithChildren<DropzoneContentProps>> = ({
  children,
  className,
}) => {
  const dropzoneItems = useDropzoneContext()
  const { handleRemove } = useFileUploadContext()

  if (!dropzoneItems || dropzoneItems?.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full gap-2',
        className
      )}
    >
      {dropzoneItems.map((item) => (
        <FileUploadItemProvider
          key={item.s3Key}
          file={item}
          handleRemove={handleRemove}
        >
          {children}
        </FileUploadItemProvider>
      ))}
    </div>
  )
}
