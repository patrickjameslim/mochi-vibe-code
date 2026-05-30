import { FC, ReactNode } from 'react'
import { cn } from '../../../utils'
import { useFileUploadItemContext } from './FileUploadItemContext'
import { FileUploadItemName } from './FileUploadItemName'
import { FileUploadItemErrorMessage } from './FileUploadItemErrorMessage'
import { FileUploadItemProgress } from './FileUploadItemProgress'
import { FileUploadItemPreview } from './FileUploadItemPreview'
import { FileUploadItemSize } from './FileUploadItemSize'
import { FileUploadItemDeleteTrigger } from './FileUploadItemDeleteTrigger'
import { RootFileUploadItem } from '../../RootFileUploadItem'

interface FileUploadItemProps {
  className?: string
  children: ReactNode
}

type FileUploadItemComponentProps = FC<FileUploadItemProps> & {
  Name: typeof FileUploadItemName
  Size: typeof FileUploadItemSize
  Preview: typeof FileUploadItemPreview
  Progress: typeof FileUploadItemProgress
  ErrorMessage: typeof FileUploadItemErrorMessage
  ItemDeleteTrigger: typeof FileUploadItemDeleteTrigger
}

export const FileUploadItem: FileUploadItemComponentProps = ({
  children,
  className,
}) => {
  const {
    file: { errors },
  } = useFileUploadItemContext()
  const hasError = !!errors?.length

  return (
    <RootFileUploadItem
      className={cn(hasError && 'outline-destructive', className)}
    >
      {children}
    </RootFileUploadItem>
  )
}

FileUploadItem.Name = FileUploadItemName
FileUploadItem.Size = FileUploadItemSize
FileUploadItem.Preview = FileUploadItemPreview
FileUploadItem.Progress = FileUploadItemProgress
FileUploadItem.ErrorMessage = FileUploadItemErrorMessage
FileUploadItem.ItemDeleteTrigger = FileUploadItemDeleteTrigger
