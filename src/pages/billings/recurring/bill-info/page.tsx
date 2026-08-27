import { useState } from 'react';
import {
  CaretRight,
  SidebarSimple,
  DotsThreeVertical,
  FileText,
  CalendarBlank,
  CaretDown,
  CheckCircle,
  ClockCounterClockwise,
  Warning,
  Info,
  type Icon,
} from '@phosphor-icons/react';
import { useNavigate, useParams, useLocation } from '@tanstack/react-router';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Checkbox } from '#/components/atoms/Checkbox';
import { Badge } from '#/components/atoms/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '#/components/atoms/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '#/components/atoms/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/atoms/Select';
import { cn } from '#/components/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#/components/atoms/DropdownMenu';
import { Tabs, TabsList, TabsTrigger } from '#/components/molecules/Tabs';
import { CUSTOMERS } from '#/data/customers';
import {
  RECURRING_BILLS,
  RECURRING_CYCLES,
  RECURRING_BILL_STATUS_CFG,
  formatPeso,
} from '#/data/recurringBilling';
import { usePenaltySettings, computePenalty, type RepeatUnit } from '#/data/penaltySettings';
import { formatNumberToOrdinal } from '#/utils/formatters';
import { useAuditLog, ensureAuditLogSeeded, resetAuditLog, pushAuditEntry, type AuditEntry } from '#/data/billAuditLog';

