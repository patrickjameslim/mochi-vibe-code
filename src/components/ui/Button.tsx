import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:
          'bg-violet-600 text-white border border-violet-600 hover:bg-violet-700 hover:border-violet-700 active:bg-violet-800 focus-visible:ring-violet-400',
        outline:
          'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400',
        ghost:
          'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:ring-slate-400',
        destructive:
          'bg-red-600 text-white border border-red-600 hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-400',
        secondary:
          'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
        link: 'text-violet-600 underline-offset-4 hover:underline border-0 p-0 h-auto font-normal',
      },
      size: {
        sm:   'px-3 py-1.5 text-xs',
        md:   'px-4 py-2 text-sm',
        lg:   'px-5 py-2.5 text-base',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
