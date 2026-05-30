import { FileIcon } from '@phosphor-icons/react'
import { ImagePreview } from '../ImagePreview'
import { Button, Link } from '../../atoms'
import { cn } from '../../utils'
import { IMAGE_FILE_TYPES } from '../FileUpload/constants'

interface RootFileUploadItemPreviewProps {
  className?: string
  width?: number
  height?: number
  url?: string
  file?: File
  name: string
  type: string
}

export const RootFileUploadItemPreview = ({
  className,
  width = 48,
  height = 48,
  url,
  file,
  name,
  type,
}: RootFileUploadItemPreviewProps) => {
  const fileSrc = url ?? (file ? URL.createObjectURL(file) : '')
  const isImage = Object.keys(IMAGE_FILE_TYPES).includes(type)

  return isImage ? (
    <ImagePreview
      src={fileSrc}
      alt={name}
      allowExpand={true}
      height={height}
      width={width}
      className={cn('shrink-0', className)}
    />
  ) : (
    <Link isExternal href={fileSrc}>
      <Button
        colorScheme="secondary"
        size={null}
        style={{ width, height }}
        className={cn('shrink-0', className)}
      >
        <FileIcon className="size-5" />
      </Button>
    </Link>
  )
}
