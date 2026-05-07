import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Funnel,
  ArrowsDownUp,
  SquaresFour,
  DownloadSimple,
  ArrowUp,
  ArrowDown,
  CopySimple,
  CheckCircle,
  PaperPlaneTilt,
  Link as LinkIcon,
  Tag,
  FileText,
} from '@phosphor-icons/react';
import { Button } from './ui/Button';
import { Bill, BillStatus, BillType, formatPeso } from '../data/bills';

// ─── Status config ────────────────────────────────────────────────────────────

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

// ─── Filter tabs ──────────────────────────────────────────────────────────────

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

type SortKey = 'id' | 'title' | 'amount' | 'billDate' | 'dueDate' | 'status' | 'lastUpdatedAt' | 'daysOutstanding';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  bills: Bill[];
  onCreateBill?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReceivablesTable({ bills, onCreateBill }: Props) {
  const [filter, setFilter]         = useState<Filter>('all');
  const [search, setSearch]         = useState('');
  const [sortKey, setSortKey]       = useState<SortKey>('id');
  const [sortAsc, setSortAsc]       = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // ── Counts per status (from full bill list, not filtered) ──────────────────
  const counts = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  // ── Filter + search ────────────────────────────────────────────────────────
  const afterFilter = filter === 'all' ? bills : bills.filter((b) => b.status === filter);
  const afterSearch = search.trim()
    ? afterFilter.filter(
        (b) =>
          b.id.toLowerCase().includes(search.toLowerCase()) ||
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.customerName.toLowerCase().includes(search.toLowerCase()),
      )
    : afterFilter;

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = [...afterSearch].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'amount')          cmp = a.amount - b.amount;
    else if (sortKey === 'daysOutstanding') cmp = a.daysOutstanding - b.daysOutstanding;
    else if (sortKey === 'id')         cmp = a.id.localeCompare(b.id);
    else if (sortKey === 'title')      cmp = a.title.localeCompare(b.title);
    else if (sortKey === 'status')     cmp = a.status.localeCompare(b.status);
    else if (sortKey === 'lastUpdatedAt') cmp = 0;
    else if (sortKey === 'billDate')   cmp = new Date(a.billDate).getTime() - new Date(b.billDate).getTime();
    else if (sortKey === 'dueDate')    cmp = new Date(a.dueDate).getTime()  - new Date(b.dueDate).getTime();
    return sortAsc ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  const allSelected = sorted.length > 0 && sorted.every((b) => selectedIds.has(b.id));

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((b) => b.id)));
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
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
    <div className="space-y-0">

      {/* ── Top toolbar: title + actions ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Bills</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <DownloadSimple size={13} />
            Download CSV
          </Button>
          <Button size="sm" onClick={() => onCreateBill?.()} className="gap-1.5 text-xs">
            + Create a new bill
          </Button>
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-gray-200">
        {FILTER_TABS.map(({ value, label }) => {
          const count = value === 'all' ? bills.length : (counts[value] ?? 0);
          const active = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                active
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
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
        })}
      </div>

      {/* ── Search + action row ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 py-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter a billing ID or customer"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-colors">
            <Funnel size={13} />
            Filter
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-colors">
            <ArrowsDownUp size={13} />
            Last updated at
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-colors">
            <SquaresFour size={13} />
            Columns
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-gray-200 rounded-xl bg-white">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <FileText size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No bills found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search
              ? 'Try a different search term.'
              : filter !== 'all'
              ? `No ${STATUS_CFG[filter as BillStatus]?.label.toLowerCase()} bills for this customer.`
              : 'No bills have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm min-w-[1400px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {/* Checkbox */}
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </th>
                {/* Status (not sortable — badge is self-explanatory) */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap w-28">
                  Status
                </th>
                {/* Flag */}
                <th className="w-6 px-1 py-3" />
                {/* Sortable columns */}
                <SortTh label="Bill ID"          col="id"              current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortTh label="Bill name"         col="title"           current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortTh label="Amount"            col="amount"          current={sortKey} asc={sortAsc} onSort={toggleSort} align="right" />
                <SortTh label="Bill date"         col="billDate"        current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <SortTh label="Due date"          col="dueDate"         current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Customer</th>
                <SortTh label="Days outstanding"  col="daysOutstanding" current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Link</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Billing type</th>
                <SortTh label="Last updated at"   col="lastUpdatedAt"   current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Payment date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Payment method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Tags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Quick actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sorted.map((bill) => {
                const selected = selectedIds.has(bill.id);
                const status   = STATUS_CFG[bill.status];
                const type     = TYPE_CFG[bill.type];
                return (
                  <tr
                    key={bill.id}
                    className={[
                      'group transition-colors',
                      selected ? 'bg-violet-50/50' : 'hover:bg-gray-50/60',
                    ].join(' ')}
                  >
                    {/* Checkbox */}
                    <td className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(bill.id)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>

                    {/* Status badge */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* Flag */}
                    <td className="px-1 py-3 text-gray-300 text-xs select-none">–</td>

                    {/* Bill ID */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {bill.id}
                      </span>
                    </td>

                    {/* Bill name */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <button className="text-xs font-medium text-violet-600 hover:text-violet-800 hover:underline truncate block text-left w-full transition-colors">
                        {bill.title}
                      </button>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-xs font-semibold text-gray-900 tabular-nums">
                        {formatPeso(bill.amount)}
                      </span>
                    </td>

                    {/* Bill date */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {bill.billDate}
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {bill.dueDate}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: bill.customerAvatarColor }}
                        >
                          {bill.customerInitials}
                        </div>
                        <span className="text-xs text-gray-700 truncate max-w-[130px]">{bill.customerName}</span>
                      </div>
                    </td>

                    {/* Days outstanding */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`text-xs font-medium ${bill.daysOutstanding > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {bill.daysOutstanding}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-violet-600 font-mono">{bill.link}</span>
                        <button
                          onClick={() => copyLink(bill.link)}
                          title="Copy link"
                          className="text-gray-300 hover:text-violet-500 transition-colors"
                        >
                          {copiedLink === bill.link
                            ? <LinkIcon size={12} className="text-emerald-500" />
                            : <CopySimple size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Billing type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${type.className}`}>
                        {type.label}
                      </span>
                    </td>

                    {/* Last updated at */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {bill.lastUpdatedAt}
                    </td>

                    {/* Payment date */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {bill.paymentDate ?? <span className="text-gray-300">N/A</span>}
                    </td>

                    {/* Payment method */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {bill.paymentMethod ?? <span className="text-gray-300">N/A</span>}
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {bill.tags && bill.tags.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {bill.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200"
                            >
                              <Tag size={9} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Quick actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Send"
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:text-violet-600 hover:border-violet-300 transition-colors"
                        >
                          <PaperPlaneTilt size={11} />
                        </button>
                        <button
                          title="Duplicate"
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:text-violet-600 hover:border-violet-300 transition-colors"
                        >
                          <CopySimple size={11} />
                        </button>
                        <button
                          title="Mark as paid"
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                        >
                          <CheckCircle size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Row count */}
      {sorted.length > 0 && (
        <p className="text-xs text-gray-400 pt-2">
          Showing {sorted.length} of {bills.length} {bills.length === 1 ? 'bill' : 'bills'}
          {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
        </p>
      )}
    </div>
  );
}

// ─── Sortable column header ───────────────────────────────────────────────────

function SortTh({
  label, col, current, asc, onSort, align = 'left',
}: {
  label: string;
  col: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = current === col;
  return (
    <th className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 hover:text-gray-700 transition-colors ${active ? 'text-gray-700' : ''}`}
      >
        {label}
        <span className="flex flex-col gap-px">
          <ArrowUp   size={7} weight="bold" className={active && asc  ? 'text-violet-600' : 'text-gray-300'} />
          <ArrowDown size={7} weight="bold" className={active && !asc ? 'text-violet-600' : 'text-gray-300'} />
        </span>
      </button>
    </th>
  );
}
