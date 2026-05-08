import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowsDownUp,
  MagnifyingGlass,
  Funnel,
  CaretDown,
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
import ColumnManagementDrawer, { ColumnDef } from './ColumnManagementDrawer';
import { ColumnsButton } from './ui/ColumnsButton';

// ─── Column config ────────────────────────────────────────────────────────────

const DEFAULT_BILLS_COLS: ColumnDef[] = [
  { id: 'status',        label: 'Status',          visible: true,  pin: 'none' },
  { id: 'billID',        label: 'Bill ID',          visible: true,  pin: 'none' },
  { id: 'billName',      label: 'Bill name',        visible: true,  pin: 'none' },
  { id: 'amount',        label: 'Amount',           visible: true,  pin: 'none' },
  { id: 'billDate',      label: 'Bill date',        visible: true,  pin: 'none' },
  { id: 'dueDate',       label: 'Due date',         visible: true,  pin: 'none' },
  { id: 'customer',      label: 'Customer',         visible: true,  pin: 'none' },
  { id: 'daysOutstanding', label: 'Days outstanding', visible: true, pin: 'none' },
  { id: 'link',          label: 'Link',             visible: true,  pin: 'none' },
  { id: 'billingType',   label: 'Billing type',     visible: true,  pin: 'none' },
  { id: 'lastUpdatedAt', label: 'Last updated at',  visible: true,  pin: 'none' },
  { id: 'paymentDate',   label: 'Payment date',     visible: true,  pin: 'none' },
  { id: 'paymentMethod', label: 'Payment method',   visible: true,  pin: 'none' },
  { id: 'tags',          label: 'Tags',             visible: true,  pin: 'none' },
  { id: 'quickActions',  label: 'Quick actions',    visible: true,  pin: 'none' },
];

const COL_WIDTH: Record<string, number> = {
  status: 110, billID: 110, billName: 170, amount: 120, billDate: 110,
  dueDate: 110, customer: 155, daysOutstanding: 145, link: 150,
  billingType: 120, lastUpdatedAt: 145, paymentDate: 120,
  paymentMethod: 140, tags: 140, quickActions: 110,
};

const CHECKBOX_W = 40;
const KEBAB_W    = 44;

// ─── Status & type config ─────────────────────────────────────────────────────

const STATUS_CFG: Record<BillStatus, { label: string; className: string; dotColor?: string }> = {
  draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-800' },
  sent:      { label: 'Sent',      className: 'bg-violet-100 text-violet-800',  dotColor: '#6D41E8' },
  scheduled: { label: 'Scheduled', className: 'bg-[#CDEFC3] text-[#14532D]' },
  verifying: { label: 'Verifying', className: 'bg-amber-100 text-amber-900',   dotColor: '#D97706' },
  paid:      { label: 'Paid',      className: 'bg-green-100 text-[#14532D]',   dotColor: '#16A34A' },
  overdue:   { label: 'Overdue',   className: 'bg-red-100 text-red-900',       dotColor: '#DC2626' },
  void:      { label: 'Void',      className: 'bg-slate-100 text-slate-400' },
};