// Same "From" business identity used on the one-off Bill Info page — reused
// here rather than inventing a second company identity for recurring bills.
const BUSINESS_PROFILE = {
  name: 'Maplecrest Group Inc.',
  email: 'maplecrest@email.com',
  phone: '124-486-789',
  address: 'Barangay San Isidro, Quezon City, Metro Manila',
  addressLine1: '24 Amora Street',
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

// Same address-line splitting used on the one-off Bill Info page, so From/To
// blocks wrap identically here.
function splitAddressLines(address: string): string[] {
  const segments = address.split(',').map((s) => s.trim()).filter(Boolean);
  const lines: string[] = [];
  for (let i = 0; i < segments.length; i += 2) {
    lines.push(segments.slice(i, i + 2).join(', '));
  }
  return lines;
}

// A recurring bill only stores one aggregate `amount` — no itemized
// breakdown of its own. When the bill's cycle still exists and lists more
// than one named line item, the amount is split evenly across those names;
// otherwise it falls back to a single line item (the bill's own name), the
// same fallback the one-off Bill Info page uses for its un-itemized bills.
function buildLineItems(billName: string, amount: number, cycleLineItems: string[] | undefined) {
  const names = cycleLineItems && cycleLineItems.length > 0 ? cycleLineItems : [billName];
  const base = Math.floor((amount / names.length) * 100) / 100;
  return names.map((name, i) => ({
    name,
    price: i === names.length - 1 ? Math.round((amount - base * (names.length - 1)) * 100) / 100 : base,
  }));
}

function daysBetween(from: string, to: string): number | null {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

// ─── Audit Log — ported from the one-off Bill's Manage Penalty page
// (src/pages/billings/view/page.tsx), trimmed to the event types that
// actually occur on a recurring bill (no manual override/reset concept
// here — Payment Management only ever waives/undoes/edits a waiver).
// AuditEntry itself, and the actual storage/persistence, live in
// recurringBillAuditLog.ts — shared (not local) state, since the "View
// Audit Log" icon always opens this same bill in a NEW TAB, which needs
// to see activity from the tab where it actually happened. ──

type AuditKind = 'automatic' | 'waived-full' | 'waived-partial' | 'reduced' | 'overdue' | 'created' | 'other';

function describeAuditEntry(entry: AuditEntry): { title: string; sentence: string; kind: AuditKind; reason?: string } {
  const { action, detail = '', actor } = entry;
  let m: RegExpMatchArray | null;

  if ((m = action.match(/^Penalty applied \(([^)]+)\)$/i))) {
    const occurrence = m[1].replace(/\s*occurrence\s*$/i, '').trim();
    const d = detail.match(/^(₱[\d,.]+)\s*—\s*(\d+(?:\.\d+)?)%\s*of\s*(₱[\d,.]+)/);
    return {
      title: 'Penalty Applied',
      kind: 'automatic',
      sentence: d
        ? `System automatically applied a ${d[1]} penalty (${d[2]}% of ${d[3]}) as the ${occurrence} scheduled occurrence.`
        : `System automatically applied a penalty as the ${occurrence} scheduled occurrence.`,
    };
  }

  if (/^Full penalty waived$/i.test(action)) {
    const d = detail.match(/^(₱[\d,.]+)\s*—\s*(.*)$/);
    return {
      title: 'Penalty Waived',
      kind: 'waived-full',
      sentence: d ? `${actor} waived the full penalty of ${d[1]}.` : `${actor} waived the full penalty.`,
      reason: d?.[2],
    };
  }

  if (/^Partial penalty waiver applied$/i.test(action)) {
    const d = detail.match(/^(₱[\d,.]+)\s*—\s*(.*)$/);
    return {
      title: 'Penalty Partially Waived',
      kind: 'waived-partial',
      sentence: d ? `${actor} waived ${d[1]} of the penalty.` : `${actor} waived part of the penalty.`,
      reason: d?.[2],
    };
  }

  if (/^Penalty reduced$/i.test(action)) {
    const d = detail.match(/^(₱[\d,.]+)\s*—\s*(.*)$/);
    return {
      title: 'Penalty Reduced',
      kind: 'reduced',
      sentence: d ? `${actor} reduced the remaining penalty by ${d[1]}.` : `${actor} reduced the remaining penalty.`,
      reason: d?.[2],
    };
  }

  if (/^Bill became overdue$/i.test(action)) {
    return { title: 'Bill Overdue', kind: 'overdue', sentence: 'This bill passed its due date and started accruing late payment penalties.' };
  }

  if (/^Recurring bill generated$/i.test(action)) {
    return { title: 'Bill Generated', kind: 'created', sentence: `${actor} generated this bill from its recurring cycle.` };
  }

  // Fallback — guarantees every action type still renders, even if unrecognized.
  return { title: action, kind: 'other', sentence: detail };
}

const MANUAL_BADGE = { label: 'Manual', className: 'bg-slate-100 text-slate-600 border-slate-200' };

const AUDIT_VISUAL: Record<AuditKind, { Icon: Icon; circleClass: string; iconClass: string; badge?: { label: string; className: string } }> = {
  automatic: { Icon: CalendarBlank, circleClass: 'bg-violet-100', iconClass: 'text-violet-600' },
  'waived-full': { Icon: CheckCircle, circleClass: 'bg-emerald-500', iconClass: 'text-white', badge: MANUAL_BADGE },
  'waived-partial': { Icon: CheckCircle, circleClass: 'bg-emerald-500', iconClass: 'text-white', badge: MANUAL_BADGE },
  reduced: { Icon: CheckCircle, circleClass: 'bg-emerald-500', iconClass: 'text-white', badge: MANUAL_BADGE },
  overdue: { Icon: Warning, circleClass: 'bg-red-50', iconClass: 'text-red-500' },
  created: { Icon: FileText, circleClass: 'bg-slate-100', iconClass: 'text-slate-400', badge: MANUAL_BADGE },
  other: { Icon: Info, circleClass: 'bg-slate-100', iconClass: 'text-slate-400' },
};

type AuditRow = { type: 'single'; entry: AuditEntry } | { type: 'group'; entries: AuditEntry[] };

function auditDateLabel(ts: string): string {
  if (ts === 'Just now') return 'Today';
  const sepIndex = ts.indexOf(' · ');
  return sepIndex === -1 ? ts : ts.slice(0, sepIndex);
}
function auditTimeLabel(ts: string): string {
  const sepIndex = ts.indexOf(' · ');
  return sepIndex === -1 ? ts : ts.slice(sepIndex + 3);
}
function groupRowsByDate(rows: AuditRow[]): { label: string; rows: AuditRow[] }[] {
  const groups: { label: string; rows: AuditRow[] }[] = [];
  for (const row of rows) {
    const ts = row.type === 'group' ? row.entries[0].ts : row.entry.ts;
    const label = auditDateLabel(ts);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.rows.push(row);
    } else {
      groups.push({ label, rows: [row] });
    }
  }
  return groups;
}

const INITIAL_AUDIT_DATE_GROUPS = 2;

