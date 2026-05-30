import { FC, ReactNode } from 'react'
import {
  DropzoneProvider,
  useDropzoneContext,
  useDropzoneDispatchContext,
} from './DropzoneContext'
import {
  DropzoneOptions,
  ErrorCode,
  FileError,
  useDropzone,
} from 'react-dropzone'
import { DEFAULT_DROPZONE_OPTIONS } from './constants'
import { DropzoneActionKind, DropzoneItem } from './dropzoneReducer'
import { useUploadFiles } from './useUploadFiles'
import { DropzoneContent } from './DropzoneContent'
import { FileUploadDropzone } from './FileUploadDropzone'
import { FileUploadContext } from './FileUploadContext'
import { FileUploadItem } from './FileUploadItem/FileUploadItem'
import { FileUploadErrorMessage } from './FileUploadErrorMessage'

export interface FileUploadProps {
  initialFiles?: readonly Omit<DropzoneItem, 'isExistingFile'>[]
  dropzoneOptions?: DropzoneOptions
  onUpload: (files: readonly { file: File; s3Key: string }[]) => void
  onRemove: (s3Key: string) => void
  className?: string
  s3KeyGenerator?: (fileName: string) => string
  children: ReactNode
  errors?: readonly string[] // external error message from schema
  onUploadStateChange?: (isUploading: boolean) => void
  onUploadError?: (hasError: boolean) => void
}

type FileUploadComponent = FC<FileUploadProps> & {
  Dropzone: typeof FileUploadDropzone
  ItemGroup: typeof DropzoneContent
  Item: typeof FileUploadItem
  ErrorMessage: typeof FileUploadErrorMessage
}

export const FileUpload: FileUploadComponent = ({
  initialFiles,
  children,
  ...rest
}) => (
  <DropzoneProvider
    initialFiles={initialFiles?.map((item) => ({
      ...item,
      isExistingFile: true,
    }))}
  >
    <FileUploadInner {...rest}>{children}</FileUploadInner>
  </DropzoneProvider>
)

type FileUploadInnerProps = Omit<FileUploadProps, 'initialFiles'>

const FileUploadInner: FC<FileUploadInnerProps> = ({
  onUpload,
  onRemove,
  className,
  s3KeyGenerator = defaultS3KeyGenerator,
  children,
  errors,
  onUploadStateChange,
  onUploadError,
  ...rest
}) => {
  const dispatch = useDropzoneDispatchContext()
  const { uploadFiles } = useUploadFiles()

  const dropzoneOptions = {
    ...DEFAULT_DROPZONE_OPTIONS,
    ...rest.dropzoneOptions,
  }

  const { maxSize, multiple } = dropzoneOptions

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple,
    ...dropzoneOptions,
    onDropAccepted: async (validFiles) => {
      try {
        const action = multiple
          ? DropzoneActionKind.ADD
          : DropzoneActionKind.SET
        const items = validFiles.map((file) => {
          const { name, size, type } = file
          return {
            file,
            name,
            size,
            type,
            s3Key: s3KeyGenerator(name),
          }
        })

        dispatch({
          type: action,
          payload: items,
        })

        onUploadStateChange?.(true)

        await uploadFiles(items)
        onUploadStateChange?.(false)

        onUpload(
          items.map(({ file, s3Key }) => ({
            s3Key,
            file,
          }))
        )
      } catch (error) {
        onUploadStateChange?.(false)
        onUploadError?.(true)
      }
    },
    onDropRejected: (invalidFiles) => {
      const action = multiple ? DropzoneActionKind.ADD : DropzoneActionKind.SET
      dispatch({
        type: action,
        payload: invalidFiles.map(
          ({ file, errors, file: { name, size, type } }) => ({
            file,
            name,
            size,
            type,
            s3Key: s3KeyGenerator(name),
            errors: errors.map((error) => getErrorMessage(error, { maxSize })),
          })
        ),
      })
      onUploadError?.(true)
    },
  })

  const handleRemove = (s3Key: string): void => {
    dispatch({
      type: DropzoneActionKind.REMOVE,
      payload: {
        s3Key,
      },
    })
    onRemove(s3Key)
    onUploadStateChange?.(false)
    onUploadError?.(false)
  }

  const dropzoneItems = useDropzoneContext()

  const groupErrors = multiple ? errors : dropzoneItems?.at(0)?.errors

  return (
    <FileUploadContext.Provider
      value={{
        getRootProps,
        getInputProps,
        handleRemove,
        isDragActive,
        errors: groupErrors,
      }}
    >
      {children}
    </FileUploadContext.Provider>
  )
}

const defaultS3KeyGenerator = (slug: string): string =>
  `next-s3-uploads/${Math.floor(
    Math.random() * Number.MAX_SAFE_INTEGER
  )}/${slug}`
const getErrorMessage = (
  fileError: FileError,
  dropzoneOptions: Required<Pick<DropzoneOptions, 'maxSize'>>
): string => {
  const maxSizeInMB = dropzoneOptions.maxSize / Math.pow(1024, 2)

  switch (fileError.code) {
    case ErrorCode.FileTooLarge:
      return `File is too big (max ${maxSizeInMB} MB)`
    case ErrorCode.FileInvalidType:
      return 'Unacceptable file format'
    case ErrorCode.TooManyFiles:
      return 'Only one file is allowed'
    default:
      return fileError.code
  }
}

FileUpload.Dropzone = FileUploadDropzone
FileUpload.ItemGroup = DropzoneContent
FileUpload.Item = FileUploadItem
FileUpload.ErrorMessage = FileUploadErrorMessage
