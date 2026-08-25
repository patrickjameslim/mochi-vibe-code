import { useSyncExternalStore } from 'react';

// ─── Overdue Payment Penalties — shared configuration ──────────────────────
// This is the single source of truth for how overdue-invoice penalties are
// calculated and displayed everywhere in the app. The Settings →
// "Overdue Payment Penalties" page is the only place that WRITES this
// (via setPenaltySettings, only on an explicit Save). Every bill-facing
// surface (Bill Info page's Penalty Management card, the Recurring Bill
// Info page's Payment Management card) only READS it, so a bill can never
// show a calculation type, rate, or compounding behavior that conflicts
// with what's actually saved here.
//
// IMPORTANT: there is only ONE penalty configuration, and it applies to
// EVERY bill regardless of that bill's own type. "One-time" and
// "Recurring" describe how a BILL is generated (the Bill data model's own
// `type` field) — they are never separate penalty configurations, and the
// word "Recurring" never refers to a distinct kind of penalty here.
// - Compounding OFF: the configured charge is applied exactly once, when
//   the bill becomes overdue, against the original invoice amount —
//   forever, no matter how long the bill stays unpaid or what kind of
//   bill it is.
// - Compounding ON: Compound Every becomes the sole cadence driving BOTH
//   when the balance updates AND when the charge itself gets re-applied,
//   for as long as the bill remains unpaid — again, regardless of bill
//   type.
//
// There's no real backend in this app, so this is backed by a simple
// in-memory module value plus a tiny pub/sub — NOT localStorage. That's
// deliberate: a Save should apply live to every bill-facing surface for
// the rest of the current session (no reload needed), but refreshing the
// page/localhost should always come back up on the untouched
// DEFAULT_PENALTY_SETTINGS, as if nothing had ever been saved. Anything
// actually persisted (e.g. surviving a refresh) would fight that.


export type PenaltyCalcType = 'percentage' | 'fixed';
export type RepeatUnit = 'Days' | 'Weeks' | 'Months';

// A single unified overdue-penalty rule — applies to every bill. With
// Compounding off, the charge is applied exactly once, forever, against
// the original invoice amount. With Compounding on, its own Compound
// Every period becomes the only cadence for both updating the balance and
// re-applying the charge.
export interface PenaltyRuleConfig {
  enabled: boolean;
  type: PenaltyCalcType;
  value: number;
  compounding: boolean;
  compoundEvery: number;
  compoundUnit: RepeatUnit;
}

export interface PenaltySettings {
  penalty: PenaltyRuleConfig;
}

// Enabled out of the box — any overdue bill should still get a penalty by
// default. Matches the numbers every existing demo bill has already been
// verified against (5% flat, applied once).
export const DEFAULT_PENALTY_SETTINGS: PenaltySettings = {
  penalty: {
    enabled: true,
    type: 'percentage',
    value: 5,
    compounding: false,
    compoundEvery: 1,
    compoundUnit: 'Weeks',
  },
};

// Plain module-level value — reinitialized to DEFAULT_PENALTY_SETTINGS on
// every fresh load of the module (i.e. every full page refresh), and
// mutated only by setPenaltySettings below. Nothing here reads or writes
// localStorage on purpose: a refresh must always come back to the
// defaults, never to whatever was last saved.
let currentSettings: PenaltySettings = DEFAULT_PENALTY_SETTINGS;
const listeners = new Set<() => void>();

export function getPenaltySettings(): PenaltySettings {
  return currentSettings;
}

