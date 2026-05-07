export type BillStatus = 'paid' | 'unpaid' | 'overdue' | 'draft';
export type BillType   = 'one-time' | 'recurring' | 'installment';

export interface Bill {
  id: string;
  customerId: string;
  title: string;
  type: BillType;
  status: BillStatus;
  amount: number;
  dateIssued: string;
  dueDate: string;
}

export const BILLS: Bill[] = [
  // ── Square C LLC (CST-2025-0249) ─────────────────────────────────────────
  {
    id: 'BLL-2025-0021',
    customerId: 'CST-2025-0249',
    title: 'Monthly Association Dues – August 2025',
    type: 'recurring',
    status: 'paid',
    amount: 18500,
    dateIssued: 'Aug 01, 2025',
    dueDate: 'Aug 31, 2025',
  },
  {
    id: 'BLL-2025-0018',
    customerId: 'CST-2025-0249',
    title: 'Monthly Association Dues – July 2025',
    type: 'recurring',
    status: 'paid',
    amount: 18500,
    dateIssued: 'Jul 01, 2025',
    dueDate: 'Jul 31, 2025',
  },
  {
    id: 'BLL-2025-0031',
    customerId: 'CST-2025-0249',
    title: 'Parking Slot Lease – Q3 2025',
    type: 'one-time',
    status: 'overdue',
    amount: 24000,
    dateIssued: 'Jul 15, 2025',
    dueDate: 'Aug 15, 2025',
  },
  {
    id: 'BLL-2025-0034',
    customerId: 'CST-2025-0249',
    title: 'Monthly Association Dues – September 2025',
    type: 'recurring',
    status: 'unpaid',
    amount: 18500,
    dateIssued: 'Sep 01, 2025',
    dueDate: 'Sep 30, 2025',
  },
  {
    id: 'BLL-2025-0037',
    customerId: 'CST-2025-0249',
    title: 'Facade Repair Assessment',
    type: 'one-time',
    status: 'draft',
    amount: 55000,
    dateIssued: 'Sep 10, 2025',
    dueDate: 'Oct 10, 2025',
  },

  // ── Daniel Rivera (CST-2025-0248) ────────────────────────────────────────
  {
    id: 'BLL-2025-0010',
    customerId: 'CST-2025-0248',
    title: 'Monthly Condo Dues – August 2025',
    type: 'recurring',
    status: 'paid',
    amount: 7200,
    dateIssued: 'Aug 01, 2025',
    dueDate: 'Aug 15, 2025',
  },
  {
    id: 'BLL-2025-0022',
    customerId: 'CST-2025-0248',
    title: 'Water Utility Charges – July 2025',
    type: 'one-time',
    status: 'paid',
    amount: 1850,
    dateIssued: 'Jul 28, 2025',
    dueDate: 'Aug 10, 2025',
  },
  {
    id: 'BLL-2025-0035',
    customerId: 'CST-2025-0248',
    title: 'Monthly Condo Dues – September 2025',
    type: 'recurring',
    status: 'unpaid',
    amount: 7200,
    dateIssued: 'Sep 01, 2025',
    dueDate: 'Sep 15, 2025',
  },

  // ── Grace Lim (CST-2025-0247) ────────────────────────────────────────────
  {
    id: 'BLL-2025-0007',
    customerId: 'CST-2025-0247',
    title: 'Monthly HOA Dues – August 2025',
    type: 'recurring',
    status: 'paid',
    amount: 5400,
    dateIssued: 'Aug 01, 2025',
    dueDate: 'Aug 20, 2025',
  },
  {
    id: 'BLL-2025-0019',
    customerId: 'CST-2025-0247',
    title: 'Landscaping Special Assessment',
    type: 'installment',
    status: 'overdue',
    amount: 12000,
    dateIssued: 'Jun 15, 2025',
    dueDate: 'Jul 15, 2025',
  },
  {
    id: 'BLL-2025-0033',
    customerId: 'CST-2025-0247',
    title: 'Monthly HOA Dues – September 2025',
    type: 'recurring',
    status: 'unpaid',
    amount: 5400,
    dateIssued: 'Sep 01, 2025',
    dueDate: 'Sep 20, 2025',
  },

  // ── Meridian Properties Inc. (CST-2025-0246) ─────────────────────────────
  {
    id: 'BLL-2025-0003',
    customerId: 'CST-2025-0246',
    title: 'Office Tower Lease – Q3 2025',
    type: 'recurring',
    status: 'paid',
    amount: 320000,
    dateIssued: 'Jul 01, 2025',
    dueDate: 'Jul 10, 2025',
  },
  {
    id: 'BLL-2025-0012',
    customerId: 'CST-2025-0246',
    title: 'Common Area Maintenance – August 2025',
    type: 'recurring',
    status: 'paid',
    amount: 45000,
    dateIssued: 'Aug 01, 2025',
    dueDate: 'Aug 10, 2025',
  },
  {
    id: 'BLL-2025-0028',
    customerId: 'CST-2025-0246',
    title: 'Elevator Modernization Installment 2 of 6',
    type: 'installment',
    status: 'overdue',
    amount: 80000,
    dateIssued: 'Aug 05, 2025',
    dueDate: 'Aug 20, 2025',
  },
  {
    id: 'BLL-2025-0036',
    customerId: 'CST-2025-0246',
    title: 'Office Tower Lease – Q4 2025',
    type: 'recurring',
    status: 'unpaid',
    amount: 320000,
    dateIssued: 'Sep 01, 2025',
    dueDate: 'Oct 01, 2025',
  },

  // ── Juan Dela Cruz (CST-2025-0245) ───────────────────────────────────────
  {
    id: 'BLL-2025-0009',
    customerId: 'CST-2025-0245',
    title: 'Monthly Dues – August 2025',
    type: 'recurring',
    status: 'paid',
    amount: 3800,
    dateIssued: 'Aug 01, 2025',
    dueDate: 'Aug 15, 2025',
  },
  {
    id: 'BLL-2025-0030',
    customerId: 'CST-2025-0245',
    title: 'Monthly Dues – September 2025',
    type: 'recurring',
    status: 'unpaid',
    amount: 3800,
    dateIssued: 'Sep 01, 2025',
    dueDate: 'Sep 15, 2025',
  },

  // ── Liza Gomez (CST-2025-0244) ───────────────────────────────────────────
  {
    id: 'BLL-2025-0014',
    customerId: 'CST-2025-0244',
    title: 'Penthouse Suite Dues – August 2025',
    type: 'recurring',
    status: 'paid',
    amount: 22000,
    dateIssued: 'Aug 01, 2025',
    dueDate: 'Aug 10, 2025',
  },
  {
    id: 'BLL-2025-0026',
    customerId: 'CST-2025-0244',
    title: 'Gym & Amenity Access – Q3 2025',
    type: 'one-time',
    status: 'paid',
    amount: 8500,
    dateIssued: 'Jul 01, 2025',
    dueDate: 'Jul 15, 2025',
  },
  {
    id: 'BLL-2025-0038',
    customerId: 'CST-2025-0244',
    title: 'Penthouse Suite Dues – September 2025',
    type: 'recurring',
    status: 'draft',
    amount: 22000,
    dateIssued: 'Sep 01, 2025',
    dueDate: 'Sep 10, 2025',
  },
];

export function getBillsByCustomer(customerId: string): Bill[] {
  return BILLS.filter((b) => b.customerId === customerId);
}

export function formatPeso(amount: number): string {
  return '₱ ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