function groupAuditLog(entries: AuditEntry[]): AuditRow[] {
  const rows: AuditRow[] = [];
  let i = 0;
  while (i < entries.length) {
    if (/^Penalty applied \(/i.test(entries[i].action)) {
      const group: AuditEntry[] = [entries[i]];
      let j = i + 1;
      while (j < entries.length && /^Penalty applied \(/i.test(entries[j].action)) {
        group.push(entries[j]);
        j++;
      }
      rows.push(group.length > 1 ? { type: 'group', entries: group } : { type: 'single', entry: group[0] });
      i = j;
    } else {
      rows.push({ type: 'single', entry: entries[i] });
      i++;
    }
  }
  return rows;
}

type AuditFilter = 'all' | 'penalty' | 'waiver' | 'activity';
function auditFilterBucket(kind: AuditKind): AuditFilter {
  if (kind === 'automatic') return 'penalty';
  if (kind === 'waived-full' || kind === 'waived-partial' || kind === 'reduced') return 'waiver';
  return 'activity';
}

// Standard PH VAT rate — recurring bills don't carry their own tax-rate
// setting, so the same rate implied elsewhere in this demo is assumed here.
const TAX_PCT = 12;

export function RecurringBillInfoPage() {
  const navigate = useNavigate();
  const { billId } = useParams({ from: '/_layout/billings/recurring/$billId' });
  const bill = RECURRING_BILLS.find((b) => b.id === billId) ?? RECURRING_BILLS[0];
  const cycle = RECURRING_CYCLES.find((c) => c.id === bill.cycleId);
  const customer = CUSTOMERS.find((c) => c.name === bill.customerName);
  const status = RECURRING_BILL_STATUS_CFG[bill.status];

  const [activeTab, setActiveTab] = useState<'info' | 'preview'>('info');

  // ── Payment Management — ported from the one-off Bill Info page's
  // "Penalty Management" (same design/implementation: Waive Penalty/Edit
  // Waiver/Undo Waiver, Penalty Calculation modal, Recent Activity). There
  // is only ONE penalty rule now, shared with every other bill regardless
  // of type — "Recurring" is this bill's own category, never a separate
  // penalty configuration, so this page reads the exact same
  // `penaltySettings.penalty` rule (and uses the same `computePenalty`)
  // as the one-off Bill Info page. Compounding is the only cadence a rule
  // can have: off means exactly one charge, on means its own Compound
  // Every period drives recalculation — see `hasSchedule` below, mirroring
  // the one-off page exactly. waivedTotal is local-only state, same as
  // the one-off page — not shared with any other mock page. ──
  const penaltySettings = usePenaltySettings();
  const isOverdueStatus = bill.status === 'overdue';
  const daysForPenalty = isOverdueStatus ? (bill.daysOutstanding ?? 0) : 0;
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
  const penaltyIsFlat = ruleType === 'fixed' || !activeRule.compounding;
  // Whether the waived-penalty copy should talk about "the penalty"
  // (singular) or "penalties" (plural, discrete repeats) — with
  // Compounding as the only cadence left, every state is conceptually ONE
  // continuously-evolving penalty, never several separate identical
  // charges.
  const isSingularFraming = !hasSchedule || activeRule.compounding;
  const [calcModalOpen, setCalcModalOpen] = useState(false);

  function repeatFrequencyLabel(everyN: number, unit: RepeatUnit): string {
    const unitLabel = everyN === 1 ? unit.replace(/s$/, '').toLowerCase() : unit.toLowerCase();
    return `Every ${everyN} ${unitLabel}`;
  }

  function naturalFrequencyPhrase(everyN: number, unit: RepeatUnit): string {
    if (everyN === 1) return `every ${unit.replace(/s$/, '').toLowerCase()}`;
    return `every ${everyN} ${unit.toLowerCase()}`;
  }

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

  const [waivedTotal, setWaivedTotal] = useState(0);
  // Rounded to the cent — plain float subtraction can leave a value like
  // 2172.1499999999996 instead of 2172.15, which then fails an inclusive
  // "amount <= currentPenalty" check even when the user enters the exact
  // displayed remaining balance. Rounding once here keeps every downstream
  // comparison (validation, isFullyWaived, the modal's remaining preview) safe.
  const currentPenalty = Math.round(Math.max(0, autoPenalty - waivedTotal) * 100) / 100;
  const isWaived = waivedTotal > 0;
  const isFullyWaived = isWaived && currentPenalty === 0;

  // Deep-link support mirroring the one-off page's Manage Penalty page:
  // "View Audit Log" opens THIS SAME route with ?panel=audit-log — there's
  // no separate audit log page for recurring bills, so isAuditOnly just
  // renders the standalone, chrome-free page below instead of navigating
  // elsewhere. Read via useLocation (not window.location directly) so
  // it's reactive to client-side navigation, not just full page loads.
  const location = useLocation();
  const isAuditOnly = (location.search as Record<string, unknown>).panel === 'audit-log';

  // ── Audit Log — one flat, append-only history for this bill, persisted
  // (not local React state) in billAuditLog.ts and shared across BOTH tabs
  // a bill can be open in: the normal Payment Management tab where a
  // waiver actually gets applied, and the "View Audit Log" tab that always
  // opens separately. Built fresh from the current penalty calculation
  // (newest occurrence first, then the bill becoming overdue, then the
  // bill's own generation) every time — but only ACTUALLY applied as:
  // - a full reset when this is the main Payment Management page loading
  //   (isAuditOnly false) — every fresh visit/refresh of the bill itself
  //   starts a clean session, discarding any prior manual activity;
  // - a seed-if-empty when this is the standalone Audit Log viewer tab
  //   (isAuditOnly true) — it should show whatever the main tab's current
  //   session has done, never reset it out from under a live view. ──
  useState(() => {
    const seed: AuditEntry[] = [];
    [...penaltyOccurrences].reverse().forEach((occ) => {
      seed.push({
        ts: `${occ.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} · 8:00 AM`,
        actor: 'System',
        action: `Penalty applied (${formatNumberToOrdinal(occ.index)} occurrence)`,
        // Manually prefixed (not formatPeso, which inserts a space after ₱)
        // so describeAuditEntry's regex parsing below can match it.
        detail:
          ruleType === 'fixed'
            ? `₱${occ.amount.toFixed(2)}`
            : `₱${occ.amount.toFixed(2)} — ${ruleValue}% of ₱${occ.base.toFixed(2)}`,
      });
    });
    if (isOverdueStatus) {
      seed.push({ ts: `${bill.dueDate} · 12:00 AM`, actor: 'System', action: 'Bill became overdue' });
    }
    seed.push({ ts: `${bill.billDate} · 8:00 AM`, actor: 'System', action: 'Recurring bill generated' });
    if (isAuditOnly) {
      ensureAuditLogSeeded(bill.id, seed);
    } else {
      resetAuditLog(bill.id, seed);
    }
    return null;
  });
  const auditLog = useAuditLog(bill.id);

  function pushAudit(action: string, detail?: string) {
    pushAuditEntry(bill.id, action, detail);
  }

  // Which "Reason" blocks in the Audit Log are expanded past their default
  // clamp — keyed per row, purely local UI state.
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());
  function toggleReason(key: string) {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const [expandedAuditGroups, setExpandedAuditGroups] = useState<Set<string>>(new Set());
  function toggleAuditGroup(key: string) {
    setExpandedAuditGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  const [auditFilter, setAuditFilter] = useState<AuditFilter>('all');
  const [visibleAuditDateGroups, setVisibleAuditDateGroups] = useState(INITIAL_AUDIT_DATE_GROUPS);

  const auditRows = groupAuditLog(auditLog);
  const filteredAuditRows = auditRows.filter((row) => {
    if (auditFilter === 'all') return true;
    const kind = row.type === 'group' ? 'automatic' : describeAuditEntry(row.entry).kind;
    return auditFilterBucket(kind) === auditFilter;
  });
  const auditDateGroups = groupRowsByDate(filteredAuditRows);
  const visibleAuditGroups = auditDateGroups.slice(0, visibleAuditDateGroups);
  const hasMoreAuditGroups = auditDateGroups.length > visibleAuditDateGroups;
  const canCollapseAuditGroups = !hasMoreAuditGroups && visibleAuditDateGroups > INITIAL_AUDIT_DATE_GROUPS;

  const [waiveOpen, setWaiveOpen] = useState(false);
  const [waiveAmount, setWaiveAmount] = useState('');
  const [waiveReason, setWaiveReason] = useState('');
  const [waiveErrors, setWaiveErrors] = useState({ amount: false, reason: false });
  const [waiverReason, setWaiverReason] = useState('');
  const [penaltyToast, setPenaltyToast] = useState<string | null>(null);

  // Waiving/reducing is final now — there's no "undo" that could bring a
  // bill back from isWaived=true to false, so Recent Activity no longer
  // needs a special "just undid a waiver" branch; it's simply hidden
  // whenever isWaived is true, same as any other waived state.
  const recentActivity =
    isWaived
      ? null
      : occurrences === 0
          ? {
              // Not hidden entirely — a bare "nothing to show" state still
              // needs SOME explanation of why, same way the Audit Log
              // always shows at least the bill's lifecycle events rather
              // than going empty. Occurrences can only be 0 here because
              // no penalty rule is currently enabled (an overdue bill
              // always has daysOutstanding > 0, so a rule that's actually
              // on always produces at least one occurrence).
              Icon: Info,
              circleClass: 'bg-slate-100',
              iconClass: 'text-slate-400',
              title: 'No penalty rule configured',
              description: 'Configure a penalty rule under Settings → Overdue Payment Penalties to start tracking penalty activity for this bill.',
              time: undefined as string | undefined,
              actor: undefined as string | undefined,
              expandable: false,
            }
          : hasSchedule
            ? {
                Icon: CalendarBlank,
                circleClass: 'bg-violet-100',
                iconClass: 'text-violet-600',
                title: `${occurrences} automatic penalty application${occurrences !== 1 ? 's' : ''}`,
                description: penaltyIsFlat
                  ? `${formatPeso(penaltyOccurrences[0].amount)} applied each time — ${occurrences} occurrence${occurrences !== 1 ? 's' : ''} so far.`
                  : `${formatPeso(autoPenalty)} applied so far across ${occurrences} compounding occurrence${occurrences !== 1 ? 's' : ''}.`,
                time: '8:00 AM' as string | undefined,
                actor: 'System' as string | undefined,
                expandable: true,
              }
            : {
                Icon: CalendarBlank,
                circleClass: 'bg-violet-100',
                iconClass: 'text-violet-600',
                title: 'Penalty applied once',
                description: `${formatPeso(autoPenalty)} charged when this invoice became overdue.`,
                time: '8:00 AM' as string | undefined,
                actor: 'System' as string | undefined,
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

  const lineItems = buildLineItems(bill.billName, bill.amount, cycle?.lineItems);

  // Subtotal is VAT-inclusive (matches how this bill's amount is already
  // stored) — Net sales/Tax amount are derived by working the standard VAT
  // rate back out of it. No separate exempt/zero-rated line-item split is
  // modeled since recurring bills don't carry that data; Discount and
  // Withholding tax default to none for the same reason.
  const subtotal = bill.amount;
  const netSales = subtotal / (1 + TAX_PCT / 100);
  const taxAmount = subtotal - netSales;
  const discountPct = 0;
  const discountAmount = 0;
  const totalDue = subtotal - discountAmount;
  const withholdingTax = 0;
  const amountDue = Math.max(0, totalDue - withholdingTax);

  // Always computed from this bill's own billDate/dueDate — never the
  // customer's stored terms label — so it can never show a number that
  // disagrees with the Issue date/Due date printed right above it.
  const paymentTermsDays = daysBetween(bill.billDate, bill.dueDate);
  const paymentTerms = paymentTermsDays === null ? '—' : `${paymentTermsDays} days`;

  // Audit Log card — pulled into its own variable (rather than left inline)
  // so it can be reused both inside the full-chrome page below AND inside
  // the standalone, chrome-free page rendered when isAuditOnly is true
  // (see the early return right after this).
  const auditLogCard = (
    <Card id="audit-log" className="gap-4 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pt-6 pb-0">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 tracking-tight">Audit Log</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">A timeline of changes and actions made to this bill.</p>
        </div>
        <Select value={auditFilter} onValueChange={(v) => setAuditFilter(v as AuditFilter)}>
          <SelectTrigger size="sm" className="w-[150px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="penalty">Penalty applied</SelectItem>
            <SelectItem value="waiver">Waivers</SelectItem>
            <SelectItem value="activity">Bill activity</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-0 pb-6">
        {auditDateGroups.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No events match this filter.</p>
        ) : (
          <div className="flex flex-col pl-3">
            {visibleAuditGroups.map((group, gi) => (
              <div key={group.label + gi}>
                <div className={cn('pb-2.5', gi === 0 ? 'pt-0' : 'pt-4')}>
                  <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 text-[11px] font-semibold">
                    {group.label}
                  </span>
                </div>

                {group.rows.map((row, ri) => {
                  const isLastRowOverall =
                    gi === visibleAuditGroups.length - 1 && !hasMoreAuditGroups && ri === group.rows.length - 1;
                  const rowWrapClass = cn('flex gap-3 py-3', !isLastRowOverall && 'border-b border-slate-100');

                  if (row.type === 'group') {
                    const key = row.entries[0].ts + row.entries[0].action;
                    const isExpanded = expandedAuditGroups.has(key);
                    const count = row.entries.length;
                    const oldestFirst = [...row.entries].reverse();
                    const perOccMatch = row.entries[0].detail?.match(/^(₱[\d,.]+)/);
                    const visual = AUDIT_VISUAL.automatic;
                    const RowIcon = visual.Icon;
                    return (
                      <div key={key} className={rowWrapClass}>
                        <span className={cn('flex items-center justify-center w-10 h-10 rounded-full shrink-0', visual.circleClass)}>
                          <RowIcon size={17} weight="bold" className={visual.iconClass} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-slate-800 leading-snug">{count} automatic penalty applications</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-2 leading-snug">
                                {perOccMatch ? `${perOccMatch[1]} applied each time` : 'Applied automatically'} — {count} occurrences so far.
                              </p>
                              <button
                                onClick={() => toggleAuditGroup(key)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-800 mt-1"
                              >
                                <CaretDown size={9} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                                {isExpanded ? 'Hide individual entries' : `Show all ${count} entries`}
                              </button>
                              {isExpanded && (
                                <div className="mt-2.5 space-y-2.5 border-l border-slate-100 pl-3">
                                  {oldestFirst.map((entry, j) => {
                                    const { title, sentence } = describeAuditEntry(entry);
                                    return (
                                      <div key={j}>
                                        <div className="flex items-baseline justify-between gap-3">
                                          <p className="text-xs font-semibold text-slate-600">{title}</p>
                                          <span className="text-[11px] text-slate-400 shrink-0">{entry.ts}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 leading-snug">{sentence}</p>
                                        <p className="text-[11px] text-slate-400 mt-1">by {entry.actor}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-700">{auditTimeLabel(row.entries[0].ts)}</p>
                                <p className="text-xs text-slate-400">by System</p>
                              </div>
                              <DotsThreeVertical size={16} weight="bold" className="text-slate-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const { title, sentence, kind, reason } = describeAuditEntry(row.entry);
                  const visual = AUDIT_VISUAL[kind];
                  const RowIcon = visual.Icon;
                  const key = row.entry.ts + row.entry.action;
                  const isReasonExpanded = expandedReasons.has(key);
                  const reasonNeedsClamp = !!reason && reason.length > 140;
                  return (
                    <div key={key} className={rowWrapClass}>
                      <span className={cn('flex items-center justify-center w-10 h-10 rounded-full shrink-0', visual.circleClass)}>
                        <RowIcon size={17} weight="bold" className={visual.iconClass} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
                              {visual.badge && (
                                <Badge className={cn('text-xs px-2.5 py-0.5', visual.badge.className)}>{visual.badge.label}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 leading-snug">{sentence}</p>
                            {reason && (
                              <div className="mt-1.5 pl-2.5 border-l-2 border-slate-100">
                                <p
                                  className={cn(
                                    'text-xs text-slate-400 leading-snug break-words',
                                    !isReasonExpanded && reasonNeedsClamp && 'line-clamp-2',
                                  )}
                                >
                                  <span className="font-medium text-slate-400">Reason: </span>
                                  {reason}
                                </p>
                                {reasonNeedsClamp && (
                                  <button
                                    onClick={() => toggleReason(key)}
                                    className="text-[11px] font-medium text-violet-600 hover:text-violet-800 mt-0.5"
                                  >
                                    {isReasonExpanded ? 'Show less' : 'Show more'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-700">{auditTimeLabel(row.entry.ts)}</p>
                              <p className="text-xs text-slate-400">by {row.entry.actor}</p>
                            </div>
                            <DotsThreeVertical size={16} weight="bold" className="text-slate-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {hasMoreAuditGroups && (
          <div className="flex justify-center pt-3">
            <Button variant="outline" size="sm" onClick={() => setVisibleAuditDateGroups((n) => n + 2)}>
              Load older events
              <CaretDown size={11} />
            </Button>
          </div>
        )}

        {canCollapseAuditGroups && (
          <div className="flex justify-center pt-3">
            <Button variant="outline" size="sm" onClick={() => setVisibleAuditDateGroups(INITIAL_AUDIT_DATE_GROUPS)}>
              Show less
              <CaretDown size={11} className="rotate-180" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ── Standalone, chrome-free page — when opened via the "View Audit Log"
  // icon's ?panel=audit-log deep link (always in a new tab), this renders
  // with NO sidebar/topbar/breadcrumb/tabs at all: just a centered card on
  // a plain light background, matching a standalone document-style page
  // rather than the full admin app shell. ──
  if (isAuditOnly) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center px-4 py-10">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {auditLogCard}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top bar — identical chrome to the one-off Bill Info page. ── */}
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

        {/* ── Sub-header — breadcrumb back to the Recurring billing list,
             Info/Preview tabs, and this bill's actions. ── */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 min-w-0 shrink-0">
            <button onClick={() => navigate({ to: '/dashboard' })} className="hover:text-slate-900 hover:underline transition-colors">
              Dashboard
            </button>
            <CaretRight size={12} />
            <button onClick={() => navigate({ to: '/billings/recurring' })} className="hover:text-slate-900 hover:underline transition-colors">
              Billing
            </button>
            <CaretRight size={12} />
            <button onClick={() => navigate({ to: '/billings/recurring' })} className="hover:text-slate-900 hover:underline transition-colors">
              Recurring billing
            </button>
            <CaretRight size={12} />
            <span className="text-slate-900 font-medium truncate">{bill.id}</span>
          </nav>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'preview')} className="shrink-0">
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
            <Button colorScheme="primary" size="md" className="rounded-[8px]">
              Edit bill
            </Button>
          </div>
        </div>

        {/* ── Content — same card structure/padding/gap/font sizes as the
             one-off Bill Info page's Info tab. ── */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-5">
            {activeTab === 'info' ? (
              <>
                {/* isAuditOnly already returned early above (its own
                    standalone, chrome-free page) — everything below only
                    ever renders in the normal, full-chrome case. */}
                {/* Payment Management — ported from the one-off Bill Info
                    page's "Penalty Management" card: same design/buttons/
                    dialogs, but titled for what it does here (managing an
                    overdue recurring bill's payment/penalty), and driven
                    by the same single Overdue Payment Penalties rule every
                    bill reads, regardless of this bill's own Recurring
                    category. Only relevant while overdue. */}
                {isOverdueStatus && (
                  <Card className="rounded-[8px] shadow-none py-6 !gap-4">
                    <CardHeader className="!flex flex-row items-center justify-between gap-4 space-y-0 px-6">
                      <CardTitle className="text-[20px] font-semibold text-slate-900">Payment Management</CardTitle>
                      <div className="flex items-center gap-2">
                        {/* Waiving (full or partial) is final — no
                            Edit/Undo. The action is always "Waive
                            Penalty", whether against an untouched penalty
                            or whatever's left after a prior waiver — it
                            just disappears once nothing remains to waive. */}
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
                          onClick={() => window.open(`/billings/recurring/${bill.id}?panel=audit-log`, '_blank')}
                          title="View Audit Log"
                          className="w-10 h-10 flex items-center justify-center rounded-[8px] border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          <ClockCounterClockwise size={18} />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6">
                      <div className={cn('relative overflow-hidden rounded-[8px] border border-slate-200', isWaived && 'bg-white')}>
                        <button
                          onClick={() => setCalcModalOpen(true)}
                          className="absolute top-2 right-0 z-10 inline-flex items-center gap-1.5 rounded-l-full border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3.5 py-2 text-[12px] font-medium text-violet-700 transition-colors whitespace-nowrap"
                        >
                          Penalty Calculation
                          <CaretRight size={12} />
                        </button>

                        <div className="p-3">
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
                                    {recentActivity.time && (
                                      <div className="text-right shrink-0">
                                        <p className="text-xs font-medium text-slate-700">{recentActivity.time}</p>
                                        <p className="text-xs font-medium text-slate-400">by {recentActivity.actor}</p>
                                      </div>
                                    )}
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

                {/* From / To / Status */}
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
                                {customer.group && (
                                  <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 mt-2">
                                    {customer.group}
                                  </span>
                                )}
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
                        <span className={`inline-flex items-center justify-center w-[88px] rounded-full border py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-900">Billing ID</p>
                        <p className="text-sm text-slate-900 mt-1">{bill.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Issue date</p>
                        <p className="text-sm text-slate-900 mt-1">{bill.billDate}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Due date</p>
                        <p className="text-sm text-slate-900 mt-1">{bill.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Payment terms</p>
                        <p className="text-sm text-slate-900 mt-1">{paymentTerms}</p>
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
                      {lineItems.map((item, i) => (
                        <div key={i} className="grid grid-cols-[1fr_60px_110px_110px] gap-4 items-start py-4 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-800">{item.name}</p>
                          <span className="text-sm text-slate-600 text-center">1</span>
                          <span className="text-sm text-slate-600 text-right tabular-nums">{formatPeso(item.price)}</span>
                          <span className="text-sm font-medium text-slate-800 text-right tabular-nums">{formatPeso(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col max-w-xs ml-auto w-full">
                      <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                        <span className="text-slate-500">Subtotal <span className="text-slate-500">(VAT inclusive)</span></span>
                        <span className="text-slate-700 tabular-nums">
                          <span className="text-slate-500">₱</span> {subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                        <span className="text-slate-500">Net sales</span>
                        <span className="text-slate-700 tabular-nums">
                          <span className="text-slate-500">₱</span> {netSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                        <span className="text-slate-500">Tax % (VAT)</span>
                        <span className="text-slate-900">{TAX_PCT}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                        <span className="text-slate-500">Discount %</span>
                        <span className="text-slate-900">{discountPct}%</span>
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
                        <span className="text-slate-700 tabular-nums">
                          <span className="text-slate-500">₱</span> {totalDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-3 px-2 border-b border-slate-100">
                        <span className="text-slate-500">Withholding tax</span>
                        <span className="text-slate-700 tabular-nums">
                          <span className="text-slate-500">₱</span> {withholdingTax.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-violet-50 rounded-[8px] py-3 px-2 mt-1">
                        <span className="text-sm font-medium text-slate-800">Amount due</span>
                        <span className="text-[18px] font-medium text-violet-700 tabular-nums">
                          <span className="text-slate-500">₱</span> {amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              // same data above, matching the one-off Bill Info page. ──
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
                      <p className="text-2xl font-bold text-violet-700 mt-1 tabular-nums">{formatPeso(amountDue)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-[1fr_60px_110px_110px] gap-4 text-xs text-slate-400 pb-2 border-b border-slate-100">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Price</span>
                      <span className="text-right">Subtotal</span>
                    </div>
                    {lineItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-[1fr_60px_110px_110px] gap-4 py-3">
                        <span className="text-sm text-slate-700">{item.name}</span>
                        <span className="text-sm text-slate-600 text-center">1</span>
                        <span className="text-sm text-slate-600 text-right tabular-nums">{formatPeso(item.price)}</span>
                        <span className="text-sm font-medium text-slate-800 text-right tabular-nums">{formatPeso(item.price)}</span>
                      </div>
                    ))}
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
           saved under Settings → Overdue Payment Penalties (the same
           single rule every bill reads). Footer offers a real escape hatch
           to that page, alongside a plain Cancel to just close this
           read-only summary. ── */}
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
          <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-200 p-4">
            <Button variant="outline" size="md" onClick={() => setCalcModalOpen(false)}>Cancel</Button>
            <Button
              colorScheme="primary"
              size="md"
              onClick={() => { window.location.href = '/settings?section=late-payment-penalties'; }}
            >
              Manage penalty
            </Button>
          </DialogFooter>
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
