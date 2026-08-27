import { useState } from 'react';
import {
  CaretRight,
  SidebarSimple,
  DotsThreeVertical,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  ClockCounterClockwise,
  CalendarBlank,
  CaretDown,
} from '@phosphor-icons/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Card, CardHeader, CardTitle, CardContent } from '#/components/atoms/Card';
import { Checkbox } from '#/components/atoms/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '#/components/atoms/Dialog';
import { cn } from '#/components/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#/components/atoms/DropdownMenu';
import { Tabs, TabsList, TabsTrigger } from '#/components/molecules/Tabs';
import { BILLS, formatPeso, type BillStatus } from '#/data/bills';
import { CUSTOMERS } from '#/data/customers';
import { usePenaltySettings, computePenalty, type RepeatUnit } from '#/data/penaltySettings';
import { resetAuditLog, pushAuditEntry, type AuditEntry } from '#/data/billAuditLog';
import { formatNumberToOrdinal } from '#/utils/formatters';

// ─── Status pill — mirrors STATUS_CFG in the Amount Breakdown / Manage
// Penalty page and the Bills list, so the same status reads identically
// everywhere it appears. ──
const STATUS_CFG: Record<BillStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-600 border-slate-300' },
  sent: { label: 'Sent', className: 'bg-violet-50 text-violet-700 border-violet-300' },
  scheduled: { label: 'Scheduled', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  verifying: { label: 'Verifying', className: 'bg-amber-50 text-amber-700 border-amber-300' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700 border-red-300' },
  void: { label: 'Void', className: 'bg-slate-50 text-slate-400 border-slate-300' },
  archived: { label: 'Archived', className: 'bg-slate-50 text-slate-400 border-slate-300' },
};

// The business issuing the bill — same profile already used as the default
// payment-instructions template in the Create Bill form, reused here for
// consistency rather than inventing a second company identity.
const BUSINESS_PROFILE = {
  name: 'Maplecrest Group Inc.',
  email: 'maplecrest@email.com',
  phone: '124-486-789',
  address: 'Barangay San Isidro, Quezon City, Metro Manila',
  addressLine1: '24 Amora Street',
};

const BILL_TYPE_LABEL: Record<string, string> = {
  'one-time': 'One-time',
  recurring: 'Recurring',
  installment: 'Installment',
};

const PAYMENT_INSTRUCTIONS =
  'The payment shall be made by way of cash, local cheque, or bank transfer to the following account details:';
const BANK_DETAILS = {
  bankName: 'BDO',
  accountName: 'Maplecrest Group Inc.',
  accountNumber: '1234567890',
  branch: 'Manila',
  swiftCode: 'BNORPHMM',
};

const NOTES =
  'Please settle your payment on or before the due date indicated above. Late payments may be subject to additional charges as outlined in your contract.';

// Demo proof-of-payment files — shown once a customer has submitted or
// completed payment. Not part of the Bill data model (no per-bill file
// storage exists yet), so these are illustrative placeholders.
const PROOF_FILES = [
  { name: 'Example receipt.pdf', size: '1MB', when: 'Just now', kind: 'pdf' as const },
  { name: 'Example picture.jpg', size: '1MB', when: '3 days ago', kind: 'image' as const },
];

// Addresses are stored as one comma-separated string. Rather than letting
// the browser wrap that single line wherever it runs out of width, split it
// into short, deliberate lines (two comma segments per line) — the same
// text flow used in the reference layout for the From/To address block.
function splitAddressLines(address: string): string[] {
  const segments = address.split(',').map((s) => s.trim()).filter(Boolean);
  const lines: string[] = [];
  for (let i = 0; i < segments.length; i += 2) {
    lines.push(segments.slice(i, i + 2).join(', '));
  }
  return lines;
}

export function BillInfoPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: '/_layout/billings/$id/info' });
  const bill = BILLS.find((b) => b.id === id) ?? BILLS.find((b) => b.status === 'overdue')!;
  const customer = CUSTOMERS.find((c) => c.id === bill.customerId);
  const status = STATUS_CFG[bill.status];

  const [activeTab, setActiveTab] = useState<'info' | 'preview'>('info');
  const [taxPct, setTaxPct] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);

  // ── Penalty Management — self-contained on this page (no navigation to
  // the Manage Penalty page), but its CALCULATION is not self-contained: it
  // reads the actual saved Settings → Overdue Payment Penalties
  // configuration via usePenaltySettings, so this card can never show a
  // calculation type, rate, or compounding behavior that conflicts with
  // what's actually saved there. There is only ONE penalty rule — it
  // applies to every bill regardless of that bill's own type ("Recurring"
  // is a bill category, never a separate penalty configuration).
  // Compounding is the only cadence a rule can have: with it off, the
  // charge applies exactly once; with it on, its own Compound Every period
  // drives recalculation — see computePenalty. This page's waivedTotal is
  // still its own local state — it does not read or write the Manage
  // Penalty page's state, since the two are separate, unconnected mock
  // pages with no shared backend in this app. ──
  const penaltySettings = usePenaltySettings();
  const isOverdueStatus = bill.status === 'overdue';
  const daysForPenalty = isOverdueStatus ? bill.daysOutstanding : 0;

  const activeRule = penaltySettings.penalty;
  const breakdown = computePenalty(bill, daysForPenalty, activeRule);

  const penaltyOccurrences = breakdown.occurrences;
  const occurrences = penaltyOccurrences.length;
  const autoPenalty = breakdown.total;
  const ruleEnabled = activeRule.enabled;
  const ruleType = activeRule.type;
  const ruleValue = activeRule.value;
  // The rule can only ever produce more than one occurrence when
  // Compounding is on — its own Compound Every period is the only cadence
  // that exists now.
  const hasSchedule = activeRule.compounding;
  const scheduleEvery = activeRule.compoundEvery;
  const scheduleUnit = activeRule.compoundUnit;
  // Every occurrence charges the identical flat amount UNLESS it's a
  // compounding percentage charge — a fixed amount is always flat, and a
  // non-compounding percentage is always a flat % of the original invoice
  // amount.
  const penaltyIsFlat = ruleType === 'fixed' || !activeRule.compounding;
  // Whether the waived-penalty copy should talk about "the penalty"
  // (singular) or "penalties" (plural, discrete repeats) — with
  // Compounding as the only cadence left, every state is conceptually ONE
  // continuously-evolving penalty, never several separate identical
  // charges.
  const isSingularFraming = !hasSchedule || activeRule.compounding;
  const [calcModalOpen, setCalcModalOpen] = useState(false);

  // "Every 7 days" / "Every 1 day" — shared by the chip label and the
  // calculation modal's structured "Applied" field, so the two never
  // phrase the same saved interval differently.
  function repeatFrequencyLabel(everyN: number, unit: RepeatUnit): string {
    const unitLabel = everyN === 1 ? unit.replace(/s$/, '').toLowerCase() : unit.toLowerCase();
    return `Every ${everyN} ${unitLabel}`;
  }

  // "every week" / "every 3 weeks" — the same interval, but phrased for a
  // sentence rather than a structured field: drops the "1" when the count
  // is one, since "every week" reads more naturally in prose than
  // "every 1 week" (the structured field above keeps the number for
  // scannability; this is only for explanatory copy).
  function naturalFrequencyPhrase(everyN: number, unit: RepeatUnit): string {
    if (everyN === 1) return `every ${unit.replace(/s$/, '').toLowerCase()}`;
    return `every ${everyN} ${unit.toLowerCase()}`;
  }

  // The calculation chip itself is just a static "Penalty Calculation"
  // label now (see JSX below); the modal it opens builds its own copy
  // directly from ruleType/ruleValue, which are still read from the one
  // saved rule that applies to this bill (by its own bill category), so
  // it can never drift out of sync with what Overdue Payment Penalties
  // actually says.

  // Per-occurrence sentence for the Recent Activity expand list and the
  // calculation modal's application history — phrased to match whichever
  // calculation type/compounding mode is actually saved, instead of
  // assuming a single flat percentage-of-original-amount rule.
  function describePenaltyOccurrence(occ: (typeof penaltyOccurrences)[number]): string {
    if (ruleType === 'fixed') {
      return activeRule.compounding
        ? `System automatically applied a fixed ${formatPeso(occ.amount)} penalty, added to the ${formatPeso(occ.base)} balance at the time.`
        : `System automatically applied a fixed ${formatPeso(occ.amount)} penalty.`;
    }
    return penaltyIsFlat
      ? `System automatically applied a ${formatPeso(occ.amount)} penalty (${ruleValue}% of ${formatPeso(occ.base)}).`
      : `System automatically applied a ${formatPeso(occ.amount)} penalty (${ruleValue}% of the ${formatPeso(occ.base)} overdue balance at the time).`;
  }

  // ── Audit Log — this page has no full Audit Log card of its own (only
  // the "Recent Activity" summary below), but its "View Audit Log" icon
  // opens the Manage Penalty page's Audit Log for this SAME bill id. That
  // log is now backed by the shared, persisted store in billAuditLog.ts —
  // so a waiver applied HERE needs to actually push into it, or the Audit
  // Log opened from here would never show it. Seeded fresh on every load
  // (matching "refreshing the main bill page starts a clean session"),
  // using the SAME action-string vocabulary the Manage Penalty page's own
  // describeAuditEntry already recognizes ("Penalty applied (Nth
  // occurrence)", "Invoice became overdue", "Invoice created"), so entries
  // written from here render with the correct title/icon over there too.
  useState(() => {
    const seed: AuditEntry[] = [];
    [...penaltyOccurrences].reverse().forEach((occ) => {
      seed.push({
        ts: `${occ.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} · 8:00 AM`,
        actor: 'System',
        action: `Penalty applied (${formatNumberToOrdinal(occ.index)} occurrence)`,
        // Manually prefixed (not formatPeso, which inserts a space after ₱)
        // so the Manage Penalty page's describeAuditEntry regex can match it.
        detail:
          ruleType === 'fixed'
            ? `₱${occ.amount.toFixed(2)}`
            : `₱${occ.amount.toFixed(2)} — ${ruleValue}% of ₱${occ.base.toFixed(2)}`,
      });
    });
    if (isOverdueStatus) {
      seed.push({ ts: `${bill.dueDate} · 12:00 AM`, actor: 'System', action: 'Invoice became overdue' });
    }
    seed.push({ ts: `${bill.billDate} · 10:00 AM`, actor: 'Juan A. Dela Cruz', action: 'Invoice created' });
    resetAuditLog(bill.id, seed);
    return null;
  });

  function pushAudit(action: string, detail?: string) {
    pushAuditEntry(bill.id, action, detail);
  }

  const [waivedTotal, setWaivedTotal] = useState(0);
  // Rounded to the cent — plain float subtraction can leave a value like
  // 2172.1499999999996 instead of 2172.15, which then fails an inclusive
  // "amount <= currentPenalty" check even when the user enters the exact
  // displayed remaining balance. Rounding once here keeps every downstream
  // comparison (validation, isFullyWaived, the modal's remaining preview) safe.
  const currentPenalty = Math.round(Math.max(0, autoPenalty - waivedTotal) * 100) / 100;
  const isWaived = waivedTotal > 0;
  const isFullyWaived = isWaived && currentPenalty === 0;

  const [waiveOpen, setWaiveOpen] = useState(false);
  const [waiveAmount, setWaiveAmount] = useState('');
  const [waiveReason, setWaiveReason] = useState('');
  const [waiveErrors, setWaiveErrors] = useState({ amount: false, reason: false });
  const [waiverReason, setWaiverReason] = useState('');
  const [penaltyToast, setPenaltyToast] = useState<string | null>(null);

  // Recent Activity — only shown while the penalty is still active (not yet
  // waived at all), to give context on how the current accrued amount built
  // up. Once any waiver (full or partial) is applied, this section is
  // dropped entirely from the Penalty Management summary — the waiver
  // status/reason/amounts become the focus instead, and the complete history
  // (including the waiver action itself) stays available in the dedicated
  // Audit Log elsewhere on the bill page. Styled to match the Audit Log's
  // own timeline rows (icon, title, description, time/actor) so it reads as
  // a preview of that log rather than a different design.
  const recentActivity =
    isWaived || occurrences === 0
      ? null
      : hasSchedule
        ? {
            Icon: CalendarBlank,
            circleClass: 'bg-violet-100',
            iconClass: 'text-violet-600',
            title: `${occurrences} automatic penalty application${occurrences !== 1 ? 's' : ''}`,
            description: penaltyIsFlat
              ? `${formatPeso(penaltyOccurrences[0].amount)} applied each time — ${occurrences} occurrence${occurrences !== 1 ? 's' : ''} so far.`
              : `${formatPeso(autoPenalty)} applied so far across ${occurrences} compounding occurrence${occurrences !== 1 ? 's' : ''}.`,
            time: '8:00 AM',
            actor: 'System',
            expandable: true,
          }
        : {
            Icon: CalendarBlank,
            circleClass: 'bg-violet-100',
            iconClass: 'text-violet-600',
            title: 'Penalty applied once',
            description: `${formatPeso(autoPenalty)} charged when this invoice became overdue.`,
            time: '8:00 AM',
            actor: 'System',
            expandable: false,
          };
  const [recentActivityExpanded, setRecentActivityExpanded] = useState(false);

  // Waive Penalty — one unified flow for lowering the remaining penalty,
  // whether this is the very FIRST waiver against an untouched penalty or a
  // further one against whatever's already left after a prior waiver. Every
  // waiver (full or partial) is final: there's no "undo" or "edit" of a
  // past waiver, only additional waivers going forward, applied repeatedly
  // as long as some penalty still remains — each one its own final action,
  // logged as its own audit entry rather than rewriting/combining prior
  // ones. Whether a given waiver counts as "fully" or "partially" waived is
  // decided purely by the amount entered, never by an explicit up-front
  // choice — see confirmWaive below.
  function openWaive() {
    setWaiveAmount('');
    setWaiveReason('');
    setWaiveErrors({ amount: false, reason: false });
    setWaiveOpen(true);
  }

  function showPenaltyToast(message: string) {
    setPenaltyToast(message);
    setTimeout(() => setPenaltyToast(null), 3000);
  }

  // One-click shortcut for waiving the entire remaining penalty, without
  // making the user retype the exact figure shown above. It just populates
  // the same field Confirm already reads from — no separate flow.
  function handleWaiveFullAmount() {
    setWaiveAmount(currentPenalty.toFixed(2));
    setWaiveErrors((prev) => ({ ...prev, amount: false }));
  }

  // Rounding to the cent before comparing keeps "enter the exact remaining
  // amount" reliably valid even though currentPenalty and the parsed input
  // are both floats that can otherwise differ by a fraction of a centavo.
  const waiveAmountNum = Math.round((Number(waiveAmount) || 0) * 100) / 100;
  const isWaiveAmountValid = waiveAmount.trim() !== '' && waiveAmountNum > 0 && waiveAmountNum <= currentPenalty;
  const remainingAfterWaive = Math.max(0, Math.round((currentPenalty - waiveAmountNum) * 100) / 100);
  const isWaiveConfirmDisabled = !isWaiveAmountValid || waiveReason.trim() === '';

  function confirmWaive() {
    const amount = waiveAmountNum;
    const reasonInvalid = waiveReason.trim() === '';
    // Cannot exceed the remaining penalty — waiving all the way to ₱0 is
    // allowed (that's just how a partial waiver becomes a full one), it's
    // only waiving MORE than what's left that isn't.
    const amountInvalid = !isWaiveAmountValid;
    if (reasonInvalid || amountInvalid) {
      setWaiveErrors({ amount: amountInvalid, reason: reasonInvalid });
      return;
    }
    const remaining = remainingAfterWaive;
    setWaivedTotal((prev) => prev + amount);
    setWaiverReason(waiveReason);

    if (isWaived) {
      // Already had a prior waiver — this is a further waiver against
      // whatever was left, regardless of whether it zeroes it out.
      pushAudit('Penalty reduced', `₱${amount.toFixed(2)} — ${waiveReason}`);
      showPenaltyToast(`${formatPeso(amount)} was waived from the remaining penalty. ${formatPeso(remaining)} penalty remains.`);
    } else if (remaining === 0) {
      pushAudit('Full penalty waived', `₱${amount.toFixed(2)} — ${waiveReason}`);
      showPenaltyToast(`Penalty waived in full — outstanding balance now ${formatPeso(bill.amount)}`);
    } else {
      pushAudit('Partial penalty waiver applied', `₱${amount.toFixed(2)} — ${waiveReason}`);
      showPenaltyToast(`₱${amount.toFixed(2)} waived — outstanding balance now ${formatPeso(bill.amount + remaining)}`);
    }
    setWaiveOpen(false);
  }

  // Line items aren't itemized in the Bill data model (only an aggregate
  // amount is stored), so the bill itself is rendered as a single line item —
  // matching how every bill in this app is created via the Create Bill form.
  // Subtotal is VAT-exclusive; tax and discount are both applied forward from
  // it, mirroring the Create Bill form's own tax/discount percentage inputs.
  const subtotal = bill.amount;
  const taxAmount = subtotal * (taxPct / 100);
  const discountAmount = subtotal * (discountPct / 100);
  const totalDue = Math.max(0, subtotal + taxAmount - discountAmount);

  const hasProofOfPayment = bill.status === 'verifying' || bill.status === 'paid';
  const isPendingReview = bill.status === 'verifying';
  const purchaseOrderId = `PO-2025-${bill.id.slice(-4)}`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Top bar — bare sidebar toggle on the left, account avatar on
           the right. No borders/background chrome, matching the reference. ── */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-4">
        <button className="px-4 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
          <SidebarSimple size={20} />
        </button>

        <span
          className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
          style={{ width: 32, height: 32, backgroundColor: '#6D41E8', fontSize: 12 }}
        >
          JD
        </span>
      </header>

      {/* ── Sub-header — page-specific row: back button + breadcrumb (Bill
           ID, not the bill's title/name), Info/Preview tabs, and this
           bill's actions. ── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 min-w-0 shrink-0">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="hover:text-slate-900 hover:underline transition-colors"
          >
            Dashboard
          </button>
          <CaretRight size={12} />
          <button
            onClick={() => navigate({ to: '/billings' })}
            className="hover:text-slate-900 hover:underline transition-colors"
          >
            Bills
          </button>
          <CaretRight size={12} />
          <span className="text-slate-900 font-medium truncate">{bill.id}</span>
        </nav>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'info' | 'preview')}
          className="shrink-0"
        >
          <TabsList className="min-w-60">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-10 h-10 flex items-center justify-center rounded-[8px] border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors outline-none">
              <DotsThreeVertical size={16} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" colorScheme="secondary" size="md" className="rounded-[8px]">
            Send reminder
          </Button>
          <Button colorScheme="primary" size="md" className="rounded-[8px]" onClick={() => navigate({ to: '/billings/create' })}>
            Edit bill
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          {activeTab === 'info' ? (
            <>
              {/* Penalty Management — a real quick-access action area, not
                  another penalty summary card: shows only the numbers that
                  don't exist anywhere else on this page (this invoice's
                  overdue-penalty rate/rule and current standing), then lets
                  the user act on them immediately. Waive Penalty opens a
                  fully self-contained dialog right here — no navigation.
                  View Audit Log is a lightweight icon button that opens the
                  Manage Penalty page's Audit Log in a new tab, since that
                  history lives there. Only relevant while overdue. */}
              {isOverdueStatus && (
                <Card className="rounded-[8px] shadow-none py-6 !gap-4">
                  <CardHeader className="!flex flex-row items-center justify-between gap-4 space-y-0 px-6">
                    <CardTitle className="text-[20px] font-semibold text-slate-900">Penalty Management</CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Waiving (full or partial) is final — there's no
                          Edit/Undo once applied. The action is always
                          "Waive Penalty", whether against an untouched
                          penalty or whatever's left after a prior waiver —
                          it just disappears once nothing remains to
                          waive. */}
                      {!isFullyWaived && (
                        <Button
                          size="md"
                          className="rounded-[8px] !bg-[#F4F3FF] hover:!bg-[#EBEAFD] text-black border border-slate-200 hover:border-slate-300 shadow-none"
                          onClick={openWaive}
                        >
                          Waive Penalty
                        </Button>
                      )}
                      <button
                        onClick={() => window.open(`/billings/${bill.id}/view?panel=audit-log`, '_blank')}
                        title="View Audit Log"
                        className="w-10 h-10 flex items-center justify-center rounded-[8px] border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        <ClockCounterClockwise size={18} />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6">
                    {/* One bordered container for the whole status area.
                        The calculation pill is absolutely positioned and
                        anchored flush to the container's own top-right
                        corner (not inline, not centered) — asymmetric
                        shape: a full curve on the left, square/flush on
                        the right, overflow-hidden on the wrapper so it
                        never pokes past the container's own rounded
                        corner. Outstanding balance is deliberately not
                        repeated here; it already lives in the Amount
                        Breakdown card below. */}
                    <div className={cn('relative overflow-hidden rounded-[8px] border border-slate-200', isWaived && 'bg-white')}>
                      <button
                        onClick={() => setCalcModalOpen(true)}
                        className="absolute top-2 right-0 z-10 inline-flex items-center gap-1.5 rounded-l-full border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 text-[12px] font-medium text-violet-700 transition-colors whitespace-nowrap"
                      >
                        Penalty Calculation
                        <CaretRight size={12} />
                      </button>

                      <div className="p-3">
                        {/* Undo Waiver now lives in the card header next to
                            Edit Waiver (see CardHeader above), so this block
                            is just the waiver status content — no side-by-
                            side row/button needed here anymore. */}
                        {isWaived && (
                          <div className="text-sm font-semibold text-emerald-700">
                            {isFullyWaived ? 'Fully waived' : 'Partially waived'}
                          </div>
                        )}
                        {isWaived && (
                          <p className="text-sm text-slate-900 leading-relaxed mt-1">
                            {isFullyWaived
                              ? `The ${formatPeso(waivedTotal)} penalty has been waived and will not be included in the amount due.`
                              : `The ${formatPeso(waivedTotal)} penalty has been waived; ${formatPeso(currentPenalty)} still remains included in the amount due.`}
                          </p>
                        )}
                        {isWaived && (
                          <p className="text-sm text-slate-900 leading-snug mt-1">
                            <span className="font-medium text-slate-900">Reason: </span>
                            {waiverReason}
                          </p>
                        )}

                        {/* Invoice amount vs. penalty — shown in all three
                            states, so the relationship between the two is
                            always clear at a glance. Whenever any amount has
                            been waived (full or partial), the original
                            accrued amount stays visible struck through —
                            fully waived pairs it with the waived amount
                            itself (never ₱0), partially waived pairs it with
                            the new reduced amount that's still due. */}
                        <div className={cn('flex flex-col gap-1 max-w-xs', isWaived && 'mt-2.5')}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-900">Invoice amount</span>
                            <span className="font-medium text-slate-900 tabular-nums">{formatPeso(bill.amount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-900">
                              {!isWaived ? 'Penalty accrued' : 'Penalty waived'}
                            </span>
                            <span className="flex items-baseline gap-2">
                              {!isWaived && (
                                <span className="font-medium text-slate-900 tabular-nums">{formatPeso(currentPenalty)}</span>
                              )}
                              {isWaived && isFullyWaived && (
                                <span className="font-medium text-slate-400 line-through tabular-nums">
                                  {formatPeso(waivedTotal)}
                                </span>
                              )}
                              {isWaived && !isFullyWaived && (
                                <>
                                  <span className="font-medium text-slate-400 line-through tabular-nums">
                                    {formatPeso(autoPenalty)}
                                  </span>
                                  <span className="font-medium text-slate-900 tabular-nums">{formatPeso(currentPenalty)}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Recent Activity — a single row, not a timeline,
                            styled to match the Audit Log's own timeline row
                            design (icon, title, description, time/actor) so
                            it reads as a preview of that log rather than a
                            different design. Content stays compact (12px
                            medium) since this is a secondary preview, not
                            the full log. Only the automatic-penalty case is
                            expandable (mirroring the Audit Log's own grouped
                            row) — a single waiver action has nothing further
                            to expand into. */}
                        {recentActivity && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent Activity</p>
                            <div className="flex gap-3">
                              <span className={cn('flex items-center justify-center w-8 h-8 rounded-full shrink-0', recentActivity.circleClass)}>
                                <recentActivity.Icon size={15} weight="bold" className={recentActivity.iconClass} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-slate-800 leading-snug">{recentActivity.title}</p>
                                    <p className="text-xs font-medium text-slate-500 mt-2 leading-snug">{recentActivity.description}</p>
                                    {recentActivity.expandable && (
                                      <>
                                        <button
                                          onClick={() => setRecentActivityExpanded((v) => !v)}
                                          className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 mt-1"
                                        >
                                          <CaretDown size={9} className={cn('transition-transform', recentActivityExpanded && 'rotate-180')} />
                                          {recentActivityExpanded ? 'Hide individual entries' : `Show all ${occurrences} entries`}
                                        </button>
                                        {recentActivityExpanded && (
                                          <div className="mt-2.5 space-y-2.5 border-l border-slate-100 pl-3">
                                            {penaltyOccurrences.map((occ, i) => (
                                              <div key={i}>
                                                <div className="flex items-baseline justify-between gap-3">
                                                  <p className="text-xs font-medium text-slate-600">Penalty Applied</p>
                                                  <span className="text-xs font-medium text-slate-400 shrink-0">
                                                    {occ.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} · 8:00 AM
                                                  </span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-400 mt-1 leading-snug">
                                                  {describePenaltyOccurrence(occ)}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-medium text-slate-700">{recentActivity.time}</p>
                                    <p className="text-xs font-medium text-slate-400">by {recentActivity.actor}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Proof of payment */}
              {hasProofOfPayment && (
                <Card className="rounded-[8px] shadow-none py-6 !gap-4">
                  <CardHeader className="!flex flex-row items-center justify-between gap-4 space-y-0 px-6">
                    <CardTitle className="text-[20px] font-semibold text-slate-900">Proof of payment</CardTitle>
                    {isPendingReview && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="md"
                          className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-none rounded-[8px]"
                        >
                          Decline
                        </Button>
                        <Button
                          size="md"
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-none rounded-[8px]"
                        >
                          Mark as paid
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 px-6">
                    {[
                      ...PROOF_FILES,
                      { name: bill.title, size: '3MB', when: bill.billDate, kind: 'image' as const },
                    ].map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center gap-3 border border-slate-200 rounded-[8px] px-4 py-3"
                      >
                        {file.kind === 'pdf' ? (
                          <div className="w-9 h-9 rounded-[8px] bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <FileText size={18} />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-violet-200 via-slate-200 to-slate-300 flex items-center justify-center text-white shrink-0 overflow-hidden">
                            <ImageIcon size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{file.size} · {file.when}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* From / To / Status — two columns: From+To stacked on the
                  left, Status+meta on the right. Labels are bold/black,
                  values are muted. */}
              <Card className="rounded-[8px] shadow-none py-6">
                <CardContent className="grid grid-cols-2 gap-16 px-6">
                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-sm font-medium text-slate-900 mb-1.5">From</p>
                      <div className="flex items-start gap-4">
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-600 text-white font-bold text-sm shrink-0">
                          {BUSINESS_PROFILE.name.charAt(0)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-violet-600">{BUSINESS_PROFILE.name}</p>
                          <p className="text-sm text-slate-900">{BUSINESS_PROFILE.email}</p>
                          <p className="text-sm text-slate-900 mt-2">{BUSINESS_PROFILE.phone}</p>
                          <p className="text-sm text-slate-900">{BUSINESS_PROFILE.addressLine1},</p>
                          {splitAddressLines(BUSINESS_PROFILE.address).map((line, i) => (
                            <p key={i} className="text-sm text-slate-900">{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900 mb-1.5">To</p>
                      <div className="flex items-start gap-4">
                        <span
                          className="flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold text-xs shrink-0"
                          style={{ backgroundColor: bill.customerAvatarColor }}
                        >
                          {bill.customerInitials}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-violet-600">{bill.customerName}</p>
                          {customer && (
                            <>
                              <p className="text-sm text-slate-900">{customer.email}</p>
                              <p className="text-sm text-slate-900 mt-2">{customer.phoneNumber}</p>
                              {splitAddressLines(customer.address).map((line, i) => (
                                <p key={i} className="text-sm text-slate-900">{line}</p>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">Status</p>
                        <button className="text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors">
                          Update status
                        </button>
                      </div>
                      {/* Same badge component as the Bills table's status column — fixed 88px width, no ad-hoc sizing. */}
                      <span className={`inline-flex items-center justify-center w-[88px] rounded-full border py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900">Bill type</p>
                      <p className="text-sm text-slate-900 mt-1">{BILL_TYPE_LABEL[bill.type]}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Bill ID</p>
                      <p className="text-sm text-slate-900 mt-1">{bill.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Purchase order ID</p>
                      <p className="text-sm text-slate-900 mt-1">{purchaseOrderId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Bill date</p>
                      <p className="text-sm text-slate-900 mt-1">{bill.billDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Due date</p>
                      <p className="text-sm text-slate-900 mt-1">{bill.dueDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line items */}
              <Card className="rounded-[8px] shadow-none py-6 !gap-4">
                <CardHeader className="px-6">
                  <CardTitle className="text-[20px] font-semibold text-slate-900">Line items</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5 px-6">
                  <div>
                    <div className="grid grid-cols-[1fr_60px_110px_110px] gap-4 text-sm text-slate-500 py-4 border-b border-slate-100">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Price</span>
                      <span className="text-right">Subtotal</span>
                    </div>
                    <div className="grid grid-cols-[1fr_60px_110px_110px] gap-4 items-start py-4 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{bill.title}</p>
                        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                          Professional services rendered in connection with this bill.
                        </p>
                      </div>
                      <span className="text-sm text-slate-600 text-center">1</span>
                      <span className="text-sm text-slate-600 text-right tabular-nums">{formatPeso(bill.amount)}</span>
                      <span className="text-sm font-medium text-slate-800 text-right tabular-nums">{formatPeso(bill.amount)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col max-w-xs ml-auto w-full">
                    <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                      <span className="text-slate-500">Subtotal <span className="text-slate-500">(VAT exclusive)</span></span>
                      <span className="text-slate-700 tabular-nums"><span className="text-slate-500">₱</span> {subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                      <span className="text-slate-500">Tax % (VAT)</span>
                      <div className="relative w-16">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={taxPct}
                          onChange={(e) => setTaxPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-full border-0 bg-transparent pr-5 py-1 text-sm text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-violet-200 focus:rounded-md transition-colors"
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-900">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                      <span className="text-slate-500">Discount %</span>
                      <div className="relative w-16">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={discountPct}
                          onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-full border-0 bg-transparent pr-5 py-1 text-sm text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-violet-200 focus:rounded-md transition-colors"
                        />
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-900">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                      <span className="text-slate-500">Tax amount</span>
                      <span className="text-slate-700 tabular-nums">
                        <span className="text-slate-500">₱</span> {taxAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                      <span className="text-slate-500">Discount amount</span>
                      <span className="text-slate-700 tabular-nums">
                        <span className="text-slate-500">₱</span> {discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                      <span className="text-slate-500">Total</span>
                      <span className="text-slate-700 tabular-nums"><span className="text-slate-500">₱</span> {totalDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between bg-violet-50 rounded-[8px] py-3 px-2 mt-1">
                      <span className="text-sm font-medium text-slate-800">Amount due</span>
                      <span className="text-[18px] font-medium text-violet-700 tabular-nums">
                        <span className="text-slate-500">₱</span> {totalDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment instructions */}
              <Card className="rounded-[8px] shadow-none py-6 !gap-4">
                <CardHeader className="px-6">
                  <CardTitle className="text-[20px] font-semibold text-slate-900">Payment instructions</CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <p className="text-sm text-slate-900 leading-relaxed">{PAYMENT_INSTRUCTIONS}</p>
                  <div className="mt-3 text-sm text-slate-900 leading-relaxed">
                    <p>Bank Name: {BANK_DETAILS.bankName}</p>
                    <p>Account Name: {BANK_DETAILS.accountName}</p>
                    <p>Account Number: {BANK_DETAILS.accountNumber}</p>
                    <p>Branch: {BANK_DETAILS.branch}</p>
                    <p>SWIFT Code: {BANK_DETAILS.swiftCode}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="rounded-[8px] shadow-none py-6 !gap-4">
                <CardHeader className="px-6">
                  <CardTitle className="text-[20px] font-semibold text-slate-900">Notes</CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <p className="text-sm text-slate-900 leading-relaxed">{NOTES}</p>
                </CardContent>
              </Card>

              {/* Supporting documents */}
              <Card className="rounded-[8px] shadow-none py-6 !gap-4">
                <CardHeader className="px-6">
                  <CardTitle className="text-[20px] font-semibold text-slate-900">Supporting documents</CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="flex items-center gap-3 border border-slate-200 rounded-[8px] px-4 py-3">
                    <div className="w-9 h-9 rounded-[8px] bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">example_attachment.pdf</p>
                      <p className="text-sm text-slate-500 mt-0.5">1MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            // ── Preview — a compact, read-only document rendering of the
            // same data above, distinct from Info's separated cards. ──
            <Card className="rounded-[8px] shadow-none">
              <CardContent className="flex flex-col gap-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{BUSINESS_PROFILE.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{BUSINESS_PROFILE.email}</p>
                    <p className="text-sm text-slate-500">{BUSINESS_PROFILE.addressLine1}, {BUSINESS_PROFILE.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900 tracking-tight">{bill.id}</p>
                    <p className="text-sm text-slate-500 mt-1">Billed {bill.billDate}</p>
                    <p className="text-sm text-slate-500">Due {bill.dueDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-100 py-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Bill to</p>
                    <p className="text-sm font-medium text-slate-800 mt-1">{bill.customerName}</p>
                    {customer && <p className="text-sm text-slate-500">{customer.address}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount due</p>
                    <p className="text-2xl font-bold text-violet-700 mt-1 tabular-nums">{formatPeso(totalDue)}</p>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-[1fr_60px_110px_110px] gap-4 text-xs text-slate-400 pb-2 border-b border-slate-100">
                    <span>Item</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Subtotal</span>
                  </div>
                  <div className="grid grid-cols-[1fr_60px_110px_110px] gap-4 py-3">
                    <span className="text-sm text-slate-700">{bill.title}</span>
                    <span className="text-sm text-slate-600 text-center">1</span>
                    <span className="text-sm text-slate-600 text-right tabular-nums">{formatPeso(bill.amount)}</span>
                    <span className="text-sm font-medium text-slate-800 text-right tabular-nums">{formatPeso(bill.amount)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{PAYMENT_INSTRUCTIONS} {BANK_DETAILS.bankName} · {BANK_DETAILS.accountName} · {BANK_DETAILS.accountNumber}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{NOTES}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      </div>

      {/* ── Waive Penalty dialog — the single, unified way to lower a
           bill's remaining penalty, whether this is the very first waiver
           or a further one against whatever's already left. Every waiver
           is final (no edit/undo), so the amount field always starts
           blank, and the remaining total updates live as the user types.
           Whether the result counts as "fully" or "partially" waived is
           decided purely by the amount entered — the "Waive full penalty"
           checkbox is just a shortcut that fills the field, not a
           separate mode; its own checked state simply reflects whether
           the current amount happens to equal the full remaining
           penalty. ── */}
      <Dialog open={waiveOpen} onOpenChange={setWaiveOpen}>
        <DialogContent className="max-w-md gap-0 p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-base font-semibold text-slate-900">Waive Penalty</DialogTitle>
            <p className="text-sm text-black leading-relaxed">
              Waive all or part of the remaining penalty. This action is final and cannot be undone.
            </p>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-600">Current remaining penalty</p>
              <p className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">{formatPeso(currentPenalty)}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Amount to waive</label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none">
                  <Checkbox
                    checked={waiveAmountNum > 0 && waiveAmountNum === currentPenalty}
                    onCheckedChange={(checked) => {
                      if (checked) handleWaiveFullAmount();
                      else { setWaiveAmount(''); setWaiveErrors((prev) => ({ ...prev, amount: false })); }
                    }}
                  />
                  Waive full penalty
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₱</span>
                <input
                  type="number"
                  min={0.01}
                  max={currentPenalty}
                  value={waiveAmount}
                  onChange={(e) => { setWaiveAmount(e.target.value); setWaiveErrors((prev) => ({ ...prev, amount: false })); }}
                  placeholder="Enter amount"
                  className={[
                    'w-full border rounded-lg pl-7 pr-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-200 transition-colors',
                    waiveErrors.amount ? 'border-red-300' : 'border-slate-200 focus:border-violet-400',
                  ].join(' ')}
                />
              </div>
              <p className={waiveErrors.amount ? 'text-xs text-red-500' : 'text-xs text-slate-400'}>
                Enter an amount between ₱0.01 and {formatPeso(currentPenalty)}.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-semibold text-slate-600">Remaining penalty</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatPeso(remainingAfterWaive)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={waiveReason}
                onChange={(e) => { setWaiveReason(e.target.value.slice(0, 500)); setWaiveErrors((prev) => ({ ...prev, reason: false })); }}
                placeholder="Enter reason..."
                rows={3}
                maxLength={500}
                className={[
                  'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-colors resize-none',
                  waiveErrors.reason ? 'border-red-300' : 'border-slate-200 focus:border-violet-400',
                ].join(' ')}
              />
              <div className="flex items-center justify-between">
                {waiveErrors.reason ? (
                  <p className="text-xs text-red-500">A reason is required.</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-slate-400 tabular-nums">{waiveReason.length} / 500</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 p-4">
            <Button variant="outline" size="md" onClick={() => setWaiveOpen(false)}>Cancel</Button>
            <Button colorScheme="primary" size="md" onClick={confirmWaive} disabled={isWaiveConfirmDisabled}>
              Confirm waiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Penalty calculation modal — always mirrors whatever is actually
           saved under Settings → Overdue Payment Penalties, never a
           hardcoded assumption. A single label/value grid instead of a
           separate "Total penalty" hero + boxed rule table: without
           Compounding it's Penalty rule/Applied ("Once"), Invoice
           amount/Penalty charged; with Compounding on it's Penalty
           rule/Frequency, Invoice amount/Penalty per application,
           Compounding/Total penalty accrued — driven entirely by
           `hasSchedule`, never by this bill's own type. Footer offers a
           real escape hatch to the fuller Manage Penalty page, alongside a
           plain Cancel to just close this read-only summary. ── */}
      <Dialog open={calcModalOpen} onOpenChange={setCalcModalOpen}>
        <DialogContent className="max-w-md gap-0 p-0">
          <DialogHeader className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {isWaived ? 'Penalty Details' : 'Penalty Calculation'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {!ruleEnabled ? (
              <p className="text-sm text-slate-500 leading-relaxed">
                No penalty rule is currently configured.
                Configure one under <span className="font-medium text-slate-700">Settings → Overdue Payment Penalties</span>.
              </p>
            ) : isWaived ? (
              // Once any waiver exists, the calculation history stops being
              // the point — Compounding/Applications/Total-charged are all
              // about how the ORIGINAL amount built up, which is no longer
              // what the reader needs. This view answers a narrower
              // question instead: what was the penalty before the waiver,
              // and what's actually still due now.
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Penalty rule</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {ruleType === 'percentage' ? `${ruleValue}% of invoice amount` : `${formatPeso(ruleValue)} fixed amount`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Applied</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {hasSchedule ? repeatFrequencyLabel(scheduleEvery, scheduleUnit) : 'Once'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Penalty before waiver</p>
                    <p className="font-medium text-slate-900 mt-0.5">{formatPeso(autoPenalty)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Penalty due</p>
                    <p className="font-medium text-slate-900 mt-0.5">{formatPeso(currentPenalty)}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isFullyWaived
                      ? isSingularFraming
                        ? `The ${formatPeso(autoPenalty)} penalty was fully waived. No penalty is included in the amount due.`
                        : `${formatPeso(autoPenalty)} in penalties was fully waived. No penalty is included in the amount due.`
                      : isSingularFraming
                        ? `The ${formatPeso(autoPenalty)} penalty was partially waived. ${formatPeso(currentPenalty)} still remains included in the amount due.`
                        : `${formatPeso(autoPenalty)} in penalties was partially waived. ${formatPeso(currentPenalty)} still remains included in the amount due.`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Penalty rule</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {ruleType === 'percentage' ? `${ruleValue}% of invoice amount` : `${formatPeso(ruleValue)} fixed amount`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Applied</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {hasSchedule ? repeatFrequencyLabel(scheduleEvery, scheduleUnit) : 'Once'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Invoice amount</p>
                    <p className="font-medium text-slate-900 mt-0.5">{formatPeso(bill.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{hasSchedule ? 'Penalty per application' : 'Penalty charged'}</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {formatPeso(hasSchedule ? (penaltyOccurrences[0]?.amount ?? 0) : autoPenalty)}
                    </p>
                  </div>
                  {hasSchedule && (
                    <>
                      <div>
                        <p className="text-xs text-slate-400">{activeRule.compounding ? 'Compounding' : 'Applications'}</p>
                        <p className="font-medium text-slate-900 mt-0.5">
                          {activeRule.compounding ? 'Enabled' : `${occurrences} time${occurrences !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Total penalty charged</p>
                        <p className="font-medium text-slate-900 mt-0.5">{formatPeso(autoPenalty)}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {!hasSchedule
                      ? `${formatPeso(autoPenalty)} was charged as the penalty for this overdue bill.`
                      : activeRule.compounding
                        ? ruleType === 'percentage'
                          ? 'Each penalty is calculated using the updated balance, so the amount charged increases over time.'
                          : 'Each penalty is added to the updated balance, so what’s owed increases over time, even though the charge itself stays the same.'
                        : ruleType === 'percentage'
                          ? `A ${ruleValue}% penalty of ${formatPeso(penaltyOccurrences[0]?.amount ?? 0)} is charged ${naturalFrequencyPhrase(scheduleEvery, scheduleUnit)} while the bill remains overdue. Each charge is based on the original invoice amount.`
                          : `A flat ${formatPeso(ruleValue)} penalty is charged ${naturalFrequencyPhrase(scheduleEvery, scheduleUnit)} while the bill remains overdue.`}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation toast — bottom-left, auto-dismisses. */}
      {penaltyToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
          {penaltyToast}
        </div>
      )}
    </div>
  );
}