// Only called by the Settings page, and only on an explicit Save — never on
// every keystroke — so a bill only ever reflects the last SAVED
// configuration, never an in-progress edit. Applies live, for the rest of
// THIS session only — refreshing the page resets back to
// DEFAULT_PENALTY_SETTINGS, since this is intentionally in-memory only.
export function setPenaltySettings(next: PenaltySettings) {
  currentSettings = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Live-reactive read — any mounted component using this re-renders the
// moment Settings saves a change, no reload needed.
export function usePenaltySettings(): PenaltySettings {
  return useSyncExternalStore(subscribe, getPenaltySettings, () => DEFAULT_PENALTY_SETTINGS);
}

// ─── Shared calculation ─────────────────────────────────────────────────────

export function intervalDays(repeatEvery: number, unit: RepeatUnit): number {
  if (unit === 'Weeks') return repeatEvery * 7;
  if (unit === 'Months') return repeatEvery * 30;
  return repeatEvery;
}

export interface PenaltyOccurrence {
  index: number;
  date: Date;
  amount: number;
  // The balance this occurrence's percentage was actually computed against
  // — the original invoice amount when not compounding, or the running
  // overdue balance (invoice + every prior penalty) when compounding. Kept
  // per-occurrence so descriptions can stay accurate regardless of mode,
  // instead of assuming a single flat rate applies to every entry.
  base: number;
}

export interface RecurringPenaltyBreakdown {
  occurrences: PenaltyOccurrence[];
  total: number;
}

// Internal engine: repeatedly applies a charge on a fixed-day cadence,
// re-basing it against the running overdue balance whenever compounding is
// on. Not exported — the only cadence a bill's penalty ever has now is its
// own Compound Every period, so every external caller goes through
// computePenalty below, which maps compoundEvery/compoundUnit onto this.
function applyRepeatingPenalty(
  bill: { amount: number; dueDate: string },
  daysOutstanding: number,
  rule: {
    type: PenaltyCalcType;
    value: number;
    repeatEvery: number;
    repeatUnit: RepeatUnit;
    compounding: boolean;
    compoundEvery: number;
    compoundUnit: RepeatUnit;
  },
): RecurringPenaltyBreakdown {
  const repeatDays = intervalDays(rule.repeatEvery, rule.repeatUnit);
  const count = repeatDays > 0 ? Math.floor(daysOutstanding / repeatDays) + 1 : 0;
  const compoundDays = rule.compounding ? intervalDays(rule.compoundEvery, rule.compoundUnit) : 0;

  // Running total of charges accrued within each compounding period index
  // (0 = the first compounding period, 1 = the second, etc.) — kept
  // separate from `total` so a later period's base can look back at
  // exactly what was charged in each PRIOR period, without re-deriving it.
  const periodTotals: number[] = [];
  const occurrences: PenaltyOccurrence[] = [];
  let total = 0;

  for (let i = 0; i < count; i++) {
    const dayOffset = (i + 1) * repeatDays;
    const periodIndex = rule.compounding && compoundDays > 0 ? Math.floor((dayOffset - 1) / compoundDays) : 0;

    // Base = the original invoice amount plus every FULLY-completed prior
    // compounding period's total — charges within the CURRENT period never
    // affect their own period's base, only the next one's.
    let priorAccrued = 0;
    for (let p = 0; p < periodIndex; p++) priorAccrued += periodTotals[p] ?? 0;
    const base = bill.amount + priorAccrued;

    const amount = rule.type === 'fixed' ? rule.value : base * (rule.value / 100);
    const date = new Date(bill.dueDate);
    date.setDate(date.getDate() + dayOffset);
    occurrences.push({ index: i + 1, date, amount, base });
    total += amount;
    periodTotals[periodIndex] = (periodTotals[periodIndex] ?? 0) + amount;
  }

  return { occurrences, total };
}

// The single penalty calculation used for EVERY bill, regardless of its own
// type (one-time or recurring) — there is no longer a separate calculation
// path for "recurring" bills:
// - Compounding OFF: a genuine single charge, applied once against the
//   original invoice amount, and never recalculated again no matter how
//   long the bill stays overdue.
// - Compounding ON: Compound Every becomes the only cadence available — it
//   drives both when the balance updates AND, necessarily, when the charge
//   itself gets recalculated (there'd be nothing to "update" the balance
//   for otherwise). Internally reuses the same repeating-penalty engine as
//   before (Repeat Every = Compound Every), which keeps the math identical
//   to what "Recurring" used to do on its own independent schedule.
export function computePenalty(
  bill: { amount: number; dueDate: string },
  daysOutstanding: number,
  rule: PenaltyRuleConfig,
): RecurringPenaltyBreakdown {
  if (!rule.enabled || daysOutstanding <= 0) {
    return { occurrences: [], total: 0 };
  }

  if (!rule.compounding) {
    const amount = rule.type === 'percentage' ? bill.amount * (rule.value / 100) : rule.value;
    const date = new Date(bill.dueDate);
    date.setDate(date.getDate() + 1);
    return { occurrences: [{ index: 1, date, amount, base: bill.amount }], total: amount };
  }

  return applyRepeatingPenalty(bill, daysOutstanding, {
    type: rule.type,
    value: rule.value,
    repeatEvery: rule.compoundEvery,
    repeatUnit: rule.compoundUnit,
    compounding: true,
    compoundEvery: rule.compoundEvery,
    compoundUnit: rule.compoundUnit,
  });
}
