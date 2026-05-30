import { FC } from 'react'
import { ImageUpload } from './ImageUpload'
import { Text } from '../../atoms'

export const ImageUploadSandbox: FC = () => {
  const handleUpload = (file: { file: File; s3Key: string }) => {
    console.log('Successfully uploaded the following file', { file })
  }

  const handleRemove = (s3Key: string) => {
    console.log(`Removed file with s3Key of ${s3Key}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Text as="h3">Image upload</Text>
      </div>

      <ImageUpload handleUpload={handleUpload} handleRemove={handleRemove} />
      <ImageUpload
        handleUpload={handleUpload}
        handleRemove={handleRemove}
        width={750}
        height={200}
      />
    </div>
  )
}
