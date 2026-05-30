import { FC } from 'react'
import { FileUpload } from './FileUpload'
import { Text } from '../../atoms'

export const FileUploadSandbox: FC = () => {
  const handleUpload = (files: readonly { file: File; s3Key: string }[]) => {
    console.log('Successfully uploaded the following files', { files })
  }

  const handleRemove = (s3Key: string) => {
    console.log(`Removed file with s3Key of ${s3Key}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Text as="h3">Base FileUpload component</Text>
      </div>
      <FileUpload
        onUpload={handleUpload}
        onRemove={handleRemove}
        dropzoneOptions={{ multiple: true }}
      >
        <FileUpload.Dropzone />
        <FileUpload.ItemGroup>
          <FileUpload.Item>
            <div className="flex flex-row justify-between w-full">
              <div className="flex flex-row gap-3">
                <FileUpload.Item.Preview />
                <div className="flex flex-col gap-1">
                  <FileUpload.Item.Name />
                  <FileUpload.Item.Size />
                </div>
              </div>
              <FileUpload.Item.ItemDeleteTrigger className="relative rounded-sm -top-0.5 -right-1 size-6" />
            </div>
            <FileUpload.Item.Progress />
            <FileUpload.Item.ErrorMessage />
          </FileUpload.Item>
        </FileUpload.ItemGroup>
      </FileUpload>
    </div>
  )
}
