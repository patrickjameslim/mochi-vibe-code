import { useRef, useEffect, useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { Paginate } from '#/components/molecules/Paginate';
import { Input } from '#/components/atoms/Input';
import { InputGroup, InputLeftElement, InputRightElement } from '#/components/molecules/InputGroup';

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
  // 'underline' (default): tabs sit inside the card with an underline indicator.
  // 'pill': tabs render as bordered buttons above the card, with counts inline in the label.
  tabVariant?: 'underline' | 'pill';

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
  // Accepted for API compatibility with callers; the checkbox column's border
  // (which used to depend on this) was replaced by the pinnedShadowLeft panel.
  hasLeftPinned: boolean;
  headers: React.ReactNode;
  // Width (px) of the pinned region on each side — checkbox/kebab column plus
  // any user-pinned columns on that side (see useStickyColumns' leftPinnedTotalWidth/
  // rightPinnedTotalWidth). When set, renders a persistent elevated-panel shadow
  // there — box-shadow on a <td>/<th> does not bleed over sibling cells in table
  // layout, so this can't be done via the cell's own box-shadow and needs a
  // dedicated overlay element instead.
  pinnedShadowLeft?: number;
  pinnedShadowRight?: number;

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

function PillTab({ label, count, active, onClick }: Omit<DataTableTabDef, 'value'> & { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1 h-10 px-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap',
        active ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      {label}
      {count !== undefined && <span className={active ? 'text-violet-500' : 'text-slate-400'}>({count})</span>}
    </button>
  );
}

export function DataTable({
  cardClass = 'bg-white rounded-lg border border-slate-200 overflow-hidden',
  tabs,
  rightTabs,
  activeTab,
  onTabChange,
  tabVariant = 'underline',
  showTopScrollbar = false,
  search,
  onSearch,
  searchPlaceholder = 'Search',
  toolbarEnd,
  allChecked,
  someChecked,
  onToggleAll,
  hasLeftPinned: _hasLeftPinned,
  headers,
  pinnedShadowLeft,
  pinnedShadowRight,
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
  const tableRef     = useRef<HTMLTableElement>(null);
  const shadowLeftRef  = useRef<HTMLDivElement>(null);
  const shadowRightRef = useRef<HTMLDivElement>(null);
  const [pinnedShadowHeight, setPinnedShadowHeight] = useState(0);

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

  // Position the pinned-panel shadow overlays directly from scroll state. They
  // can't use `position: sticky` like a real pinned <td> — a plain sibling
  // element's static position never reaches the sticky threshold the way a
  // table cell's does, so it never engages. Instead, track scrollLeft/clientWidth
  // ourselves and place each overlay via `left` in the same coordinate space as
  // the scrolling content. Each overlay spans its FULL pinned-region width (not
  // just a thin divider strip), with its own box-shadow bleeding onto the
  // scrollable table — reading as "this whole panel is elevated", not a seam.
  //
  // The shadow itself is contextual, not permanent — it reflects whether
  // there's actually hidden content behind the pinned panel right now:
  //   - As long as any column is scrolled out of view (maxScroll > 0), the
  //     panel is genuinely "floating over" hidden content — even at rest,
  //     scrollLeft 0, since not-yet-revealed columns already sit behind it.
  //     So the shadow shows at full strength from the very first render,
  //     with no fade-in needed.
  //   - It fades OUT only as the scroll position approaches the end of the
  //     scrollable range — once every column is fully revealed (scrollLeft
  //     === scrollWidth - clientWidth), nothing is hidden underneath the
  //     panel anymore, so the shadow disappears completely.
  //   - If the table doesn't overflow at all (scrollWidth <= clientWidth),
  //     there's nothing to hide behind the panel, so it never shows.
  const PINNED_SHADOW_FADE_DISTANCE = 24;
  const positionPinnedShadows = () => {
    const container = tableScrollRef.current;
    if (!container) return;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const distFromEnd = maxScroll - container.scrollLeft;
    const opacity = maxScroll <= 0
      ? 0
      : Math.max(0, Math.min(1, distFromEnd / PINNED_SHADOW_FADE_DISTANCE));
    if (shadowLeftRef.current && pinnedShadowLeft !== undefined) {
      shadowLeftRef.current.style.left = container.scrollLeft + 'px';
      shadowLeftRef.current.style.opacity = String(opacity);
    }
    if (shadowRightRef.current && pinnedShadowRight !== undefined) {
      shadowRightRef.current.style.left = (container.scrollLeft + container.clientWidth - pinnedShadowRight) + 'px';
      shadowRightRef.current.style.opacity = String(opacity);
    }
  };

  // Height-measurement can't wait on the overlay refs: each overlay only mounts
  // once pinnedShadowHeight > 0, so gating this effect on the refs would never
  // fire on the first pass (chicken-and-egg). Measure height unconditionally;
  // positioning (which does need the refs) is handled by the effect below once
  // the overlays actually exist.
  useEffect(() => {
    if (pinnedShadowLeft === undefined && pinnedShadowRight === undefined) return;
    const container = tableScrollRef.current;
    const tableEl = tableRef.current;
    if (!container || !tableEl) return;

    const sync = () => {
      setPinnedShadowHeight(tableEl.offsetHeight);
      positionPinnedShadows();
    };
    sync();

    container.addEventListener('scroll', sync);
    const ro = new ResizeObserver(sync);
    ro.observe(tableEl);
    ro.observe(container);
    return () => {
      container.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [pinnedShadowLeft, pinnedShadowRight, rows]);

  // Once the overlays have actually mounted (pinnedShadowHeight > 0 renders them), position them.
  useEffect(() => {
    if (pinnedShadowHeight === 0) return;
    positionPinnedShadows();
  }, [pinnedShadowHeight, pinnedShadowLeft, pinnedShadowRight]);

  const searchInput = (
    <InputGroup size="md" className="flex-1 max-w-xs !h-10 rounded-lg border-slate-200 focus-within:border-violet-400 focus-within:ring-violet-200">
      <InputLeftElement>
        <MagnifyingGlass size={14} className="text-slate-400" />
      </InputLeftElement>
      <Input
        ref={searchRef}
        type="text"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      {search && (
        <InputRightElement>
          <button
            onClick={() => { onSearch(''); searchRef.current?.focus(); }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </InputRightElement>
      )}
    </InputGroup>
  );

  const toolbarRow = (
    <div className={tabVariant === 'pill' ? 'flex items-center gap-2 mb-4' : 'px-4 py-3 flex items-center gap-2 border-b border-slate-100'}>
      {searchInput}
      {toolbarEnd && <div className="ml-auto flex items-center gap-2">{toolbarEnd}</div>}
    </div>
  );

  return (
    <>
      {tabVariant === 'pill' && (tabs || rightTabs) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {tabs?.map((tab) => (
              <PillTab
                key={tab.value}
                {...tab}
                active={activeTab === tab.value}
                onClick={() => onTabChange?.(tab.value)}
              />
            ))}
          </div>
          {rightTabs && (
            <div className="flex items-center gap-2 flex-wrap">
              {rightTabs.map((tab) => (
                <PillTab
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

      {tabVariant === 'pill' && toolbarRow}

    <div className={cardClass}>
      {/* ── Tabs ── */}
      {tabVariant === 'underline' && (tabs || rightTabs) && (
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
      {tabVariant !== 'pill' && toolbarRow}

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
            className="overflow-x-auto overflow-y-hidden relative"
            onScroll={() => {
              if (topScrollRef.current && tableScrollRef.current)
                topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
              positionPinnedShadows();
            }}
          >
            <table ref={tableRef} className="w-full text-sm" style={{ borderSpacing: 0, borderCollapse: 'separate' }}>
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="sticky left-0 z-[3] w-10 px-3 py-2.5 bg-white">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={onToggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
                    />
                  </th>
                  {headers}
                  <th className="sticky right-0 z-[3] w-10 bg-white" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows}
              </tbody>
            </table>

            {/* Pinned-panel elevation shadows — backdrops spanning each FULL pinned
                region (not a thin divider strip), sitting behind the real pinned
                cells (z-index 2/3) but above ordinary scrollable cells (z-index
                auto), so their box-shadow reads as "this whole white panel is
                floating above the table" rather than a seam between two columns.
                Needs dedicated overlays since box-shadow doesn't bleed over
                sibling <td>/<th> cells, and a plain sibling can't rely on
                position:sticky the way a real pinned <td> does — positioned via
                JS from scroll state instead (see effects above).
                Contextual, not permanent: starts at opacity 0 (clean column at
                rest) and is faded in/out by positionPinnedShadows() as the user
                scrolls horizontally — see PINNED_SHADOW_FADE_DISTANCE above. */}
            {pinnedShadowLeft !== undefined && pinnedShadowHeight > 0 && (
              <div
                ref={shadowLeftRef}
                aria-hidden
                className="pointer-events-none absolute top-0 z-[1] bg-white transition-opacity duration-150 ease-out"
                style={{
                  width: pinnedShadowLeft,
                  height: pinnedShadowHeight,
                  opacity: 0,
                  boxShadow: '20px 0 32px 4px rgba(15, 23, 42, 0.16), 6px 0 12px 0px rgba(15, 23, 42, 0.10)',
                }}
              />
            )}
            {pinnedShadowRight !== undefined && pinnedShadowHeight > 0 && (
              <div
                ref={shadowRightRef}
                aria-hidden
                className="pointer-events-none absolute top-0 z-[1] bg-white transition-opacity duration-150 ease-out"
                style={{
                  width: pinnedShadowRight,
                  height: pinnedShadowHeight,
                  opacity: 0,
                  boxShadow: '-20px 0 32px 4px rgba(15, 23, 42, 0.16), -6px 0 12px 0px rgba(15, 23, 42, 0.10)',
                }}
              />
            )}
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
    </>
  );
}
