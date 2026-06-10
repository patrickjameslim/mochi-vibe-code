import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCircle,
  Lock,
  CreditCard,
  UploadSimple,
  DownloadSimple,
  Warning,
  CalendarBlank,
  MagnifyingGlass,
  FunnelSimple,
  X,
  Buildings,
  User,
  CaretLeft,
  CaretRight,
  CaretDown,
  ArrowLeft,
  ArrowSquareOut,
  DeviceMobile,
  EnvelopeSimple,
  Bank,
  QrCode,
  CloudArrowUp,
  FilePdf,
  Image as ImageIcon,
  Trash,
  ShieldCheck,
  Spinner,
  Info,
  Gear,
} from '@phosphor-icons/react';
import mochiLogo from '#/assets/mochi-logo.svg';
import mochiLogoWhite from '#/assets/mochi-logo-white.svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = 'setupPin' | 'login' | 'portal';
type Step = 1 | 2 | 3;
type PaymentMethod = 'card' | 'gcash' | 'maya' | 'bank' | 'qrph' | 'upload';
type BillStatus = 'paid' | 'unpaid' | 'pending' | 'overdue';
type BillType = 'one-time' | 'recurring' | 'installment';
type CustomerType = 'organization' | 'individual';

interface LineItem {
  name: string;
  description: string;
  quantity: number;
  discount: number;
  tax: number;
  subtotal: number;
}

interface Bill {
  id: string;
  name: string;
  status: BillStatus;
  billType: BillType;
  billDate: string;
  dueDate: string;
  amount: number;
  overdueCharge?: number;
  lineItems: LineItem[];
}

/** Methods that redirect to an external secure provider (PayMongo). Upload is the only in-portal method. */
const PAYMONGO_METHODS: PaymentMethod[] = ['card', 'gcash', 'maya', 'bank', 'qrph'];

interface ContactPerson {
  name: string;
  position: string;
  email: string;
  phone: string;
}

interface Customer {
  type: CustomerType;
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vatStatus: 'VATable' | 'VAT-Exempt' | 'VAT Zero-Rated';
  withholdingTax: string;
  tin: string;
  primaryContact?: ContactPerson;
  otherContacts?: ContactPerson[];
}

