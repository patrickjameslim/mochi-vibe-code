import * as React from 'react'
import TextareaAutosize, {
  TextareaAutosizeProps,
} from 'react-textarea-autosize'
import { cn } from '../../utils'

interface TextareaInputProps
  extends TextareaAutosizeProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  dataTestId?: string
}

export const TextareaInput = ({ className, ...props }: TextareaInputProps) => {
  return (
    <TextareaAutosize
      {...props}
      rows={1}
      className={cn(
        'w-full transition-[color,box-shadow] border resize-none outline-none px-3 py-2 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 rounded-md focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[0.5px] selection:bg-primary selection:text-primary-foreground',
        'aria-invalid:ring-destructive dark:aria-invalid:ring-destructive aria-invalid:border-destructive aria-invalid:focus-visible:ring-[0.5px] bg-white',
        className
      )}
    />
  )
}
