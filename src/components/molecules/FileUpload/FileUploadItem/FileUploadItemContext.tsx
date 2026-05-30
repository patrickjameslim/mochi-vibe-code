import { createContext, FC, ReactNode, useContext } from 'react'
import { DropzoneItem } from '../dropzoneReducer'

interface FileUploadItemContextValue {
  file: DropzoneItem
  handleRemove: (s3Key: string) => void
}

const FileUploadItemContext = createContext<
  FileUploadItemContextValue | undefined
>(undefined)

export const useFileUploadItemContext = () => {
  const context = useContext(FileUploadItemContext)
  if (!context) {
    throw new Error(
      'This component must be used within FileUpload.ItemGroup component'
    )
  }
  return context
}

export const FileUploadItemProvider: FC<{
  file: DropzoneItem
  handleRemove: (s3Key: string) => void
  children: ReactNode
}> = ({ file, children, handleRemove }) => (
  <FileUploadItemContext.Provider value={{ file, handleRemove }}>
    {children}
  </FileUploadItemContext.Provider>
)
