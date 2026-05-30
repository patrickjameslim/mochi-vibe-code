import { FC } from 'react'
import { Progress, Text } from '../../../atoms'
import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import { useFileUploadItemContext } from './FileUploadItemContext'

interface FileUploadItemProgressProps {
  className?: string
  centerLoading?: boolean
}

export const FileUploadItemProgress: FC<FileUploadItemProgressProps> = ({
  centerLoading,
}) => {
  const {
    file: { errors, progress, isExistingFile },
  } = useFileUploadItemContext()
  const hasError = !!errors?.length
  const progressValue = Math.round(progress ?? 0)

  if (isExistingFile) {
    return null
  }

  const ProgressBar = () => (
    <div className="flex items-center gap-1 w-full">
      <Progress
        value={progressValue}
        max={100}
        color={hasError ? 'danger' : 'success'}
        className="w-full"
      />
      <div className="w-fit">
        {hasError ? (
          <XCircleIcon weight="fill" className="fill-destructive" size={17} />
        ) : progressValue < 100 ? (
          <Text as="span" className="leading-none">
            {progressValue}%
          </Text>
        ) : (
          <CheckCircleIcon weight="fill" className="fill-success" size={17} />
        )}
      </div>
    </div>
  )

  if (centerLoading) {
    // TODO: replace with circular progress

    return (
      progressValue < 100 &&
      !hasError && (
        <div className="absolute inset-0 flex items-center rounded-md justify-center px-2 bg-black/40 text-white">
          <ProgressBar />
        </div>
      )
    )
  }

  return <ProgressBar />
}
