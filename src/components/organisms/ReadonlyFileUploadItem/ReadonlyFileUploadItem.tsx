import { DropzoneItem } from '../../molecules/FileUpload'
import {
  RootFileUploadItem,
  RootFileUploadItemName,
  RootFileUploadItemPreview,
  RootFileUploadItemSize,
} from '../../molecules/RootFileUploadItem'
import mime from 'mime'

interface ReadonlyFileUploadItemProps {
  dropzoneItem: DropzoneItem
}
export const ReadonlyFileUploadItem = ({
  dropzoneItem: { name, type, size, url },
}: ReadonlyFileUploadItemProps) => {
  return (
    <RootFileUploadItem>
      <div className="flex flex-row justify-between w-full">
        <div className="flex flex-row gap-3">
          <RootFileUploadItemPreview name={name} type={type} url={url} />
          <div className="flex flex-col gap-1">
            <RootFileUploadItemName
              name={name}
              type={mime.getType(name) ?? ''}
            />
            <RootFileUploadItemSize size={size} />
          </div>
        </div>
      </div>
    </RootFileUploadItem>
  )
}
