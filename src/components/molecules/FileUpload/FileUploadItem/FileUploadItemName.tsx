import { useFileUploadItemContext } from './FileUploadItemContext'
import { RootFileUploadItemName } from '../../RootFileUploadItem'

export const FileUploadItemName = ({ className }: { className?: string }) => {
  const {
    file: { name, type },
  } = useFileUploadItemContext()

  return (
    <RootFileUploadItemName name={name} type={type} className={className} />
  )
}
