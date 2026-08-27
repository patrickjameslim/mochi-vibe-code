import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CaretRight,
  BellSimple,
  HandCoins,
  CheckCircle,
  Info,
  CaretDown,
  CalendarBlank,
  ClockCounterClockwise,
  Warning,
  FileText,
  PaperPlaneTilt,
  DotsThreeVertical,
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
import { BILLS, formatPeso, type BillStatus } from '#/data/bills';
import { useAuditLog, ensureAuditLogSeeded, resetAuditLog, pushAuditEntry, type AuditEntry } from '#/data/billAuditLog';

// ─── Status badge config — mirrors STATUS_CFG in
// src/components/molecules/ReceivablesTable/ReceivablesTable.tsx so the pill
// shown here for bill.status looks identical to the one in the bills list. ──
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

// ─── Global penalty rule (mirrors the sample configured in Settings → Late Payment Penalties) ──
const PENALTY_RULE = {
  type: 'percentage' as const,
  value: 5,
  frequency: 'recurring' as 'one-time' | 'recurring',
  repeatEveryDays: 7,
};

const SEED_AUDIT_LOG: AuditEntry[] = [
  { ts: 'Sep 10, 2025 · 8:00 AM', actor: 'System', action: 'Penalty applied (4th occurrence)', detail: '₱1,200.00 — 5% of ₱24,000.00' },
  { ts: 'Sep 03, 2025 · 8:00 AM', actor: 'System', action: 'Penalty applied (3rd occurrence)', detail: '₱1,200.00 — 5% of ₱24,000.00' },
  { ts: 'Aug 27, 2025 · 8:00 AM', actor: 'System', action: 'Penalty applied (2nd occurrence)', detail: '₱1,200.00 — 5% of ₱24,000.00' },
  { ts: 'Aug 20, 2025 · 8:00 AM', actor: 'System', action: 'Penalty applied (1st occurrence)', detail: '₱1,200.00 — 5% of ₱24,000.00' },
  { ts: 'Aug 15, 2025 · 12:00 AM', actor: 'System', action: 'Invoice became overdue' },
  { ts: 'Jul 15, 2025 · 10:15 AM', actor: 'Juan A. Dela Cruz', action: 'Invoice sent to customer' },
  { ts: 'Jul 15, 2025 · 10:12 AM', actor: 'Juan A. Dela Cruz', action: 'Invoice created' },
];

// ─── Audit entry "kind" — a purely additive visual-categorization tag used to
// pick an icon/color/badge for the timeline. It never changes what's stored
// or how sentences are worded; it only labels each entry for presentation. ──
type AuditKind =
  | 'automatic'
  | 'waived-full'
  | 'waived-partial'
  | 'reduced'
  | 'overdue'
  | 'sent'
  | 'created'
  | 'other';

// ─── Presentational helper — turns a raw audit entry (action/detail strings,
// unchanged from what pushAudit()/SEED_AUDIT_LOG store) into a plain-language
// title + sentence + kind for the timeline. Purely a display transform: it does
// not read or write any component state, and every entry type below maps back
// to an existing action string produced elsewhere in this file. Unrecognized
// entries fall back to their raw action/detail so no event type is ever lost.
// ─── `reason` is returned separately from `sentence` (rather than baked into
// one flowing paragraph) so the timeline can render it as its own,
// independently-clamped block — a long pasted reason can't stretch the rest
// of the entry or the surrounding rows out of rhythm. ──
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

  if (/^Invoice became overdue$/i.test(action)) {
    return { title: 'Invoice Overdue', kind: 'overdue', sentence: 'This invoice passed its due date and started accruing late payment penalties.' };
  }

  if (/^Invoice sent to customer$/i.test(action)) {
    return { title: 'Invoice Sent', kind: 'sent', sentence: `${actor} sent this invoice to the customer.` };
  }

  if (/^Invoice created$/i.test(action)) {
    return { title: 'Invoice Created', kind: 'created', sentence: `${actor} created this invoice.` };
  }

  // Fallback — guarantees every action type still renders, even if unrecognized.
  return { title: action, kind: 'other', sentence: detail };
}

