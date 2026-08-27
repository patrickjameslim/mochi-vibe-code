import { Columns } from '@phosphor-icons/react';

interface ColumnsButtonProps {
  onClick: () => void;
  activeChanges?: number;
}

export function ColumnsButton({ onClick, activeChanges = 0 }: ColumnsButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border text-sm transition-colors',
        activeChanges > 0
          ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      ].join(' ')}
    >
      <Columns size={14} />
      Columns
      {activeChanges > 0 && (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold leading-none">
          {activeChanges}
        </span>
      )}
    </button>
  );
}
