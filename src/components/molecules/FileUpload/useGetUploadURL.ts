import { useDropzoneDispatchContext } from './DropzoneContext'
import { DropzoneActionKind } from './dropzoneReducer'

// Stubbed — S3 upload not implemented in prototype
export const useGetUploadURL = () => {
  const dispatch = useDropzoneDispatchContext()
  return {
    mutateAsync: async (_data: unknown) => {
      dispatch({
        type: DropzoneActionKind.SET_ERRORS,
        payload: { errors: ['Upload not supported in prototype'], s3Key: '' },
      })
      throw new Error('S3 upload not implemented in prototype')
    },
    isPending: false,
  }
}
