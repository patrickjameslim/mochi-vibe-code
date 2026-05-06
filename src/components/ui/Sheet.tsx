import { useEffect } from 'react';
import { X } from '@phosphor-icons/react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, children }: SheetProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      aria-hidden={!open}
      className={[
        'fixed right-0 top-0 z-50 flex h-screen w-[400px] flex-col bg-white shadow-2xl',
        'border-l border-gray-200',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      {children}
    </div>
  );
}

export function SheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <button
        onClick={onClose}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
      >
        <X size={15} weight="bold" />
      </button>
    </div>
  );
}

export function SheetBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
  );
}

export function SheetFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
      {children}
    </div>
  );
}
