import React from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-violet-600 text-white border border-violet-600 hover:bg-violet-700 hover:border-violet-700 active:bg-violet-800 focus-visible:ring-violet-400',
  outline:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-400',
  ghost:
    'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-400',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'outline',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[base, variants[variant], sizes[size], className].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
