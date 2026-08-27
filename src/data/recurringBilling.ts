import { formatPeso } from '#/data/bills';

export { formatPeso };

// ─── Recurring cycles — the schedule/template itself (customer, line items,
// amount, and whether it's currently active/paused/etc). Each cycle
// generates individual recurring bills over time (see RECURRING_BILLS
// below) — the cycle is the rule, the bills are what it produces. ──

export type RecurringCycleStatus = 'active' | 'draft' | 'completed' | 'paused' | 'cancelled' | 'archived';

export interface RecurringCycle {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  customerInitials: string;
  customerAvatarColor: string;
  lineItems: string[];
  amount: number;
}

export const RECURRING_CYCLES: RecurringCycle[] = [
  {
    id: 'RC-000002',
    name: 'Monthly Rent Invoice',
    customerId: 'CST-1002',
    customerName: 'Block 101 Hobbies Store',
    customerInitials: 'BH',
    customerAvatarColor: '#0f172a',
    lineItems: ['Property Rental'],
    amount: 20500,
  },
  {
    id: 'RC-000003',
    name: 'Association Dues Billing',
    customerId: 'CST-1003',
    customerName: 'Ana Jane B. Argoncilla',
    customerInitials: 'AA',
    customerAvatarColor: '#334155',
    lineItems: ['HOA/Condo Dues'],
    amount: 50500,
  },
  {
    id: 'RC-000004',
    name: 'Water Refilling Supply Contract',
    customerId: 'CST-1004',
    customerName: 'Mark Anthony D. Santos',
    customerInitials: 'MS',
    customerAvatarColor: '#334155',
    lineItems: ['Water supply service'],
    amount: 3500,
  },
  {
    id: 'RC-000005',
    name: 'Electricity Consumption Billing',
    customerId: 'CST-1005',
    customerName: 'Jhuniefer S. Esmeralda',
    customerInitials: 'JE',
    customerAvatarColor: '#be185d',
    lineItems: ['Power Utility'],
    amount: 3000,
  },
  {
    id: 'RC-000006',
    name: 'Parking Slot Rental',
    customerId: 'CST-1006',
    customerName: 'ACME Toys and Collectibles',
    customerInitials: 'AT',
    customerAvatarColor: '#0ea5e9',
    lineItems: ['Parking Lease'],
    amount: 2500,
  },
  {
    id: 'RC-000007',
    name: 'Water Billing Statement',
    customerId: 'CST-1007',
    customerName: 'John Joseph B. Ramos',
    customerInitials: 'JR',
    customerAvatarColor: '#334155',
    lineItems: ['Water Utility'],
    amount: 550,
  },
  {
    id: 'RC-000008',
    name: 'Clearing sale - Beauty & Health',
    customerId: 'CST-1008',
    customerName: 'Esmeralda C. Concepcion-Ang',
    customerInitials: 'EC',
    customerAvatarColor: '#be185d',
    lineItems: ['Building Maintenance'],
    amount: 8500,
  },
  {
    id: 'RC-000009',
    name: 'Parking Slot Rental',
    customerId: 'CST-1009',
    customerName: 'Arnold James R. Mercado',
    customerInitials: 'AM',
    customerAvatarColor: '#334155',
    lineItems: ['Parking Lease'],
    amount: 2500,
  },
  {
    id: 'RC-000010',
    name: 'Equipment Lease Billing',
    customerId: 'CST-1010',
    customerName: 'Simon Benedict D. Lee',
    customerInitials: 'SL',
    customerAvatarColor: '#334155',
    lineItems: ['Equipment Rental'],
    amount: 11588,
  },
  {
    id: 'RC-000011',
    name: 'Water Refilling Supply Contract',
    customerId: 'CST-1011',
    customerName: 'Iya Marie D. Carandang',
    customerInitials: 'IC',
    customerAvatarColor: '#be185d',
    lineItems: ['Water supply service'],
    amount: 3500,
  },
  {
    id: 'RC-000012',
    name: 'New Client Onboarding Retainer',
    customerId: 'CST-1012',
    customerName: 'Grace Lim',
    customerInitials: 'GL',
    customerAvatarColor: '#be185d',
    lineItems: ['Onboarding Retainer'],
    amount: 15000,
  },
  {
    id: 'RC-000013',
    name: 'Draft Service Plan',
    customerId: 'CST-1013',
    customerName: 'Square C LLC',
    customerInitials: 'SC',
    customerAvatarColor: '#3b82f6',
    lineItems: ['Service Plan'],
    amount: 9800,
  },
];

// Status per cycle — kept alongside (rather than on the object above) so the
// mapping is easy to scan/adjust in one place while iterating on the demo
// dataset.
export const RECURRING_CYCLE_STATUS: Record<string, RecurringCycleStatus> = {
  'RC-000002': 'completed',
  'RC-000003': 'paused',
  'RC-000004': 'cancelled',
  'RC-000005': 'active',
  'RC-000006': 'active',
  'RC-000007': 'active',
  'RC-000008': 'active',
  'RC-000009': 'active',
  'RC-000010': 'paused',
  'RC-000011': 'paused',
  'RC-000012': 'draft',
  'RC-000013': 'draft',
};

// ─── Recurring bills — the individual bills a recurring cycle has generated
// so far. Same shape/spirit as the one-off Bill model in bills.ts, just
// scoped to "which cycle produced this bill". ──

export type RecurringBillStatus =
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'verifying'
  | 'paid'
  | 'overdue'
  | 'void'
  | 'partially-paid'
  | 'archived';

