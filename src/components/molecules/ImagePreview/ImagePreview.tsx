import { DialogDescription } from '@radix-ui/react-dialog'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Skeleton,
} from '../../atoms'
import { cn } from '../../utils'
import { XIcon } from '@phosphor-icons/react'
import { useState } from 'react'

interface ImagePreviewProps {
  src: string
  alt: string
  height?: string | number
  width?: string | number
  minHeight?: string | number
  minWidth?: string | number
  allowExpand?: boolean
  className?: string
}

export const ImagePreview = ({
  src,
  alt,
  height,
  width,
  minHeight,
  minWidth,
  allowExpand,
  className,
}: ImagePreviewProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const containerBaseStyle = `rounded-md`

  if (allowExpand) {
    return (
      <div
        className={cn(
          containerBaseStyle,
          'hover:bg-black outline-0',
          className
        )}
        style={{
          height,
          width,
          minWidth: minWidth ?? width,
          minHeight: minHeight ?? height,
        }}
      >
        <Dialog
          onOpenChange={(open) => {
            if (open) {
              setIsLoading(true)
            }
          }}
        >
          <DialogTrigger
            className={cn(
              'w-full h-full items-center justify-center flex overflow-clip rounded-md bg-white',
              'outline-0 hover:opacity-80 focus-visible:ring-ring/50 focus-visible:ring-3 cursor-zoom-in'
            )}
          >
            <img
              alt={alt}
              src={src}
              width="100%"
              height="100%"
              className="object-cover h-full w-full"
            />
          </DialogTrigger>
          <DialogContent className="p-3 border-0" showCloseButton={false}>
            <DialogClose asChild>
              <Button
                type="button"
                size="icon"
                colorScheme="secondary"
                variant="roundIcon"
                className="absolute -top-5 -right-5 size-5"
              >
                <XIcon className="size-3" />
              </Button>
            </DialogClose>
            <DialogDescription className="overflow-clip rounded-md">
              {isLoading && <Skeleton className="w-full h-50" />}
              <img
                alt={alt}
                src={src}
                width="100%"
                height="100%"
                className={cn(
                  'object-contain h-full w-full',
                  isLoading && 'hidden'
                )}
                onLoad={() => setIsLoading(false)}
              />
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div
      className={cn(containerBaseStyle, 'overflow-clip bg-white', className)}
      style={{
        height,
        width,
        minWidth: minWidth ?? width,
        minHeight: minHeight ?? height,
      }}
    >
      <img
        alt={alt}
        src={src}
        width="100%"
        height="100%"
        className="object-cover h-full w-full"
      />
    </div>
  )
}
