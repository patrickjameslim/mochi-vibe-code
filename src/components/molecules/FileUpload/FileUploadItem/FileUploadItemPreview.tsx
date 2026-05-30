import { useFileUploadItemContext } from './FileUploadItemContext'
import { RootFileUploadItemPreview } from '../../RootFileUploadItem'

export const FileUploadItemPreview = ({
  className,
  width = 48,
  height = 48,
}: {
  className?: string
  width?: number
  height?: number
}) => {
  const {
    file: { url, file, name, type },
  } = useFileUploadItemContext()

  return (
    <RootFileUploadItemPreview
      file={file}
      url={url}
      name={name}
      type={type}
      width={width}
      height={height}
      className={className}
    />
  )
}