export interface RecurringBillRow {
  id: string;
  cycleId: string;
  billName: string;
  amount: number;
  billDate: string;
  dueDate: string;
  customerName: string;
  customerInitials: string;
  customerAvatarColor: string;
  status: RecurringBillStatus;
  // Only meaningful while `status === 'overdue'` — drives the Payment
  // Management penalty calculation on the Recurring Bill Info page, same
  // role `daysOutstanding` plays on the one-off Bill model in bills.ts.
  // A mock/authored value (not computed from a live "today"), same
  // convention as bills.ts.
  daysOutstanding?: number;
}

// Shared status pill config — same visual language as the Bills table's own
// status badges (bordered rounded-full pill). Exported so both the
// Recurring Bills table and its detail page (Recurring Bill Info) render
// the exact same label/color per status instead of two copies drifting
// apart.
export const RECURRING_BILL_STATUS_CFG: Record<RecurringBillStatus, { label: string; className: string }> = {
  draft:            { label: 'Draft',           className: 'bg-slate-50 text-slate-600 border-slate-300' },
  scheduled:        { label: 'Scheduled',       className: 'bg-amber-50 text-amber-700 border-amber-300' },
  sent:             { label: 'Sent',            className: 'bg-violet-50 text-violet-700 border-violet-300' },
  verifying:        { label: 'Verifying',       className: 'bg-amber-50 text-amber-700 border-amber-300' },
  paid:             { label: 'Paid',            className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  overdue:          { label: 'Overdue',         className: 'bg-red-50 text-red-700 border-red-300' },
  void:             { label: 'Void',            className: 'bg-slate-50 text-slate-400 border-slate-300' },
  'partially-paid': { label: 'Partially paid', className: 'bg-orange-50 text-orange-700 border-orange-300' },
  archived:         { label: 'Archived',        className: 'bg-slate-50 text-slate-400 border-slate-300' },
};

// Each helper below builds its rows without an `id` — bill IDs aren't
// assigned per-cycle/per-helper, but as one flat "RCBT-XXXXXX" sequence
// across the fully combined list (see RECURRING_BILLS at the bottom), so
// every recurring bill shares a single, consistently-numbered ID scheme
// regardless of which cycle produced it.
type RecurringBillDraft = Omit<RecurringBillRow, 'id'>;

function waterBillingRows(): RecurringBillDraft[] {
  const statuses: RecurringBillStatus[] = ['sent', 'overdue', 'verifying', 'scheduled', 'scheduled', 'scheduled', 'scheduled', 'scheduled', 'scheduled', 'scheduled'];
  return statuses.map((status) => ({
    cycleId: 'RC-000001',
    billName: 'Water Billing Statement',
    amount: 250,
    billDate: 'Aug 10, 2025',
    dueDate: 'Sep 10, 2025',
    customerName: 'Square C LLC',
    customerInitials: 'SC',
    customerAvatarColor: '#3b82f6',
    status,
    daysOutstanding: status === 'overdue' ? 18 : 0,
  }));
}

function rentInvoiceRows(): RecurringBillDraft[] {
  const statuses: RecurringBillStatus[] = ['paid', 'overdue', 'scheduled', 'scheduled', 'scheduled', 'scheduled'];
  return statuses.map((status) => ({
    cycleId: 'RC-000002',
    billName: 'Monthly Rent Invoice',
    amount: 20500,
    billDate: 'Jul 30, 2025',
    dueDate: 'Aug 30, 2025',
    daysOutstanding: status === 'overdue' ? 12 : 0,
    customerName: 'Block 101 Hobbies Store',
    customerInitials: 'BH',
    customerAvatarColor: '#0f172a',
    status,
  }));
}

function draftPlanRows(): RecurringBillDraft[] {
  return [
    {
      cycleId: 'RC-000013',
      billName: 'Draft Service Plan',
      amount: 9800,
      billDate: 'Sep 05, 2025',
      dueDate: 'Oct 05, 2025',
      customerName: 'Square C LLC',
      customerInitials: 'SC',
      customerAvatarColor: '#3b82f6',
      status: 'draft',
    },
  ];
}

function voidedContractRows(): RecurringBillDraft[] {
  return [
    {
      cycleId: 'RC-000004',
      billName: 'Water Refilling Supply Contract',
      amount: 3500,
      billDate: 'Jun 12, 2025',
      dueDate: 'Jul 12, 2025',
      customerName: 'Mark Anthony D. Santos',
      customerInitials: 'MS',
      customerAvatarColor: '#334155',
      status: 'void',
    },
  ];
}

function partiallyPaidRows(): RecurringBillDraft[] {
  return [
    {
      cycleId: 'RC-000003',
      billName: 'Association Dues Billing',
      amount: 50500,
      billDate: 'Jul 01, 2025',
      dueDate: 'Aug 01, 2025',
      customerName: 'Ana Jane B. Argoncilla',
      customerInitials: 'AA',
      customerAvatarColor: '#334155',
      status: 'partially-paid',
    },
  ];
}

const RECURRING_BILL_DRAFTS: RecurringBillDraft[] = [
  ...waterBillingRows(),
  ...rentInvoiceRows(),
  ...draftPlanRows(),
  ...voidedContractRows(),
  ...partiallyPaidRows(),
];

export const RECURRING_BILLS: RecurringBillRow[] = RECURRING_BILL_DRAFTS.map((bill, i) => ({
  ...bill,
  id: `RCBT-${String(i + 1).padStart(6, '0')}`,
}));
