import { useDropzoneDispatchContext } from './DropzoneContext'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { DropzoneActionKind } from './dropzoneReducer'

export const useUploadToS3 = () => {
  const dispatch = useDropzoneDispatchContext()

  return useMutation({
    mutationFn: ({ file, s3Key, uploadURL }: UploadToS3Props) =>
      axios.put(uploadURL, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: ({ progress }) =>
          dispatch({
            type: DropzoneActionKind.SET_PROGRESS,
            payload: {
              s3Key,
              progress: (progress ?? 0) * 100,
            },
          }),
      }),
    onError: (_error, { s3Key }) => {
      dispatch({
        type: DropzoneActionKind.SET_ERRORS,
        payload: {
          s3Key,
          errors: ['Upload failed'],
        },
      })
    },
  })
}

interface UploadToS3Props {
  file: File
  s3Key: string
  uploadURL: string
}