interface FilterState {
  status: BillStatus | 'all';
  amountMin: string;
  amountMax: string;
  overdueMin: string;
  overdueMax: string;
  billDateFrom: string;
  billDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
  billType: BillType | 'all';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const BILLS: Bill[] = [
  {
    id: 'BNG-2025-001',
    name: 'Monthly Association Dues — May 2025',
    status: 'unpaid',
    billType: 'recurring',
    billDate: 'May 1, 2025',
    dueDate: 'May 31, 2025',
    amount: 15000,
    lineItems: [
      { name: 'Association Dues', description: 'Monthly residential association dues for amenities and security.', quantity: 1, discount: 0, tax: 1607.14, subtotal: 13392.86 },
      { name: 'Common Area Electricity', description: 'Shared electricity for hallways, lobby, and amenities.', quantity: 1, discount: 0, tax: 192.86, subtotal: 1607.14 },
    ],
  },
  {
    id: 'BNG-2025-002',
    name: 'Parking Fee — June 2025',
    status: 'overdue',
    billType: 'recurring',
    billDate: 'Jun 1, 2025',
    dueDate: 'Jun 15, 2025',
    amount: 20000,
    overdueCharge: 500,
    lineItems: [
      { name: 'Reserved Parking', description: 'Two reserved covered parking slots for Unit 4B.', quantity: 2, discount: 1000, tax: 2142.86, subtotal: 17857.14 },
      { name: 'Access RFID Sticker', description: 'Vehicle access RFID sticker for the parking gate.', quantity: 1, discount: 0, tax: 256.55, subtotal: 2142.86 },
    ],
  },
  {
    id: 'BNG-2025-003',
    name: 'Water Utility Bill — April 2025',
    status: 'paid',
    billType: 'one-time',
    billDate: 'Apr 1, 2025',
    dueDate: 'Apr 30, 2025',
    amount: 10000,
    lineItems: [
      { name: 'Water Consumption', description: 'Metered water usage for the billing period (32 cu.m.).', quantity: 32, discount: 0, tax: 1071.43, subtotal: 8928.57 },
      { name: 'Meter Maintenance', description: 'Routine maintenance and reading of the water meter.', quantity: 1, discount: 0, tax: 128.57, subtotal: 1071.43 },
    ],
  },
  {
    id: 'BNG-2025-004',
    name: 'Maintenance Fee — Q2 2025',
    status: 'pending',
    billType: 'installment',
    billDate: 'Apr 15, 2025',
    dueDate: 'Jul 1, 2025',
    amount: 8500,
    lineItems: [
      { name: 'Quarterly Maintenance', description: 'Q2 building upkeep, janitorial, and equipment servicing.', quantity: 1, discount: 500, tax: 964.29, subtotal: 8035.71 },
    ],
  },
  {
    id: 'BNG-2025-005',
    name: 'Move-in Deposit — Unit 4B',
    status: 'overdue',
    billType: 'one-time',
    billDate: 'Mar 1, 2025',
    dueDate: 'Mar 15, 2025',
    amount: 30000,
    overdueCharge: 1200,
    lineItems: [
      { name: 'Move-in Deposit', description: 'Refundable security deposit for moving into Unit 4B.', quantity: 1, discount: 0, tax: 0, subtotal: 25000 },
      { name: 'Processing Fee', description: 'One-time administrative move-in processing fee.', quantity: 1, discount: 0, tax: 535.71, subtotal: 5000 },
    ],
  },
];

const CUSTOMER: Customer = {
  type: 'organization',
  id: '#CST-2025-0001',
  name: 'Metroview Commercial Inc.',
  email: 'accounts@metroview.com',
  phone: '09123456789',
  address: 'Unit 4B, Metroview Tower, EDSA, Mandaluyong City, Metro Manila, Philippines 1550',
  vatStatus: 'VATable',
  withholdingTax: '2%',
  tin: '123-456-789-000',
  primaryContact: {
    name: 'Juan Dela Cruz',
    position: 'Finance Manager',
    email: 'juan@metroview.com',
    phone: '09987654321',
  },
  otherContacts: [
    { name: 'Maria Santos', position: 'Accountant', email: 'maria@metroview.com', phone: '09111222333' },
  ],
};

// ─── Active data (swapped to demo in preview mode) ───────────────────────────
// These are module-level refs overridden at runtime for preview mode.
let _activeBills: Bill[] = BILLS;
let _activeCustomer: Customer = CUSTOMER;
function getActiveBills() { return _activeBills; }
function getActiveCustomer() { return _activeCustomer; }

// ─── Preview / Demo placeholder data ─────────────────────────────────────────

const DEMO_BILLS: Bill[] = [
  {
    id: 'DEMO-001',
    name: 'Sample Bill A',
    status: 'unpaid',
    billType: 'recurring',
    billDate: 'Jun 1, 2025',
    dueDate: 'Jun 30, 2025',
    amount: 5000,
    lineItems: [{ name: 'Sample Line Item', description: '', quantity: 1, discount: 0, tax: 535.71, subtotal: 4464.29 }],
  },
  {
    id: 'DEMO-002',
    name: 'Sample Bill B',
    status: 'overdue',
    billType: 'recurring',
    billDate: 'May 1, 2025',
    dueDate: 'May 31, 2025',
    amount: 3500,
    overdueCharge: 200,
    lineItems: [{ name: 'Sample Line Item', description: '', quantity: 1, discount: 0, tax: 375, subtotal: 3125 }],
  },
  {
    id: 'DEMO-003',
    name: 'Sample Bill C',
    status: 'paid',
    billType: 'one-time',
    billDate: 'Apr 1, 2025',
    dueDate: 'Apr 30, 2025',
    amount: 2000,
    lineItems: [{ name: 'Sample Line Item', description: '', quantity: 1, discount: 0, tax: 214.29, subtotal: 1785.71 }],
  },
  {
    id: 'DEMO-004',
    name: 'Sample Bill D',
    status: 'pending',
    billType: 'installment',
    billDate: 'Jun 15, 2025',
    dueDate: 'Jul 15, 2025',
    amount: 1500,
    lineItems: [{ name: 'Sample Line Item', description: '', quantity: 1, discount: 0, tax: 160.71, subtotal: 1339.29 }],
  },
];

const DEMO_CUSTOMER: Customer = {
  type: 'organization',
  id: '#DEMO-0001',
  name: 'Sample Customer Inc.',
  email: 'contact@samplecustomer.com',
  phone: '09XX XXX XXXX',
  address: 'Sample Address, City, Province, Philippines',
  vatStatus: 'VATable',
  withholdingTax: '2%',
  tin: 'XXX-XXX-XXX-000',
  primaryContact: {
    name: 'Sample Contact',
    position: 'Finance Manager',
    email: 'contact@samplecustomer.com',
    phone: '09XX XXX XXXX',
  },
  otherContacts: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function isPayable(b: Bill) {
  return b.status !== 'paid';
}

const DEFAULT_FILTERS: FilterState = {
  status: 'all',
  amountMin: '',
  amountMax: '',
  overdueMin: '',
  overdueMax: '',
  billDateFrom: '',
  billDateTo: '',
  dueDateFrom: '',
  dueDateTo: '',
  billType: 'all',
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

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

// ─── Bill Card ────────────────────────────────────────────────────────────────

function BillCard({ bill, checked, onToggle }: { bill: Bill; checked: boolean; onToggle: () => void }) {
  const isOverdue = bill.status === 'overdue';
  const isPaid = bill.status === 'paid';

  return (
    <div
      onClick={() => !isPaid && onToggle()}
      className={[
        'relative bg-white rounded-xl border flex items-center gap-4 px-5 py-4 transition-all',
        isPaid ? 'opacity-70 cursor-default' : 'cursor-pointer',
        checked
          ? 'border-violet-400 ring-2 ring-violet-100 shadow-sm'
          : isOverdue
            ? 'border-red-200 hover:border-red-300 hover:shadow-sm'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
      ].join(' ')}
    >
      {/* ── Checkbox ── */}
      <div
        onClick={(e) => { e.stopPropagation(); !isPaid && onToggle(); }}
        className={[
          'w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
          checked
            ? 'bg-violet-600 border-violet-600'
            : 'border-slate-300 hover:border-slate-400',
          isPaid ? 'opacity-50 cursor-default' : '',
        ].join(' ')}
      >
        {checked && <Check size={12} weight="bold" className="text-white" />}
      </div>

      {/* ── Main info: Bill ID + Status + Name + Dates ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/bills/${bill.id}`, '_blank'); }}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800 hover:underline transition-colors shrink-0"
          >
            #{bill.id}
          </button>
          <StatusBadge status={bill.status} />
        </div>
        <h3 className="text-sm font-medium text-slate-800 leading-snug truncate">{bill.name}</h3>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarBlank size={13} className="shrink-0 text-slate-400" />
            <span><span className="text-slate-400">Billed: </span>{bill.billDate}</span>
          </div>
          <div className={[
            'flex items-center gap-1.5 text-xs',
            isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500',
          ].join(' ')}>
            <CalendarBlank size={13} className={['shrink-0', isOverdue ? 'text-red-500' : 'text-slate-400'].join(' ')} />
            <span>
              <span className={isOverdue ? 'text-red-400 font-normal' : 'text-slate-400'}>Due: </span>
              {bill.dueDate}
            </span>
          </div>
        </div>
      </div>

      {/* ── Amount (+ overdue) ── */}
      <div className="flex flex-col items-end gap-0.5 shrink-0 pl-4">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Amount Due</span>
        <span className="text-xl font-medium text-slate-900 tracking-tight">{fmt(bill.amount)}</span>
        {bill.overdueCharge && (
          <span className="text-xs font-medium text-red-600 flex items-center gap-1">
            <Warning size={11} weight="fill" /> + {fmt(bill.overdueCharge)}
          </span>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="self-stretch border-l border-slate-100" />

      {/* ── Download PDF (icon-only, tooltip) ── */}
      <button
        onClick={(e) => e.stopPropagation()}
        title="Download Bill PDF"
        aria-label="Download Bill PDF"
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-colors"
      >
        <DownloadSimple size={16} />
      </button>
    </div>
  );
}

// ─── Date Range Picker ────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function fmtDisplay(d: Date) {
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
}
function toISO(d: Date) { return d.toISOString().split('T')[0]; }
function fromISO(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? null : d;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

interface MonthCalendarProps {
  year: number; month: number;
  fromDate: Date | null; toDate: Date | null; hoverDate: Date | null;
  pendingFrom: Date | null; pendingTo: Date | null; today: Date;
  onDayClick: (d: Date) => void; onDayHover: (d: Date | null) => void;
  onPrev: () => void; onNext: () => void;
  showPrev: boolean; showNext: boolean;
}

function MonthCalendar({ year, month, fromDate, toDate, hoverDate, pendingFrom, pendingTo, today, onDayClick, onDayHover, onPrev, onNext, showPrev, showNext }: MonthCalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Effective range for highlighting
  // While selecting: show from pendingFrom to either pendingTo (if set) or hoverDate (preview)
  // After selection: show the confirmed range
  const effFrom = pendingFrom || fromDate;
  const effTo = pendingFrom ? (pendingTo || hoverDate) : toDate;
  const [lo, hi] = effFrom && effTo
    ? (effFrom <= effTo ? [effFrom, effTo] : [effTo, effFrom])
    : [effFrom, null];

  function classify(d: Date) {
    const isStart = lo && sameDay(d, lo);
    const isEnd = hi && sameDay(d, hi);
    const inRange = lo && hi && d > lo && d < hi;
    const isToday = sameDay(d, today);
    return { isStart, isEnd, inRange, isToday };
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Month header */}
      <div className="flex items-center justify-between">
        {showPrev ? (
          <button onClick={onPrev} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors">
            <CaretLeft size={14} weight="bold" />
          </button>
        ) : <div className="w-6" />}
        <p className="text-sm font-bold text-slate-800">{MONTH_NAMES[month]} {year}</p>
        {showNext ? (
          <button onClick={onNext} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors">
            <CaretRight size={14} weight="bold" />
          </button>
        ) : <div className="w-6" />}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map(l => (
          <div key={l} className="text-center text-xs font-semibold text-slate-400 py-1">{l}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const { isStart, isEnd, inRange, isToday } = classify(d);
          return (
            <div
              key={i}
              onClick={() => onDayClick(d)}
              onMouseEnter={() => onDayHover(d)}
              onMouseLeave={() => onDayHover(null)}
              className={[
                'relative flex items-center justify-center h-9 cursor-pointer select-none transition-colors',
                inRange ? 'bg-violet-100' : '',
                // Left/right rounding caps for range endpoints
                isStart && hi ? 'rounded-l-lg' : '',
                isEnd && lo ? 'rounded-r-lg' : '',
                !isStart && !isEnd && !inRange ? 'rounded-lg' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className={[
                'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-colors relative z-10',
                isStart || isEnd ? 'bg-violet-600 text-white shadow-sm' : '',
                !isStart && !isEnd && isToday ? 'text-violet-600 ring-2 ring-violet-400' : '',
                !isStart && !isEnd && !isToday ? 'text-slate-700 hover:bg-violet-100 hover:text-violet-700' : '',
              ].filter(Boolean).join(' ')}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePicker({ label, fromStr, toStr, onChangeDates }: {
  label: string; fromStr: string; toStr: string;
  onChangeDates: (from: string, to: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null);
  const [pendingTo, setPendingTo] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const today = new Date();
  const [leftYear, setLeftYear] = useState(today.getFullYear());
  const [leftMonth, setLeftMonth] = useState(today.getMonth());

  const rightMonth = (leftMonth + 1) % 12;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const fromDate = fromISO(fromStr);
  const toDate = fromISO(toStr);

  const displayText = fromDate && toDate
    ? `${fmtDisplay(fromDate)} – ${fmtDisplay(toDate)}`
    : fromDate
      ? `${fmtDisplay(fromDate)} – ...`
      : null;

  // Calculate popover position (recalculate on scroll and resize)
  const updatePosition = () => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 520;
      const popoverHeight = 380; // Approximate height of calendar
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let top = rect.bottom + 4;
      let left = rect.left;

      // Adjust if popover would overflow right edge
      if (left + popoverWidth > viewportWidth - 16) {
        left = Math.max(16, viewportWidth - popoverWidth - 16);
      }

      // Adjust if popover would overflow bottom edge
      if (top + popoverHeight > viewportHeight - 16) {
        top = Math.max(16, rect.top - popoverHeight - 4);
      }

      setPopoverPos({ top, left });
    }
  };

  useEffect(() => {
    updatePosition();
  }, [open]);

  // Recalculate position on scroll and resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  // Escape key + outside click handling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setPendingFrom(null);
        setPendingTo(null);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target) &&
          triggerRef.current && !triggerRef.current.contains(target)) {
        setOpen(false);
        setPendingFrom(null);
        setPendingTo(null);
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  function handleDayClick(d: Date) {
    if (!pendingFrom) {
      setPendingFrom(d);
      setPendingTo(null);
    } else {
      setPendingTo(d);
      // Don't update dates yet — wait for Apply click
    }
  }

  function handleApply() {
    if (pendingFrom && pendingTo) {
      const [from, to] = pendingFrom < pendingTo ? [pendingFrom, pendingTo] : [pendingTo, pendingFrom];
      onChangeDates(toISO(from), toISO(to));
    }
    setOpen(false);
    setPendingFrom(null);
    setPendingTo(null);
  }

  function prevMonth() {
    if (leftMonth === 0) { setLeftMonth(11); setLeftYear(y => y - 1); }
    else setLeftMonth(m => m - 1);
  }
  function nextMonth() {
    if (leftMonth === 11) { setLeftMonth(0); setLeftYear(y => y + 1); }
    else setLeftMonth(m => m + 1);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-800">{label}</p>

      {/* Trigger input */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        className={[
          'flex items-center gap-3 border rounded-lg px-4 py-2.5 bg-white w-full text-left transition-colors',
          open ? 'border-violet-400 ring-2 ring-violet-100' : 'border-slate-300 hover:border-slate-400',
        ].join(' ')}
      >
        <CalendarBlank size={15} className="text-slate-400 shrink-0" />
        <span className={displayText ? 'text-sm text-slate-700' : 'text-sm text-slate-400'}>
          {displayText || 'mm/dd/yyyy – mm/dd/yyyy'}
        </span>
        {displayText && (
          <button
            onClick={(e) => { e.stopPropagation(); onChangeDates('', ''); setPendingFrom(null); setPendingTo(null); }}
            className="ml-auto text-slate-400 hover:text-slate-600 transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </button>

      {/* Calendar popover — natural extension of field via Portal */}
      {open && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-2xl p-3"
          style={{
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: '520px',
          }}
        >
          {/* Two-month calendar grid */}
          <div className="flex gap-5">
            <MonthCalendar
              year={leftYear} month={leftMonth}
              fromDate={pendingFrom || fromDate} toDate={pendingTo || toDate}
              hoverDate={hoverDate} pendingFrom={pendingFrom} pendingTo={pendingTo} today={today}
              onDayClick={handleDayClick} onDayHover={setHoverDate}
              onPrev={prevMonth} onNext={nextMonth}
              showPrev showNext={false}
            />
            <div className="w-px bg-slate-100 shrink-0" />
            <MonthCalendar
              year={rightYear} month={rightMonth}
              fromDate={pendingFrom || fromDate} toDate={pendingTo || toDate}
              hoverDate={hoverDate} pendingFrom={pendingFrom} pendingTo={pendingTo} today={today}
              onDayClick={handleDayClick} onDayHover={setHoverDate}
              onPrev={prevMonth} onNext={nextMonth}
              showPrev={false} showNext
            />
          </div>

          {/* Footer: hint + Apply button */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {pendingFrom && !pendingTo ? 'Click an end date' : pendingFrom ? 'Ready to apply' : 'Click a start date'}
            </p>
            <button
              onClick={handleApply}
              disabled={!pendingFrom || !pendingTo}
              className={[
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                pendingFrom && pendingTo
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              ].join(' ')}
            >
              Apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Price Range Slider ───────────────────────────────────────────────────

function PriceRangeSlider({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = '0.00',
  maxPlaceholder = '100,000.00',
  maxRange = 100000,
}: {
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  maxRange?: number;
}) {
  const min = minValue ? parseFloat(minValue) : 0;
  const max = maxValue ? parseFloat(maxValue) : maxRange;
  const minPercent = (min / maxRange) * 100;
  const maxPercent = (max / maxRange) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Interactive Slider Track */}
      <div className="relative pt-2 pb-6">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 rounded-full -translate-y-1/2" />

        {/* Filled track */}
        <div
          className="absolute top-1/2 h-2 bg-violet-600 rounded-full -translate-y-1/2"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min="0"
          max={maxRange}
          value={min}
          onChange={(e) => {
            const newMin = parseFloat(e.target.value);
            if (newMin <= max) {
              onMinChange(e.target.value);
            }
          }}
          className="absolute top-1/2 left-0 right-0 w-full h-2 -translate-y-1/2 pointer-events-none appearance-none bg-transparent cursor-pointer"
          style={{
            zIndex: min > maxRange - 100 ? 5 : 3,
          }}
        />

        {/* Max slider */}
        <input
          type="range"
          min="0"
          max={maxRange}
          value={max}
          onChange={(e) => {
            const newMax = parseFloat(e.target.value);
            if (newMax >= min) {
              onMaxChange(e.target.value);
            }
          }}
          className="absolute top-1/2 left-0 right-0 w-full h-2 -translate-y-1/2 pointer-events-none appearance-none bg-transparent cursor-pointer"
          style={{
            zIndex: max < 100 ? 3 : 5,
          }}
        />

        {/* Custom CSS for slider thumbs */}
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 3px solid #7c3aed;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 3px solid #7c3aed;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>

      {/* Min and Max inputs */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">From</span>
          <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 gap-1 bg-white">
            <span className="text-sm text-slate-400">₱</span>
            <input
              type="number"
              placeholder={minPlaceholder}
              value={minValue}
              onChange={(e) => onMinChange(e.target.value)}
              className="w-20 text-sm outline-none text-slate-700 bg-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">To</span>
          <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 gap-1 bg-white">
            <span className="text-sm text-slate-400">₱</span>
            <input
              type="number"
              placeholder={maxPlaceholder}
              value={maxValue}
              onChange={(e) => onMaxChange(e.target.value)}
              className="w-20 text-sm outline-none text-slate-700 bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Drawer ────────────────────────────────────────────────────────────

function FilterDrawer({ open, onClose, filters, onChange, onApply, onReset }: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const statuses: (BillStatus | 'all')[] = ['all', 'paid', 'unpaid', 'pending', 'overdue'];
  const billTypes: (BillType | 'all')[] = ['all', 'one-time', 'recurring', 'installment'];
  const billTypeLabels: Record<BillType | 'all', string> = {
    'all': 'All', 'one-time': 'One-Time', 'recurring': 'Recurring', 'installment': 'Installment',
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Filter</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-7">

          {/* Status */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-800">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ status: s })}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-semibold border capitalize transition-colors',
                    filters.status === s
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {s === 'all' ? 'All' : STATUS_LABELS[s as BillStatus]}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Due */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-800">Amount Due</p>
            <PriceRangeSlider
              minValue={filters.amountMin}
              maxValue={filters.amountMax}
              onMinChange={(v) => onChange({ amountMin: v })}
              onMaxChange={(v) => onChange({ amountMax: v })}
              minPlaceholder="0.00"
              maxPlaceholder="100,000.00"
            />
          </div>

          {/* Overdue Charge */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-800">Overdue Charge</p>
            <PriceRangeSlider
              minValue={filters.overdueMin}
              maxValue={filters.overdueMax}
              onMinChange={(v) => onChange({ overdueMin: v })}
              onMaxChange={(v) => onChange({ overdueMax: v })}
              minPlaceholder="0.00"
              maxPlaceholder="10,000.00"
              maxRange={10000}
            />
          </div>

          {/* Bill Date */}
          <DateRangePicker
            label="Bill Date"
            fromStr={filters.billDateFrom}
            toStr={filters.billDateTo}
            onChangeDates={(from, to) => onChange({ billDateFrom: from, billDateTo: to })}
          />

          {/* Due Date */}
          <DateRangePicker
            label="Due Date"
            fromStr={filters.dueDateFrom}
            toStr={filters.dueDateTo}
            onChangeDates={(from, to) => onChange({ dueDateFrom: from, dueDateTo: to })}
          />

          {/* Bill Type */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-800">Bill Type</p>
            <div className="flex flex-wrap gap-2">
              {billTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => onChange({ billType: t })}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors',
                    filters.billType === t
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {billTypeLabels[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onReset}
            className="px-6 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Customer Info Panel ──────────────────────────────────────────────────────

function InfoRow({ label, value, blurValue }: { label: string; value: string; blurValue?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className={['text-sm text-slate-500 leading-snug', blurValue ? 'blur-sm select-none' : ''].join(' ')}>{value}</p>
    </div>
  );
}

function CustomerInfoPanel({ restricted = false, visibleFields = null }: { restricted?: boolean; visibleFields?: Set<string> | null }) {
  const c = getActiveCustomer();
  const isOrg = c.type === 'organization';
  // Helper: show field only if not filtered (null = show all)
  const show = (key: string) => !visibleFields || visibleFields.has(key);

  return (
    <aside className="w-72 shrink-0 bg-white border-l border-slate-200 sticky top-0 self-stretch overflow-y-auto">
      <div className="px-6 py-8 flex flex-col gap-5">
        <h2 className="text-xl font-bold text-slate-900">Customer information</h2>

        {/* Avatar */}
        <div className={[
          'w-20 h-20 rounded-full flex flex-col items-center justify-center shrink-0',
          isOrg ? 'bg-slate-700' : 'bg-slate-500',
        ].join(' ')}>
          {isOrg
            ? <>
                <Buildings size={22} className="text-white mb-0.5" />
                <span className="text-white text-[8px] font-bold tracking-widest uppercase">Company</span>
              </>
            : <User size={30} className="text-white" />
          }
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          {show('customerId') && <InfoRow label="Customer ID" value={c.id} />}
          {show('customerName') && <InfoRow label="Name" value={c.name} />}
          {show('email') && <InfoRow label="Email address" value={c.email} blurValue={restricted} />}
          {show('phone') && <InfoRow label="Phone" value={c.phone} blurValue={restricted} />}
          {show('address') && <InfoRow label="Address" value={c.address} blurValue={restricted} />}
          {show('withholdingTax') && <InfoRow label="Withholding Tax" value={c.withholdingTax} />}

          {/* Primary Contact (org only) */}
          {isOrg && c.primaryContact && (show('primaryContactName') || show('primaryContactPosition') || show('primaryContactEmail') || show('primaryContactPhone')) && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Contact</p>
              {(show('primaryContactName') || show('primaryContactPosition')) && (
                <div className="flex flex-col gap-0.5">
                  {show('primaryContactName') && <p className="text-sm font-semibold text-slate-800">{c.primaryContact.name}</p>}
                  {show('primaryContactPosition') && <p className="text-sm text-slate-500">{c.primaryContact.position}</p>}
                </div>
              )}
              {show('primaryContactEmail') && <InfoRow label="Email" value={c.primaryContact.email} blurValue={restricted} />}
              {show('primaryContactPhone') && <InfoRow label="Phone" value={c.primaryContact.phone} blurValue={restricted} />}
            </div>
          )}

          {/* Other Contacts (org only) */}
          {show('otherContacts') && isOrg && c.otherContacts && c.otherContacts.length > 0 && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Other Contacts</p>
              {c.otherContacts.map((oc, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-slate-800">{oc.name}</p>
                    <p className="text-sm text-slate-500">{oc.position}</p>
                  </div>
                  <InfoRow label="Email" value={oc.email} blurValue={restricted} />
                  <InfoRow label="Phone" value={oc.phone} blurValue={restricted} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ step, muted = false, settingsActive = false, onSettings }: { step: Step; muted?: boolean; settingsActive?: boolean; onSettings?: () => void }) {
  const steps = [
    { n: 1, label: 'Select Bill' },
    { n: 2, label: 'Confirm Payment' },
    { n: 3, label: 'Payment Submitted' },
  ];
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
      {/* Logo */}
      <img src={mochiLogo} alt="Mochi" className={['h-7 w-auto', muted ? 'opacity-50' : ''].join(' ')} />

      {/* Progress heading */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</h2>
        <ol className="flex flex-col gap-5">
          {steps.map(({ n, label }) => {
            const done = !muted && step > n;
            const active = !muted && step === n;
            return (
              <li key={n} className="flex items-center gap-3">
                {done ? (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 shrink-0">
                    <Check size={14} weight="bold" className="text-white" />
                  </div>
                ) : (
                  <div className={[
                    'flex items-center justify-center w-6 h-6 rounded-full shrink-0 text-xs font-semibold',
                    active
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200',
                  ].join(' ')}>
                    {n}
                  </div>
                )}
                <span className={[
                  'text-sm',
                  muted ? 'text-slate-400' : done ? 'text-violet-600 font-medium' : active ? 'text-violet-700 font-semibold' : 'text-slate-400',
                ].join(' ')}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Settings — disabled until authenticated */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <button
          onClick={muted ? undefined : onSettings}
          disabled={muted}
          className={[
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            muted
              ? 'text-slate-400 cursor-not-allowed'
              : settingsActive
                ? 'bg-violet-50 text-violet-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50',
          ].join(' ')}
          title={muted ? 'Unlock your portal to access Settings' : 'Settings'}
        >
          <Gear size={18} className={muted ? 'text-slate-300' : settingsActive ? 'text-violet-600' : 'text-slate-400'} />
          <span>Settings</span>
          {muted && <Lock size={12} weight="fill" className="ml-auto text-slate-300" />}
        </button>
      </div>
    </aside>
  );
}

// ─── Set Up PIN (mandatory, first-time) ───────────────────────────────────────

function SetUpPinModal({ onComplete }: { onComplete: (pin: string) => void }) {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const newComplete = newPin.length === 4;
  const confirmComplete = confirmPin.length === 4;
  const mismatch = confirmComplete && newComplete && confirmPin !== newPin;
  const repeating = newComplete && /^(\d)\1{3}$/.test(newPin);
  const canSubmit = newComplete && confirmComplete && !mismatch;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) onComplete(newPin);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/25 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-6">
        {/* Header — shield icon + centered title/description */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <ShieldCheck size={26} className="text-violet-600" weight="duotone" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Set Up Your PIN</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Before you can access your portal, you need to create a 4-digit PIN. You'll use this PIN every time you log in going forward.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* New PIN */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-semibold text-slate-700">New PIN</label>
              <span className="relative group inline-flex">
                <Info size={15} className="text-slate-400 cursor-help" />
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 rounded-lg bg-slate-800 text-white text-xs leading-snug px-3 py-2 text-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                  Choose something memorable but not easy to guess. Avoid using your birthday or repeating digits.
                </span>
              </span>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm placeholder:tracking-normal tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-violet-200 transition-colors"
            />
            {repeating && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                <Warning size={13} weight="fill" /> Avoid repeating digits for better security.
              </p>
            )}
          </div>

          {/* Confirm New PIN */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Confirm New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Re-enter 4-digit PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={[
                'w-full border rounded-lg px-4 py-3 text-sm placeholder:tracking-normal tracking-[0.3em] focus:outline-none focus:ring-2 transition-colors',
                mismatch ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-violet-200',
              ].join(' ')}
            />
            {mismatch && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <Warning size={13} weight="fill" /> PINs do not match.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Set PIN
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center">Your PIN is required to continue and cannot be skipped.</p>
      </div>
    </div>
  );
}

// ─── PIN Authentication (returning customer) ──────────────────────────────────

const GRAD = { backgroundImage: 'linear-gradient(135deg, #504977, #965CB8)' };

const AUTH_SLIDES = [
  {
    key: 'methods',
    title: 'Pay your way',
    desc: 'Choose from GCash, Maya, credit card, and more — pay your bills through the method that\'s most convenient for you.',
  },
  {
    key: 'multibills',
    title: 'Settle all your bills at once',
    desc: 'See all your outstanding balances in one place and pay them in a single checkout — no need to log in multiple times.',
  },
  {
    key: 'tracking',
    title: 'Always know your payment status',
    desc: 'Get instant confirmation and download your receipt right after paying — so you always have proof on hand.',
  },
  {
    key: 'security',
    title: 'Your account is secure',
    desc: 'Your portal is protected by a personal PIN and encrypted connection — your billing and payment details stay private.',
  },
  {
    key: 'devices',
    title: 'Access your portal from any device',
    desc: 'Check your bills, view due dates, and make payments from your phone, tablet, or computer — anytime, anywhere.',
  },
];

function PinAuthModal({ currentPin, onSuccess }: { currentPin: string; onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [forgotNote, setForgotNote] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % AUTH_SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === currentPin) { setError(''); onSuccess(); }
    else { setError('Incorrect PIN'); setPin(''); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex">
      {/* ── Left: sign-in form ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          <img src={mochiLogo} alt="Mochi" className="h-8 w-auto mb-10" />

          <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-2">Enter your 4-digit PIN to access your payment portal.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">PIN</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                  className={[
                    'w-full border rounded-xl pl-11 pr-4 py-3 text-sm placeholder:tracking-normal tracking-[0.3em] focus:outline-none focus:ring-2 transition-colors',
                    error ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-violet-200',
                  ].join(' ')}
                />
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <Warning size={13} weight="fill" /> {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pin.length !== 4}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sign in
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            Forgot your PIN?{' '}
            <button onClick={() => setForgotNote(true)} className="font-semibold text-violet-600 hover:text-violet-800 hover:underline transition-colors">
              Reset PIN
            </button>
          </p>
          {forgotNote && <p className="mt-2 text-xs text-slate-500">We've sent a PIN reset link to {getActiveCustomer().email}.</p>}
        </div>
      </div>

      {/* ── Right: digital-payments showcase hero (carousel) ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden text-white flex-col items-center justify-between py-12 px-10" style={{ backgroundColor: '#32215F' }}>
        {/* dotted texture */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        {/* bottom glow graphic */}
        <div
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[120%] h-80 rounded-[100%] blur-3xl pointer-events-none"
          style={{ backgroundColor: '#C35CFF', opacity: 0.45 }}
        />

        {/* logo (white, directly on the dark hero) */}
        <div className="relative z-10">
          <img src={mochiLogoWhite} alt="Mochi" className="h-9 w-auto" />
        </div>

        {/* slide illustration */}
        <div className="relative z-10 my-6 flex items-center justify-center w-full max-w-[660px]" style={{ minHeight: 360 }}>
          <AuthIllustration slideKey={AUTH_SLIDES[slide].key} />
        </div>

        {/* carousel */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md">
          <div className="flex items-center gap-2">
            {AUTH_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={['h-1.5 rounded-full transition-all', i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'].join(' ')}
              />
            ))}
          </div>
          <div className="text-center min-h-[140px]">
            <h2 className="text-2xl font-bold leading-tight">{AUTH_SLIDES[slide].title}</h2>
            <p className="text-sm text-violet-100 mt-3 leading-relaxed">{AUTH_SLIDES[slide].desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderPill({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={['absolute z-20 bg-white rounded-full shadow-lg px-4 py-2 whitespace-nowrap', className].join(' ')}>
      <span
        className="text-sm font-bold bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #504977, #965CB8)' }}
      >
        {label}
      </span>
    </div>
  );
}

// Gradient-filled text (for brand marks / labels)
function GradText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={['bg-clip-text text-transparent whitespace-nowrap', className].join(' ')} style={GRAD}>
      {children}
    </span>
  );
}

// ─── Carousel slide illustrations ──────────────────────────────────────────────

function AuthIllustration({ slideKey }: { slideKey: string }) {
  switch (slideKey) {
    case 'multibills': return <IllustrationMultiBills />;
    case 'tracking': return <IllustrationTracking />;
    case 'security': return <IllustrationSecurity />;
    case 'devices': return <IllustrationDevices />;
    default: return <IllustrationMethods />;
  }
}

// Slide 5 — payment methods (unchanged design)
function IllustrationMethods() {
  return (
    <div className="relative">
      <ProviderPill label="GCash" className="-left-12 top-24" />
      <ProviderPill label="VISA" className="-right-10 top-16" />
      <ProviderPill label="GrabPay" className="-left-14 top-1/2" />
      <ProviderPill label="Maya" className="-right-12 top-[58%]" />
      <ProviderPill label="UnionBank" className="-right-8 bottom-12" />

      <div className="w-80 rounded-lg p-5 shadow-2xl border border-white/15" style={GRAD}>
        <h3 className="text-base font-bold text-white">Payment Portal</h3>
        <p className="text-xs font-semibold text-violet-100 mt-3 mb-2">Select a Payment Method</p>
        <div className="flex flex-col gap-2">
          {[
            { mark: 'VISA', label: 'Credit or Debit Card', cls: 'italic font-extrabold text-[11px]' },
            { mark: 'GCash', label: 'GCash', cls: 'font-bold text-[9px]' },
            { mark: 'BPI', label: 'BPI Online', cls: 'font-extrabold text-[11px]' },
            { mark: 'maya', label: 'Paymaya', cls: 'font-bold lowercase text-[10px]' },
            { mark: 'GrabPay', label: 'GrabPay', cls: 'font-bold text-[8px]' },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-3 bg-white rounded-md px-3 py-2.5">
              <span className="w-12 h-7 rounded-sm bg-slate-100 flex items-center justify-center px-1">
                <GradText className={m.cls}>{m.mark}</GradText>
              </span>
              <span className="text-sm font-semibold text-slate-800">{m.label}</span>
            </div>
          ))}
          <div className="bg-white/25 rounded-md py-2.5 text-center text-sm font-bold text-white">Pay now</div>
        </div>
      </div>
    </div>
  );
}

// Tiny UI primitives for mockups
function MiniBillRow({ status }: { status: 'paid' | 'due' | 'pending' }) {
  const pill = { paid: 'bg-emerald-100', due: 'bg-rose-100', pending: 'bg-amber-100' }[status];
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5">
      <div className="space-y-1">
        <div className="h-1.5 w-20 bg-slate-300 rounded" />
        <div className="h-1 w-12 bg-slate-200 rounded" />
      </div>
      <div className={['h-3 w-8 rounded-full', pill].join(' ')} />
    </div>
  );
}

// Slide 1 — Manage your account anywhere (product window behind, person in front)
function IllustrationDevices() {
  return (
    <div className="relative w-[540px] h-[460px]">
      {/* enlarged "Your Bills" product window — background layer */}
      <div className="absolute left-6 top-8 z-10 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* window title bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="px-5 pt-4 pb-2">
          <div className="text-sm font-bold text-slate-700">Your Bills</div>
          <div className="text-xs text-slate-400 mt-0.5">Check bills & due dates anytime</div>
        </div>
        <div className="px-5 pb-5 space-y-2.5">
          <MiniBillRow status="due" />
          <MiniBillRow status="paid" />
          <MiniBillRow status="pending" />
        </div>
      </div>

      {/* cut-out person — foreground layer, overlapping the window */}
      <img
        src="/person.png?v=6"
        alt=""
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        className="absolute right-0 bottom-0 w-[600px] h-auto object-contain object-bottom z-30 drop-shadow-2xl select-none pointer-events-none"
      />
    </div>
  );
}

// Small status pill for the security slide (icon + short label only)
function SecPill({ icon, label, tint = 'violet', className = '' }: { icon: React.ReactNode; label: string; tint?: 'violet' | 'emerald'; className?: string }) {
  return (
    <div className={['absolute z-30 bg-white rounded-full shadow-lg px-3 py-1.5 flex items-center gap-1.5', className].join(' ')}>
      <span className={tint === 'emerald' ? 'text-emerald-500' : 'text-violet-600'}>{icon}</span>
      <span className="text-xs font-bold text-slate-700">{label}</span>
    </div>
  );
}

// Slide 2 — Bank-grade security (Overview dashboard + Secure Login popup + badges)
function IllustrationSecurity() {
  return (
    <div className="relative w-[660px] h-[440px]">
      {/* dimmed Overview dashboard — background layer */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 z-0 w-[430px] rounded-xl bg-white/90 shadow-2xl overflow-hidden blur-[0.5px]">
        {/* header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <img src={mochiLogo} alt="" className="h-4 w-auto" />
            <span className="text-[9px] font-bold text-slate-700">Customer Payment Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-100" />
            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[7px] font-bold text-white">JM</div>
          </div>
        </div>
        <div className="flex">
          {/* sidebar — progress stepper */}
          <div className="w-[88px] p-2.5 space-y-2 border-r border-slate-100 shrink-0">
            <div className="text-[6px] font-bold text-slate-300 uppercase tracking-wider mb-1">Progress</div>
            {[['1', 'Select Bill', true], ['2', 'Confirm Payment', false], ['3', 'Payment Submitted', false]].map(([n, label, active]) => (
              <div key={n as string} className="flex items-center gap-1.5">
                <div className={['w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0', active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'].join(' ')}>{n as string}</div>
                <span className={['text-[7px] leading-tight', active ? 'font-bold text-violet-700' : 'font-medium text-slate-400'].join(' ')}>{label as string}</span>
              </div>
            ))}
          </div>
          {/* main */}
          <div className="flex-1 p-3 min-w-0">
            <div className="text-[10px] font-bold text-slate-700">Welcome back, Juan! 👋</div>
            <div className="text-[7px] text-slate-400 mt-0.5">Here's what's happening with your account.</div>
            {/* stat cards */}
            <div className="flex gap-2 mt-2.5">
              <div className="flex-1 rounded-md border border-slate-100 p-2">
                <div className="text-[6px] text-slate-400">Total Outstanding</div>
                <div className="text-[11px] font-bold text-violet-700 mt-0.5">₱53,500.00</div>
                <div className="text-[6px] text-slate-400 mt-0.5">4 bills pending</div>
              </div>
              <div className="w-24 rounded-md border border-slate-100 p-2">
                <div className="text-[6px] text-slate-400">Last Payment</div>
                <div className="text-[10px] font-bold text-slate-700 mt-0.5">₱15,000.00</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[6px] text-slate-400">May 1, 2025</span>
                  <span className="text-[6px] font-bold text-emerald-600 bg-emerald-50 rounded px-1">Paid</span>
                </div>
              </div>
            </div>
            {/* recent bills + payment history */}
            <div className="flex gap-2 mt-2.5">
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-bold text-slate-600 mb-1">Recent Bills</div>
                <div className="space-y-1.5">
                  {[['Association Dues', 'May 1, 2025'], ['Parking Fee', 'June 1, 2025'], ['Water Utility Bill', 'April 1, 2025'], ['Maintenance Fee', 'Q2 2025']].map(([n, d]) => (
                    <div key={n}>
                      <div className="text-[7px] font-semibold text-slate-600 truncate">{n}</div>
                      <div className="text-[6px] text-slate-400">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-24">
                <div className="text-[8px] font-bold text-slate-600 mb-1">Payment History</div>
                <div className="space-y-1.5">
                  {[['₱15,000.00', 'May 1, 2025'], ['₱12,500.00', 'April 1, 2025'], ['₱8,250.00', 'March 1, 2025']].map(([a, d]) => (
                    <div key={d} className="flex items-center justify-between">
                      <div>
                        <div className="text-[7px] font-bold text-slate-600">{a}</div>
                        <div className="text-[6px] text-slate-400">{d}</div>
                      </div>
                      <span className="text-[5px] font-bold text-emerald-600 bg-emerald-50 rounded px-1 py-0.5">Paid</span>
                    </div>
                  ))}
                </div>
                <div className="text-[6px] font-bold text-violet-600 mt-1.5">View all payments →</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secure Login popup — centered over the dashboard */}
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-20 w-48 bg-white rounded-2xl shadow-2xl p-5 flex flex-col items-center">
        <img src={mochiLogo} alt="Mochi" className="h-6 w-auto" />
        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center my-3.5">
          <Lock size={20} weight="fill" className="text-violet-600" />
        </div>
        <div className="text-base font-bold text-slate-800">Secure Login</div>
        <div className="text-[10px] text-slate-400 mt-1">Enter your 4-digit PIN</div>
        <div className="flex gap-2 mt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-9 rounded-md border border-slate-200 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full" style={GRAD} />
            </div>
          ))}
        </div>
        <div className="mt-4 w-full rounded-lg bg-violet-50 px-3 py-2 flex items-center gap-2">
          <ShieldCheck size={16} weight="fill" className="text-violet-600 shrink-0" />
          <div>
            <div className="text-[10px] font-bold text-violet-700 leading-none">Protected</div>
            <div className="text-[8px] text-slate-400 mt-0.5">Your account is safe with us</div>
          </div>
        </div>
      </div>

      {/* small floating status pills around the login card */}
      <SecPill className="left-[120px] top-16" icon={<Lock size={13} weight="fill" />} label="Encrypted" />
      <SecPill className="right-[120px] top-24" tint="emerald" icon={<CheckCircle size={14} weight="fill" />} label="Verified" />
      <SecPill className="left-[150px] bottom-24" icon={<ShieldCheck size={13} weight="fill" />} label="Secure PIN" />
      <SecPill className="right-[140px] bottom-16" icon={<Lock size={13} weight="fill" />} label="Protected" />
    </div>
  );
}

// Slide 3 — Track every payment (status timeline console + receipt + success badge)
function IllustrationTracking() {
  const steps = [
    { n: '1', label: 'Payment Received', time: '16:42:33', done: true },
    { n: '2', label: 'Verification', time: '16:42:33', done: true },
    { n: '3', label: 'Paid', time: '16:42:34', done: true },
  ];
  return (
    <div className="relative w-[420px] h-[370px] flex items-center justify-center">
      {/* console card */}
      <div className="bg-white rounded-xl shadow-2xl w-72 overflow-hidden">
        {/* header */}
        <div className="px-4 py-3 flex items-center justify-between" style={GRAD}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Bank size={13} weight="fill" className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">Payment Status</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            <span className="text-[10px] font-bold text-white tracking-wide">Live</span>
          </div>
        </div>

        {/* timeline */}
        <div className="p-4">
          {steps.map((s, i) => (
            <div key={s.n} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shadow shrink-0" style={GRAD}>
                  <Check size={12} weight="bold" className="text-white" />
                </div>
                {i < steps.length - 1 && <div className="w-0.5 flex-1 my-1" style={GRAD} />}
              </div>
              <div className={['flex-1 flex items-start justify-between', i < steps.length - 1 ? 'pb-4' : ''].join(' ')}>
                <div>
                  <div className="text-xs font-semibold text-slate-700">{s.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{s.time}</div>
                </div>
                <span className="text-[9px] font-bold text-emerald-500">Done</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* floating Receipt.pdf download card */}
      <div className="absolute -right-3 top-8 bg-white rounded-lg p-3 shadow-2xl w-40 border border-slate-100">
        <div className="flex items-center gap-2">
          <FilePdf size={26} weight="fill" className="text-violet-600" />
          <div>
            <div className="text-xs font-bold text-slate-800">Receipt.pdf</div>
            <div className="text-[9px] text-slate-400">24 KB</div>
          </div>
        </div>
        <div className="mt-2 rounded-md py-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-white" style={GRAD}>
          <DownloadSimple size={12} weight="bold" /> Download Receipt
        </div>
      </div>

      {/* floating Payment Successful badge */}
      <div className="absolute -left-3 bottom-10 bg-white rounded-full px-3 py-2 shadow-2xl flex items-center gap-2">
        <CheckCircle size={18} weight="fill" className="text-emerald-500" />
        <span className="text-xs font-bold text-slate-800">Payment Successful</span>
      </div>
    </div>
  );
}

// Slide 4 — Pay multiple bills in one go
function IllustrationMultiBills() {
  const bills = [
    { name: 'Association Dues', sub: 'Due May 31, 2025', amt: '₱15,000' },
    { name: 'Parking Fee', sub: 'Due Jun 15, 2025', amt: '₱20,000' },
    { name: 'Utility Bill', sub: 'Due Apr 30, 2025', amt: '₱10,000' },
    { name: 'Maintenance Fee', sub: 'Due Jul 1, 2025', amt: '₱8,500' },
  ];
  return (
    <div className="relative w-[400px] h-[340px] flex items-center justify-center">
      {/* payment summary card */}
      <div className="bg-white rounded-xl shadow-2xl w-72 overflow-hidden">
        {/* amount header */}
        <div className="p-5 pb-4">
          <div className="text-[11px] font-semibold text-slate-400">Amount to pay</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            <GradText>₱53,500</GradText>
          </div>
        </div>

        {/* itemized bills */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="text-[11px] font-semibold text-slate-400 mb-3">For 4 bills</div>
          <div className="space-y-3">
            {bills.map((b) => (
              <div key={b.name} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm" style={GRAD}>
                  <Buildings size={17} weight="fill" className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700 truncate">{b.name}</div>
                  <div className="text-[10px] text-slate-400">{b.sub}</div>
                </div>
                <div className="text-xs font-bold text-slate-700 shrink-0">{b.amt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* single checkout action */}
        <div className="px-5 pb-5">
          <div className="rounded-lg py-2.5 text-center text-sm font-bold text-white shadow" style={GRAD}>
            Pay all bills
          </div>
        </div>
      </div>

      {/* floating success toast */}
      <div className="absolute -right-4 bottom-4 bg-white rounded-full pl-2 pr-4 py-2 shadow-2xl flex items-center gap-2">
        <CheckCircle size={22} weight="fill" className="text-emerald-500" />
        <span className="text-sm font-bold text-slate-800">Payment received!</span>
      </div>
    </div>
  );
}

// ─── Restricted Pre-PIN Portal (Name/Bill/Due visible; rest blurred & locked) ──

function RestrictedPortalView() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Center: blurred bills + lock overlay */}
      <div className="relative flex-1 overflow-hidden min-w-0">
        <div className="absolute inset-0 overflow-hidden blur-[3px] pointer-events-none select-none p-8 flex flex-col gap-5" aria-hidden="true">
          <div className="flex gap-2">
            <div className="flex-1 h-11 bg-white border border-slate-200 rounded-lg" />
            <div className="w-28 h-11 bg-white border border-slate-200 rounded-lg" />
          </div>
          <div className="h-20 bg-white border border-slate-200 rounded-lg" />
          <div className="flex flex-col gap-3">
            {getActiveBills().slice(0, 4).map((b) => (
              <BillCard key={b.id} bill={b} checked={false} onToggle={() => {}} />
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-center gap-4 px-6">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center">
            <Lock size={34} className="text-slate-700" weight="fill" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Your portal is currently restricted</h3>
          <p className="text-sm text-slate-500 max-w-xs">Set up your PIN to view your full billing history, account details, payment methods, and settings.</p>
        </div>
      </div>

      {/* Right: customer information (sensitive fields blurred) */}
      <CustomerInfoPanel restricted />
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ selected, onToggle, showError, onContinue, showSummary = true, showCustomerInfo = true, visibleFields = null }: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  showError: boolean;
  onContinue: () => void;
  showSummary?: boolean;
  showCustomerInfo?: boolean;
  visibleFields?: Set<string> | null;
}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function applyFilters(b: Bill): boolean {
    if (appliedFilters.status !== 'all' && b.status !== appliedFilters.status) return false;
    if (appliedFilters.billType !== 'all' && b.billType !== appliedFilters.billType) return false;
    if (appliedFilters.amountMin && b.amount < parseFloat(appliedFilters.amountMin)) return false;
    if (appliedFilters.amountMax && b.amount > parseFloat(appliedFilters.amountMax)) return false;
    if (appliedFilters.overdueMin && (b.overdueCharge ?? 0) < parseFloat(appliedFilters.overdueMin)) return false;
    if (appliedFilters.overdueMax && (b.overdueCharge ?? 0) > parseFloat(appliedFilters.overdueMax)) return false;
    return true;
  }

  const filtered = getActiveBills().filter((b) => {
    const matchSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch && applyFilters(b);
  });

  const payableBills = getActiveBills().filter(isPayable);
  const allVisiblePayable = filtered.filter(isPayable);
  const allSelected = allVisiblePayable.length > 0 && allVisiblePayable.every((b) => selected.has(b.id));
  const selectedTotal = payableBills
    .filter((b) => selected.has(b.id))
    .reduce((s, b) => s + b.amount + (b.overdueCharge ?? 0), 0);

  function handleSelectAll() {
    if (allSelected) {
      allVisiblePayable.forEach((b) => { if (selected.has(b.id)) onToggle(b.id); });
    } else {
      allVisiblePayable.forEach((b) => { if (!selected.has(b.id)) onToggle(b.id); });
    }
  }

  const activeFilterCount = [
    appliedFilters.status !== 'all',
    appliedFilters.billType !== 'all',
    appliedFilters.amountMin || appliedFilters.amountMax,
    appliedFilters.overdueMin || appliedFilters.overdueMax,
    appliedFilters.billDateFrom || appliedFilters.billDateTo,
    appliedFilters.dueDateFrom || appliedFilters.dueDateTo,
  ].filter(Boolean).length;

  return (
    <>
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        onApply={() => setAppliedFilters(filters)}
        onReset={() => { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); }}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Center content column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Sticky workspace header (white card, matches side panels) ── */}
          <div className="shrink-0 sticky top-0 z-20 bg-white border-b border-slate-200 px-8 py-5 flex flex-col gap-4 shadow-sm">
            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-slate-800">Select Bills to Pay</h1>
              <p className="text-sm text-slate-500 mt-0.5">Choose one or more bills below to proceed with payment.</p>
            </div>

            {/* Search + Filter */}
            <div className="flex items-center justify-between">
              <div className="relative w-72">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 focus:bg-white transition-colors"
                  placeholder="Search by Bill ID or name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className={[
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors',
                  activeFilterCount > 0
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-violet-50 border-violet-200 text-slate-800 hover:bg-violet-100',
                ].join(' ')}
              >
                <FunnelSimple size={15} />
                Filter
                {activeFilterCount > 0 && (
                  <span className="bg-white text-violet-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Summary metrics */}
            {showSummary && <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-3.5 flex items-center justify-between">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Total amount due before fees</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(selectedTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Number of selected bills</p>
                  <p className="text-lg font-bold text-slate-900">{selected.size}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Number of bills in portal</p>
                  <p className="text-lg font-bold text-slate-900">{payableBills.length}</p>
                </div>
              </div>
              <button
                onClick={handleSelectAll}
                className="px-6 py-2 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>}
          </div>

          {/* ── Scrollable bill list ── */}
          <div className="flex-1 overflow-auto px-8 py-6 flex flex-col gap-3">
            {/* Error banner */}
            {showError && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <Warning size={16} weight="fill" className="shrink-0" />
                Please select at least one bill to continue.
              </div>
            )}

            {/* Bill cards */}
            {filtered.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                checked={selected.has(bill.id)}
                onToggle={() => isPayable(bill) && onToggle(bill.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-slate-400">No bills match your search.</div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="border-t border-slate-200 bg-white px-8 py-4 flex items-center justify-end shrink-0">
            <button
              onClick={onContinue}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>

        {/* Right panel */}
        {showCustomerInfo && <CustomerInfoPanel visibleFields={visibleFields} />}
      </div>
    </>
  );
}

// ─── Payment Method Config ──────────────────────────────────────────────────

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: typeof CreditCard;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, JCB', icon: CreditCard },
  { id: 'gcash', label: 'GCash', desc: 'Pay via your GCash wallet', icon: DeviceMobile },
  { id: 'maya', label: 'Maya', desc: 'Pay via your Maya wallet', icon: DeviceMobile },
  { id: 'bank', label: 'Direct Bank Transfer', desc: 'InstaPay / PESONet', icon: Bank },
  { id: 'qrph', label: 'QR PH', desc: 'Scan with any QR Ph app', icon: QrCode },
  { id: 'upload', label: 'Upload Proof of Payment', desc: 'Submit a receipt manually', icon: UploadSimple },
];

function methodLabel(m: PaymentMethod) {
  return PAYMENT_METHODS.find((o) => o.id === m)?.label ?? m;
}

function gatewayFeeFor(method: PaymentMethod, subtotal: number) {
  return PAYMONGO_METHODS.includes(method) ? subtotal * 0.035 + 15 : 0;
}

// ─── Order Summary Card (Step 2) ──────────────────────────────────────────────

function OrderSummaryCard({ bill }: { bill: Bill }) {
  const [open, setOpen] = useState(false); // line items accordion collapsed by default
  const isOverdue = bill.status === 'overdue';

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-3">
          <button className="text-sm font-semibold text-violet-600 hover:text-violet-800 hover:underline transition-colors">
            #{bill.id}
          </button>
          <StatusBadge status={bill.status} />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
          <DownloadSimple size={14} />
          Download Bill PDF
        </button>
      </div>

      {/* Bill name */}
      <h3 className="text-base font-bold text-slate-800 leading-snug px-5 pt-2">{bill.name}</h3>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Bill Date</p>
          <p className="text-sm text-slate-700">{bill.billDate}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Due Date</p>
          <p className={['text-sm', isOverdue ? 'text-red-600 font-semibold' : 'text-slate-700'].join(' ')}>{bill.dueDate}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Amount Due</p>
          <p className="text-sm font-bold text-slate-900">{fmt(bill.amount)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Overdue Charge</p>
          <p className={['text-sm font-bold', bill.overdueCharge ? 'text-red-600' : 'text-slate-400'].join(' ')}>
            {bill.overdueCharge ? `+ ${fmt(bill.overdueCharge)}` : '—'}
          </p>
        </div>
      </div>

      {/* Line Items Accordion */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>Line items ({bill.lineItems.length})</span>
          <CaretDown size={14} className={['transition-transform text-slate-400', open ? 'rotate-180' : ''].join(' ')} />
        </button>
        {open && (
          <div className="px-5 pb-4">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                    <th className="text-left font-semibold px-3 py-2">Item</th>
                    <th className="text-right font-semibold px-3 py-2">Qty</th>
                    <th className="text-right font-semibold px-3 py-2">Discount</th>
                    <th className="text-right font-semibold px-3 py-2">Tax</th>
                    <th className="text-right font-semibold px-3 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lineItems.map((li, i) => (
                    <tr key={i} className="border-t border-slate-100 text-slate-700 align-top">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-800">{li.name}</p>
                        <p className="text-slate-400">{li.description}</p>
                      </td>
                      <td className="px-3 py-2 text-right">{li.quantity}</td>
                      <td className="px-3 py-2 text-right">{li.discount ? `- ${fmt(li.discount)}` : '—'}</td>
                      <td className="px-3 py-2 text-right">{fmt(li.tax)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{fmt(li.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payment Method Card (Step 2) ─────────────────────────────────────────────

function PaymentMethodCard({ option, selected, onSelect }: {
  option: PaymentMethodOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      onClick={onSelect}
      className={[
        'flex items-center gap-3 p-4 rounded-lg border text-left transition-all',
        selected
          ? 'border-violet-400 ring-2 ring-violet-100 bg-violet-50/40'
          : 'border-slate-200 hover:border-slate-300 bg-white',
      ].join(' ')}
    >
      <div className={[
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
        selected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500',
      ].join(' ')}>
        <Icon size={20} weight={selected ? 'fill' : 'regular'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{option.label}</p>
        <p className="text-xs text-slate-500 truncate">{option.desc}</p>
      </div>
      <div className={[
        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
        selected ? 'border-violet-600 bg-violet-600' : 'border-slate-300',
      ].join(' ')}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}

// ─── Upload Proof of Payment (Step 2) ─────────────────────────────────────────

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string | null;
  progress: number; // 0–100
}

function humanFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadedFileRow({ file, onChange, onRemove }: { file: UploadedFile; onChange: (f: File) => void; onRemove: () => void }) {
  const uploading = file.progress < 100;
  const changeRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      {/* Preview */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
        {file.previewUrl
          ? <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
          : file.type === 'application/pdf'
            ? <FilePdf size={24} className="text-red-500" />
            : <ImageIcon size={24} className="text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        {uploading ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full transition-all duration-200" style={{ width: `${file.progress}%` }} />
            </div>
            <span className="text-xs text-slate-400 tabular-nums w-9 text-right">{file.progress}%</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400">{humanFileSize(file.size)} • Uploaded</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => changeRef.current?.click()}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Change file
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Remove file"
        >
          <Trash size={16} />
        </button>
      </div>
      <input
        ref={changeRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); e.target.value = ''; }}
      />
    </div>
  );
}

function UploadProofCard({ files, onAddFile, onChangeFile, onRemove, error }: {
  files: UploadedFile[];
  onAddFile: (f: File) => void;
  onChangeFile: (id: string, f: File) => void;
  onRemove: (id: string) => void;
  error: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const ACCEPT = '.jpg,.jpeg,.png,.pdf';

  function handleFiles(fileList: FileList | null) {
    if (fileList) Array.from(fileList).forEach((f) => onAddFile(f));
  }

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-800">Upload proof of payment</p>

      {/* Uploaded file list */}
      {hasFiles && (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <UploadedFileRow key={f.id} file={f} onChange={(nf) => onChangeFile(f.id, nf)} onRemove={() => onRemove(f.id)} />
          ))}
        </div>
      )}

      {/* Dropzone — always available so customers can add another proof */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
          hasFiles ? 'px-6 py-6' : 'px-6 py-10',
          dragOver ? 'border-violet-400 bg-violet-50' : error ? 'border-red-300 bg-red-50/40' : 'border-slate-300 bg-slate-50 hover:border-slate-400',
        ].join(' ')}
      >
        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
          <CloudArrowUp size={24} className="text-violet-600" />
        </div>
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-violet-600">{hasFiles ? 'Add another file' : 'Browse file'}</span> or drag and drop here
        </p>
        <p className="text-xs text-slate-400">Accepted: JPG, PNG, PDF — up to 10MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <Warning size={13} weight="fill" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Step 2: Confirm Payment ──────────────────────────────────────────────────

function Step2({ selected, method, setMethod, onSubmitRedirect, onUploadSuccess, onPrevious, showUpload = true, showSummary = true }: {
  selected: Set<string>;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  onSubmitRedirect: () => void;
  onUploadSuccess: () => void;
  onPrevious: () => void;
  showUpload?: boolean;
  showSummary?: boolean;
}) {
  const selectedBills = getActiveBills().filter((b) => selected.has(b.id));

  // Breakdown aggregates from line items
  const allItems = selectedBills.flatMap((b) => b.lineItems);
  const vatSubtotal = allItems.reduce((s, li) => s + li.subtotal, 0);
  const taxAmount = allItems.reduce((s, li) => s + li.tax, 0);
  const discountAmount = allItems.reduce((s, li) => s + li.discount, 0);
  const overdueTotal = selectedBills.reduce((s, b) => s + (b.overdueCharge ?? 0), 0);
  const VAT_RATE = 12;
  const discountPct = vatSubtotal > 0 ? (discountAmount / vatSubtotal) * 100 : 0;
  const breakdownTotal = vatSubtotal + taxAmount - discountAmount;
  const amountDue = breakdownTotal + overdueTotal;

  const isUpload = method === 'upload';

  // Upload state (supports multiple proofs)
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [remarks, setRemarks] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const idRef = useRef(0);

  const anyUploading = files.some((f) => f.progress < 100);

  function animateProgress(id: string) {
    const interval = window.setInterval(() => {
      setFiles((prev) => {
        let done = false;
        const next = prev.map((x) => {
          if (x.id !== id) return x;
          const progress = Math.min(100, x.progress + 20);
          if (progress >= 100) done = true;
          return { ...x, progress };
        });
        if (done) window.clearInterval(interval);
        return next;
      });
    }, 180);
  }

  function handleAddFile(f: File) {
    const id = `f${++idRef.current}`;
    const previewUrl = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
    setFiles((prev) => [...prev, { id, name: f.name, size: f.size, type: f.type, previewUrl, progress: 0 }]);
    setUploadError('');
    setSubmitError(false);
    animateProgress(id);
  }

  function handleChangeFile(id: string, f: File) {
    const previewUrl = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
    setFiles((prev) => prev.map((x) => {
      if (x.id !== id) return x;
      if (x.previewUrl) URL.revokeObjectURL(x.previewUrl);
      return { ...x, name: f.name, size: f.size, type: f.type, previewUrl, progress: 0 };
    }));
    setUploadError('');
    setSubmitError(false);
    animateProgress(id);
  }

  function handleRemove(id: string) {
    setFiles((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  function handlePrimary() {
    if (isUpload) {
      if (files.length === 0) { setUploadError('Please upload proof of payment to continue.'); return; }
      if (anyUploading) return; // wait for uploads to finish
      setUploadError('');
      setSubmitError(false);
      setSubmitting(true);
      window.setTimeout(() => {
        setSubmitting(false);
        onUploadSuccess();
      }, 1000);
    } else {
      onSubmitRedirect();
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Confirm Payment</h1>
            <p className="text-sm text-slate-500 mt-0.5">Review your bills and choose how you'd like to pay.</p>
          </div>

          {/* Order Summary */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-800">Order summary</p>
            {selectedBills.map((bill) => (
              <OrderSummaryCard key={bill.id} bill={bill} />
            ))}
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-800">Payment method</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.filter(opt => showUpload || opt.id !== 'upload').map((opt) => (
                <PaymentMethodCard
                  key={opt.id}
                  option={opt}
                  selected={method === opt.id}
                  onSelect={() => { setMethod(opt.id); setSubmitError(false); setUploadError(''); }}
                />
              ))}
            </div>

            {/* Redirect notice for external providers */}
            {!isUpload && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                <ShieldCheck size={16} weight="fill" className="shrink-0 mt-0.5" />
                You'll be securely redirected to PayMongo, our external payment provider, to complete your {methodLabel(method)} payment.
              </div>
            )}
          </div>

          {/* Upload proof (only for upload method) */}
          {isUpload && (
            <div className="flex flex-col gap-3">
              {submitError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  <Warning size={16} weight="fill" className="shrink-0" />
                  Proof of payment could not be submitted. Please try again.
                </div>
              )}
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-5">
                <UploadProofCard files={files} onAddFile={handleAddFile} onChangeFile={handleChangeFile} onRemove={handleRemove} error={uploadError} />

                {/* Remarks */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-800">Remarks <span className="font-normal text-slate-400">(optional)</span></label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Add a note for this payment (e.g. reference number, sender name)…"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-y"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-slate-200 bg-white px-8 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onPrevious}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <button
            onClick={handlePrimary}
            disabled={submitting || (isUpload && anyUploading)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Spinner size={16} className="animate-spin" />}
            {isUpload ? (submitting ? 'Submitting…' : 'Submit Proof') : 'Continue'}
          </button>
        </div>
      </div>

      {/* Right: Payment Breakdown — hidden when summary section is disabled */}
      {showSummary && <aside className="w-72 shrink-0 bg-white border-l border-slate-200 overflow-y-auto">
        <div className="p-6 flex flex-col gap-6">
          {/* Summary of Line Items */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Summary of Line Items</h2>
            <div className="flex flex-col gap-3">
              {allItems.map((li, i) => {
                const original = li.subtotal + li.discount;
                const pct = li.discount > 0 ? (li.discount / original) * 100 : 0;
                return (
                  <div key={i} className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{li.name}</p>
                      <p className="text-xs text-slate-400">Qty: {li.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-slate-700 whitespace-nowrap">{fmt(li.subtotal)}</p>
                      {li.discount > 0 && (
                        <p className="text-xs whitespace-nowrap">
                          <span className="text-violet-600">({pct.toFixed(0)}% discount)</span>{' '}
                          <span className="text-slate-400 line-through">{fmt(original)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing Cycle Breakdown */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Billing Cycle Breakdown</h2>
            <div className="flex flex-col">
              {/* Subtotal (VAT exclusive) */}
              <div className="flex justify-between items-center gap-3 py-2.5 text-sm border-b border-slate-100">
                <span className="text-slate-600 min-w-0">Subtotal <span className="text-slate-400">(VAT exclusive)</span></span>
                <span className="font-medium text-slate-800 whitespace-nowrap shrink-0">{fmt(vatSubtotal)}</span>
              </div>

              {/* Tax % (VAT) */}
              <div className="flex justify-between items-center gap-3 py-2.5 text-sm border-b border-slate-100">
                <span className="text-slate-600 min-w-0">Tax % <span className="text-slate-400">(VAT)</span></span>
                <span className="font-medium text-slate-800 whitespace-nowrap shrink-0">{VAT_RATE.toFixed(2)} %</span>
              </div>

              {/* Discount % */}
              <div className="flex justify-between items-center gap-3 py-2.5 text-sm border-b border-slate-100">
                <span className="text-slate-600 min-w-0">Discount %</span>
                <span className="font-medium text-slate-800 whitespace-nowrap shrink-0">{discountPct.toFixed(2)} %</span>
              </div>

              {/* Tax amount */}
              <div className="flex justify-between items-center gap-3 py-2.5 text-sm border-b border-slate-100">
                <span className="text-slate-600 min-w-0">Tax amount</span>
                <span className="font-medium text-slate-800 whitespace-nowrap shrink-0">{fmt(taxAmount)}</span>
              </div>

              {/* Discount amount */}
              <div className="flex justify-between items-center gap-3 py-2.5 text-sm border-b border-slate-100">
                <span className="text-slate-600 min-w-0">Discount amount</span>
                <span className="font-medium text-slate-800 whitespace-nowrap shrink-0">{fmt(discountAmount)}</span>
              </div>

              {/* Overdue charges (only when applicable) */}
              {overdueTotal > 0 && (
                <div className="flex justify-between items-center gap-3 py-2.5 text-sm border-b border-slate-100">
                  <span className="text-slate-600 min-w-0">Overdue charges</span>
                  <span className="font-medium text-red-600 whitespace-nowrap shrink-0">+ {fmt(overdueTotal)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center gap-3 py-2.5 text-sm border-b border-slate-100">
                <span className="text-slate-600 min-w-0">Total</span>
                <span className="font-medium text-slate-800 whitespace-nowrap shrink-0">{fmt(breakdownTotal)}</span>
              </div>

              {/* Amount due — highlighted */}
              <div className="flex justify-between items-center gap-3 mt-2 px-3 py-3 rounded-lg bg-violet-50">
                <span className="text-sm font-bold text-slate-700 min-w-0">Amount due</span>
                <span className="text-base font-bold text-violet-700 whitespace-nowrap shrink-0">{fmt(amountDue)}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>}
    </div>
  );
}

// ─── PayMongo Redirect Modal ──────────────────────────────────────────────────

function PayMongoRedirectModal({ method, selectedCount, subtotal, gatewayFee, total, onContinue, onCancel }: {
  method: PaymentMethod;
  selectedCount: number;
  subtotal: number;
  gatewayFee: number;
  total: number;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const [redirecting, setRedirecting] = useState(false);

  function handleContinue() {
    setRedirecting(true);
    window.setTimeout(() => { onContinue(); }, 1200);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-5">
        {/* Headline */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <ShieldCheck size={26} className="text-violet-600" weight="duotone" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Redirecting to secure payment</h2>
            <p className="text-sm text-slate-500 mt-1">
              You'll be redirected to PayMongo, our secure external payment provider, to complete your {methodLabel(method)} payment.
            </p>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col gap-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Number of bills selected</span>
            <span className="font-semibold text-slate-800">{selectedCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-800">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Gateway fee (3.5% + ₱15)</span>
            <span className="font-semibold text-slate-800">{fmt(gatewayFee)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2.5 flex justify-between">
            <span className="text-sm font-bold text-slate-700">Total amount due</span>
            <span className="text-base font-bold text-violet-700">{fmt(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleContinue}
            disabled={redirecting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {redirecting ? <><Spinner size={16} className="animate-spin" /> Redirecting…</> : <>Continue to Payment <ArrowSquareOut size={16} /></>}
          </button>
          <button
            onClick={onCancel}
            disabled={redirecting}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Lock size={12} /> Secured by PayMongo
        </p>
      </div>
    </div>
  );
}

// ─── Step 3: Success Page ─────────────────────────────────────────────────────

function Step3({ selected, total, method, onBackToPortal }: {
  selected: Set<string>;
  total: number;
  method: PaymentMethod;
  onBackToPortal: () => void;
}) {
  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-lg mx-auto flex flex-col gap-6 py-6">
        {/* Success illustration */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle size={48} className="text-emerald-500" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {method === 'upload' ? 'Payment submitted' : 'Payment successful'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {method === 'upload'
                ? 'Your proof of payment has been submitted and is currently under review.'
                : 'Your payment has been completed through our secure payment partner.'}
            </p>
          </div>
          {method === 'upload' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Spinner size={12} className="animate-spin" /> Verifying
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check size={12} weight="bold" /> Paid
            </span>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Number of bills paid</span>
            <span className="font-semibold text-slate-800">{selected.size}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total amount paid</span>
            <span className="font-bold text-violet-700">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Payment method</span>
            <span className="font-medium text-slate-800">{methodLabel(method)}</span>
          </div>
        </div>

        {/* Email confirmation note */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
          <ShieldCheck size={16} weight="fill" className="shrink-0 mt-0.5" />
          A confirmation email with your bill details has been sent to {getActiveCustomer().email}.
        </div>

        {/* Primary CTA */}
        <button
          onClick={onBackToPortal}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
        >
          Back to Portal
        </button>
      </div>
    </div>
  );
}

// ─── PayMongo Hosted Checkout ─────────────────────────────────────────────────

function genReference() {
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${hex(4)}-${hex(12)}`;
}

/** Method-specific payment field shown in the PayMongo "Payment Method" card */
function CheckoutMethodField({ method, onClick }: { method: PaymentMethod; onClick?: () => void }) {
  if (method === 'qrph') {
    const qrContent = (
      <>
        <span className="text-base">Scan</span>
        <span className="inline-flex items-center gap-1 font-bold">
          <span className="text-amber-500">▦</span>
          <span className="text-slate-800">QR</span>
          <span className="text-red-500">Ph</span>
        </span>
        <span className="text-base">code to pay</span>
      </>
    );
    if (onClick) {
      return (
        <button
          onClick={onClick}
          className="w-full border border-slate-200 rounded-lg px-4 py-4 flex items-center justify-center gap-2 text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors"
        >
          {qrContent}
        </button>
      );
    }
    return (
      <div className="border border-slate-200 rounded-lg px-4 py-4 flex items-center justify-center gap-2 text-slate-800">
        {qrContent}
      </div>
    );
  }

  const label = method === 'bank' ? 'Online Banking' : method === 'card' ? 'Card' : 'E-Wallets';

  // Right-side brand badge
  let badge: React.ReactNode = null;
  if (method === 'card') {
    badge = (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-7 h-5 rounded bg-gradient-to-r from-red-500 to-amber-400" />
        <span className="text-[10px] font-black italic text-blue-700">VISA</span>
      </div>
    );
  } else if (method === 'gcash') {
    badge = <span className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-blue-600 text-white text-[10px] font-bold">GC</span>;
  } else if (method === 'maya') {
    badge = <span className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold lowercase">maya</span>;
  } else if (method === 'bank') {
    badge = <span className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-red-700 text-white text-[10px] font-bold">BPI</span>;
  }

  const hasCaret = method === 'gcash' || method === 'maya' || method === 'bank';

  const content = (
    <>
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {badge}
        {hasCaret && <CaretDown size={16} className="text-slate-400" />}
      </div>
    </>
  );

  // The Card field is itself the button that opens the card form
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between text-slate-800 text-left hover:border-slate-300 hover:bg-slate-50 transition-colors"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between text-slate-800">
      {content}
    </div>
  );
}

/** Small brand badge for a payment method (reused in field rows and option rows) */
function MethodBadge({ method }: { method: PaymentMethod }) {
  if (method === 'card') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-7 h-5 rounded bg-gradient-to-r from-red-500 to-amber-400" />
        <span className="text-[10px] font-black italic text-blue-700">VISA</span>
      </div>
    );
  }
  if (method === 'gcash') return <span className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-blue-600 text-white text-[10px] font-bold">GC</span>;
  if (method === 'maya') return <span className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold lowercase">maya</span>;
  if (method === 'bank') return <span className="inline-flex items-center justify-center px-1.5 h-5 rounded bg-red-700 text-white text-[10px] font-bold">BPI</span>;
  return null;
}

/** Countdown timer for the QR Ph screen — starts at 30:00 and ticks down */
function QrCountdown() {
  const [seconds, setSeconds] = useState(30 * 60);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return <>{mm}:{ss}</>;
}

/** Decorative faux QR code (prototype only) */
function FauxQR() {
  const N = 25;
  const cells: boolean[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      // Finder squares in three corners
      const inFinder = (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
      const on = inFinder ? ((r < 1 || r > 5 || c < 1 || c > 5) ? ((r === 0 || r === 6 || c === 0 || c === 6) ? true : (r >= 2 && r <= 4 && c >= 2 && c <= 4)) : false)
                          : ((r * 7 + c * 13 + r * c) % 3 === 0);
      cells.push(on);
    }
  }
  return (
    <div className="relative">
      <div className="grid bg-white p-2 rounded" style={{ gridTemplateColumns: `repeat(${N}, 1fr)`, width: '13rem', height: '13rem' }}>
        {cells.map((on, i) => (
          <div key={i} className={on ? 'bg-slate-900' : 'bg-white'} />
        ))}
      </div>
      {/* Center QR Ph logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-9 h-9 rounded bg-white flex items-center justify-center shadow">
          <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
            <span className="bg-blue-600 rounded-sm" />
            <span className="bg-amber-400 rounded-sm" />
            <span className="bg-red-500 rounded-sm" />
            <span className="bg-blue-600 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardForm {
  name: string; email: string; phone: string;
  country: string; address1: string; address2: string; city: string; state: string; postal: string;
  cardNumber: string; mm: string; yy: string; cvc: string; fullName: string;
}

const EMPTY_CARD_FORM: CardForm = {
  name: '', email: '', phone: '',
  country: '', address1: '', address2: '', city: '', state: '', postal: '',
  cardNumber: '', mm: '', yy: '', cvc: '', fullName: '',
};

const CARD_REQUIRED: (keyof CardForm)[] = ['name', 'email', 'country', 'address1', 'city', 'state', 'postal', 'cardNumber', 'mm', 'yy', 'cvc', 'fullName'];

function isCardFormValid(form: CardForm) {
  return CARD_REQUIRED.every((k) => form[k].trim() !== '');
}

/** Controlled PayMongo card form fields (Customer Information + Billing Address + Card Information). */
function PayMongoCardForm({ form, onChange }: { form: CardForm; onChange: (k: keyof CardForm, v: string) => void }) {
  const labelCls = 'text-sm font-medium text-slate-700 mb-1.5 block';
  const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100';

  const set = (k: keyof CardForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(k, e.target.value);

  return (
    <div className="flex flex-col gap-6">
      {/* Customer Information */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Customer Information</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.name} onChange={set('name')} placeholder="John Doe" className={`${inputCls} pl-9`} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <div className="relative">
              <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.email} onChange={set('email')} type="email" placeholder="email@example.com" className={`${inputCls} pl-9`} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Mobile Phone (optional)</label>
            <div className="relative">
              <DeviceMobile size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.phone} onChange={set('phone')} placeholder="+63  917 123 4567" className={`${inputCls} pl-9`} />
            </div>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Billing Address</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Country</label>
            <div className="relative">
              <select value={form.country} onChange={set('country')} className={`${inputCls} appearance-none ${form.country ? 'text-slate-700' : 'text-slate-400'}`}>
                <option value="">Select a country</option>
                <option value="PH">Philippines</option>
                <option value="US">United States</option>
                <option value="SG">Singapore</option>
                <option value="JP">Japan</option>
              </select>
              <CaretDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address Line 1</label>
            <input value={form.address1} onChange={set('address1')} placeholder="123 Main St" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Address Line 2 (optional)</label>
            <input value={form.address2} onChange={set('address2')} placeholder="Apt 123" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city} onChange={set('city')} placeholder="Manila" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State / Province</label>
              <input value={form.state} onChange={set('state')} placeholder="Metro Manila" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Postal Code</label>
            <input value={form.postal} onChange={set('postal')} placeholder="12345" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Card Information */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Card Information</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Card Number</label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.cardNumber} onChange={set('cardNumber')} inputMode="numeric" placeholder="1234 1234 1234 1234" className={`${inputCls} pl-9`} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>MM</label>
              <input value={form.mm} onChange={set('mm')} inputMode="numeric" placeholder="01" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>YY</label>
              <input value={form.yy} onChange={set('yy')} inputMode="numeric" placeholder="31" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CVC</label>
              <input value={form.cvc} onChange={set('cvc')} inputMode="numeric" placeholder="123" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Full Name</label>
            <input value={form.fullName} onChange={set('fullName')} placeholder="John Doe" className={inputCls} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PayMongoCheckout({ method, selectedBills, gatewayFee, total, onPay, onBack }: {
  method: PaymentMethod;
  selectedBills: Bill[];
  gatewayFee: number;
  total: number;
  onPay: () => void;
  onBack: () => void;
}) {
  type Stage = 'method' | 'mobile' | 'otp' | 'bankauth' | 'qrconfirm' | 'success';
  const [reference] = useState(genReference);
  const [stage, setStage] = useState<Stage>('method');
  const [expanded, setExpanded] = useState(false);
  const [cardForm, setCardForm] = useState<CardForm>(EMPTY_CARD_FORM);
  const cardValid = isCardFormValid(cardForm);
  const setCardField = (k: keyof CardForm, v: string) => setCardForm((f) => ({ ...f, [k]: v }));

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paidAt, setPaidAt] = useState('');

  const ewalletLabel = method === 'bank' ? 'Online Banking' : 'E-Wallets';
  const optionLabel = method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : method === 'bank' ? 'BPI Online' : '';

  const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100';

  function goSuccess() {
    setProcessing(false);
    setPaidAt(new Date().toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    setStage('success');
  }
  function verifyAndPay() {
    setProcessing(true);
    window.setTimeout(goSuccess, 1200);
  }
  function startQr() {
    setStage('qrconfirm');
    window.setTimeout(goSuccess, 2200);
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" aria-label="Back to merchant">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">M</span>
            <span className="text-lg font-semibold text-slate-800">Mochi</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Reference Number</p>
          <p className="text-sm font-semibold text-slate-700 tracking-wide">{reference}</p>
        </div>
      </div>

      {stage === 'success' ? (
        /* ── Hosted Payment Success ── */
        <div className="max-w-md mx-auto px-6 py-16 flex flex-col items-center text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle size={48} className="text-emerald-500" weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Successful</h1>
            <p className="text-sm text-slate-500 mt-2">Your payment has been received and confirmed.</p>
          </div>
          <div className="w-full border border-slate-200 rounded-xl p-5 flex flex-col gap-3 text-left">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-500 min-w-0">Reference Number</span>
              <span className="font-medium text-slate-800 text-right break-all">{reference}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-slate-900 whitespace-nowrap">{fmt(total)}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-slate-500">Date &amp; Time</span>
              <span className="font-medium text-slate-800 text-right">{paidAt}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm items-center">
              <span className="text-slate-500">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check size={12} weight="bold" /> Paid
              </span>
            </div>
          </div>
          <div className="w-full flex flex-col gap-3">
            <button onClick={onPay} className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">
              Return to Billing Portal
            </button>
            <button onClick={onPay} className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Return to Merchant Portal
            </button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-sm text-slate-400 mt-2">
            Powered by <span className="font-bold text-slate-600">paymongo</span>
          </p>
        </div>
      ) : (
        /* ── Two-column: order + active step ── */
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Order */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Complete Your Order</h1>

            <div className="flex flex-col gap-5">
              {selectedBills.map((bill) => {
                const amt = bill.amount + (bill.overdueCharge ?? 0);
                return (
                  <div key={bill.id} className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-2xl font-bold shrink-0">
                      {bill.id.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="font-semibold text-slate-800">#{bill.id}</p>
                      <p className="text-sm text-slate-400 mt-1">Quantity: 1</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{fmt(amt)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Transaction fees */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-2xl font-bold shrink-0">T</div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="font-semibold text-slate-800">Transaction fees</p>
                  <p className="text-sm text-slate-400 mt-1">Quantity: 1</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{fmt(gatewayFee)}</p>
                </div>
              </div>
            </div>

            {/* Merchant + totals */}
            <div className="mt-8 pt-5 border-t border-dashed border-slate-200">
              <p className="text-sm font-medium text-slate-700">Metroview Homes &amp; Realty</p>
            </div>
            <div className="mt-5 pt-5 border-t border-dashed border-slate-200 flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-500">{fmt(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Fees</span>
                <span className="text-slate-500">Free</span>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-dashed border-slate-200 flex justify-between">
              <span className="text-base font-bold text-slate-900">Total Due</span>
              <span className="text-base font-bold text-slate-900">{fmt(total)}</span>
            </div>
          </div>

          {/* Right: active step */}
          <div>
            {stage === 'method' && (!expanded ? (
              /* Collapsed: method row + Continue */
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Method</h2>
                <CheckoutMethodField method={method} onClick={() => setExpanded(true)} />
                <button
                  onClick={method === 'card' ? () => setStage('otp') : () => setExpanded(true)}
                  disabled={method === 'card' && !cardValid}
                  className="w-full mt-5 py-3 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">
                  By completing your purchase, you agree to PayMongo's <span className="text-emerald-600">Privacy Policy</span>.
                </p>
              </div>
            ) : method === 'card' ? (
              /* Card form */
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                <PayMongoCardForm form={cardForm} onChange={setCardField} />
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setStage('otp')}
                    disabled={!cardValid}
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Pay {fmt(total)}
                  </button>
                  <button onClick={() => setExpanded(false)} className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                    Use a different payment method
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    By completing your purchase, you agree to PayMongo's <span className="text-emerald-600">Privacy Policy</span>.
                  </p>
                </div>
              </div>
            ) : method === 'qrph' ? (
              /* QR Ph */
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="text-center text-base flex items-center justify-center gap-1.5 text-slate-800">
                  Scan
                  <span className="inline-flex items-center gap-1 font-bold">
                    <span className="text-amber-500">▦</span><span className="text-slate-800">QR</span><span className="text-red-500">Ph</span>
                  </span>
                  code to pay
                </div>
                <div className="flex items-center justify-center gap-2.5 text-[10px] font-bold">
                  <span className="text-blue-600">GCash</span>
                  <span className="text-slate-900 lowercase">maya</span>
                  <span className="text-red-700">BPI</span>
                  <span className="text-slate-700">GoTyme</span>
                  <span className="text-red-500">HOME CREDIT</span>
                </div>
                <button className="mx-auto text-xs text-slate-500 flex items-center gap-1 hover:text-slate-700">
                  See all supported banks and e-wallets <CaretDown size={12} />
                </button>
                <div onClick={startQr} className="mx-auto cursor-pointer relative bg-slate-50 rounded-xl p-4" title="Simulate scan to pay">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-semibold tabular-nums"><QrCountdown /></span>
                  <FauxQR />
                </div>
                <p className="text-center text-xs text-slate-500">Open your banking or e-wallet app, scan the code, and confirm the payment.</p>
                <button className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <DownloadSimple size={16} /> Download QR Code
                </button>
                <button onClick={() => setExpanded(false)} className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                  Use a different payment method
                </button>
              </div>
            ) : (
              /* E-Wallets / Online Banking */
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Method</h2>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button onClick={() => setExpanded(false)} className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-800">{ewalletLabel}</span>
                    <div className="flex items-center gap-2">
                      <MethodBadge method={method} />
                      <CaretDown size={16} className="text-slate-400 rotate-180" />
                    </div>
                  </button>
                  <div className="border-t border-slate-100 p-3">
                    <div className="border border-slate-200 rounded-lg px-3 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-sm font-medium text-slate-800">{optionLabel}</span>
                      </div>
                      <MethodBadge method={method} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStage(method === 'bank' ? 'bankauth' : 'mobile')}
                  className="w-full mt-5 py-3 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                >
                  Continue
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">
                  By completing your purchase, you agree to PayMongo's <span className="text-emerald-600">Privacy Policy</span>.
                </p>
              </div>
            ))}

            {/* GCash / Maya — mobile number */}
            {stage === 'mobile' && (
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <MethodBadge method={method} />
                  <h2 className="text-xl font-bold text-slate-900">{optionLabel}</h2>
                </div>
                <p className="text-sm text-slate-500">Log in to your {optionLabel} account to authorize this payment.</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Mobile Number</label>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" placeholder="+63 917 123 4567" className={inputCls} />
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setStage('otp')} disabled={!mobile.trim()} className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Continue
                  </button>
                  <button onClick={() => setStage('method')} className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* OTP — card / gcash / maya */}
            {stage === 'otp' && (
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <h2 className="text-xl font-bold text-slate-900">Enter verification code</h2>
                <p className="text-sm text-slate-500">
                  For your security, we sent a 6-digit code to {method === 'card' ? 'your registered mobile number' : (mobile || 'your mobile number')} to authorize this payment.
                </p>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="••••••"
                  className={`${inputCls} text-center text-lg tracking-[0.5em]`}
                />
                <div className="flex flex-col gap-3">
                  <button onClick={verifyAndPay} disabled={otp.length < 6 || processing} className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                    {processing ? <><Spinner size={16} className="animate-spin" /> Verifying…</> : `Verify & Pay ${fmt(total)}`}
                  </button>
                  <button className="text-xs text-slate-500 hover:text-slate-700">Didn't get a code? Resend</button>
                </div>
              </div>
            )}

            {/* Direct Bank Transfer — account authorization */}
            {stage === 'bankauth' && (
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <MethodBadge method="bank" />
                  <h2 className="text-xl font-bold text-slate-900">BPI Online</h2>
                </div>
                <p className="text-sm text-slate-500">Log in to authorize this payment from your BPI account.</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">User ID</label>
                  <input placeholder="Enter your BPI user ID" className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password</label>
                  <input type="password" placeholder="Enter your password" className={inputCls} />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex justify-between text-sm">
                  <span className="text-slate-500">Pay from account ••••&nbsp;1234</span>
                  <span className="font-bold text-slate-900">{fmt(total)}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={verifyAndPay} disabled={processing} className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 transition-colors flex items-center justify-center gap-2">
                    {processing ? <><Spinner size={16} className="animate-spin" /> Confirming…</> : 'Confirm Payment'}
                  </button>
                  <button onClick={() => setStage('method')} className="w-full py-3 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* QR confirmation state */}
            {stage === 'qrconfirm' && (
              <div className="border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4 py-12">
                <Spinner size={40} className="animate-spin text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-900">Confirming your payment…</h2>
                <p className="text-sm text-slate-500 max-w-xs">Waiting for confirmation from your banking or e-wallet app. Please don't close this window.</p>
              </div>
            )}

            <p className="flex items-center justify-center gap-1.5 text-sm text-slate-400 mt-5">
              Powered by <span className="font-bold text-slate-600">paymongo</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function SettingsPage({ currentPin, onChangePin, onBack }: { currentPin: string; onChangePin: (pin: string) => void; onBack: () => void }) {
  const [open, setOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [done, setDone] = useState(false);

  const oldComplete = oldPin.length === 4;
  const newComplete = newPin.length === 4;
  const confirmComplete = confirmPin.length === 4;
  const currentWrong = oldComplete && oldPin !== currentPin;
  const mismatch = confirmComplete && newComplete && confirmPin !== newPin;
  const canSave = oldComplete && !currentWrong && newComplete && confirmComplete && !mismatch;

  function reset() { setOpen(false); setOldPin(''); setNewPin(''); setConfirmPin(''); }

  function handleSave() {
    if (!canSave) return;
    onChangePin(newPin);
    reset();
    setDone(true);
  }

  const pinInput = (value: string, onChange: (v: string) => void, placeholder: string, invalid?: boolean) => (
    <input
      type="password"
      inputMode="numeric"
      maxLength={4}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      className={[
        'w-full border rounded-lg px-4 py-2.5 text-sm placeholder:tracking-normal tracking-[0.3em] focus:outline-none focus:ring-2 transition-colors',
        invalid ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-violet-200',
      ].join(' ')}
    />
  );

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-2xl flex flex-col gap-6">
        <div>
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3">
            <ArrowLeft size={16} /> Back to portal
          </button>
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your portal preferences and security.</p>
        </div>

        {/* PIN Management */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-violet-600" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">PIN Management</h2>
                <p className="text-sm text-slate-500 mt-0.5">Your 4-digit PIN secures access to your payment portal. You'll use it every time you log in.</p>
              </div>
            </div>
            {!open && (
              <button
                onClick={() => { setOpen(true); setDone(false); }}
                className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Change PIN
              </button>
            )}
          </div>

          {done && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
              <CheckCircle size={16} weight="fill" /> Your PIN has been updated.
            </div>
          )}

          {open && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Current PIN</label>
                {pinInput(oldPin, setOldPin, 'Enter current PIN', currentWrong)}
                {currentWrong && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <Warning size={13} weight="fill" /> Incorrect current PIN.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">New PIN</label>
                {pinInput(newPin, setNewPin, 'Enter 4-digit PIN')}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Confirm New PIN</label>
                {pinInput(confirmPin, setConfirmPin, 'Re-enter 4-digit PIN', mismatch)}
                {mismatch && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <Warning size={13} weight="fill" /> PINs do not match.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Update PIN
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomerPaymentPortalPage() {
  // Support ?mode=portal (direct access, PIN off) | ?mode=login (PIN on, returning) | default = setupPin
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlMode = urlParams.get('mode');
  const isPreview = urlMode !== null;
  const initialState: AppState = urlMode === 'portal' ? 'portal' : urlMode === 'login' ? 'login' : 'setupPin';
  // Read visibility settings from URL params (set by the settings page preview)
  const previewShowSummary = urlParams.get('summary') !== '0';
  const previewShowCustomerInfo = urlParams.get('info') !== '0';
  const previewShowUpload = urlParams.get('upload') !== '0';
  const previewFieldsParam = urlParams.get('fields');
  // Visible fields set — null means all fields visible (non-preview mode)
  const previewVisibleFields: Set<string> | null = previewFieldsParam
    ? new Set(previewFieldsParam.split(',').filter(Boolean))
    : null;
  // Swap to placeholder data in preview mode (affects all components via module refs)
  if (isPreview) { _activeBills = DEMO_BILLS; _activeCustomer = DEMO_CUSTOMER; }
  else { _activeBills = BILLS; _activeCustomer = CUSTOMER; }
  const [appState, setAppState] = useState<AppState>(initialState);
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [gatewayStage, setGatewayStage] = useState<'idle' | 'modal' | 'checkout'>('idle');
  const [showStep1Error, setShowStep1Error] = useState(false);
  const [portalView, setPortalView] = useState<'flow' | 'settings'>('flow');
  const [showPinSuccessBanner, setShowPinSuccessBanner] = useState(false);
  const [showSettingsBanner, setShowSettingsBanner] = useState(false);
  const [currentPin, setCurrentPin] = useState('1234'); // demo PIN for the "returning customer" state

  const isSetup = appState === 'setupPin';
  const isLogin = appState === 'login';
  const locked = isSetup || isLogin;

  function handleSetupComplete(pin: string) {
    // PIN saved + one-time link invalidated (conceptually) → unlock + surface banners
    setCurrentPin(pin);
    setShowPinSuccessBanner(true);
    setShowSettingsBanner(true);
    setAppState('portal');
  }

  // Demo state switch (for stakeholder review)
  function demoFirstTime() {
    setShowPinSuccessBanner(false);
    setShowSettingsBanner(false);
    setPortalView('flow');
    setStep(1);
    setSelected(new Set());
    setAppState('setupPin');
  }
  function demoReturning() {
    setShowPinSuccessBanner(false);
    setShowSettingsBanner(false);
    setPortalView('flow');
    setStep(1);
    setSelected(new Set());
    setCurrentPin('1234');
    setAppState('login');
  }

  const selectedBills = getActiveBills().filter((b) => selected.has(b.id));
  const subtotal = selectedBills.reduce((s, b) => s + b.amount + (b.overdueCharge ?? 0), 0);
  const gatewayFee = gatewayFeeFor(method, subtotal);
  const total = subtotal + gatewayFee;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleStep1Continue() {
    if (selected.size === 0) { setShowStep1Error(true); }
    else { setShowStep1Error(false); setStep(2); }
  }

  function handleBackToPortal() {
    setSelected(new Set());
    setMethod('card');
    setGatewayStage('idle');
    setStep(1);
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
        <h1 className="text-sm font-semibold text-slate-700">Customer Payment Portal</h1>
        <span className="ml-2 text-xs text-slate-400">— {getActiveCustomer().name}</span>
        {!locked && (
          <button
            onClick={() => setPortalView(portalView === 'settings' ? 'flow' : 'settings')}
            className={[
              'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              portalView === 'settings' ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            <Gear size={16} className={portalView === 'settings' ? 'text-violet-600' : 'text-slate-400'} />
            Settings
          </button>
        )}
      </header>

      {/* Post-setup banners (above all portal content) */}
      {!locked && showPinSuccessBanner && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between shrink-0">
          <p className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
            <CheckCircle size={18} weight="fill" /> Your PIN has been set. You're all set! Use it next time you log in.
          </p>
          <button onClick={() => setShowPinSuccessBanner(false)} className="text-emerald-600 hover:text-emerald-800 transition-colors" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      {!locked && showSettingsBanner && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <p className="text-sm text-blue-700">
            Need to change your PIN? Go to{' '}
            <button onClick={() => setPortalView('settings')} className="font-semibold underline hover:text-blue-900 transition-colors">Settings</button>
            {' '}to update it anytime.
          </p>
          <button onClick={() => setShowSettingsBanner(false)} className="text-blue-600 hover:text-blue-800 transition-colors" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Stepper
          step={step}
          muted={locked}
          settingsActive={!locked && portalView === 'settings'}
          onSettings={() => setPortalView('settings')}
        />
        {locked && <RestrictedPortalView />}
        {!locked && portalView === 'settings' && <SettingsPage currentPin={currentPin} onChangePin={setCurrentPin} onBack={() => setPortalView('flow')} />}
        {!locked && portalView === 'flow' && step === 1 && <Step1 selected={selected} onToggle={toggle} showError={showStep1Error} onContinue={handleStep1Continue} showSummary={previewShowSummary} showCustomerInfo={previewShowCustomerInfo} visibleFields={previewVisibleFields} />}
        {!locked && portalView === 'flow' && step === 2 && (
          <Step2
            selected={selected}
            method={method}
            setMethod={setMethod}
            onSubmitRedirect={() => setGatewayStage('modal')}
            onUploadSuccess={() => setStep(3)}
            onPrevious={() => setStep(1)}
            showUpload={previewShowUpload}
            showSummary={previewShowSummary}
          />
        )}
        {!locked && portalView === 'flow' && step === 3 && <Step3 selected={selected} total={total} method={method} onBackToPortal={handleBackToPortal} />}
      </div>

      {/* First-time: mandatory Set Up PIN (cannot be dismissed) */}
      {isSetup && <SetUpPinModal onComplete={handleSetupComplete} />}

      {/* Returning: PIN authentication */}
      {isLogin && <PinAuthModal currentPin={currentPin} onSuccess={() => setAppState('portal')} />}

      {/* Demo state switch — hidden in preview mode */}
      {!isPreview && <div className="fixed bottom-4 left-4 z-[60] bg-white border border-slate-200 rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1">
        <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demo</span>
        <button
          onClick={demoFirstTime}
          className={['px-3 py-1.5 rounded-full text-xs font-semibold transition-colors', isSetup ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'].join(' ')}
        >
          First-Time
        </button>
        <button
          onClick={demoReturning}
          className={['px-3 py-1.5 rounded-full text-xs font-semibold transition-colors', isLogin ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'].join(' ')}
        >
          Returning
        </button>
      </div>}

      {gatewayStage === 'modal' && (
        <PayMongoRedirectModal
          method={method}
          selectedCount={selected.size}
          subtotal={subtotal}
          gatewayFee={gatewayFee}
          total={total}
          onContinue={() => setGatewayStage('checkout')}
          onCancel={() => setGatewayStage('idle')}
        />
      )}

      {gatewayStage === 'checkout' && (
        <PayMongoCheckout
          method={method}
          selectedBills={selectedBills}
          gatewayFee={gatewayFee}
          total={total}
          onPay={() => { setGatewayStage('idle'); setStep(3); }}
          onBack={() => setGatewayStage('idle')}
        />
      )}
    </div>
  );
}
