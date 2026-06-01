import { useState } from 'react';
import {
  CheckCircle,
  Circle,
  Lock,
  CreditCard,
  UploadSimple,
  DownloadSimple,
  Warning,
  CalendarBlank,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type PaymentMethod = 'card' | 'upload';
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

const BILLS: Bill[] = [
  {
    id: 'BNG-2025-001',
    name: 'Monthly Association Dues — May 2025',
    status: 'unpaid',
    billDate: 'May 1, 2025',
    dueDate: 'May 31, 2025',
    amount: 15000,
  },
  {
    id: 'BNG-2025-002',
    name: 'Parking Fee — June 2025',
    status: 'overdue',
    billDate: 'Jun 1, 2025',
    dueDate: 'Jun 15, 2025',
    amount: 20000,
    overdueCharge: 500,
  },
  {
    id: 'BNG-2025-003',
    name: 'Water Utility Bill — April 2025',
    status: 'paid',
    billDate: 'Apr 1, 2025',
    dueDate: 'Apr 30, 2025',
    amount: 10000,
  },
  {
    id: 'BNG-2025-004',
    name: 'Maintenance Fee — Q2 2025',
    status: 'pending',
    billDate: 'Apr 15, 2025',
    dueDate: 'Jul 1, 2025',
    amount: 8500,
  },
  {
    id: 'BNG-2025-005',
    name: 'Move-in Deposit — Unit 4B',
    status: 'overdue',
    billDate: 'Mar 1, 2025',
    dueDate: 'Mar 15, 2025',
    amount: 30000,
    overdueCharge: 1200,
  },
];

const CUSTOMER = {
  id: '#CST-2025-0001',
  name: 'Juan Dela Cruz',
  email: 'juan@example.com',
};

function fmt(n: number) {
  return `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BillStatus, string> = {
  paid:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unpaid:  'bg-slate-100 text-slate-600 border border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  overdue: 'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_LABELS: Record<BillStatus, string> = {
  paid:    'Paid',
  unpaid:  'Unpaid',
  pending: 'Pending',
  overdue: 'Overdue',
};

function StatusBadge({ status }: { status: BillStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Bill Card ────────────────────────────────────────────────────────────────

function BillCard({
  bill,
  checked,
  onToggle,
}: {
  bill: Bill;
  checked: boolean;
  onToggle: () => void;
}) {
  const isOverdue = bill.status === 'overdue';
  const isPaid = bill.status === 'paid';

  return (
    <div
      onClick={onToggle}
      className={[
        'relative bg-white rounded-xl border transition-all cursor-pointer group',
        checked
          ? 'border-violet-400 ring-2 ring-violet-100 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
        isPaid ? 'opacity-70' : '',
      ].join(' ')}
    >
      {/* Checkbox — stop propagation so clicking it directly still works */}
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
        {/* Top row: Bill ID + Status */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={(e) => e.stopPropagation()}
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
            <span>
              <span className="text-slate-400">Billed: </span>
              {bill.billDate}
            </span>
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

      {/* Footer: Download button */}
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

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Select Bill' },
    { n: 2, label: 'Confirm Payment' },
    { n: 3, label: 'Finished' },
  ];
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 p-6 flex flex-col gap-6">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</h2>
      <ol className="flex flex-col gap-5">
        {steps.map(({ n, label }) => {
          const done = step > n;
          const active = step === n;
          return (
            <li key={n} className="flex items-center gap-3">
              {done ? (
                <CheckCircle size={22} weight="fill" className="text-violet-600 shrink-0" />
              ) : (
                <Circle
                  size={22}
                  weight={active ? 'fill' : 'regular'}
                  className={active ? 'text-violet-600 shrink-0' : 'text-slate-300 shrink-0'}
                />
              )}
              <span
                className={[
                  'text-sm',
                  done ? 'text-violet-600 font-medium' : active ? 'text-violet-700 font-semibold' : 'text-slate-400',
                ].join(' ')}
              >
                {n}: {label}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  selected,
  onToggle,
  onContinue,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onContinue: () => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'all'>('all');

  const filtered = BILLS.filter((b) => {
    const matchSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const payableBills = BILLS.filter((b) => b.status !== 'paid');
  const selectedTotal = payableBills
    .filter((b) => selected.has(b.id))
    .reduce((s, b) => s + b.amount + (b.overdueCharge ?? 0), 0);

  return (
    <div className="flex-1 flex gap-6 p-8 overflow-auto">
      {/* Center */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Select Bills to Pay</h1>
          <p className="text-sm text-slate-500 mt-0.5">Choose one or more bills below to proceed with payment.</p>
        </div>

        {/* Search + filter row */}
        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="Search by Bill ID or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {(['all', 'unpaid', 'overdue', 'pending', 'paid'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={[
                  'px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-colors',
                  statusFilter === s
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                ].join(' ')}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Bill cards grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              checked={selected.has(bill.id)}
              onToggle={() => bill.status !== 'paid' && onToggle(bill.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-slate-400">
              No bills match your search.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            disabled={selected.size === 0}
            onClick={onContinue}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="w-64 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 sticky top-0">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer Details</p>
            <p className="text-xs text-slate-500">ID: {CUSTOMER.id}</p>
            <p className="text-sm font-semibold text-slate-800">{CUSTOMER.name}</p>
            <p className="text-xs text-slate-500">{CUSTOMER.email}</p>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Selection Summary</p>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Bills selected</span>
              <span className="font-semibold text-slate-800">{selected.size}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total due</span>
              <span className="font-bold text-violet-700">{fmt(selectedTotal)}</span>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5">
              {payableBills
                .filter((b) => selected.has(b.id))
                .map((b) => (
                  <div key={b.id} className="flex justify-between text-xs">
                    <span className="text-slate-500 truncate pr-2">#{b.id}</span>
                    <span className="font-medium text-slate-700 shrink-0">{fmt(b.amount + (b.overdueCharge ?? 0))}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  selected,
  method,
  setMethod,
  onSubmit,
}: {
  selected: Set<string>;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  onSubmit: () => void;
}) {
  const selectedBills = BILLS.filter((b) => selected.has(b.id));
  const subtotal = selectedBills.reduce((s, b) => s + b.amount + (b.overdueCharge ?? 0), 0);
  const gatewayFee = method === 'card' ? subtotal * 0.035 + 15 : 0;
  const total = subtotal + gatewayFee;

  return (
    <div className="flex-1 flex gap-6 p-8 overflow-auto">
      <div className="flex-1 flex flex-col gap-5 max-w-xl">
        <h1 className="text-xl font-bold text-slate-800">Confirm Payment</h1>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-slate-100 bg-slate-50">
            Bills to pay
          </p>
          {selectedBills.map((bill, i) => (
            <div
              key={bill.id}
              className={[
                'flex justify-between items-center px-4 py-3 text-sm',
                i !== selectedBills.length - 1 ? 'border-b border-slate-100' : '',
              ].join(' ')}
            >
              <div>
                <p className="font-medium text-slate-700">#{bill.id}</p>
                <p className="text-xs text-slate-400">{bill.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">{fmt(bill.amount)}</p>
                {bill.overdueCharge && (
                  <p className="text-xs text-red-600 font-semibold">+ {fmt(bill.overdueCharge)} overdue</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Method</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="method"
              className="accent-violet-600 mt-0.5"
              checked={method === 'card'}
              onChange={() => setMethod('card')}
            />
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <CreditCard size={16} /> Credit or Debit Card (PayMongo)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Pay securely using your Visa, Mastercard, or E-wallet.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="method"
              className="accent-violet-600 mt-0.5"
              checked={method === 'upload'}
              onChange={() => setMethod('upload')}
            />
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <UploadSimple size={16} /> Upload Proof of Payment
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Customers can upload a receipt and submit payment manually.
              </p>
            </div>
          </label>

          {method === 'card' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 flex gap-1.5">
              <span className="mt-0.5">ⓘ</span>
              Note: You will be securely redirected to PayMongo to complete your credit card payment.
            </div>
          )}
        </div>

        <button
          onClick={onSubmit}
          className="self-end px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
        >
          Submit Payment
        </button>
      </div>

      <aside className="w-64 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Breakdown</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Bills selected</span>
            <span className="font-semibold text-slate-800">{selectedBills.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-800">{fmt(subtotal)}</span>
          </div>
          {method === 'card' && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gateway fee (3.5% + ₱15)</span>
              <span className="font-semibold text-slate-800">{fmt(gatewayFee)}</span>
            </div>
          )}
          <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-bold">
            <span className="text-slate-700">Total Due</span>
            <span className="text-violet-700">{fmt(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── PayMongo Mock ────────────────────────────────────────────────────────────

function PayMongoGateway({ total, onPay, onCancel }: { total: number; onPay: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-5">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Lock size={20} className="text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">PayMongo Secure Checkout</h2>
          </div>
          <p className="text-xs text-slate-500">Merchant: Metroview Homes &amp; Realty</p>
          <p className="text-2xl font-bold text-violet-700 mt-2">{fmt(total)}</p>
        </div>

        <div className="flex flex-col gap-3">
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Cardholder Name" />
          <input className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Card Number" />
          <div className="flex gap-3">
            <input className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="MM / YY" />
            <input className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="CVC" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onPay}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Pay {fmt(total)}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel and return to merchant
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({ selected, total, method }: { selected: Set<string>; total: number; method: PaymentMethod }) {
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="flex-1 flex p-8 overflow-auto">
      <div className="flex-1 flex flex-col gap-6 max-w-xl">
        <div className="text-center py-6">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-slate-800">Payment Submitted Successfully!</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Thank you. Your payment is currently being processed. You will receive a confirmation email shortly with your receipt and updated bill status.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submission Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Bill IDs</span>
            <span className="font-medium text-slate-800 text-right">{[...selected].map((id) => `#${id}`).join(', ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Paid</span>
            <span className="font-bold text-violet-700">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Method</span>
            <span className="font-medium text-slate-800">
              {method === 'card' ? 'Credit Card - PayMongo' : 'Upload Proof of Payment'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Date</span>
            <span className="font-medium text-slate-800">{today}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
            Return to Dashboard
          </button>
          <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors">
            Download Receipt PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomerPaymentPortalPage() {
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [showGateway, setShowGateway] = useState(false);

  const selectedBills = BILLS.filter((b) => selected.has(b.id));
  const subtotal = selectedBills.reduce((s, b) => s + b.amount + (b.overdueCharge ?? 0), 0);
  const gatewayFee = method === 'card' ? subtotal * 0.035 + 15 : 0;
  const total = subtotal + gatewayFee;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (method === 'card') {
      setShowGateway(true);
    } else {
      setStep(3);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
        <h1 className="text-sm font-semibold text-slate-700">Customer Payment Portal</h1>
        <span className="ml-2 text-xs text-slate-400">— {CUSTOMER.name}</span>
      </header>

      {!showGateway && (
        <div className="flex flex-1 overflow-hidden">
          <Stepper step={step} />

          {step === 1 && (
            <Step1 selected={selected} onToggle={toggle} onContinue={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2 selected={selected} method={method} setMethod={setMethod} onSubmit={handleSubmit} />
          )}
          {step === 3 && (
            <Step3 selected={selected} total={total} method={method} />
          )}
        </div>
      )}

      {showGateway && (
        <PayMongoGateway
          total={total}
          onPay={() => { setShowGateway(false); setStep(3); }}
          onCancel={() => setShowGateway(false)}
        />
      )}
    </div>
  );
}
