import { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function PerPageDropdown({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50 transition-colors"
      >
        {value}
        <CaretDown size={12} className={['transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-20 min-w-[72px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {PER_PAGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={[
                'w-full px-3 py-1.5 text-left text-sm transition-colors',
                opt === value ? 'bg-violet-50 text-violet-700 font-medium' : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export function Pagination({
  currentPage, totalPages, perPage, totalRows, onPageChange, onPerPageChange,
}: {
  currentPage: number; totalPages: number; perPage: number; totalRows: number;
  onPageChange: (p: number) => void; onPerPageChange: (v: number) => void;
}) {
  const pages = getPageNumbers(currentPage, totalPages);
  const start = (currentPage - 1) * perPage + 1;
  const end   = Math.min(currentPage * perPage, totalRows);

  return (
    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Show</span>
        <PerPageDropdown value={perPage} onChange={onPerPageChange} />
        <span>per page</span>
        <span className="ml-2 text-slate-400">· {start}–{end} of {totalRows}</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="w-8 text-center text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={[
                'w-8 h-8 rounded border text-sm transition-colors',
                p === currentPage
                  ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
        >
          Next <CaretDown size={12} className="-rotate-90" />
        </button>
      </div>
    </div>
  );
}
