import { useGetUploadURL } from './useGetUploadURL'
import { useUploadToS3 } from './useUploadToS3'

export const useUploadFiles = () => {
  const getUploadURLMutation = useGetUploadURL()
  const uploadToS3Mutation = useUploadToS3()

  const uploadFiles = async (
    files: readonly {
      file: File
      s3Key: string
    }[]
  ): Promise<void> => {
    await Promise.all(files.map(upload))
  }
  const upload = async ({ file, s3Key }: UploadFileItem): Promise<void> => {
    const uploadURL = await getUploadURLMutation.mutateAsync({
      key: s3Key,
      mimeType: file.type,
    })

    await uploadToS3Mutation.mutateAsync({
      s3Key,
      file,
      uploadURL,
    })
  }

  return { uploadFiles }
}

interface UploadFileItem {
  file: File
  s3Key: string
}
