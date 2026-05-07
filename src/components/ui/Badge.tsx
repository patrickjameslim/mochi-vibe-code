import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-gray-300 bg-white text-gray-600',
        primary:
          'border-violet-200 bg-violet-100 text-violet-700',
        secondary:
          'border-gray-200 bg-gray-100 text-gray-600',
        success:
          'border-green-200 bg-green-50 text-green-700',
        destructive:
          'border-red-200 bg-red-50 text-red-700',
        outline:
          'border-gray-300 bg-transparent text-gray-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
