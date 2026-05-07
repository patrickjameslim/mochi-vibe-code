import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

// ─── Primitives re-exported for advanced use ──────────────────────────────────
const SheetPortal   = DialogPrimitive.Portal;
const SheetTrigger  = DialogPrimitive.Trigger;
const SheetClose    = DialogPrimitive.Close;

// ─── Overlay ─────────────────────────────────────────────────────────────────
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/30',
      'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

// ─── Content (the sliding panel) ─────────────────────────────────────────────
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'right' | 'left';
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col bg-white shadow-2xl border-l border-gray-200',
        'top-0 h-full w-[400px]',
        side === 'right' ? 'right-0' : 'left-0',
        'data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

// ─── Compatibility wrapper keeping the original controlled API ────────────────
// Usage: <Sheet open={bool} onClose={fn}><SheetHeader /><SheetBody />…</Sheet>
interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Sheet({ open, onClose, children }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent>{children}</SheetContent>
    </DialogPrimitive.Root>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
      <DialogPrimitive.Title className="text-base font-semibold text-gray-900">
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Close
        onClick={onClose}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
      >
        <X size={15} weight="bold" />
      </DialogPrimitive.Close>
    </div>
  );
}

// ─── Body ────────────────────────────────────────────────────────────────────
function SheetBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function SheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
      {children}
    </div>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
};
