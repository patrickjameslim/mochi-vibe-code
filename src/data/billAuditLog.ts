import { useSyncExternalStore } from 'react';

// ─── Per-bill Audit Log store — backed by localStorage (keyed per bill id),
// shared by BOTH the one-off Bill's "Manage Penalty" page and the Recurring
// Bill Info page. This exists (rather than plain component state) because
// "View Audit Log" always opens in a NEW TAB — a completely separate JS
// runtime from the tab where a waiver/undo/etc. actually happened. Plain
// React state could never bridge that gap; shared storage + the native
// `storage` event (which only fires in OTHER tabs — exactly the case we
// need) can. ──

export type AuditEntry = {
  ts: string;
  actor: string;
  action: string;
  detail?: string;
};

const KEY_PREFIX = 'mochi:billAuditLog:';
function storageKey(billId: string): string {
  return `${KEY_PREFIX}${billId}`;
}

// In-memory cache, one array reference per bill — required by
// useSyncExternalStore: its getSnapshot must return the SAME reference
// across calls whenever nothing has actually changed, or React sees a
// "new" value on every render and spins into an infinite update loop.
// JSON.parse-ing localStorage fresh on every read (as a naive
// implementation would) violates exactly that, so every read/write here
// goes through this cache instead of parsing directly.
const cache = new Map<string, AuditEntry[]>();

function loadFromStorage(billId: string): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(billId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureCached(billId: string): AuditEntry[] {
  if (!cache.has(billId)) cache.set(billId, loadFromStorage(billId));
  return cache.get(billId)!;
}

function commit(billId: string, entries: AuditEntry[]) {
  cache.set(billId, entries);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey(billId), JSON.stringify(entries));
    } catch {
      // Storage can fail (private mode, quota) — the in-memory cache above
      // still updates for the current tab, which is what matters most;
      // persistence (and therefore cross-tab visibility) just won't.
    }
  }
  notify(billId);
}

// Seeds this bill's log ONLY the first time it's ever read (nothing
// persisted yet) — called with a freshly-computed seed. Every later call is
// a no-op, so manual actions already logged never get silently overwritten
// by a re-seed. Meant for the standalone "?panel=audit-log" viewer tab: it
// should show whatever the main tab's session has done, not reset it.
export function ensureAuditLogSeeded(billId: string, seed: AuditEntry[]) {
  const alreadyPersisted = typeof window !== 'undefined' && window.localStorage.getItem(storageKey(billId)) != null;
  if (!alreadyPersisted) commit(billId, seed);
}

// Unconditionally overwrites this bill's log with a fresh seed, discarding
// any manual activity from a previous session. Meant for the MAIN bill
// page's own mount/reload — every fresh visit (or refresh) of the actual
// bill starts a clean session; only a separately-opened Audit Log viewer
// tab (see ensureAuditLogSeeded above) is meant to survive that reset live.
export function resetAuditLog(billId: string, seed: AuditEntry[]) {
  commit(billId, seed);
}

export function getAuditLog(billId: string): AuditEntry[] {
  return ensureCached(billId);
}

// Appends one entry to the front (newest-first, matching how every reader
// of this log expects entries ordered).
export function pushAuditEntry(billId: string, action: string, detail?: string) {
  const next: AuditEntry = { ts: 'Just now', actor: 'Juan A. Dela Cruz', action, detail };
  commit(billId, [next, ...ensureCached(billId)]);
}

const listenersByBill = new Map<string, Set<() => void>>();

function notify(billId: string) {
  listenersByBill.get(billId)?.forEach((listener) => listener());
}

function subscribe(billId: string, listener: () => void): () => void {
  let set = listenersByBill.get(billId);
  if (!set) {
    set = new Set();
    listenersByBill.set(billId, set);
  }
  set.add(listener);

  // Cross-tab: the `storage` event only fires in OTHER tabs/windows than
  // the one that wrote the change — exactly the case a separately-opened
  // "View Audit Log" tab needs. Refresh this tab's cache from the value
  // the other tab just wrote BEFORE notifying, so the next getSnapshot()
  // call returns a fresh (but then stable-until-next-change) reference.
  function onStorage(e: StorageEvent) {
    if (e.key !== storageKey(billId)) return;
    cache.set(billId, loadFromStorage(billId));
    listener();
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);

  return () => {
    set!.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

// Live-reactive read, scoped to one bill — updates immediately within the
// same tab (e.g. Payment Management pushes a waiver), and updates in any
// OTHER tab that has this same bill's Audit Log open, the moment the
// other tab's action writes to storage.
export function useAuditLog(billId: string): AuditEntry[] {
  return useSyncExternalStore(
    (listener) => subscribe(billId, listener),
    () => getAuditLog(billId),
    () => [],
  );
}