// ─── Badge = HOW the action was performed (Manual) — a category distinct
// from the title (what happened), the description (specifics), and the
// actor (who, specifically). Automatic entries no longer carry a badge of
// their own; the icon/color already distinguishes them, and the "Automatic"
// label was redundant with the title and actor ("by System") next to it. ──
const MANUAL_BADGE = { label: 'Manual', className: 'bg-slate-100 text-slate-600 border-slate-200' };

// ─── Per-kind icon/color/badge lookup for the timeline — presentation only. ──
const AUDIT_VISUAL: Record<AuditKind, { Icon: Icon; circleClass: string; iconClass: string; badge?: { label: string; className: string } }> = {
  automatic: { Icon: CalendarBlank, circleClass: 'bg-violet-100', iconClass: 'text-violet-600' },
  'waived-full': { Icon: CheckCircle, circleClass: 'bg-emerald-500', iconClass: 'text-white', badge: MANUAL_BADGE },
  'waived-partial': { Icon: CheckCircle, circleClass: 'bg-emerald-500', iconClass: 'text-white', badge: MANUAL_BADGE },
  reduced: { Icon: CheckCircle, circleClass: 'bg-emerald-500', iconClass: 'text-white', badge: MANUAL_BADGE },
  overdue: { Icon: Warning, circleClass: 'bg-red-50', iconClass: 'text-red-500' },
  sent: { Icon: PaperPlaneTilt, circleClass: 'bg-slate-100', iconClass: 'text-slate-400', badge: MANUAL_BADGE },
  created: { Icon: FileText, circleClass: 'bg-slate-100', iconClass: 'text-slate-400', badge: MANUAL_BADGE },
  other: { Icon: Info, circleClass: 'bg-slate-100', iconClass: 'text-slate-400' },
};

type AuditRow = { type: 'single'; entry: AuditEntry } | { type: 'group'; entries: AuditEntry[] };

// ─── Which top-level filter bucket a kind belongs to, for the "All events"
// selector — a client-side visibility filter over already-loaded entries,
// same category as groupAuditLog: it never mutates auditLog/storage. ──
type AuditFilter = 'all' | 'penalty' | 'waiver' | 'activity';
function auditFilterBucket(kind: AuditKind): AuditFilter {
  if (kind === 'automatic') return 'penalty';
  if (kind === 'waived-full' || kind === 'waived-partial' || kind === 'reduced') return 'waiver';
  return 'activity';
}

// ─── Groups already-ordered (newest-first) audit rows into date-labeled
// buckets, e.g. "Today" for freshly-logged ('Just now') entries, otherwise the
// calendar date parsed from the entry's existing ts string. Presentation only
// — reads ts as already stored, never reformats/changes the underlying data. ──
function auditDateLabel(ts: string): string {
  if (ts === 'Just now') return 'Today';
  const sepIndex = ts.indexOf(' · ');
  return sepIndex === -1 ? ts : ts.slice(0, sepIndex);
}
// ─── Per-event metadata only needs to show what the date group above it
// doesn't already establish — the time. Falls back to the full ts (e.g.
// "Just now") when there's no separate date/time split to strip. ──
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

// ─── How many date groups the Audit Log shows before "Load older events" is
// needed, and what "Show less" collapses back down to. ──
const INITIAL_AUDIT_DATE_GROUPS = 2;

// ─── Presentational-only grouping — collapses consecutive "Penalty applied
// (Nth occurrence)" entries into a single summary row so the timeline isn't
// dominated by repeats of the same event type. Every other action type still
// renders individually, and every grouped entry (with its exact timestamp)
// remains reachable via the row's expand toggle. Purely a display transform
// over auditLog — it never mutates state or storage. ──
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

