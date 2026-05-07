import { useState, useRef, useEffect } from 'react';
import {
  ArrowsDownUp,
  MagnifyingGlass,
  Funnel,
  Columns,
  CaretDown,
  Plus,
  DotsThreeVertical,
  PaperPlaneTilt,
  CopySimple,
  CheckCircle,
  Archive,
  X,
  FileText,
  Link as LinkIcon,
  Tag,
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/DropdownMenu';
import { Bill, BillStatus, BillType, formatPeso } from '../data/bills';

// ─── Status & type config ─────────────────────────────────────────────────────

const STATUS_CFG: Record<BillStatus, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-gray-100 text-gray-500 border border-gray-200' },
  sent:      { label: 'Sent',      className: 'bg-teal-500 text-white' },
  scheduled: { label: 'Scheduled', className: 'bg-indigo-500 text-white' },
  verifying: { label: 'Verifying', className: 'bg-amber-500 text-white' },
  paid:      { label: 'Paid',      className: 'bg-emerald-500 text-white' },
  overdue:   { label: 'Overdue',   className: 'bg-red-50 text-red-600 border border-red-200' },
  void:      { label: 'Void',      className: 'bg-gray-200 text-gray-400 border border-gray-300' },
};

const TYPE_CFG: Record<BillType, { label: string; className: string }> = {
  'one-time':    { label: 'One-time',    className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'recurring':   { label: 'Recurring',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'installment': { label: 'Installment', className: 'bg-orange-50 text-orange-700 border border-orange-200' },
};

// ─── Filter tab type ──────────────────────────────────────────────────────────

type Filter = 'all' | BillStatus;

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'overdue',   label: 'Overdue' },
  { value: 'draft',     label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent',      label: 'Sent' },
  { value: 'verifying', label: 'Verifying' },
  { value: 'paid',      label: 'Paid' },
  { value: 'void',      label: 'Void' },
];

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = 'id' | 'title' | 'amount' | 'billDate' | 'dueDate' | 'daysOutstanding' | 'lastUpdatedAt';

// ─── Tab ─────────────────────────────────────────────────────────────────────

function Tab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
        active
          ? 'border-violet-600 text-violet-700'
          : 'border-transparent text-gray-500 hover:text-gray-700',
      ].join(' ')}
    >
      {label}
      {count > 0 && (
        <span className={[
          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
          active ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500',
        ].join(' ')}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortTh({
  children,
  col,
  current,
  onSort,
  align = 'left',
}: {
  children: React.ReactNode;
  col: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  return (
    <th className={`px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap select-none ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 hover:text-gray-700 transition-colors ${current === col ? 'text-gray-700' : ''}`}
      >
        {children}
        <ArrowsDownUp size={12} weight="bold" className={current === col ? 'text-violet-500' : 'text-gray-400'} />
      </button>
    </th>
  );
}

// ─── Per-page dropdown ────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function PerPageDropdown({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50 transition-colors"
      >
        {value}
        <CaretDown size={12} className={['transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-20 min-w-[72px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {PER_PAGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={[
                'w-full px-3 py-1.5 text-left text-sm transition-colors',
                opt === value ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-700 hover:bg-gray-50',
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

// ─── Pagination ───────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function Pagination({
  currentPage, totalPages, perPage, totalRows, onPageChange, onPerPageChange,
}: {
  currentPage: number; totalPages: number; perPage: number; totalRows: number;
  onPageChange: (p: number) => void; onPerPageChange: (v: number) => void;
}) {
  const pages = getPageNumbers(currentPage, totalPages);
  const start = (currentPage - 1) * perPage + 1;
  const end   = Math.min(currentPage * perPage, totalRows);

  return (
    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Show</span>
        <PerPageDropdown value={perPage} onChange={onPerPageChange} />
        <span>per page</span>
        <span className="ml-2 text-gray-400">· {start}–{end} of {totalRows}</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="w-8 text-center text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={[
                'w-8 h-8 rounded border text-sm transition-colors',
                p === currentPage
                  ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
        >
          Next <CaretDown size={12} className="-rotate-90" />
        </button>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  bills: Bill[];
  onCreateBill?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReceivablesTable({ bills, onCreateBill }: Props) {
  const [filter, setFilter]     = useState<Filter>('all');
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<SortKey>('id');
  const [sortAsc, setSortAsc]   = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage]   = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedLink, setCopiedLink]   = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const counts = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  // Filter → search → sort
  const afterFilter = filter === 'all' ? bills : bills.filter((b) => b.status === filter);
  const q = search.trim().toLowerCase();
  const afterSearch = q
    ? afterFilter.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q),
      )
    : afterFilter;

  const sorted = [...afterSearch].sort((a, b) => {
    let cmp = 0;
    if      (sortKey === 'amount')          cmp = a.amount - b.amount;
    else if (sortKey === 'daysOutstanding') cmp = a.daysOutstanding - b.daysOutstanding;
    else if (sortKey === 'id')              cmp = a.id.localeCompare(b.id);
    else if (sortKey === 'title')           cmp = a.title.localeCompare(b.title);
    else if (sortKey === 'billDate')        cmp = new Date(a.billDate).getTime() - new Date(b.billDate).getTime();
    else if (sortKey === 'dueDate')         cmp = new Date(a.dueDate).getTime()  - new Date(b.dueDate).getTime();
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

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

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 1500);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ── Filter tabs ── */}
      <div className="border-b border-gray-200 px-4 flex items-center gap-0">
        {FILTER_TABS.map(({ value, label }) => (
          <Tab
            key={value}
            label={label}
            count={value === 'all' ? bills.length : (counts[value] ?? 0)}
            active={filter === value}
            onClick={() => handleFilterChange(value)}
          />
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by bill ID or customer"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className={`w-full pl-8 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 ${search ? 'pr-7' : 'pr-3'}`}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setCurrentPage(1); searchRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Funnel size={14} />
            Filter
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <ArrowsDownUp size={14} />
            Last updated at
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Columns size={14} />
            Columns
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <FileText size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No bills found</p>
            <p className="text-xs text-gray-400 mt-1">
              {q
                ? 'Try a different search term.'
                : filter !== 'all'
                ? `No ${STATUS_CFG[filter as BillStatus]?.label.toLowerCase()} bills.`
                : 'No bills have been created yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 accent-violet-600 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Status
                </th>
                <SortTh col="id"              current={sortKey} onSort={toggleSort}>Bill ID</SortTh>
                <SortTh col="title"           current={sortKey} onSort={toggleSort}>Bill name</SortTh>
                <SortTh col="amount"          current={sortKey} onSort={toggleSort} align="right">Amount</SortTh>
                <SortTh col="billDate"        current={sortKey} onSort={toggleSort}>Bill date</SortTh>
                <SortTh col="dueDate"         current={sortKey} onSort={toggleSort}>Due date</SortTh>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Customer</th>
                <SortTh col="daysOutstanding" current={sortKey} onSort={toggleSort}>Days outstanding</SortTh>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Link</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Billing type</th>
                <SortTh col="lastUpdatedAt"   current={sortKey} onSort={toggleSort}>Last updated at</SortTh>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Payment date</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Payment method</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Tags</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Quick actions</th>
                <th className="sticky right-0 z-10 w-10 bg-gray-50 [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_#f9fafb]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((bill) => {
                const isSelected = selected.has(bill.id);
                const status = STATUS_CFG[bill.status];
                const type   = TYPE_CFG[bill.type];
                return (
                  <tr
                    key={bill.id}
                    className={['transition-colors hover:bg-gray-50', isSelected ? 'bg-violet-50' : ''].join(' ')}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(bill.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-violet-600 cursor-pointer"
                      />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* Bill ID */}
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-gray-600">
                      {bill.id}
                    </td>

                    {/* Bill name */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <button className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm text-left transition-colors">
                        {bill.title}
                      </button>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-semibold text-gray-800 tabular-nums">
                      {formatPeso(bill.amount)}
                    </td>

                    {/* Bill date */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                      {bill.billDate}
                    </td>

                    {/* Due date */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                      {bill.dueDate}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: bill.customerAvatarColor }}
                        >
                          {bill.customerInitials}
                        </span>
                        <span className="text-sm text-gray-700 max-w-[130px] truncate">{bill.customerName}</span>
                      </div>
                    </td>

                    {/* Days outstanding */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                      <span className={bill.daysOutstanding > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {bill.daysOutstanding}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-violet-600">{bill.link}</span>
                        <button
                          onClick={() => copyLink(bill.link)}
                          className="text-gray-400 hover:text-violet-500 transition-colors"
                          title="Copy link"
                        >
                          {copiedLink === bill.link
                            ? <LinkIcon size={12} className="text-emerald-500" />
                            : <CopySimple size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Billing type */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${type.className}`}>
                        {type.label}
                      </span>
                    </td>

                    {/* Last updated at */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                      {bill.lastUpdatedAt}
                    </td>

                    {/* Payment date */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                      {bill.paymentDate ?? <span className="text-gray-400">N/A</span>}
                    </td>

                    {/* Payment method */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                      {bill.paymentMethod ?? <span className="text-gray-400">N/A</span>}
                    </td>

                    {/* Tags */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {bill.tags && bill.tags.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {bill.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200"
                            >
                              <Tag size={9} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>

                    {/* Quick actions */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          title="Send"
                          className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <PaperPlaneTilt size={14} />
                        </button>
                        <button
                          title="Mark as paid"
                          className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Kebab menu */}
                    <td className="sticky right-0 z-10 px-2 py-2.5 bg-white [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_white]">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:bg-gray-100 transition-colors outline-none">
                          <DotsThreeVertical size={16} weight="bold" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <PaperPlaneTilt size={14} className="text-gray-400" />
                            Send
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CopySimple size={14} className="text-gray-400" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle size={14} className="text-gray-400" />
                            Mark as paid
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive>
                            <Archive size={14} />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {sorted.length > 0 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          perPage={perPage}
          totalRows={sorted.length}
          onPageChange={setCurrentPage}
          onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
        />
      )}
    </div>
  );
}
