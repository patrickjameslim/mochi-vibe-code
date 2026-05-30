import { useCallback, useEffect, useState } from 'react'

interface UseCopyToClipboardProps {
  isCopied?: boolean
  onCopyChange?: (isCopied: boolean) => void
}

interface HandleCopyProps {
  content: string
  onCopy?: (content: string) => void
}
export const useCopyToClipboard = (props?: UseCopyToClipboardProps) => {
  const isCopied = props?.isCopied ?? false
  const onCopyChange = props?.onCopyChange

  const [localIsCopied, setLocalIsCopied] = useState(isCopied)

  useEffect(() => {
    setLocalIsCopied(isCopied ?? false)
  }, [isCopied])

  const handleIsCopied = useCallback(
    (isCopied: boolean) => {
      setLocalIsCopied(isCopied)
      onCopyChange?.(isCopied)
    },
    [onCopyChange]
  )

  const handleCopy = useCallback(
    ({ content, onCopy }: HandleCopyProps) => {
      if (localIsCopied) return

      navigator.clipboard
        .writeText(content)
        .then(() => {
          handleIsCopied(true)
          setTimeout(() => handleIsCopied(false), 3000)
          onCopy?.(content)
        })
        .catch((error) => {
          console.error('Error copying command', error)
        })
    },
    [localIsCopied, handleIsCopied]
  )

  return { isCopied: localIsCopied, handleCopy }
}