const TYPE_CFG: Record<BillType, { label: string; className: string }> = {
  'one-time':    { label: 'One-time',    className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'recurring':   { label: 'Recurring',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'installment': { label: 'Installment', className: 'bg-orange-50 text-orange-700 border border-orange-200' },
};

// ─── Filter tab ───────────────────────────────────────────────────────────────

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

const COL_SORT_KEY: Partial<Record<string, SortKey>> = {
  billID: 'id', billName: 'title', amount: 'amount', billDate: 'billDate',
  dueDate: 'dueDate', daysOutstanding: 'daysOutstanding', lastUpdatedAt: 'lastUpdatedAt',
};

// ─── Tab ─────────────────────────────────────────────────────────────────────

function Tab({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
        active ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700',
      ].join(' ')}
    >
      {label}
      {count > 0 && (
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

// ─── Header cell helpers ──────────────────────────────────────────────────────

function SortTh({ children, colId, sortKey, onSort, align = 'left', style }: {
  children: React.ReactNode;
  colId: string;
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
  style?: React.CSSProperties;
}) {
  const sk = COL_SORT_KEY[colId];
  if (!sk) {
    return (
      <th style={style} className={`px-3 py-2.5 text-[11px] font-semibold text-slate-500 whitespace-nowrap select-none tracking-[0.06em] bg-slate-50 ${align === 'right' ? 'text-right' : 'text-left'}`}>
        {children}
      </th>
    );
  }
  return (
    <th style={style} className={`px-3 py-2.5 text-[11px] font-semibold text-slate-500 whitespace-nowrap select-none tracking-[0.06em] bg-slate-50 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => onSort(sk)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 transition-colors ${sortKey === sk ? 'text-slate-700' : ''}`}
      >
        {children}
        <ArrowsDownUp size={12} weight="bold" className={sortKey === sk ? 'text-violet-500' : 'text-slate-400'} />
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

// ─── Pagination ───────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function Pagination({ currentPage, totalPages, perPage, totalRows, onPageChange, onPerPageChange }: {
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

// ─── Pin indicator ────────────────────────────────────────────────────────────

function PinIndicator() {
  return <span className="inline-block w-1 h-3 rounded-sm bg-violet-400 mr-1 opacity-70 shrink-0" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  bills: Bill[];
  onCreateBill?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReceivablesTable({ bills, onCreateBill: _onCreateBill }: Props) {
  const [filter, setFilter]     = useState<Filter>('all');
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<SortKey>('id');
  const [sortAsc, setSortAsc]   = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage]   = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedLink, setCopiedLink]   = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Column management
  const [columnConfig, setColumnConfig] = useState<ColumnDef[]>(DEFAULT_BILLS_COLS);
  const [colDrawerOpen, setColDrawerOpen] = useState(false);

  const counts = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

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

  // ─── Compute visible ordered columns + sticky offsets ────────────────────────
  const { visibleCols, colHeaderStyle, colCellStyle, hasLeftPinned } = useMemo(() => {
    const leftPinned  = columnConfig.filter((c) => c.pin === 'left'  && c.visible);
    const center      = columnConfig.filter((c) => c.pin === 'none'  && c.visible);
    const rightPinned = columnConfig.filter((c) => c.pin === 'right' && c.visible);

    const ordered = [...leftPinned, ...center, ...rightPinned];

    const leftOffsets: Record<string, number> = {};
    let leftCursor = CHECKBOX_W;
    for (const col of leftPinned) {
      leftOffsets[col.id] = leftCursor;
      leftCursor += COL_WIDTH[col.id] ?? 130;
    }

    const rightOffsets: Record<string, number> = {};
    let rightCursor = KEBAB_W;
    for (let i = rightPinned.length - 1; i >= 0; i--) {
      rightOffsets[rightPinned[i].id] = rightCursor;
      rightCursor += COL_WIDTH[rightPinned[i].id] ?? 130;
    }

    const lastLeftId   = leftPinned.length > 0 ? leftPinned[leftPinned.length - 1].id : null;
    const firstRightId = rightPinned.length > 0 ? rightPinned[0].id : null;
    const SEP_R = { borderRight: '1px solid #d1d5db' };
    const SEP_L = { borderLeft:  '1px solid #d1d5db' };

    function colHeaderStyle(id: string): React.CSSProperties {
      if (leftOffsets[id] !== undefined)  return { position: 'sticky', left: leftOffsets[id],   zIndex: 2, backgroundColor: '#f8fafc', ...(id === lastLeftId   ? SEP_R : {}) };
      if (rightOffsets[id] !== undefined) return { position: 'sticky', right: rightOffsets[id], zIndex: 2, backgroundColor: '#f8fafc', ...(id === firstRightId ? SEP_L : {}) };
      return {};
    }

    function colCellStyle(id: string): React.CSSProperties {
      if (leftOffsets[id] !== undefined)  return { position: 'sticky', left: leftOffsets[id],   zIndex: 1, ...(id === lastLeftId   ? SEP_R : {}) };
      if (rightOffsets[id] !== undefined) return { position: 'sticky', right: rightOffsets[id], zIndex: 1, ...(id === firstRightId ? SEP_L : {}) };
      return {};
    }

    return { visibleCols: ordered, colHeaderStyle, colCellStyle, hasLeftPinned: leftPinned.length > 0 };
  }, [columnConfig]);

  const activeColChanges = columnConfig.filter((c) => !c.visible || c.pin !== 'none').length;

  // ─── Header renderer ─────────────────────────────────────────────────────────
  function renderHeader(col: ColumnDef) {
    const style = colHeaderStyle(col.id);
    const isPinned = !!style.position;
    const pin = isPinned ? <PinIndicator /> : null;
    const align = col.id === 'amount' ? 'right' : 'left';

    return (
      <SortTh
        key={col.id}
        colId={col.id}
        sortKey={sortKey}
        onSort={toggleSort}
        align={align}
        style={style}
      >
        {pin}{col.label}
      </SortTh>
    );
  }

  // ─── Cell renderer ────────────────────────────────────────────────────────────
  function renderCell(col: ColumnDef, bill: Bill, isSelected: boolean) {
    const style = { ...colCellStyle(col.id), backgroundColor: isSelected ? '#f5f3ff' : '#ffffff' };
    const status = STATUS_CFG[bill.status];
    const type   = TYPE_CFG[bill.type];

    switch (col.id) {
      case 'status':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
              {status.dotColor && (
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: status.dotColor }} />
              )}
              {status.label}
            </span>
          </td>
        );
      case 'billID':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-mono text-xs">
            {bill.id}
          </td>
        );
      case 'billName':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            <button className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm text-left transition-colors">
              {bill.title}
            </button>
          </td>
        );
      case 'amount':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-medium text-slate-700 tabular-nums">
            {formatPeso(bill.amount)}
          </td>
        );
      case 'billDate':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
            {bill.billDate}
          </td>
        );
      case 'dueDate':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
            {bill.dueDate}
          </td>
        );
      case 'customer':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-white font-semibold shrink-0"
                style={{ backgroundColor: bill.customerAvatarColor, fontSize: 10 }}
              >
                {bill.customerInitials}
              </span>
              <span className="text-slate-700 text-sm max-w-[130px] truncate">{bill.customerName}</span>
            </div>
          </td>
        );
      case 'daysOutstanding':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
            <span className={bill.daysOutstanding > 0 ? 'text-red-600 font-medium' : 'text-slate-600'}>
              {bill.daysOutstanding}
            </span>
          </td>
        );
      case 'link':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-slate-600">{bill.link}</span>
              <button
                onClick={() => copyLink(bill.link)}
                className="text-slate-400 hover:text-violet-500 transition-colors"
                title="Copy link"
              >
                {copiedLink === bill.link
                  ? <LinkIcon size={12} className="text-emerald-500" />
                  : <CopySimple size={12} />}
              </button>
            </div>
          </td>
        );
      case 'billingType':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${type.className}`}>
              {type.label}
            </span>
          </td>
        );
      case 'lastUpdatedAt':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
            {bill.lastUpdatedAt}
          </td>
        );
      case 'paymentDate':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
            {bill.paymentDate ?? <span className="text-slate-400">N/A</span>}
          </td>
        );
      case 'paymentMethod':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
            {bill.paymentMethod ?? <span className="text-slate-400">N/A</span>}
          </td>
        );
      case 'tags':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            {bill.tags && bill.tags.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                {bill.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                  >
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400 text-sm">—</span>
            )}
          </td>
        );
      case 'quickActions':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <button
                title="Send"
                className="inline-flex items-center justify-center w-7 h-7 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <PaperPlaneTilt size={14} />
              </button>
              <button
                title="Mark as paid"
                className="inline-flex items-center justify-center w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle size={14} />
              </button>
            </div>
          </td>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

        {/* ── Filter tabs ── */}
        <div className="border-b border-slate-200 px-4 flex items-center gap-0">
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
        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by bill ID or customer"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={`w-full pl-8 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 ${search ? 'pr-7' : 'pr-3'}`}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setCurrentPage(1); searchRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Funnel size={14} />
              Filter
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowsDownUp size={14} />
              Last updated at
            </button>
            <ColumnsButton
              onClick={() => setColDrawerOpen(true)}
              activeChanges={activeColChanges}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <FileText size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No bills found</p>
              <p className="text-xs text-slate-400 mt-1">
                {q
                  ? 'Try a different search term.'
                  : filter !== 'all'
                  ? `No ${STATUS_CFG[filter as BillStatus]?.label.toLowerCase()} bills.`
                  : 'No bills have been created yet.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="sticky left-0 z-[3] w-10 px-3 py-2.5 bg-slate-50" style={!hasLeftPinned ? { borderRight: '1px solid #d1d5db' } : undefined}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
                    />
                  </th>
                  {visibleCols.map((col) => renderHeader(col))}
                  <th className="sticky right-0 z-[3] w-10 bg-slate-50 [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_#f9fafb]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((bill) => {
                  const isSel = selected.has(bill.id);
                  return (
                    <tr
                      key={bill.id}
                      className={['transition-colors hover:bg-slate-50', isSel ? 'bg-violet-50' : ''].join(' ')}
                    >
                      {/* Checkbox — frozen left */}
                      <td className="sticky left-0 z-[2] px-3 py-2.5" style={{ backgroundColor: isSel ? '#f5f3ff' : '#ffffff', ...(!hasLeftPinned ? { borderRight: '1px solid #d1d5db' } : {}) }}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleRow(bill.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
                        />
                      </td>

                      {/* Dynamic columns */}
                      {visibleCols.map((col) => renderCell(col, bill, isSel))}

                      {/* Kebab */}
                      <td className="sticky right-0 z-[2] px-2 py-2.5 [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_white]" style={{ backgroundColor: isSel ? '#f5f3ff' : '#ffffff' }}>
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

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          perPage={perPage}
          totalRows={sorted.length}
          onPageChange={setCurrentPage}
          onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
        />
      </div>

      {/* Column Management Drawer */}
      <ColumnManagementDrawer
        open={colDrawerOpen}
        onClose={() => setColDrawerOpen(false)}
        columns={columnConfig}
        onChange={setColumnConfig}
      />
    </>
  );
}
