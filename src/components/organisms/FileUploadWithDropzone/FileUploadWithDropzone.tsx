import { DropzoneOptions } from 'react-dropzone'
import { DropzoneItem, FileUpload } from '../../molecules'

interface FileUploadWithDropzoneProps {
  initialFiles?: readonly Omit<DropzoneItem, 'isExistingFile'>[]
  onUpload: (files: readonly { file: File; s3Key: string }[]) => void
  onRemove: (s3Key: string) => void
  dropzoneOptions?: DropzoneOptions
  errors?: readonly string[]
  allowDeleteItems?: boolean
}

export const FileUploadWithDropzone = ({
  initialFiles,
  onUpload,
  onRemove,
  dropzoneOptions,
  errors,
  allowDeleteItems = true,
}: FileUploadWithDropzoneProps) => {
  return (
    <FileUpload
      onUpload={onUpload}
      onRemove={onRemove}
      dropzoneOptions={{ multiple: true, ...dropzoneOptions }}
      initialFiles={initialFiles}
      errors={errors}
    >
      <FileUpload.Dropzone />
      <FileUpload.ItemGroup>
        <FileUpload.Item>
          <div className="flex flex-row justify-between w-full">
            <div className="flex flex-row gap-3">
              <FileUpload.Item.Preview />
              <div className="flex flex-col space-y-1!">
                <FileUpload.Item.Name />
                <FileUpload.Item.Size />
              </div>
            </div>
            {allowDeleteItems && (
              <FileUpload.Item.ItemDeleteTrigger className="relative rounded-sm -top-0.5 -right-1 size-6" />
            )}
          </div>
          <FileUpload.Item.Progress />
          <FileUpload.Item.ErrorMessage />
        </FileUpload.Item>
      </FileUpload.ItemGroup>
    </FileUpload>
  )
}
