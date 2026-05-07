import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Applies red border + ring to indicate a validation error */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex w-full rounded-lg border bg-white px-3 py-2 text-sm',
        'placeholder:text-gray-400',
        'outline-none transition-shadow',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error
          ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:border-red-500'
          : 'border-gray-200 focus:ring-2 focus:ring-violet-200 focus:border-violet-400',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
