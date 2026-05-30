import { useRef, useEffect } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { Paginate } from '#/components/molecules/Paginate';

export interface DataTableTabDef {
  value: string;
  label: string;
  count?: number;
}

interface DataTableProps {
  // Card
  cardClass?: string;

  // Tabs
  tabs?: DataTableTabDef[];
  rightTabs?: DataTableTabDef[];
  activeTab?: string;
  onTabChange?: (value: string) => void;

  // Top scrollbar (synced with table — pass false for tabs that swap to a non-table view)
  showTopScrollbar?: boolean;

  // Toolbar
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  toolbarEnd?: React.ReactNode;

  // Table header cells (checkbox + kebab injected by DataTable)
  allChecked: boolean;
  someChecked: boolean;
  onToggleAll: () => void;
  hasLeftPinned: boolean;
  headers: React.ReactNode;

  // Table rows OR a replacement view (e.g. Customer groups)
  rows?: React.ReactNode;
  customContent?: React.ReactNode;

  // Empty state
  isEmpty: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;

  // Pagination
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (value: number) => void;
}

function Tab({ label, count, active, onClick }: Omit<DataTableTabDef, 'value'> & { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
        active ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700',
      ].join(' ')}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={[
          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
          active ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500',
        ].join(' ')}>
          {count}
        </span>
      )}
    </button>
  );
}

export function DataTable({
  cardClass = 'bg-white rounded-xl border border-slate-200 overflow-hidden',
  tabs,
  rightTabs,
  activeTab,
  onTabChange,
  showTopScrollbar = false,
  search,
  onSearch,
  searchPlaceholder = 'Search',
  toolbarEnd,
  allChecked,
  someChecked,
  onToggleAll,
  hasLeftPinned,
  headers,
  rows,
  customContent,
  isEmpty,
  emptyIcon,
  emptyTitle = 'No results',
  emptyMessage = 'Nothing to show here.',
  currentPage,
  totalPages,
  perPage,
  totalRows,
  onPageChange,
  onPerPageChange,
}: DataTableProps) {
  const searchRef    = useRef<HTMLInputElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const spacerRef    = useRef<HTMLDivElement>(null);

  // Keep spacer width = table scrollWidth so the top thumb is sized correctly
  useEffect(() => {
    if (!showTopScrollbar) return;
    const tableEl = tableScrollRef.current;
    if (!tableEl || !spacerRef.current) return;
    const sync = () => {
      if (spacerRef.current && tableEl) spacerRef.current.style.width = tableEl.scrollWidth + 'px';
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(tableEl);
    return () => ro.disconnect();
  }, [showTopScrollbar]);

  return (
    <div className={cardClass}>
      {/* ── Tabs ── */}
      {(tabs || rightTabs) && (
        <div className="border-b border-slate-200 px-4 flex items-center justify-between">
          <div className="flex items-center">
            {tabs?.map((tab) => (
              <Tab
                key={tab.value}
                {...tab}
                active={activeTab === tab.value}
                onClick={() => onTabChange?.(tab.value)}
              />
            ))}
          </div>
          {rightTabs && (
            <div className="flex items-center">
              {rightTabs.map((tab) => (
                <Tab
                  key={tab.value}
                  {...tab}
                  active={activeTab === tab.value}
                  onClick={() => onTabChange?.(tab.value)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Top scrollbar ── */}
      {showTopScrollbar && (
        <div className="border-b border-slate-100">
          <div
            ref={topScrollRef}
            className="overflow-x-scroll"
            onScroll={() => {
              if (tableScrollRef.current && topScrollRef.current)
                tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
            }}
          >
            <div ref={spacerRef} style={{ height: 1 }} />
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className={`w-full pl-8 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 ${search ? 'pr-7' : 'pr-3'}`}
          />
          {search && (
            <button
              onClick={() => { onSearch(''); searchRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
        {toolbarEnd && <div className="ml-auto flex items-center gap-2">{toolbarEnd}</div>}
      </div>

      {/* ── Main content ── */}
      {customContent ?? (
        isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {emptyIcon && (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                {emptyIcon}
              </div>
            )}
            <p className="text-sm font-medium text-slate-500">{emptyTitle}</p>
            <p className="text-xs text-slate-400 mt-1">{emptyMessage}</p>
          </div>
        ) : (
          <div
            ref={tableScrollRef}
            className="overflow-x-auto"
            onScroll={() => {
              if (topScrollRef.current && tableScrollRef.current)
                topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
            }}
          >
            <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th
                    className="sticky left-0 z-[3] w-10 px-3 py-2.5 bg-slate-50"
                    style={!hasLeftPinned ? { borderRight: '1px solid #d1d5db' } : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={onToggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
                    />
                  </th>
                  {headers}
                  <th className="sticky right-0 z-[3] w-10 bg-slate-50 [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_#f9fafb]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Rows per page</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="ml-2">{totalRows} total</span>
        </div>
        {totalPages > 1 && (
          <Paginate
            currentPage={currentPage}
            totalPages={totalPages}
            onGoToPage={onPageChange}
            onNext={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            onPrev={() => onPageChange(Math.max(currentPage - 1, 1))}
          />
        )}
      </div>
    </div>
  );
}
