import { FC } from 'react'
import { FileUploadWithDropzone } from './FileUploadWithDropzone'
import { Text } from '../../atoms'

export const FileUploadWithDropzoneSandbox: FC = () => {
  const handleUpload = (files: readonly { file: File; s3Key: string }[]) => {
    console.log('Successfully uploaded the following files', { files })
  }

  const handleRemove = (s3Key: string) => {
    console.log(`Removed file with s3Key of ${s3Key}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Text as="h3">FileUploadWithDropzone component</Text>
      </div>

      <FileUploadWithDropzone onUpload={handleUpload} onRemove={handleRemove} />
    </div>
  )
}
