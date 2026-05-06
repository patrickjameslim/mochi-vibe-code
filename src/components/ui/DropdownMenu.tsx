import * as Radix from '@radix-ui/react-dropdown-menu';
import { twMerge } from 'tailwind-merge';

export const DropdownMenu = Radix.Root;
export const DropdownMenuTrigger = Radix.Trigger;

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
  ...props
}: Radix.DropdownMenuContentProps & { className?: string }) {
  return (
    <Radix.Portal>
      <Radix.Content
        align={align}
        sideOffset={4}
        className={twMerge(
          'z-50 min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg',
          '',
          className
        )}
        {...props}
      >
        {children}
      </Radix.Content>
    </Radix.Portal>
  );
}

export function DropdownMenuItem({
  children,
  className,
  destructive = false,
  onSelect,
  ...props
}: Radix.DropdownMenuItemProps & { className?: string; destructive?: boolean }) {
  return (
    <Radix.Item
      onSelect={onSelect}
      className={twMerge(
        'flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none transition-colors',
        destructive
          ? 'text-red-600 focus:bg-red-50'
          : 'text-gray-700 focus:bg-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </Radix.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <Radix.Separator
      className={twMerge('my-1 h-px bg-gray-100', className)}
    />
  );
}