export function BillDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: '/_layout/billings/$id/view' });
  const bill = BILLS.find((b) => b.id === id) ?? BILLS.find((b) => b.status === 'overdue')!;

  // ── Bill status — penalties only accrue while a bill is overdue ──
  const isOverdueStatus = bill.status === 'overdue';
  const isPaidStatus = bill.status === 'paid';

  // ── Auto-calculated penalty for this invoice, given PENALTY_RULE ──
  // Only an overdue bill accrues/recalculates a penalty; a paid (settled) or
  // not-yet-overdue bill has nothing to accrue.
  const daysForPenalty = isOverdueStatus ? bill.daysOutstanding : 0;
  const occurrences =
    daysForPenalty <= 0
      ? 0
      : PENALTY_RULE.frequency === 'one-time'
        ? 1
        : Math.floor(daysForPenalty / PENALTY_RULE.repeatEveryDays) + 1;
  const perOccurrence = bill.amount * (PENALTY_RULE.value / 100);
  const autoPenalty = perOccurrence * occurrences;

  // Deep-link support for the Penalty Management quick actions on the Bill
  // Info page: "Waive Penalty" links here with ?action=waive to jump
  // straight into the dialog. "View Audit Log" links here with
  // ?panel=audit-log — isAuditOnly hides everything except the Audit Log
  // card itself, so that link genuinely opens "just the audit log" rather
  // than the full Manage Penalty page. Read via useLocation (not
  // window.location directly) so it's reactive to client-side navigation,
  // not just full page loads.
  const location = useLocation();
  const isAuditOnly = (location.search as Record<string, unknown>).panel === 'audit-log';

  // ── Penalty state ──
  // No manual override of the calculated penalty exists anymore — per
  // product decision, the configured penalty rule (Settings → Overdue
  // Payment Penalties) is always the source of truth for what accrues
  // automatically. If the accrued amount is too high, the only lever a
  // user has is Waive Penalty below, which reduces what's OWED without
  // ever touching the underlying calculation itself.
  const [waivedTotal, setWaivedTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // ── Audit Log — persisted (not local React state) in billAuditLog.ts and
  // shared across BOTH tabs this bill can be open in: the main Manage
  // Penalty page where a waiver/override actually happens, and the "View
  // Audit Log" tab that always opens separately. Only ACTUALLY applied as:
  // - a full reset when this IS the main Manage Penalty page loading
  //   (isAuditOnly false) — every fresh visit/refresh of the bill itself
  //   starts a clean session, discarding any prior manual activity;
  // - a seed-if-empty when this is the standalone Audit Log viewer tab
  //   (isAuditOnly true) — it should show whatever the main tab's current
  //   session has done, never reset it out from under a live view. ──
  useState(() => {
    if (isAuditOnly) {
      ensureAuditLogSeeded(bill.id, SEED_AUDIT_LOG);
    } else {
      resetAuditLog(bill.id, SEED_AUDIT_LOG);
    }
    return null;
  });
  const auditLog = useAuditLog(bill.id);

  // ── Which "Reason" blocks are expanded past their default clamp — purely
  // local UI state, keyed per block (Amount Breakdown uses the fixed key
  // 'amount-breakdown'; Audit Log entries use their own per-row key), so
  // expanding one long reason never affects any other block. ──
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());
  function toggleReason(key: string) {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Purely presentational — whether the Amount Breakdown card's fuller
  // penalty explanation (override/waiver notice text, reason, and their
  // actions) is expanded past its default collapsed state. Never touches
  // business-logic state; the headline state tag stays visible either way. ──
  const [penaltyDetailsExpanded, setPenaltyDetailsExpanded] = useState(false);

  // Rounded to the cent — plain float subtraction can leave a value like
  // 2172.1499999999996 instead of 2172.15, which then fails an inclusive
  // "amount <= currentPenalty" check even when the user enters the exact
  // displayed remaining balance. Rounding once here keeps every downstream
  // comparison (validation, isFullyWaived, the modal's remaining preview) safe.
  const currentPenalty = Math.round(Math.max(0, autoPenalty - waivedTotal) * 100) / 100;
  const isWaived = waivedTotal > 0;
  const isFullyWaived = isWaived && currentPenalty === 0;
  const outstandingBalance = bill.amount + currentPenalty;

  // ── Presentational-only lookup: the reason behind the most recent waiver
  // action, read from the existing audit log rather than new state, per the
  // Penalty Status section's "Reason" field. ──
  const latestWaiverEntry = auditLog.find((entry) => /waiver|waived/i.test(entry.action));
  const waiverReason = (() => {
    if (!latestWaiverEntry?.detail) return undefined;
    const dashIndex = latestWaiverEntry.detail.lastIndexOf('—');
    return dashIndex === -1 ? latestWaiverEntry.detail : latestWaiverEntry.detail.slice(dashIndex + 1).trim();
  })();
  // Reason text is unpredictable in length — only clamp (and only offer to
  // expand) when it's actually long enough to need it.
  const waiverReasonNeedsClamp = !!waiverReason && waiverReason.length > 140;
  const isAmountReasonExpanded = expandedReasons.has('amount-breakdown');

  function pushAudit(action: string, detail?: string) {
    pushAuditEntry(bill.id, action, detail);
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Waive Penalty dialog — one unified flow for lowering the remaining
  // penalty, whether this is the FIRST waiver against an untouched penalty
  // or a further one against whatever's already left. Every waiver (full
  // or partial) is final: there's no "undo" or "edit" of a past waiver,
  // only additional waivers going forward, applied repeatedly as long as
  // some penalty still remains — each one its own final action, logged as
  // its own audit entry. Whether a given waiver counts as "fully" or
  // "partially" waived is decided purely by the amount entered, never by
  // an explicit up-front choice — see confirmWaive below. ──
  const [waiveOpen, setWaiveOpen] = useState(false);
  const [waiveAmount, setWaiveAmount] = useState('');
  const [waiveReason, setWaiveReason] = useState('');
  const [waiveErrors, setWaiveErrors] = useState({ amount: false, reason: false });

  function openWaive() {
    setWaiveAmount('');
    setWaiveReason('');
    setWaiveErrors({ amount: false, reason: false });
    setWaiveOpen(true);
  }

  // "Waive Penalty" quick action from the Bill Info page links here with
  // ?action=waive to jump straight into the dialog (isAuditOnly itself is
  // declared earlier, alongside the Audit Log's reset/seed logic that
  // depends on it).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('action') === 'waive') {
      openWaive();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    if (isWaived) {
      // Already had a prior waiver — this is a further waiver against
      // whatever was left, regardless of whether it zeroes it out.
      pushAudit('Penalty reduced', `₱${amount.toFixed(2)} — ${waiveReason}`);
      showToast(`${formatPeso(amount)} was waived from the remaining penalty. ${formatPeso(remaining)} penalty remains.`);
    } else if (remaining === 0) {
      pushAudit('Full penalty waived', `₱${amount.toFixed(2)} — ${waiveReason}`);
      showToast(`Penalty waived in full — outstanding balance now ${formatPeso(bill.amount)}`);
    } else {
      pushAudit('Partial penalty waiver applied', `₱${amount.toFixed(2)} — ${waiveReason}`);
      showToast(`₱${amount.toFixed(2)} waived — outstanding balance now ${formatPeso(bill.amount + remaining)}`);
    }
    setWaiveOpen(false);
  }

  // ── Notification bell — surfaces the "penalty first applied" event ──
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const firstPenaltyEntry = auditLog.find((entry) => entry.action.toLowerCase().includes('first penalty applied'));

  useEffect(() => {
    if (!notifOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [notifOpen]);

  // ── Audit log presentation — purely local UI state controlling which
  // grouped rows (see groupAuditLog above) are expanded to show their
  // individual entries, which event-type filter is active, and how many
  // date groups are revealed. Never read by/written from any business logic. ──
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


  const auditLogCard = (
            <Card id="audit-log" className="gap-4 py-0">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pt-6 pb-0">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 tracking-tight">Audit Log</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">A timeline of changes and actions made to this invoice.</p>
                </div>
                <Select value={auditFilter} onValueChange={(v) => setAuditFilter(v as AuditFilter)}>
                  <SelectTrigger size="sm" className="w-[150px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    <SelectItem value="penalty">Penalty applied</SelectItem>
                    <SelectItem value="waiver">Waivers</SelectItem>
                    <SelectItem value="activity">Invoice activity</SelectItem>
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
                                    {/* Title, description, and toggle live in one column so the
                                        description sits directly under the title — not under the taller
                                        timestamp+actor column beside it. */}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-slate-800 leading-snug">{count} automatic penalty applications</p>
                                        {visual.badge && (
                                          <Badge className={cn('text-xs px-2.5 py-0.5', visual.badge.className)}>{visual.badge.label}</Badge>
                                        )}
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
                                          {/* Each occurrence here can fall on a different calendar day
                                              than the date-group pill above (which reflects only the
                                              group's most recent entry), so the full date is kept —
                                              it isn't redundant in this nested view. */}
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
                                    {/* Metadata shows only what the date group above doesn't
                                        already establish: the time (not the full date), plus
                                        who — "by System" here, since these are always
                                        automatic occurrences. Badge = how (Automatic), this = who. */}
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
                          // A reason is user-generated free text of unpredictable length —
                          // clamp it by default so one long reason can't stretch this row (and
                          // throw off the timeline's rhythm); only offer to expand it past the
                          // clamp when it's actually long enough to need it.
                          const isReasonExpanded = expandedReasons.has(key);
                          const reasonNeedsClamp = !!reason && reason.length > 140;
                          return (
                            <div key={key} className={rowWrapClass}>
                              <span className={cn('flex items-center justify-center w-10 h-10 rounded-full shrink-0', visual.circleClass)}>
                                <RowIcon size={17} weight="bold" className={visual.iconClass} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  {/* Title, badge, and description live in one column so the
                                      description sits directly under the title — not under the
                                      taller timestamp+actor column beside it. */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
                                      {visual.badge && (
                                        <Badge className={cn('text-xs px-2.5 py-0.5', visual.badge.className)}>{visual.badge.label}</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 leading-snug">{sentence}</p>
                                    {/* Reason is supporting detail, not a primary event fact — kept
                                        visually secondary (smaller, lighter, indented with a rule)
                                        so it never competes with the title/badge/description above,
                                        and clamped so it can't dominate the row's height. */}
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
                                  {/* Metadata shows only what the date group above doesn't already
                                      establish (the time, not the full date), plus who performed
                                      it — badge = how (Automatic/Manual), this = who specifically. */}
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
  // with NO sidebar/header at all: just the Audit Log card centered on a
  // plain light background, matching the Recurring Bill Info page's own
  // standalone Audit Log view. ──
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
        {/* ── Header ── */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/billings' })}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={14} weight="bold" />
            </button>
            <nav className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>Dashboard</span>
              <CaretRight size={12} />
              <button onClick={() => navigate({ to: '/billings' })} className="hover:text-slate-700 transition-colors">
                Manage bills
              </button>
              <CaretRight size={12} />
              <span className="text-slate-900 font-medium">{bill.id}</span>
            </nav>
          </div>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <BellSimple size={16} />
              {firstPenaltyEntry && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-3">
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Notifications</p>
                {firstPenaltyEntry ? (
                  <div>
                    <p className="text-sm font-medium text-slate-800">Penalty first applied</p>
                    {firstPenaltyEntry.detail && <p className="text-xs text-slate-500 mt-0.5">{firstPenaltyEntry.detail}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{firstPenaltyEntry.ts}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No notifications yet.</p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto px-8 py-6 relative">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* isAuditOnly already returned early above (its own standalone,
                chrome-free page) — everything below only ever renders in
                the normal, full-chrome case. */}
            {/* ── Invoice header card — original layout restored per request:
                 title + status inline, id/customer chip row, billed/due/overdue
                 icon row, actions top-right. ── */}
            <Card className="overflow-hidden gap-0 py-0">
              <div
                className={[
                  'h-1.5 bg-gradient-to-r',
                  isOverdueStatus ? 'from-red-500 to-red-400' : isPaidStatus ? 'from-emerald-500 to-emerald-400' : 'from-slate-300 to-slate-200',
                ].join(' ')}
              />
              <CardContent className="px-6 py-6">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="min-w-0 space-y-4">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight truncate">{bill.title}</h1>
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-[88px] rounded-full border py-1 text-xs font-semibold',
                          STATUS_CFG[bill.status].className,
                        )}
                      >
                        {STATUS_CFG[bill.status].label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="bg-slate-100 text-slate-500 rounded px-2 py-0.5 text-xs font-mono">{bill.id}</span>
                      <span className="text-slate-300">·</span>
                      <span
                        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-white font-semibold shrink-0"
                        style={{ backgroundColor: bill.customerAvatarColor, fontSize: 8 }}
                      >
                        {bill.customerInitials}
                      </span>
                      <span className="text-slate-700 font-medium">{bill.customerName}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CalendarBlank size={13} />
                        Billed {bill.billDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarBlank size={13} />
                        Due {bill.dueDate}
                      </span>
                      {isOverdueStatus && (
                        <span className="flex items-center gap-1.5 text-red-500 font-medium">
                          <ClockCounterClockwise size={13} />
                          {bill.daysOutstanding} days overdue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* No manual override of the calculated penalty exists
                        anymore — the configured rule under Settings is
                        always the source of truth. The action is always
                        "Waive Penalty", whether against an untouched
                        penalty or whatever's left after a prior waiver —
                        it just disappears once nothing remains to waive;
                        there's never an Edit/Undo. */}
                    {currentPenalty > 0 && (
                      <Button variant="outline" size="sm" onClick={openWaive}>
                        <HandCoins size={13} />
                        Waive Penalty
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Amount Breakdown — reads as a calculation, not a table:
                 Original amount and Penalty carry matching visual weight as
                 the two inputs; Outstanding Balance is set apart as a shaded
                 "conclusion" bar (not a divider line) so the result of the
                 calculation is felt, not just labeled — its primacy comes
                 from weight/color/placement, not from being the biggest text
                 on the card. ── */}
            <Card className="gap-4 py-0 overflow-hidden">
              <CardHeader className="pt-6 pb-0">
                <CardTitle className="text-base font-semibold text-slate-900 tracking-tight">Amount Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-0">
                {/* ── Inputs — the two amounts that feed the total below. A
                     small "+"/"=" glyph on each label makes the calculation
                     flow (inputs → result) legible at a glance, without
                     relying on relative font sizes to communicate it. ── */}
                <div className="pb-3 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-500">Original invoice amount</span>
                    <span className="text-sm font-medium text-slate-700 tabular-nums font-mono">{formatPeso(bill.amount)}</span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-slate-500">Late payment penalty</span>
                      <span className="text-right shrink-0">
                        {isWaived && (
                          <span className="mr-1.5 text-xs text-slate-400 line-through tabular-nums font-mono">{formatPeso(autoPenalty)}</span>
                        )}
                        <span className="text-sm font-medium text-slate-700 tabular-nums font-mono">{formatPeso(currentPenalty)}</span>
                      </span>
                    </div>

                    {/* Integrated detail for the penalty row — a single rail
                        that scales to zero, one, or multiple simultaneous
                        states (automatic accrual, manual override, waiver)
                        without adding new rows. Every state (Automatic,
                        Manual Override, Partially/Fully Waived) surfaces as
                        a distinctly-colored tag so it's unmistakable without
                        a click; the fuller explanation, reason, and action
                        for the waiver sit one click behind "Show details"
                        so a routine automatic-penalty invoice stays compact
                        by default. No manual override of the calculation
                        exists anymore — Settings is always the source of
                        truth for what accrues; this rail only ever
                        reflects the automatic accrual and, once applied,
                        the waiver on top of it. The "Show details" toggle
                        itself is a minor disclosure control, so it's muted
                        (slate, not violet) — violet is reserved for the
                        real action (Waive Penalty) below. ── */}
                    <div className="mt-1.5 pl-3 border-l-2 border-slate-100">
                      {isWaived ? (
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700">
                              <CheckCircle size={10} />
                              {isFullyWaived ? 'Fully waived' : `Partially waived · ${formatPeso(waivedTotal)}`}
                            </span>
                            <button
                              onClick={() => setPenaltyDetailsExpanded((v) => !v)}
                              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-700"
                            >
                              {penaltyDetailsExpanded ? 'Hide details' : 'Show details'}
                              <CaretDown size={9} className={cn('transition-transform', penaltyDetailsExpanded && 'rotate-180')} />
                            </button>
                          </div>
                          {/* Waived invoices keep their calculation basis
                              visible alongside the waiver tag — same
                              structured label/value rows as the plain
                              Automatic state, for one consistent design
                              language across both, gated behind the same
                              "Show details" toggle instead of always
                              showing. */}
                          {isOverdueStatus && penaltyDetailsExpanded && (
                            <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                              <span className="text-slate-400">Rate</span>
                              <span className="text-slate-600 font-medium">{PENALTY_RULE.value}%</span>
                              <span className="text-slate-400">Frequency</span>
                              <span className="text-slate-600 font-medium">Every {PENALTY_RULE.repeatEveryDays} days</span>
                              <span className="text-slate-400">Applied</span>
                              <span className="text-slate-600 font-medium">{occurrences} time{occurrences !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      ) : isOverdueStatus ? (
                        // Same disclosure pattern as the Manual Override /
                        // Waived branch above: badge + "Show details" sit
                        // inline, sharing the one penaltyDetailsExpanded
                        // toggle, so a routine automatic-penalty invoice
                        // stays just as compact by default. Expanded content
                        // is structured label/value rows (Rate, Frequency,
                        // Applied) rather than a prose sentence — quicker to
                        // scan, and reads more like a rule definition.
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-violet-50 text-violet-700">
                              <CalendarBlank size={10} />
                              Automatic
                            </span>
                            <button
                              onClick={() => setPenaltyDetailsExpanded((v) => !v)}
                              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-700"
                            >
                              {penaltyDetailsExpanded ? 'Hide details' : 'Show details'}
                              <CaretDown size={9} className={cn('transition-transform', penaltyDetailsExpanded && 'rotate-180')} />
                            </button>
                          </div>
                          {penaltyDetailsExpanded && (
                            <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                              <span className="text-slate-400">Rate</span>
                              <span className="text-slate-600 font-medium">{PENALTY_RULE.value}%</span>
                              <span className="text-slate-400">Frequency</span>
                              <span className="text-slate-600 font-medium">Every {PENALTY_RULE.repeatEveryDays} days</span>
                              <span className="text-slate-400">Applied</span>
                              <span className="text-slate-600 font-medium">{occurrences} time{occurrences !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      ) : isPaidStatus ? (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Invoice paid — no penalty applied, penalty accrual settled.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          This invoice is not yet overdue, so no late payment penalty applies.
                        </p>
                      )}

                      {/* Waived — a self-contained, subtly-surfaced panel
                          (emerald wash matching the collapsed tag color)
                          grouping an icon, heading, explanation, the reason
                          with its existing clamp/expand untouched, and the
                          one real action (Waive Penalty, only while some
                          penalty still remains — a full waiver has nothing
                          left to waive) — rather than a sentence with a
                          floating link. Body copy stays neutral slate;
                          violet is reserved for that one real action,
                          rendered as a real Button rather than a text link. ── */}
                      {isWaived && penaltyDetailsExpanded && (
                        <div className="mt-2 space-y-2">
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle size={12} />
                              {isFullyWaived ? 'Fully waived' : `Partially waived · ${formatPeso(waivedTotal)}`}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                              The penalty on this invoice has been {isFullyWaived ? 'fully' : 'partially'} waived
                              {isFullyWaived ? '' : `, by ${formatPeso(waivedTotal)}`}.
                            </p>
                            {waiverReason && (
                              <div className="mt-1.5">
                                <p
                                  className={cn(
                                    'text-xs text-slate-500 leading-snug break-words',
                                    !isAmountReasonExpanded && waiverReasonNeedsClamp && 'line-clamp-2',
                                  )}
                                >
                                  <span className="font-medium text-slate-500">Reason: </span>
                                  {waiverReason}
                                </p>
                                {waiverReasonNeedsClamp && (
                                  <button
                                    onClick={() => toggleReason('amount-breakdown')}
                                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 mt-1"
                                  >
                                    {isAmountReasonExpanded ? 'Show less' : 'Show more'}
                                  </button>
                                )}
                              </div>
                            )}
                            {!isFullyWaived && (
                              <Button variant="outline" size="xs" onClick={openWaive} className="mt-2">
                                <HandCoins size={11} />
                                Waive Penalty
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Conclusion — Outstanding Balance reads as the result of
                     the calculation above, set apart by a shaded footer bar
                     (not a divider line) that spans the full card width. Its
                     primacy comes from weight (heaviest on the card), color
                     (the only slate-900 amount here), and generous
                     surrounding space — not from a tinted icon or the
                     largest font size on the card; this is a neutral
                     financial summary, not an action. ── */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 -mx-6 px-6 py-4 rounded-b-md">
                  <span className="text-sm font-semibold text-slate-700">Outstanding balance</span>
                  <span className="text-base font-bold text-slate-900 tracking-tight tabular-nums font-mono">
                    {formatPeso(outstandingBalance)}
                  </span>
                </div>
              </CardContent>
            </Card>
            {auditLogCard}
          </div>

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg px-4 py-3 text-sm font-medium text-emerald-700 max-w-sm">
              <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
              {toast}
            </div>
          )}
        </main>
      </div>

      {/* ── Waive Penalty dialog — the single, unified way to lower this
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
          <DialogHeader className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base font-semibold text-slate-900">Waive Penalty</DialogTitle>
            <p className="text-sm text-black leading-relaxed">
              Choose the amount of penalty to waive. This action cannot be undone.
            </p>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-600">Current remaining penalty</p>
              <p className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">{formatPeso(currentPenalty)}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Amount to waive</label>
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
              <label className="flex items-center gap-2 mt-0.5 w-fit cursor-pointer select-none">
                <Checkbox
                  className="size-5 border-slate-400"
                  checked={waiveAmountNum > 0 && waiveAmountNum === currentPenalty}
                  onCheckedChange={(checked) => {
                    if (checked) handleWaiveFullAmount();
                    else { setWaiveAmount(''); setWaiveErrors((prev) => ({ ...prev, amount: false })); }
                  }}
                />
                <span className="text-xs font-medium text-slate-700">Full amount</span>
              </label>
              {waiveErrors.amount && (
                <p className="text-xs text-red-500">Enter an amount between ₱0.01 and {formatPeso(currentPenalty)}.</p>
              )}
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
          <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-200 p-4">
            <Button variant="outline" size="md" onClick={() => setWaiveOpen(false)}>Cancel</Button>
            <Button colorScheme="primary" size="md" onClick={confirmWaive} disabled={isWaiveConfirmDisabled}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
