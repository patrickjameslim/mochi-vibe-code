import { useState } from 'react';
import {
  ArrowsDownUp,
  Funnel,
  DotsThreeVertical,
  BellSimple,
  CopySimple,
  FileText,
  Prohibit,
  CheckCircle,
  ChatCircle,
  PencilSimple,
  Archive,
  PaperPlaneTilt,
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
import { useNavigate } from '@tanstack/react-router';
import { formatPeso, RECURRING_BILLS, RECURRING_BILL_STATUS_CFG, type RecurringBillStatus } from '#/data/recurringBilling';

// Status config now lives in recurringBilling.ts (RECURRING_BILL_STATUS_CFG)
// so this table and the Recurring Bill Info detail page share one copy.
const STATUS_CFG = RECURRING_BILL_STATUS_CFG;

type Filter = 'all' | RecurringBillStatus;

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',             label: 'All' },
  { value: 'draft',           label: 'Draft' },
  { value: 'scheduled',       label: 'Scheduled' },
  { value: 'sent',            label: 'Sent' },
  { value: 'verifying',       label: 'Verifying' },
  { value: 'paid',            label: 'Paid' },
  { value: 'overdue',         label: 'Overdue' },
  { value: 'void',            label: 'Void' },
  { value: 'partially-paid',  label: 'Partially paid' },
  { value: 'archived',        label: 'Archived' },
];

type SortKey = 'cycleId' | 'billId' | 'amount';

export function RecurringBillsTable() {
  const navigate = useNavigate();
  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');
  const { sortKey, sortAsc, toggleSort } = useTableSort<SortKey>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const bills = RECURRING_BILLS;

  const counts = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const afterFilter = filter === 'all' ? bills : bills.filter((b) => b.status === filter);
  const q = search.trim().toLowerCase();
  const afterSearch = q ? afterFilter.filter((b) => b.id.toLowerCase().includes(q)) : afterFilter;

  const sorted = sortKey === null ? [...afterSearch] : [...afterSearch].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'amount') cmp = a.amount - b.amount;
    else if (sortKey === 'cycleId') cmp = a.cycleId.localeCompare(b.cycleId);
    else if (sortKey === 'billId') cmp = a.id.localeCompare(b.id);
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

  const allChecked  = paginated.length > 0 && paginated.every((b) => selected.has(b.id));
  const someChecked = paginated.some((b) => selected.has(b.id)) && !allChecked;

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(paginated.map((b) => b.id)));
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
    count: value === 'all' ? bills.length : (counts[value] ?? 0),
  }));

  const headers = (
    <>
      <SortTh>Status</SortTh>
      <SortTh colSortKey="billId" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void}>
        Bill ID
      </SortTh>
      <SortTh>Recurring cycle name</SortTh>
      <SortTh colSortKey="amount" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void} align="right">
        Amount
      </SortTh>
      <SortTh>Bill date</SortTh>
      <SortTh>Due date</SortTh>
      <SortTh>Customer</SortTh>
      <SortTh colSortKey="cycleId" activeSortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort as (key: string) => void}>
        Recurring cycle ID
      </SortTh>
      <SortTh align="right">Quick actions</SortTh>
    </>
  );

  // Quick actions genuinely vary by status — each icon is a real, distinct
  // action available for that state (e.g. a Scheduled bill can only be
  // edited before it goes out; a Sent bill can be reminded/duplicated/
  // viewed; a Verifying bill can be rejected/duplicated/approved).
  function quickActionsFor(status: RecurringBillStatus) {
    switch (status) {
      case 'sent':
        return (
          <>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Send reminder">
              <BellSimple size={16} />
            </Button>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Duplicate">
              <CopySimple size={16} />
            </Button>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="View details">
              <FileText size={16} />
            </Button>
          </>
        );
      case 'verifying':
        return (
          <>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Reject payment">
              <Prohibit size={16} />
            </Button>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Duplicate">
              <CopySimple size={16} />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 !bg-emerald-50 hover:!bg-emerald-100 !border-emerald-200 !text-emerald-700 shadow-none border"
              title="Confirm payment"
            >
              <CheckCircle size={16} />
            </Button>
          </>
        );
      case 'scheduled':
        return (
          <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Edit bill">
            <PencilSimple size={16} />
          </Button>
        );
      case 'paid':
        return (
          <>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Duplicate">
              <CopySimple size={16} />
            </Button>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Send receipt">
              <ChatCircle size={16} />
            </Button>
          </>
        );
      case 'overdue':
        return (
          <>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Send reminder">
              <BellSimple size={16} />
            </Button>
            <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Duplicate">
              <CopySimple size={16} />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 !bg-emerald-50 hover:!bg-emerald-100 !border-emerald-200 !text-emerald-700 shadow-none border"
              title="Mark as paid"
            >
              <CheckCircle size={16} />
            </Button>
          </>
        );
      case 'draft':
        return (
          <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Edit bill">
            <PencilSimple size={16} />
          </Button>
        );
      default:
        return (
          <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="View details">
            <FileText size={16} />
          </Button>
        );
    }
  }

  const rows = paginated.map((bill) => {
    const isSel = selected.has(bill.id);
    const status = STATUS_CFG[bill.status];

    return (
      <tr key={bill.id} className={['transition-colors hover:bg-slate-50', isSel ? 'bg-violet-50' : ''].join(' ')}>
        <td className="px-3 py-2.5">
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => toggleRow(bill.id)}
            className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
          />
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <span className={`inline-flex items-center justify-center w-[88px] rounded-full border py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <button
            onClick={() => navigate({ to: '/billings/recurring/$billId', params: { billId: bill.id } })}
            className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm text-left"
          >
            <Highlight text={bill.id} query={q} />
          </button>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
          {bill.billName}
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-medium text-slate-700 tabular-nums">
          {formatPeso(bill.amount)}
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">{bill.billDate}</td>
        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">{bill.dueDate}</td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-white font-semibold shrink-0"
              style={{ backgroundColor: bill.customerAvatarColor, fontSize: 10 }}
            >
              {bill.customerInitials}
            </span>
            <span className="text-slate-700 text-sm max-w-[140px] truncate">{bill.customerName}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <a href="#" className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm">
            <Highlight text={bill.cycleId} query={q} />
          </a>
        </td>
        <td className="px-3 py-2.5 whitespace-nowrap">
          <div className="flex items-center justify-end gap-2">{quickActionsFor(bill.status)}</div>
        </td>
        <td className="px-2 py-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:bg-slate-100 transition-colors outline-none">
              <DotsThreeVertical size={16} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <PaperPlaneTilt size={14} className="text-slate-400" />
                Send
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CopySimple size={14} className="text-slate-400" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CheckCircle size={14} className="text-slate-400" />
                Mark as paid
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
    ? `No ${STATUS_CFG[filter as RecurringBillStatus]?.label.toLowerCase()} bills.`
    : 'No recurring bills have been generated yet.';

  return (
    <DataTable
      tabs={tabs}
      activeTab={filter}
      onTabChange={(v) => handleFilterChange(v as Filter)}
      tabVariant="pill"
      search={search}
      onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
      searchPlaceholder="Enter bill ID"
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
      emptyIcon={<FileText size={22} />}
      emptyTitle="No recurring bills found"
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
