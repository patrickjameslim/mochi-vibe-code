import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm',
        'placeholder:text-gray-400',
        'outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'resize-none transition-shadow',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
