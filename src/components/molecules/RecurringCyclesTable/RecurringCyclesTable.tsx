import { useState } from 'react';
import {
  ArrowsDownUp,
  Funnel,
  DotsThreeVertical,
  PencilSimple,
  DownloadSimple,
  ArrowCounterClockwise,
  CopySimple,
  Archive,
  Cube,
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/atoms/DropdownMenu';
import { Button } from '#/components/atoms/Button';
import { Highlight } from '#/components/molecules/Highlight';
import { SortTh } from '#/components/molecules/SortTh';
import { useTableSort } from '#/hooks/useTableSort';
import { DataTable, DataTableTabDef } from '#/components/molecules/DataTable';
import { formatPeso, RECURRING_CYCLES, RECURRING_CYCLE_STATUS, type RecurringCycleStatus } from '#/data/recurringBilling';

// ─── Status config — same visual language (bordered rounded-full pill) as
// the Bills table's own status badges, so a "cycle" status reads exactly
// like a "bill" status elsewhere in the app. ──
const STATUS_CFG: Record<RecurringCycleStatus, { label: string; className: string }> = {
  active:    { label: 'Active',    className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  draft:     { label: 'Draft',     className: 'bg-slate-50 text-slate-600 border-slate-300' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  paused:    { label: 'Paused',    className: 'bg-slate-50 text-slate-500 border-slate-300' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-50 text-slate-400 border-slate-300' },
  archived:  { label: 'Archived',  className: 'bg-slate-50 text-slate-400 border-slate-300' },
};

type Filter = 'all' | RecurringCycleStatus;

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'draft',     label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused',    label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived',  label: 'Archived' },
];

type SortKey = 'id' | 'amount';

export function RecurringCyclesTable() {
  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');
  const { sortKey, sortAsc, toggleSort } = useTableSort<SortKey>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const cycles = RECURRING_CYCLES.map((c) => ({ ...c, status: RECURRING_CYCLE_STATUS[c.id] }));

  const counts = cycles.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const afterFilter = filter === 'all' ? cycles : cycles.filter((c) => c.status === filter);
  const q = search.trim().toLowerCase();
  const afterSearch = q
    ? afterFilter.filter(
        (c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q),
      )
    : afterFilter;

  const sorted = sortKey === null ? [...afterSearch] : [...afterSearch].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'amount') cmp = a.amount - b.amount;
    else if (sortKey === 'id') cmp = a.id.localeCompare(b.id);
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setCurrentPage(1);
    setSearch('');
  }

  const allChecked  = paginated.length > 0 && paginated.every((c) => selected.has(c.id));
  const someChecked = paginated.some((c) => selected.has(c.id)) && !allChecked;

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(paginated.map((c) => c.id)));
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const tabs: DataTableTabDef[] = FILTER_TABS.map(({ value, label }) => ({
    value,
    label,
    count: value === 'all' ? cycles.length : (counts[value] ?? 0),
  }));

  const headers = (
    <>
      <SortTh>Status</SortTh>
      <SortTh colSortKey="id" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void}>
        Recurring cycle ID
      </SortTh>
      <SortTh>Recurring cycle name</SortTh>
      <SortTh>Customer</SortTh>
      <SortTh>Line items</SortTh>
      <SortTh colSortKey="amount" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void} align="right">
        Amount
      </SortTh>
      <SortTh align="right">Quick actions</SortTh>
    </>
  );

  const rows = paginated.map((cycle) => {
    const isSel = selected.has(cycle.id);
    const status = STATUS_CFG[cycle.status];
    const [firstItem, secondItem, ...rest] = cycle.lineItems;

    return (
      <tr key={cycle.id} className={['transition-colors hover:bg-slate-50', isSel ? 'bg-violet-50' : ''].join(' ')}>
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => toggleRow(cycle.id)}
            className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
          />
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <span className={`inline-flex items-center justify-center w-[100px] rounded-full border py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <span className="text-slate-700 text-sm font-medium">
            <Highlight text={cycle.id} query={q} />
          </span>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <a href="#" className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm">
            <Highlight text={cycle.name} query={q} />
          </a>
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-white font-semibold shrink-0"
              style={{ backgroundColor: cycle.customerAvatarColor, fontSize: 10 }}
            >
              {cycle.customerInitials}
            </span>
            <span className="text-slate-700 text-sm max-w-[160px] truncate">
              <Highlight text={cycle.customerName} query={q} />
            </span>
          </div>
        </td>
        <td className="px-3 py-3 align-top">
          {cycle.lineItems.length <= 1 ? (
            <span className="text-sm text-slate-600">{firstItem}</span>
          ) : (
            <div className="text-sm text-slate-600 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                {firstItem}
              </div>
              <div className="flex items-start gap-1.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                {secondItem}
              </div>
              {rest.length > 0 && (
                <button className="text-violet-600 hover:text-violet-800 hover:underline text-sm mt-0.5">and more...</button>
              )}
            </div>
          )}
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium text-slate-700 tabular-nums">
          {formatPeso(cycle.amount)}
        </td>
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex items-center justify-end gap-2">
            {cycle.status !== 'completed' && (
              <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Edit cycle">
                <PencilSimple size={16} />
              </Button>
            )}
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Export">
              <DownloadSimple size={16} />
            </Button>
            {cycle.status !== 'completed' && (
              <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Restart cycle">
                <ArrowCounterClockwise size={16} />
              </Button>
            )}
          </div>
        </td>
        <td className="px-2 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:bg-slate-100 transition-colors outline-none">
              <DotsThreeVertical size={16} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <CopySimple size={14} className="text-slate-400" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Archive size={14} />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  });

  const emptyMessage = q
    ? 'Try a different search term.'
    : filter !== 'all'
    ? `No ${STATUS_CFG[filter as RecurringCycleStatus]?.label.toLowerCase()} cycles.`
    : 'No recurring cycles have been created yet.';

  return (
    <DataTable
      tabs={tabs}
      activeTab={filter}
      onTabChange={(v) => handleFilterChange(v as Filter)}
      tabVariant="pill"
      search={search}
      onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
      searchPlaceholder="Enter ID, name or customer"
      toolbarEnd={
        <>
          <button className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Funnel size={14} />
            Filter
          </button>
          <button className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowsDownUp size={14} />
            Sort by
          </button>
        </>
      }
      allChecked={allChecked}
      someChecked={someChecked}
      onToggleAll={toggleAll}
      hasLeftPinned={false}
      headers={headers}
      rows={rows}
      isEmpty={paginated.length === 0}
      emptyIcon={<Cube size={22} />}
      emptyTitle="No recurring cycles found"
      emptyMessage={emptyMessage}
      currentPage={safePage}
      totalPages={totalPages}
      perPage={perPage}
      totalRows={sorted.length}
      onPageChange={setCurrentPage}
      onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
    />
  );
}
