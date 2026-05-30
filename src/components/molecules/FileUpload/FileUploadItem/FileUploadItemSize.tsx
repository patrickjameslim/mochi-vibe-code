import { RootFileUploadItemSize } from '../../RootFileUploadItem'
import { useFileUploadItemContext } from './FileUploadItemContext'

export const FileUploadItemSize = ({ className }: { className?: string }) => {
  const {
    file: { size },
  } = useFileUploadItemContext()

  return <RootFileUploadItemSize size={size} className={className} />
}
