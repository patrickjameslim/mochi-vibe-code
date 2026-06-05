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
} from '@phosphor-icons/react';
import mochiLogo from '#/assets/mochi-logo.svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = 'access' | 'portal';
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

const CORRECT_PIN = '1234';

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
        'relative bg-white rounded-lg border flex flex-col transition-all',
        isPaid ? 'opacity-70 cursor-default' : 'cursor-pointer',
        checked
          ? 'border-violet-400 ring-2 ring-violet-100 shadow-sm'
          : isOverdue
            ? 'border-red-200 hover:border-red-300 hover:shadow-sm'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
      ].join(' ')}
    >
      {/* ── Top row: Checkbox + Bill ID + Status Badge ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-0">
        <div className="flex items-center gap-3">
          <div
            onClick={(e) => { e.stopPropagation(); !isPaid && onToggle(); }}
            className={[
              'w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
              checked
                ? 'bg-violet-600 border-violet-600'
                : 'border-slate-300 hover:border-slate-400',
              isPaid ? 'opacity-50 cursor-default' : '',
            ].join(' ')}
          >
            {checked && <Check size={12} weight="bold" className="text-white" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/bills/${bill.id}`, '_blank'); }}
            className="text-sm font-semibold text-violet-600 hover:text-violet-800 hover:underline transition-colors"
          >
            #{bill.id}
          </button>
        </div>
        <StatusBadge status={bill.status} />
      </div>

      {/* ── Body: Bill Name + Dates + Amount ── */}
      <div className="px-5 pt-3 pb-0 flex-1 flex flex-col gap-3">
        {/* Bill name */}
        <h3 className="text-base font-bold text-slate-800 leading-snug">{bill.name}</h3>

        {/* Dates */}
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

        {/* Amount Due row */}
        <div className="flex items-end justify-between pb-1">
          {/* Left: Amount Due */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Amount Due</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{fmt(bill.amount)}</span>
          </div>

          {/* Right: Overdue Charge (only when applicable) */}
          {bill.overdueCharge && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-semibold text-red-500 uppercase tracking-widest flex items-center gap-1">
                <Warning size={10} weight="fill" /> Overdue Charge
              </span>
              <span className="text-base font-bold text-red-600">+ {fmt(bill.overdueCharge)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 mt-3 border-t border-slate-100" />

      {/* ── Footer: Download PDF ── */}
      <div className="px-5 py-3 flex justify-end">
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <DownloadSimple size={14} />
          Download Bill PDF
        </button>
      </div>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-sm text-slate-500 leading-snug">{value}</p>
    </div>
  );
}

function CustomerInfoPanel() {
  const c = CUSTOMER;
  const isOrg = c.type === 'organization';

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
          <InfoRow label="Customer ID" value={c.id} />
          <InfoRow label="Name" value={c.name} />
          <InfoRow label="Email address" value={c.email} />
          <InfoRow label="Phone" value={c.phone} />
          <InfoRow label="Address" value={c.address} />
          <InfoRow label="VAT Status" value={c.vatStatus} />
          <InfoRow label="Withholding Tax" value={c.withholdingTax} />
          <InfoRow label="TIN" value={c.tin} />

          {/* Primary Contact (org only) */}
          {isOrg && c.primaryContact && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Contact</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-slate-800">{c.primaryContact.name}</p>
                <p className="text-sm text-slate-500">{c.primaryContact.position}</p>
              </div>
              <InfoRow label="Email" value={c.primaryContact.email} />
              <InfoRow label="Phone" value={c.primaryContact.phone} />
            </div>
          )}

          {/* Other Contacts (org only) */}
          {isOrg && c.otherContacts && c.otherContacts.length > 0 && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Other Contacts</p>
              {c.otherContacts.map((oc, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-slate-800">{oc.name}</p>
                    <p className="text-sm text-slate-500">{oc.position}</p>
                  </div>
                  <InfoRow label="Email" value={oc.email} />
                  <InfoRow label="Phone" value={oc.phone} />
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

function Stepper({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Select Bill' },
    { n: 2, label: 'Confirm Payment' },
    { n: 3, label: 'Payment Submitted' },
  ];
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
      {/* Logo */}
      <img src={mochiLogo} alt="Mochi" className="h-7 w-auto" />

      {/* Progress heading */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</h2>
        <ol className="flex flex-col gap-5">
          {steps.map(({ n, label }) => {
            const done = step > n;
            const active = step === n;
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
                  done ? 'text-violet-600 font-medium' : active ? 'text-violet-700 font-semibold' : 'text-slate-400',
                ].join(' ')}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

// ─── Access Portal ────────────────────────────────────────────────────────────

function AccessPortal({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect PIN. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 w-full max-w-sm flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
          <Lock size={26} className="text-violet-600" weight="duotone" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">Customer Payment Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your PIN to access your payment portal.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access PIN</label>
            <input
              type="password"
              maxLength={4}
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              className={[
                'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors',
                error
                  ? 'border-red-300 focus:ring-red-200 bg-red-50'
                  : 'border-slate-300 focus:ring-violet-200',
              ].join(' ')}
            />
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <Warning size={13} weight="fill" /> {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={pin.length === 0}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Access Portal
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center">
          Need help? Contact{' '}
          <a href="mailto:support@metroviewhomes.com" className="text-violet-600 hover:underline">
            support@metroviewhomes.com
          </a>
        </p>
      </div>
      <p className="mt-6 text-xs text-slate-400">Metroview Homes &amp; Realty — Secure Payment Portal</p>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ selected, onToggle, showError, onContinue }: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  showError: boolean;
  onContinue: () => void;
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

  const filtered = BILLS.filter((b) => {
    const matchSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch && applyFilters(b);
  });

  const payableBills = BILLS.filter(isPayable);
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
        {/* Center content column (scroll area + sticky footer) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-8 flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Select Bills to Pay</h1>
              <p className="text-sm text-slate-500 mt-0.5">Choose one or more bills below to proceed with payment.</p>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
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
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
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

            {/* Top Summary */}
            <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex items-center justify-between">
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
                className="px-6 py-2 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Error banner */}
            {showError && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <Warning size={16} weight="fill" className="shrink-0" />
                Please select at least one bill to continue.
              </div>
            )}

            {/* Bill cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </div>

          {/* Sticky footer — fixed within the middle content area */}
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
        <CustomerInfoPanel />
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

function Step2({ selected, method, setMethod, onSubmitRedirect, onUploadSuccess, onPrevious }: {
  selected: Set<string>;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  onSubmitRedirect: () => void;
  onUploadSuccess: () => void;
  onPrevious: () => void;
}) {
  const selectedBills = BILLS.filter((b) => selected.has(b.id));

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
              {PAYMENT_METHODS.map((opt) => (
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

      {/* Right: Payment Breakdown */}
      <aside className="w-72 shrink-0 bg-white border-l border-slate-200 overflow-y-auto">
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
      </aside>
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
          A confirmation email with your bill details has been sent to {CUSTOMER.email}.
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomerPaymentPortalPage() {
  const [appState, setAppState] = useState<AppState>('access');
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [gatewayStage, setGatewayStage] = useState<'idle' | 'modal' | 'checkout'>('idle');
  const [showStep1Error, setShowStep1Error] = useState(false);

  const selectedBills = BILLS.filter((b) => selected.has(b.id));
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

  if (appState === 'access') {
    return <AccessPortal onSuccess={() => setAppState('portal')} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
        <h1 className="text-sm font-semibold text-slate-700">Customer Payment Portal</h1>
        <span className="ml-2 text-xs text-slate-400">— {CUSTOMER.name}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Stepper step={step} />
        {step === 1 && <Step1 selected={selected} onToggle={toggle} showError={showStep1Error} onContinue={handleStep1Continue} />}
        {step === 2 && (
          <Step2
            selected={selected}
            method={method}
            setMethod={setMethod}
            onSubmitRedirect={() => setGatewayStage('modal')}
            onUploadSuccess={() => setStep(3)}
            onPrevious={() => setStep(1)}
          />
        )}
        {step === 3 && <Step3 selected={selected} total={total} method={method} onBackToPortal={handleBackToPortal} />}
      </div>

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
