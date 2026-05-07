import React, { useState } from 'react';
import { Receipt, ArrowUp, ArrowDown, FileText } from '@phosphor-icons/react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Bill, BillStatus, BillType, formatPeso } from '../data/bills';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BillStatus, string> = {
  paid:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  unpaid:  'bg-amber-50   text-amber-700   border-amber-200',
  overdue: 'bg-red-50     text-red-700     border-red-200',
  draft:   'bg-gray-100   text-gray-500    border-gray-200',
};

const STATUS_LABELS: Record<BillStatus, string> = {
  paid:    'Paid',
  unpaid:  'Unpaid',
  overdue: 'Overdue',
  draft:   'Draft',
};

const TYPE_STYLES: Record<BillType, string> = {
  'one-time':    'bg-violet-50 text-violet-700 border-violet-200',
  'recurring':   'bg-blue-50   text-blue-700   border-blue-200',
  'installment': 'bg-orange-50 text-orange-700 border-orange-200',
};

const TYPE_LABELS: Record<BillType, string> = {
  'one-time':    'One-time',
  'recurring':   'Recurring',
  'installment': 'Installment',
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type Filter = 'all' | BillStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',    label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'overdue',label: 'Overdue' },
  { value: 'paid',   label: 'Paid' },
  { value: 'draft',  label: 'Draft' },
];

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = 'id' | 'title' | 'dateIssued' | 'dueDate' | 'amount' | 'status';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  bills: Bill[];
  onCreateBill?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReceivablesTable({ bills, onCreateBill }: Props) {
  const [filter, setFilter]     = useState<Filter>('all');
  const [sortKey, setSortKey]   = useState<SortKey>('dateIssued');
  const [sortAsc, setSortAsc]   = useState(false);

  // Filter
  const filtered = filter === 'all' ? bills : bills.filter((b) => b.status === filter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'amount')     cmp = a.amount - b.amount;
    else if (sortKey === 'id')    cmp = a.id.localeCompare(b.id);
    else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortKey === 'status')cmp = a.status.localeCompare(b.status);
    else if (sortKey === 'dateIssued') cmp = new Date(a.dateIssued).getTime() - new Date(b.dateIssued).getTime();
    else if (sortKey === 'dueDate')    cmp = new Date(a.dueDate).getTime()    - new Date(b.dueDate).getTime();
    return sortAsc ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(false); }
  }

  // Count by status
  const counts = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Bills</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {bills.length} {bills.length === 1 ? 'bill' : 'bills'} on record
          </p>
        </div>
        <Button size="sm" onClick={() => onCreateBill?.()} className="gap-1.5 text-xs">
          + Create bill
        </Button>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-0">
        {FILTERS.map(({ value, label }) => {
          const count = value === 'all' ? bills.length : (counts[value] ?? 0);
          const active = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                active
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {label}
              {count > 0 && (
                <span className={[
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  active ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500',
                ].join(' ')}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <FileText size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No bills found</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter !== 'all' ? `No ${STATUS_LABELS[filter as BillStatus]?.toLowerCase()} bills for this customer.` : 'No bills have been created for this customer yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <Th label="Bill #"       sortKey="id"          current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <Th label="Description"  sortKey="title"       current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Type</th>
                <Th label="Issued"       sortKey="dateIssued"  current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <Th label="Due date"     sortKey="dueDate"     current={sortKey} asc={sortAsc} onSort={toggleSort} />
                <Th label="Amount"       sortKey="amount"      current={sortKey} asc={sortAsc} onSort={toggleSort} align="right" />
                <Th label="Status"       sortKey="status"      current={sortKey} asc={sortAsc} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((bill) => (
                <tr
                  key={bill.id}
                  className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                >
                  {/* Bill # */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {bill.id}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3.5 max-w-xs">
                    <p className="text-sm font-medium text-gray-800 truncate">{bill.title}</p>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <Badge className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${TYPE_STYLES[bill.type]}`}>
                      {TYPE_LABELS[bill.type]}
                    </Badge>
                  </td>

                  {/* Issued */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                    {bill.dateIssued}
                  </td>

                  {/* Due date */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                    {bill.dueDate}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {formatPeso(bill.amount)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <Badge className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[bill.status]}`}>
                      {STATUS_LABELS[bill.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Sortable column header ───────────────────────────────────────────────────

function Th({
  label,
  sortKey,
  current,
  asc,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = current === sortKey;
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <button
        onClick={() => onSort(sortKey)}
        className={[
          'inline-flex items-center gap-1 hover:text-gray-700 transition-colors',
          active ? 'text-gray-700' : '',
        ].join(' ')}
      >
        {label}
        <span className="flex flex-col gap-px">
          <ArrowUp
            size={8}
            weight="bold"
            className={active && asc ? 'text-violet-600' : 'text-gray-300'}
          />
          <ArrowDown
            size={8}
            weight="bold"
            className={active && !asc ? 'text-violet-600' : 'text-gray-300'}
          />
        </span>
      </button>
    </th>
  );
}
