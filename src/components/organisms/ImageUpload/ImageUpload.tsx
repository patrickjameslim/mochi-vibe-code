import { ImageSquareIcon, XIcon } from '@phosphor-icons/react'
import { DropzoneItem, FileUpload, IMAGE_FILE_TYPES } from '../../molecules'
import { convertMBtoBytes } from '../../utils/convertMBtoBytes'

interface ImageUploadProps {
  initialFile?: Omit<DropzoneItem, 'isExistingFile'>
  handleUpload: (file: { file: File; s3Key: string }) => void
  handleRemove: (s3Key: string) => void
  width?: number
  height?: number
  maxSizeInMB?: number
  onUploadStateChange?: (isUploading: boolean) => void
  onUploadError?: (hasError: boolean) => void
}
export const ImageUpload = ({
  initialFile,
  handleRemove,
  handleUpload,
  width = 64,
  height = 64,
  maxSizeInMB,
  onUploadStateChange,
  onUploadError,
}: ImageUploadProps) => (
  <FileUpload
    onUpload={(files) => {
      const file = files?.at(0)

      if (file) {
        handleUpload(file)
      }
    }}
    onRemove={handleRemove}
    onUploadStateChange={onUploadStateChange}
    onUploadError={onUploadError}
    dropzoneOptions={{
      multiple: false,
      accept: IMAGE_FILE_TYPES,
      ...(maxSizeInMB && { maxSize: convertMBtoBytes(maxSizeInMB) }),
    }}
    initialFiles={initialFile ? [initialFile] : undefined}
  >
    <div className="flex flex-col gap-4">
      <div className="relative" style={{ width, height }}>
        <FileUpload.Dropzone className="rounded-md w-full h-full p-0">
          <ImageSquareIcon size={20} className="text-muted-foreground" />
        </FileUpload.Dropzone>
        <FileUpload.ItemGroup className="absolute top-0 left-0">
          <FileUpload.Item className="w-auto p-0 relative top-0 left-0">
            <FileUpload.Item.Preview width={width} height={height} />
            <FileUpload.Item.ItemDeleteTrigger
              className="absolute -top-1.5 -right-1.5 h-4 w-4"
              variant="roundIcon"
            >
              <XIcon className="size-3" weight="bold" />
            </FileUpload.Item.ItemDeleteTrigger>
            <FileUpload.Item.Progress centerLoading />
          </FileUpload.Item>
        </FileUpload.ItemGroup>
      </div>
      <FileUpload.ErrorMessage />
    </div>
  </FileUpload>
)
