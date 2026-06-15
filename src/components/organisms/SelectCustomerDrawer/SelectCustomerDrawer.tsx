import { useState, useMemo, useEffect } from 'react';
import { MagnifyingGlass, X, User, Buildings, Check } from '@phosphor-icons/react';
import { Sheet, SheetContent } from '#/components/atoms/Sheet';
import { Input } from '#/components/atoms/Input';
import { Button } from '#/components/atoms/Button';
import { GroupCombobox } from '#/components/molecules/GroupCombobox';
import { formatPHPhone } from '#/utils/phoneFormat';
import { Customer, CustomerType } from '#/data/customers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#6366f1','#ef4444','#14b8a6','#f97316','#a855f7',
];

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectCustomerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onSelectMultiple?: (customers: Customer[]) => void;
  onNewCustomer?: (customer: Customer) => void;
  customers: Customer[];
  preselectedIds?: string[];
}

type Tab = 'select' | 'create';

const GROUP_PILL_LIMIT = 4;

// ─── Main component ───────────────────────────────────────────────────────────

export function SelectCustomerDrawer({
  open,
  onClose,
  onSelect,
  onSelectMultiple,
  onNewCustomer,
  customers,
  preselectedIds,
}: SelectCustomerDrawerProps) {
  const [tab, setTab] = useState<Tab>('select');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setPendingIds(new Set(preselectedIds ?? []));
    }
  }, [open]);

  // New customer form state
  const [newType, setNewType] = useState<CustomerType>('Individual');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGroups, setNewGroups] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');

  const groups = useMemo(() => {
    const seen = new Set<string>();
    customers.forEach((c) => { if (c.group) seen.add(c.group); });
    return Array.from(seen).sort();
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const matchesGroup = !activeGroup || c.group === activeGroup;
      return matchesSearch && matchesGroup;
    });
  }, [customers, search, activeGroup]);

  function resetForm() {
    setNewType('Individual');
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewGroups([]);
    setNameError('');
  }

  function handleClose() {
    setTab('select');
    setSearch('');
    setActiveGroup(null);
    setShowAllGroups(false);
    setPendingIds(new Set());
    resetForm();
    onClose();
  }

  function handleConfirm() {
    const selected = customers.filter((c) => pendingIds.has(c.id));
    if (onSelectMultiple) {
      onSelectMultiple(selected);
    } else if (selected.length === 1) {
      onSelect(selected[0]);
    }
    handleClose();
  }

  function togglePending(id: string) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleTabChange(next: Tab) {
    setTab(next);
    if (next === 'select') resetForm();
  }

  function handleCreateCustomer() {
    if (!newName.trim()) {
      setNameError('Name is required');
      return;
    }
    const name = newName.trim();
    const created: Customer = {
      id: `CST-${Date.now()}`,
      type: newType,
      name,
      avatarInitials: buildInitials(name),
      avatarColor: pickColor(name),
      email: newEmail.trim(),
      address: '',
      phoneNumber: newPhone.trim(),
      group: newGroups[0] ?? '',
      supportingDocuments: [],
      lastUpdatedAt: new Date().toLocaleString(),
      dateCreated: new Date().toLocaleString(),
    };
    onNewCustomer?.(created);
    onSelect(created);
    handleClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent side="right" size="md" className="p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
        <span className="text-base font-semibold text-slate-900">Select customer</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-slate-200 px-5 pt-3 pb-0 shrink-0">
        <TabButton label="Select existing" active={tab === 'select'} onClick={() => handleTabChange('select')} />
        <TabButton label="New customer" active={tab === 'create'} onClick={() => handleTabChange('create')} />
      </div>

      {tab === 'select' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {/* Search */}
            <div className="relative mb-3">
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                placeholder="Search by name, email, or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Group filter pills */}
            {groups.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <FilterPill
                  label="All"
                  active={!activeGroup}
                  onClick={() => setActiveGroup(null)}
                />
                {(showAllGroups ? groups : groups.slice(0, GROUP_PILL_LIMIT)).map((g) => (
                  <FilterPill
                    key={g}
                    label={g}
                    active={activeGroup === g}
                    onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                  />
                ))}
                {groups.length > GROUP_PILL_LIMIT && (
                  <button
                    onClick={() => setShowAllGroups((v) => !v)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {showAllGroups ? 'Show less' : `+${groups.length - GROUP_PILL_LIMIT} more`}
                  </button>
                )}
              </div>
            )}

            {/* Select / deselect all */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-end gap-3 mb-2">
                <button
                  onClick={() => setPendingIds((prev) => {
                    const next = new Set(prev);
                    filtered.forEach((c) => next.add(c.id));
                    return next;
                  })}
                  className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={() => setPendingIds((prev) => {
                    const next = new Set(prev);
                    filtered.forEach((c) => next.delete(c.id));
                    return next;
                  })}
                  className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors"
                >
                  Deselect all
                </button>
              </div>
            )}

            {/* Customer list or empty state */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm text-slate-500">
                  No customers found
                  {search && (
                    <>
                      {' '}for{' '}
                      <span className="font-medium text-slate-700">&ldquo;{search}&rdquo;</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  Try the{' '}
                  <button
                    onClick={() => handleTabChange('create')}
                    className="text-violet-600 underline underline-offset-2 hover:text-violet-700"
                  >
                    New customer
                  </button>
                  {' '}tab to add one.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((c) => (
                  <CustomerRow
                    key={c.id}
                    customer={c}
                    selected={pendingIds.has(c.id)}
                    onSelect={() => togglePending(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm footer */}
          {pendingIds.size > 0 && (
            <div className="shrink-0 border-t border-slate-200 px-4 py-3">
              <Button colorScheme="primary" className="w-full" onClick={handleConfirm}>
                Confirm {pendingIds.size} customer{pendingIds.size !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Customer type toggle */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Customer type
              </p>
              <div className="flex gap-2">
                {(['Individual', 'Organization'] as CustomerType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={[
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors',
                      newType === t
                        ? 'border-violet-400 bg-violet-50 text-violet-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {t === 'Individual' ? <User size={14} /> : <Buildings size={14} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Full name <span className="text-red-500">*</span>
              </p>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (e.target.value) setNameError('');
                }}
                placeholder={newType === 'Organization' ? 'Company or organization name' : 'Full name'}
                className={nameError ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-500">{nameError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Email address
              </p>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Phone number
              </p>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(formatPHPhone(e.target.value))}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>

            {/* Group */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Customer group
              </p>
              <GroupCombobox
                selected={newGroups}
                onChange={setNewGroups}
                groups={groups}
              />
            </div>

            {/* CTAs */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => handleTabChange('select')} className="flex-1 text-violet-700">
                Cancel
              </Button>
              <Button colorScheme="primary" onClick={handleCreateCustomer} className="flex-1">
                Create customer
              </Button>
            </div>
          </div>
        </div>
      )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 pb-2.5 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-violet-600 text-violet-700'
          : 'border-transparent text-slate-500 hover:text-slate-700',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-violet-100 text-violet-700'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function CustomerRow({
  customer,
  onSelect,
  selected = false,
}: {
  customer: Customer;
  onSelect: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={[
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
        selected ? 'bg-violet-50' : 'hover:bg-slate-50',
      ].join(' ')}
    >
      <span className={[
        'shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
        selected ? 'border-violet-600 bg-violet-600' : 'border-slate-300 bg-white',
      ].join(' ')}>
        {selected && <Check size={9} weight="bold" className="text-white" />}
      </span>
      <span
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: customer.avatarColor }}
      >
        {customer.avatarInitials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800">{customer.name}</p>
        {customer.email && (
          <p className="truncate text-xs text-slate-500">{customer.email}</p>
        )}
      </div>
      <span
        className={[
          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
          customer.type === 'Organization'
            ? 'bg-blue-50 text-blue-600'
            : 'bg-emerald-50 text-emerald-600',
        ].join(' ')}
      >
        {customer.type}
      </span>
    </button>
  );
}
