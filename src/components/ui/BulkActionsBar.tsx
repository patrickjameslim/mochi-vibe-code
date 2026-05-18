import { X } from '@phosphor-icons/react';

export interface BulkAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface BulkActionsBarProps {
  selectedCount: number;
  subtitle?: string;
  actions: BulkAction[];
  onDismiss: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  subtitle,
  actions,
  onDismiss,
}: BulkActionsBarProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto animate-bulk-bar-in">
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-slate-200 whitespace-nowrap">

          {/* Count + subtitle */}
          <div className="flex flex-col leading-tight mr-1">
            <span className="text-sm font-semibold text-slate-900">
              {selectedCount} selected
            </span>
            {subtitle && (
              <span className="text-xs text-slate-500">{subtitle}</span>
            )}
          </div>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          {/* Action buttons */}
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                action.variant === 'destructive'
                  ? 'text-red-600 border-red-200 hover:bg-red-50'
                  : 'text-slate-700 border-slate-200 hover:bg-slate-50',
              ].join(' ')}
            >
              {action.icon}
              {action.label}
            </button>
          ))}

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Clear selection"
          >
            <X size={15} weight="bold" />
          </button>

        </div>
      </div>
    </div>
  );
}
