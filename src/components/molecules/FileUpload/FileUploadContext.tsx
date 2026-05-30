import { createContext, useContext } from 'react'
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone'

interface FileUploadContextValue {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T
  handleRemove: (s3Key: string) => void
  isDragActive: boolean
  errors?: readonly string[]
}

export const FileUploadContext = createContext<
  FileUploadContextValue | undefined
>(undefined)

export const useFileUploadContext = () => {
  const context = useContext(FileUploadContext)
  if (!context) {
    throw new Error(
      'useFileUploadContext must be used within a FileUploadContext provider'
    )
  }
  return context
}
