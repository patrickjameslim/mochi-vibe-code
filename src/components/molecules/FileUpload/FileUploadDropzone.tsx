import { FC, ReactNode } from 'react'
import { cn } from '../../utils'
import { useFileUploadContext } from './FileUploadContext'
import { UploadSimpleIcon } from '@phosphor-icons/react'
import { Text } from '../../atoms'

interface FileUploadDropzoneProps {
  className?: string
  children?: ReactNode
}

export const FileUploadDropzone: FC<FileUploadDropzoneProps> = ({
  className,
  children,
}) => {
  const { getRootProps, getInputProps, isDragActive, errors } =
    useFileUploadContext()

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer bg-white hover:bg-muted/50 relative h-auto w-full flex flex-col overflow-hidden p-8 border-2 border-dashed rounded-md shrink-0',
        isDragActive && 'outline-none ring-1 ring-ring',
        errors && errors.length > 0 && 'border-destructive',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-2 h-full">
        {children ?? (
          <>
            <UploadSimpleIcon
              size={18}
              weight="bold"
              className="text-muted-foreground shrink-0"
            />
            <div className="flex flex-col items-center justify-center space-y-1">
              <Text as="muted" className="mb-0!">
                Drag your files here
              </Text>
              <Text as="muted" className="font-normal">
                or click to browse files
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
