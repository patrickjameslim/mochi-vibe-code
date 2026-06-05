/**
 * DESIGN REFERENCE — Bill Card V1
 *
 * This is the original bill card design saved for comparison and future iterations.
 * Do NOT import or use this file directly in the app — it is a design reference only.
 *
 * Layout:
 *   Header row:   [Checkbox]  [#Bill ID]  ──────────────────  [Status Badge]
 *   Body:         [Bill Name]
 *                 [📅 Billed: date]  [📅 Due: date]
 *                 AMOUNT DUE                    ⚠️ OVERDUE CHARGE
 *                 ₱ 15,000.00                   + ₱ 500.00
 *   Divider
 *   Footer:                                     [Download Bill PDF]
 */

import { CalendarBlank, DownloadSimple, Warning } from '@phosphor-icons/react';

type BillStatus = 'paid' | 'unpaid' | 'pending' | 'overdue';

interface Bill {
  id: string;
  name: string;
  status: BillStatus;
  billDate: string;
  dueDate: string;
  amount: number;
  overdueCharge?: number;
}

const STATUS_STYLES: Record<BillStatus, string> = {
  paid:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unpaid:  'bg-slate-100 text-slate-600 border border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  overdue: 'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_LABELS: Record<BillStatus, string> = {
  paid: 'Paid', unpaid: 'Unpaid', pending: 'Pending', overdue: 'Overdue',
};

function StatusBadge({ status }: { status: BillStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function fmt(n: number) {
  return `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

/** V1 — Status badge top-right, Amount Due in body below dates */
export function BillCardV1({ bill, checked, onToggle }: { bill: Bill; checked: boolean; onToggle: () => void }) {
  const isOverdue = bill.status === 'overdue';
  const isPaid = bill.status === 'paid';

  return (
    <div
      onClick={() => !isPaid && onToggle()}
      className={[
        'relative bg-white rounded-xl border transition-all cursor-pointer group',
        isPaid ? 'opacity-70 cursor-default' : '',
        checked
          ? 'border-violet-400 ring-2 ring-violet-100 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
      ].join(' ')}
    >
      {/* Checkbox */}
      <div className="absolute top-4 left-4" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="accent-violet-600 w-4 h-4 cursor-pointer"
          checked={checked}
          onChange={onToggle}
          disabled={isPaid}
        />
      </div>

      {/* Card body */}
      <div className="pl-10 pr-5 pt-4 pb-0">
        {/* Bill ID + Status */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/bills/${bill.id}`, '_blank'); }}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline transition-colors"
          >
            #{bill.id}
          </button>
          <StatusBadge status={bill.status} />
        </div>

        {/* Bill name */}
        <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-3">{bill.name}</h3>

        {/* Dates */}
        <div className="flex gap-5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarBlank size={13} className="shrink-0" />
            <span><span className="text-slate-400">Billed: </span>{bill.billDate}</span>
          </div>
          <div className={['flex items-center gap-1.5 text-xs', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'].join(' ')}>
            <CalendarBlank size={13} className="shrink-0" />
            <span>
              <span className={isOverdue ? 'text-red-400' : 'text-slate-400'}>Due: </span>
              {bill.dueDate}
            </span>
          </div>
        </div>

        {/* Amount due */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Amount Due</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{fmt(bill.amount)}</span>
          </div>
          {bill.overdueCharge && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-red-400 uppercase tracking-wider font-medium flex items-center gap-1">
                <Warning size={11} weight="fill" /> Overdue Charge
              </span>
              <span className="text-sm font-bold text-red-600">+ {fmt(bill.overdueCharge)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 my-3 border-t border-slate-100" />

      {/* Footer */}
      <div className="px-5 pb-4 flex justify-end">
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <DownloadSimple size={14} />
          Download Bill PDF
        </button>
      </div>
    </div>
  );
}
