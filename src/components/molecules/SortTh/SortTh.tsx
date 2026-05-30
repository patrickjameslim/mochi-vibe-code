import { ArrowDown, ArrowUp, ArrowsDownUp } from '@phosphor-icons/react';

interface SortThProps {
  children: React.ReactNode;
  colSortKey?: string;
  activeSortKey?: string | null;
  sortAsc?: boolean;
  onSort?: (key: string) => void;
  align?: 'left' | 'right';
  style?: React.CSSProperties;
}

export function SortTh({
  children,
  colSortKey,
  activeSortKey = null,
  sortAsc = false,
  onSort,
  align = 'left',
  style,
}: SortThProps) {
  const isActive = !!colSortKey && activeSortKey === colSortKey;
  const thClass = `px-3 py-2.5 text-sm font-semibold text-slate-500 whitespace-nowrap select-none tracking-[0.06em] bg-slate-50 ${align === 'right' ? 'text-right' : 'text-left'}`;

  if (!colSortKey) {
    return <th style={style} className={thClass}>{children}</th>;
  }

  const SortIcon = isActive ? (sortAsc ? ArrowUp : ArrowDown) : ArrowsDownUp;

  return (
    <th style={style} className={thClass}>
      <button
        onClick={() => onSort?.(colSortKey)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 transition-colors ${isActive ? 'text-slate-700' : ''}`}
      >
        {children}
        <SortIcon size={12} weight="bold" className={isActive ? 'text-violet-500' : 'text-slate-400'} />
      </button>
    </th>
  );
}
