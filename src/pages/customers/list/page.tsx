import { useState, useEffect, useMemo, useRef, forwardRef, type ReactNode, type CSSProperties } from 'react';
import { useCustomFields } from '#/context/CustomFieldsContext';
import { useCustomers } from '#/context/CustomersContext';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowsDownUp,
  ArrowCounterClockwise,
  Copy,
  DotsThreeVertical,
  Funnel,
  CaretDown,
  Plus,
  BellSimple,
  CaretRight,
  Notepad,
  PencilSimple,
  UsersThree,
  Archive,
  X,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import { BulkActionsBar, BulkAction } from '#/components/molecules/BulkActionsBar';
import { Customer, SupportingDocFile } from '#/data/customers';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '#/components/atoms/Tooltip';
import { Highlight } from '#/components/molecules/Highlight';
import { SortTh } from '#/components/molecules/SortTh';
import { useTableSort } from '#/hooks/useTableSort';
import { useStickyColumns } from '#/hooks/useStickyColumns';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/atoms/DropdownMenu';
import { AssignGroupsDrawer } from '#/components/organisms/AssignGroupsDrawer';
import { SuccessBanner } from '#/components/molecules/SuccessBanner';
import { CustomerGroupsPage as CustomerGroupsTable } from '#/pages/customers/groups/page';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '#/components/atoms/Sheet';
import { Badge } from '#/components/atoms/Badge';
import {
  FilePdf, FileDoc, FileXls, FileCsv, FileZip,
  File as FileIcon, ArrowSquareOut,
} from '@phosphor-icons/react';
import { ColumnManagementDrawer, ColumnDef } from '#/components/molecules/ColumnManagementDrawer';
import { ColumnsButton } from '#/components/molecules/ColumnsButton';
import {
  FilterDrawer,
  FilterSectionDef,
  FilterValue,
  countActiveFilters,
  matchesDateRange,
} from '#/components/molecules/FilterDrawer';
import { DataTable } from '#/components/molecules/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '#/components/atoms/Dialog';
import { Button } from '#/components/atoms/Button';
import { Input } from '#/components/atoms/Input';

// ─── Column config ────────────────────────────────────────────────────────────

const DEFAULT_CUSTOMER_COLS: ColumnDef[] = [
  { id: 'customerID',      label: 'Customer ID',          visible: true,  pin: 'none' },
  { id: 'type',            label: 'Customer type',        visible: true,  pin: 'none' },
  { id: 'name',            label: 'Customer name',        visible: true,  pin: 'none' },
  { id: 'email',           label: 'Customer email',       visible: true,  pin: 'none' },
  { id: 'address',         label: 'Customer address',     visible: true,  pin: 'none' },
  { id: 'phone',           label: 'Customer phone',       visible: true,  pin: 'none' },
  { id: 'group',           label: 'Customer group',       visible: true,  pin: 'none' },
  { id: 'supportingDocs',  label: 'Supporting documents', visible: true,  pin: 'none' },
  { id: 'notes',           label: 'Notes',                visible: true,  pin: 'none' },
  { id: 'lastUpdatedAt',   label: 'Last updated at',      visible: true,  pin: 'none' },
  { id: 'dateCreated',     label: 'Date created',         visible: true,  pin: 'none' },
  { id: 'quickActions',    label: 'Quick actions',        visible: true,  pin: 'none' },
];

// ─── Sort config ──────────────────────────────────────────────────────────────

type CustomerSortKey = 'id' | 'type' | 'name' | 'email' | 'address' | 'phone' | 'group' | 'lastUpdatedAt' | 'dateCreated';

const COL_SORT_KEY: Partial<Record<string, CustomerSortKey>> = {
  customerID:    'id',
  type:          'type',
  name:          'name',
  email:         'email',
  address:       'address',
  phone:         'phone',
  group:         'group',
  lastUpdatedAt: 'lastUpdatedAt',
  dateCreated:   'dateCreated',
};

// Approximate column widths (px) for sticky offset calculation
const COL_WIDTH: Record<string, number> = {
  customerID: 120, type: 130, name: 165, email: 195, address: 210,
  phone: 145, group: 165, supportingDocs: 165, notes: 85,
  lastUpdatedAt: 145, dateCreated: 135, quickActions: 115,
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

// ─── Icon Button ─────────────────────────────────────────────────────────────
const IconButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode;
    ghost?: boolean;
    onClick?: () => void;
  }
>(({ children, ghost = false, onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center w-7 h-7 rounded transition-colors',
        ghost
          ? 'text-slate-500 hover:bg-slate-100'
          : 'text-slate-500 border border-slate-200 hover:bg-slate-50',
      ].join(' ')}
    >
      {children}
    </button>
  );
});

// ─── Group Cell ───────────────────────────────────────────────────────────────
const MAX_VISIBLE = 3;

function GroupCell({
  groups,
  expanded,
  onToggleExpand,
}: {
  groups: string[];
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const hidden = groups.length - MAX_VISIBLE;
  const visible = expanded ? groups : groups.slice(0, MAX_VISIBLE);

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visible.map((g) => (
        <Badge key={g} colorScheme="secondary" className="whitespace-nowrap">
          {g}
        </Badge>
      ))}
      {!expanded && hidden > 0 && (
        <button
          onClick={onToggleExpand}
          className="text-xs font-medium text-violet-600 hover:text-violet-800 whitespace-nowrap"
        >
          +{hidden} more
        </button>
      )}
      {expanded && hidden > 0 && (
        <button
          onClick={onToggleExpand}
          className="text-xs font-medium text-violet-600 hover:text-violet-800 whitespace-nowrap"
        >
          − Show less
        </button>
      )}
    </div>
  );
}

// ─── Drawer state shared across rows ─────────────────────────────────────────
interface DrawerState {
  open: boolean;
  customer: Customer | null;
}

// ─── Main Table ───────────────────────────────────────────────────────────────
export function CustomersListPage() {
  const navigate = useNavigate();
  const { customers, setCustomers, pendingBanner, setPendingBanner, groupOverride, setGroupOverride } = useCustomers();

  const { sortKey, sortAsc, toggleSort } = useTableSort<CustomerSortKey>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'All' | 'Individual' | 'Organization' | 'Customer groups' | 'Draft' | 'Archived'>('All');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, customer: null });
  const [banner, setBanner] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [perPage, setPerPage]       = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Column management
  const [columnConfig, setColumnConfig] = useState<ColumnDef[]>(DEFAULT_CUSTOMER_COLS);
  const [colDrawerOpen, setColDrawerOpen] = useState(false);

  // Filter drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterValue>({});

  const { savedCustomFields } = useCustomFields();
  useEffect(() => {
    setColumnConfig(prev => {
      const standard = prev.filter(c => !c.id.startsWith('cf_'));
      const cfCols: ColumnDef[] = savedCustomFields
        .filter(f => f.visible)
        .map(f => ({ id: `cf_${f.id}`, label: f.label, visible: true, pin: 'none' as const }));
      const insertAt = standard.findIndex(c => c.id === 'quickActions');
      const idx = insertAt >= 0 ? insertAt : standard.length;
      return [...standard.slice(0, idx), ...cfCols, ...standard.slice(idx)];
    });
  }, [savedCustomFields]);

  // Notes drawer
  const [notesDrawer, setNotesDrawer] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });
  const [newNoteText, setNewNoteText] = useState('');
  const notesEndRef = useRef<HTMLDivElement>(null);
  // Docs viewer drawer
  const [docsDrawer, setDocsDrawer] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });
  // Archive state
  const [archivedCustomers, setArchivedCustomers] = useState<Set<string>>(new Set());
  const [archiveModal, setArchiveModal] = useState<{ open: boolean; customer: Customer | null; inputValue: string }>({ open: false, customer: null, inputValue: '' });
  const [unarchiveModal, setUnarchiveModal] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });
  const [bulkArchiveModal, setBulkArchiveModal] = useState(false);
  const [bulkUnarchiveModal, setBulkUnarchiveModal] = useState(false);
  const [bulkGroupsDrawerOpen, setBulkGroupsDrawerOpen] = useState(false);

  useEffect(() => {
    if (pendingBanner) {
      setBanner(pendingBanner);
      setPendingBanner(null);
    }
  }, [pendingBanner]); // eslint-disable-line react-hooks/exhaustive-deps

  const [customerGroups, setCustomerGroups] = useState<Record<string, string[]>>(
    () => Object.fromEntries(customers.map((c) => [c.id, [c.group]]))
  );

  useEffect(() => {
    setCustomerGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      customers.forEach((c) => {
        if (!next[c.id]) { next[c.id] = [c.group]; changed = true; }
      });
      return changed ? next : prev;
    });
  }, [customers]);

  useEffect(() => {
    if (!groupOverride) return;
    setCustomerGroups((prev) => ({ ...prev, [groupOverride.id]: groupOverride.groups }));
    setGroupOverride(null);
  }, [groupOverride]); // eslint-disable-line react-hooks/exhaustive-deps

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const q = search.trim().toLowerCase();

  const draftCount = customers.filter((c) => c.status === 'draft' && !archivedCustomers.has(c.id)).length;

  const filtered = customers.filter((c) => {
    const isArchived = archivedCustomers.has(c.id);
    const isDraft = c.status === 'draft';

    const matchesSearch = !q || (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q) ||
      c.group.toLowerCase().includes(q)
    );

    if (activeTab === 'Archived') {
      return isArchived && matchesSearch;
    }

    if (activeTab === 'Draft') {
      return isDraft && !isArchived && matchesSearch;
    }

    // All other tabs: exclude archived and drafts
    if (isArchived || isDraft) return false;

    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Individual' && c.type === 'Individual') ||
      (activeTab === 'Organization' && c.type === 'Organization') ||
      activeTab === 'Customer groups';

    if (!(matchesTab && matchesSearch)) return false;

    // Drawer filters
    const fType = appliedFilters.type ?? [];
    if (fType.length > 0 && !fType.includes(c.type)) return false;

    const fGroup = appliedFilters.group ?? [];
    const cGroups = customerGroups[c.id] ?? [c.group];
    if (fGroup.length > 0 && !fGroup.some((g) => cGroups.includes(g))) return false;

    if (!matchesDateRange(c.dateCreated,   appliedFilters.dateCreated   ?? [])) return false;
    if (!matchesDateRange(c.lastUpdatedAt, appliedFilters.lastUpdatedAt ?? [])) return false;

    return true;
  });

  const sorted = sortKey === null ? filtered : [...filtered].sort((a, b) => {
    let cmp = 0;
    if      (sortKey === 'id')            cmp = a.id.localeCompare(b.id);
    else if (sortKey === 'type')          cmp = a.type.localeCompare(b.type);
    else if (sortKey === 'name')          cmp = a.name.localeCompare(b.name);
    else if (sortKey === 'email')         cmp = a.email.localeCompare(b.email);
    else if (sortKey === 'address')       cmp = a.address.localeCompare(b.address);
    else if (sortKey === 'phone')         cmp = a.phoneNumber.localeCompare(b.phoneNumber);
    else if (sortKey === 'group')         cmp = a.group.localeCompare(b.group);
    else if (sortKey === 'lastUpdatedAt') cmp = new Date(a.lastUpdatedAt).getTime() - new Date(b.lastUpdatedAt).getTime();
    else if (sortKey === 'dateCreated')   cmp = new Date(a.dateCreated).getTime()   - new Date(b.dateCreated).getTime();
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  function handleTabChange(tab: typeof activeTab) {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearch('');
  }

  function handlePerPageChange(v: number) {
    setPerPage(v);
    setCurrentPage(1);
  }

  const allChecked  = paginated.length > 0 && paginated.every((c) => selected.has(c.id));
  const someChecked = paginated.some((c) => selected.has(c.id)) && !allChecked;

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((c) => c.id)));
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openAssignGroups(customer: Customer) {
    setDrawer({ open: true, customer });
  }

  function closeDrawer() {
    setDrawer((prev) => ({ ...prev, open: false }));
  }

  // ─── Bulk helpers ─────────────────────────────────────────────────────────────
  const selectedCustomers = useMemo(
    () => paginated.filter((c) => selected.has(c.id)),
    [paginated, selected],
  );

  const allSelectedSameGroups = useMemo(() => {
    if (selectedCustomers.length === 0) return false;
    const first = JSON.stringify([...(customerGroups[selectedCustomers[0].id] ?? [selectedCustomers[0].group])].sort());
    return selectedCustomers.every(
      (c) => JSON.stringify([...(customerGroups[c.id] ?? [c.group])].sort()) === first,
    );
  }, [selectedCustomers, customerGroups]);

  const bulkCustomerInitialGroups = useMemo(
    () => selectedCustomers.length > 0 ? (customerGroups[selectedCustomers[0].id] ?? [selectedCustomers[0].group]) : [],
    [selectedCustomers, customerGroups],
  );

  function handleBulkGroupsSave(groups: string[]) {
    setCustomerGroups((prev) => {
      const next = { ...prev };
      selectedCustomers.forEach((c) => { next[c.id] = groups; });
      return next;
    });
    setBulkGroupsDrawerOpen(false);
    setSelected(new Set());
  }

  function handleBulkArchive() {
    setBulkArchiveModal(true);
  }

  function handleConfirmBulkArchive() {
    setArchivedCustomers((prev) => {
      const next = new Set(prev);
      selectedCustomers.forEach((c) => next.add(c.id));
      return next;
    });
    setBulkArchiveModal(false);
    const count = selectedCustomers.length;
    setSelected(new Set());
    setBanner(`${count} customer${count !== 1 ? 's' : ''} archived successfully.`);
  }

  function handleConfirmBulkUnarchive() {
    setArchivedCustomers((prev) => {
      const next = new Set(prev);
      selectedCustomers.forEach((c) => next.delete(c.id));
      return next;
    });
    setBulkUnarchiveModal(false);
    const count = selectedCustomers.length;
    setSelected(new Set());
    setBanner(`${count} customer${count !== 1 ? 's' : ''} unarchived successfully.`);
  }

  function handleConfirmArchive() {
    if (!archiveModal.customer) return;
    const customer = archiveModal.customer;
    setArchivedCustomers((prev) => { const next = new Set(prev); next.add(customer.id); return next; });
    setSelected((prev) => { const next = new Set(prev); next.delete(customer.id); return next; });
    setArchiveModal({ open: false, customer: null, inputValue: '' });
    setBanner(`${customer.name} has been archived.`);
  }

  function handleConfirmUnarchive() {
    if (!unarchiveModal.customer) return;
    const customer = unarchiveModal.customer;
    setArchivedCustomers((prev) => { const next = new Set(prev); next.delete(customer.id); return next; });
    setUnarchiveModal({ open: false, customer: null });
    setBanner(`${customer.name} has been unarchived.`);
  }

  const bulkCustomerActions = useMemo((): BulkAction[] => {
    const actions: BulkAction[] = [];
    if (allSelectedSameGroups) {
      actions.push({
        label: 'Assign group',
        icon: <UsersThree size={15} />,
        onClick: () => setBulkGroupsDrawerOpen(true),
      });
    }
    if (activeTab === 'Archived') {
      actions.push({
        label: 'Unarchive',
        icon: <ArrowCounterClockwise size={15} />,
        onClick: () => setBulkUnarchiveModal(true),
      });
    } else {
      actions.push({
        label: 'Archive',
        icon: <Archive size={15} />,
        onClick: handleBulkArchive,
        variant: 'destructive',
      });
    }
    return actions;
  }, [allSelectedSameGroups, selectedCustomers, activeTab]);

  function handleSaveGroups(customerId: string, groups: string[]) {
    setCustomerGroups((prev) => ({ ...prev, [customerId]: groups }));
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.delete(customerId);
      return next;
    });
    const customer = customers.find((c) => c.id === customerId);
    const count = groups.length;
    const groupLabel = count === 1 ? 'group' : 'groups';
    setBanner(
      `${customer?.name ?? 'Customer'}'s ${groupLabel} ${count === 0 ? 'have been cleared.' : `updated — ${count} ${groupLabel} assigned successfully.`}`
    );
  }

  function toggleExpand(customerId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(customerId) ? next.delete(customerId) : next.add(customerId);
      return next;
    });
  }

  // ─── Compute visible ordered columns + sticky offsets ────────────────────────
  const { visibleCols, colHeaderStyle, colCellStyle, hasLeftPinned } = useStickyColumns(columnConfig, COL_WIDTH);

  // Count active pins/hidden for button badge
  const activeColChanges = columnConfig.filter((c) => !c.visible || c.pin !== 'none').length;

  // Filter sections — derived from column list; group options from live data
  const availableGroups = useMemo(
    () => [...new Set(Object.values(customerGroups).flat())].sort(),
    [customerGroups],
  );

  const filterSections = useMemo((): FilterSectionDef[] => [
    {
      id: 'type',
      label: 'Customer type',
      type: 'checkbox',
      options: [
        { value: 'Organization', label: 'Organization' },
        { value: 'Individual',   label: 'Individual' },
      ],
    },
    {
      id: 'group',
      label: 'Customer group',
      type: 'checkbox',
      options: availableGroups.map((g) => ({ value: g, label: g })),
    },
    { id: 'dateCreated',   label: 'Date created',    type: 'dateRange' },
    { id: 'lastUpdatedAt', label: 'Last updated at',  type: 'dateRange' },
  ], [availableGroups]);

  const activeFilterCount = countActiveFilters(filterSections, appliedFilters);

  // ─── Headers ─────────────────────────────────────────────────────────────────
  const headers = visibleCols.map((col) => {
    const style = colHeaderStyle(col.id);
    const isPinned = !!style.position;
    return (
      <SortTh
        key={col.id}
        colSortKey={COL_SORT_KEY[col.id]}
        activeSortKey={sortKey}
        sortAsc={sortAsc}
        onSort={toggleSort as (key: string) => void}
        style={style}
      >
        {isPinned && <PinIndicator />}
        {col.label}
      </SortTh>
    );
  });

  // ─── Rows ─────────────────────────────────────────────────────────────────────
  const rows = paginated.map((customer) => (
    <CustomerRow
      key={customer.id}
      customer={customer}
      groups={customerGroups[customer.id] ?? [customer.group]}
      visibleCols={visibleCols}
      colStyle={colCellStyle}
      checkboxSeparator={!hasLeftPinned}
      isExpanded={expandedRows.has(customer.id)}
      isSelected={selected.has(customer.id)}
      isArchived={archivedCustomers.has(customer.id)}
      query={q}
      onToggle={() => toggleRow(customer.id)}
      onAssignGroups={() => openAssignGroups(customer)}
      onToggleExpand={() => toggleExpand(customer.id)}
      onViewNotes={() => { setNewNoteText(''); setNotesDrawer({ open: true, customer }); }}
      onViewDocs={() => setDocsDrawer({ open: true, customer })}
      onEdit={() => navigate({ to: '/customers/$id/edit', params: { id: customer.id } })}
      onView={() =>
        customer.status === 'draft'
          ? navigate({ to: '/customers/create' })
          : navigate({ to: '/customers/$id/view', params: { id: customer.id } })
      }
      onArchive={() => setArchiveModal({ open: true, customer, inputValue: '' })}
      onUnarchive={() => setUnarchiveModal({ open: true, customer })}
    />
  ));

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <AppSidebar />

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
            <nav className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>Dashboard</span>
              <CaretRight size={12} />
              <span className="text-slate-900 font-medium">Customers</span>
            </nav>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <BellSimple size={16} />
            </button>
          </header>

          {banner && (
            <SuccessBanner message={banner} onDismiss={() => setBanner(null)} />
          )}

          <div className="px-6 py-5">
            {/* Page title + actions */}
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Customers</h1>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Export data
                  <CaretDown size={13} />
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Bulk create customer(s)
                </button>
                <button
                  onClick={() => navigate({ to: '/customers/create' })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  <Plus size={15} weight="bold" />
                  Create a new customer
                </button>
              </div>
            </div>

            {/* Card */}
            <DataTable
              cardClass="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              tabs={[
                { value: 'All', label: 'All' },
                { value: 'Individual', label: 'Individual' },
                { value: 'Organization', label: 'Organization' },
                { value: 'Customer groups', label: 'Customer groups' },
              ]}
              rightTabs={[
                { value: 'Draft', label: 'Draft', count: draftCount },
                { value: 'Archived', label: 'Archived', count: archivedCustomers.size },
              ]}
              activeTab={activeTab}
              onTabChange={(v) => handleTabChange(v as typeof activeTab)}
              showTopScrollbar={activeTab !== 'Customer groups'}
              search={search}
              onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
              toolbarEnd={
                <>
                  <button
                    onClick={() => setFilterDrawerOpen(true)}
                    className={[
                      'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                      activeFilterCount > 0
                        ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <Funnel size={14} />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold leading-none">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <ArrowsDownUp size={14} />
                    Last updated at
                  </button>
                  <ColumnsButton onClick={() => setColDrawerOpen(true)} activeChanges={activeColChanges} />
                </>
              }
              allChecked={allChecked}
              someChecked={someChecked}
              onToggleAll={toggleAll}
              hasLeftPinned={hasLeftPinned}
              headers={headers}
              rows={rows}
              customContent={
                activeTab === 'Customer groups'
                  ? <CustomerGroupsTable
                      customers={customers}
                      customerGroups={customerGroups}
                      onAssignGroups={openAssignGroups}
                      searchQuery={search}
                    />
                  : undefined
              }
              isEmpty={paginated.length === 0}
              emptyTitle={
                activeTab === 'Archived' ? 'No archived customers' :
                activeTab === 'Draft'    ? 'No draft customers' :
                'No results'
              }
              emptyMessage={
                activeTab === 'Archived' ? 'Customers you archive will appear here.' :
                activeTab === 'Draft'    ? 'Customers saved as drafts will appear here.' :
                'Nothing to show here.'
              }
              currentPage={activeTab === 'Customer groups' ? 1 : safePage}
              totalPages={activeTab === 'Customer groups' ? 1 : totalPages}
              perPage={perPage}
              totalRows={activeTab === 'Customer groups' ? customers.length : filtered.length}
              onPageChange={activeTab === 'Customer groups' ? () => {} : setCurrentPage}
              onPerPageChange={handlePerPageChange}
            />
          </div>
        </div>

        {/* Assign Groups Drawer */}
        {drawer.customer && (
          <AssignGroupsDrawer
            open={drawer.open}
            onClose={closeDrawer}
            onSave={(groups) => handleSaveGroups(drawer.customer!.id, groups)}
            customerName={drawer.customer.name}
            initialGroups={customerGroups[drawer.customer.id] ?? [drawer.customer.group]}
          />
        )}

        {/* Notes Drawer */}
        <Sheet
          open={notesDrawer.open}
          onOpenChange={(o) => { if (!o) { setNotesDrawer({ open: false, customer: null }); setNewNoteText(''); } }}
        >
          <SheetContent side="right" size="md" className="p-0 flex flex-col">
            <SheetHeader className="border-b border-slate-200 p-4 shrink-0">
              <SheetTitle className="text-base font-semibold text-slate-900">
                {notesDrawer.customer ? `${notesDrawer.customer.name} — Notes` : 'Notes'}
              </SheetTitle>
            </SheetHeader>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
              {(() => {
                const c = notesDrawer.customer;
                if (!c) return null;
                const items = c.noteItems ?? [];
                if (items.length === 0) return (
                  <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-400">
                    <Notepad size={28} weight="light" />
                    <p className="text-sm">No notes yet. Add the first one below.</p>
                  </div>
                );
                return items.map((note) => (
                  <div key={note.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Avatar initials={note.author.initials} color={note.author.color} size={32} />
                    </div>
                    <div className="pb-1 min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900">{note.author.name}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(note.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                      </div>
                    </div>
                  </div>
                ));
              })()}
              <div ref={notesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-slate-200 p-3 shrink-0 flex gap-2 items-start">
              <Avatar initials="JD" color="#6366f1" size={32} />
              <textarea
                className="flex-1 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 overflow-hidden leading-5"
                rows={1}
                placeholder="Write a note…"
                value={newNoteText}
                onChange={(e) => {
                  setNewNoteText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!newNoteText.trim() || !notesDrawer.customer) return;
                    const note = { id: crypto.randomUUID(), text: newNoteText.trim(), createdAt: new Date().toISOString(), author: { name: 'Juan A. Dela Cruz', initials: 'JD', color: '#6366f1' } };
                    const updated = { ...notesDrawer.customer, noteItems: [...(notesDrawer.customer.noteItems ?? []), note] };
                    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                    setNotesDrawer((s) => ({ ...s, customer: updated }));
                    setNewNoteText('');
                    e.currentTarget.style.height = 'auto';
                    setTimeout(() => notesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }
                }}
              />
              <Button
                size="sm"
                disabled={!newNoteText.trim()}
                onClick={() => {
                  if (!newNoteText.trim() || !notesDrawer.customer) return;
                  const note = { id: crypto.randomUUID(), text: newNoteText.trim(), createdAt: new Date().toISOString(), author: { name: 'Juan A. Dela Cruz', initials: 'JD', color: '#6366f1' } };
                  const updated = { ...notesDrawer.customer, noteItems: [...(notesDrawer.customer.noteItems ?? []), note] };
                  setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                  setNotesDrawer((s) => ({ ...s, customer: updated }));
                  setNewNoteText('');
                  setTimeout(() => notesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                }}
              >
                <PaperPlaneTilt size={15} />
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Supporting Documents Drawer */}
        <Sheet open={docsDrawer.open} onOpenChange={(o) => { if (!o) setDocsDrawer({ open: false, customer: null }); }}>
          <SheetContent side="right" size="md" className="p-0">
            <SheetHeader className="border-b border-slate-200 p-4">
              <SheetTitle className="text-base font-semibold text-slate-900">
                {docsDrawer.customer ? `${docsDrawer.customer.name} — Documents` : 'Documents'}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              {docsDrawer.customer && <DocsViewer customer={docsDrawer.customer} />}
            </div>
          </SheetContent>
        </Sheet>

        {/* Column Management Drawer */}
        <ColumnManagementDrawer
          open={colDrawerOpen}
          onClose={() => setColDrawerOpen(false)}
          columns={columnConfig}
          onChange={setColumnConfig}
        />

        {/* Filter Drawer */}
        <FilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          sections={filterSections}
          value={appliedFilters}
          onApply={setAppliedFilters}
        />
      </div>

      {/* Bulk Assign Groups Drawer */}
      <AssignGroupsDrawer
        open={bulkGroupsDrawerOpen}
        onClose={() => setBulkGroupsDrawerOpen(false)}
        onSave={handleBulkGroupsSave}
        customerName=""
        entityLabel={`${selected.size} selected customer${selected.size !== 1 ? 's' : ''}`}
        initialGroups={bulkCustomerInitialGroups}
      />

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <BulkActionsBar
          selectedCount={selected.size}
          actions={bulkCustomerActions}
          onDismiss={() => setSelected(new Set())}
        />
      )}

      {/* Bulk Archive Modal */}
      <Dialog open={bulkArchiveModal} onOpenChange={(o) => { if (!o) setBulkArchiveModal(false); }}>
        <DialogContent showCloseButton={false} className="max-w-md gap-0 p-0">
          <DialogHeader className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base font-semibold text-slate-900">Archive customers?</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">{selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''}</span> will
              be moved to the Archived tab and hidden from active customer lists. You can restore them at any time.
            </p>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-200 p-4">
            <Button variant="outline" size="md" onClick={() => setBulkArchiveModal(false)}>Cancel</Button>
            <Button colorScheme="destructive" size="md" onClick={handleConfirmBulkArchive}>
              Archive {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Unarchive Modal */}
      <Dialog open={bulkUnarchiveModal} onOpenChange={(o) => { if (!o) setBulkUnarchiveModal(false); }}>
        <DialogContent showCloseButton={false} className="max-w-md gap-0 p-0">
          <DialogHeader className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base font-semibold text-slate-900">Unarchive customers?</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">{selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''}</span> will
              be restored and appear in active customer lists again.
            </p>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-200 p-4">
            <Button variant="outline" size="md" onClick={() => setBulkUnarchiveModal(false)}>Cancel</Button>
            <Button colorScheme="primary" size="md" onClick={handleConfirmBulkUnarchive}>
              Unarchive {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Customer Modal */}
      <Dialog
        open={archiveModal.open}
        onOpenChange={(o) => { if (!o) setArchiveModal({ open: false, customer: null, inputValue: '' }); }}
      >
        <DialogContent showCloseButton={false} className="max-w-md gap-0 p-0">
          <DialogHeader className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base font-semibold text-slate-900">Archive customer?</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">{archiveModal.customer?.name}</span> will be
              moved to the Archived tab and hidden from active customer lists. You can restore them at any time.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Type the customer ID to confirm:</p>
              <code className="block text-sm font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 select-all">
                {archiveModal.customer?.id}
              </code>
              <Input
                autoFocus
                placeholder={archiveModal.customer?.id ?? ''}
                value={archiveModal.inputValue}
                onChange={(e) => setArchiveModal((prev) => ({ ...prev, inputValue: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-200 p-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => setArchiveModal({ open: false, customer: null, inputValue: '' })}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              size="md"
              disabled={archiveModal.inputValue !== archiveModal.customer?.id}
              onClick={handleConfirmArchive}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unarchive Customer Modal */}
      <Dialog
        open={unarchiveModal.open}
        onOpenChange={(o) => { if (!o) setUnarchiveModal({ open: false, customer: null }); }}
      >
        <DialogContent showCloseButton={false} className="max-w-md gap-0 p-0">
          <DialogHeader className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base font-semibold text-slate-900">Unarchive customer?</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">{unarchiveModal.customer?.name}</span> will be
              restored and appear in active customer lists again.
            </p>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-200 p-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => setUnarchiveModal({ open: false, customer: null })}
            >
              Cancel
            </Button>
            <Button colorScheme="primary" size="md" onClick={handleConfirmUnarchive}>
              Unarchive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// ─── Pin indicator ────────────────────────────────────────────────────────────
function PinIndicator() {
  return (
    <span className="inline-block w-1 h-3 rounded-sm bg-violet-400 mr-1 opacity-70 shrink-0" />
  );
}

// ─── Supporting docs viewer ───────────────────────────────────────────────────
function DocFileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')                        return <FilePdf  size={26} className="text-red-500 shrink-0"    />;
  if (['doc','docx'].includes(ext))         return <FileDoc  size={26} className="text-blue-500 shrink-0"   />;
  if (['xls','xlsx'].includes(ext))         return <FileXls  size={26} className="text-green-600 shrink-0"  />;
  if (ext === 'csv')                        return <FileCsv  size={26} className="text-green-500 shrink-0"  />;
  if (['zip','rar','7z'].includes(ext))     return <FileZip  size={26} className="text-yellow-600 shrink-0" />;
  return                                           <FileIcon size={26} className="text-slate-400 shrink-0"   />;
}

function DocsViewer({ customer }: { customer: Customer }) {
  const [lightbox, setLightbox] = useState<SupportingDocFile | null>(null);

  const hasRealFiles = (customer.supportingDocumentFiles?.length ?? 0) > 0;

  if (!hasRealFiles && customer.supportingDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
        <FileIcon size={28} weight="light" />
        <p className="text-sm">No documents uploaded.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {hasRealFiles
          ? customer.supportingDocumentFiles!.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 group">
                <div className="w-11 h-11 shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {doc.isImage
                    ? <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                    : <DocFileIcon name={doc.name} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.size}</p>
                </div>
                {doc.isImage && (
                  <button
                    onClick={() => setLightbox(doc)}
                    className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ArrowSquareOut size={14} />
                  </button>
                )}
              </li>
            ))
          : customer.supportingDocuments.map((name, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div className="w-11 h-11 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center">
                  <DocFileIcon name={name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">—</p>
                </div>
              </li>
            ))}
      </ul>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.name} className="max-w-full max-h-[78vh] rounded-xl shadow-2xl object-contain" />
            <div className="text-center">
              <p className="text-white text-sm font-medium">{lightbox.name}</p>
              <p className="text-white/60 text-xs mt-0.5">{lightbox.size}</p>
            </div>
          </div>
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      )}
    </>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function CustomerRow({
  customer,
  groups,
  visibleCols,
  colStyle,
  checkboxSeparator,
  isSelected,
  isExpanded,
  isArchived,
  query = '',
  onToggle,
  onAssignGroups,
  onToggleExpand,
  onViewNotes,
  onViewDocs,
  onEdit,
  onView,
  onArchive,
  onUnarchive,
}: {
  customer: Customer;
  groups: string[];
  visibleCols: ColumnDef[];
  colStyle: (id: string) => CSSProperties;
  checkboxSeparator: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  isArchived: boolean;
  query?: string;
  onToggle: () => void;
  onAssignGroups: () => void;
  onToggleExpand: () => void;
  onViewNotes?: () => void;
  onViewDocs?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
}) {
  const rowBg = isSelected ? '#f5f3ff' : '#ffffff';

  function renderCell(col: ColumnDef) {
    const style = { ...colStyle(col.id), backgroundColor: rowBg };

    switch (col.id) {
      case 'customerID':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
            <Highlight text={customer.id} query={query} />
          </td>
        );
      case 'type':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
            <Highlight text={customer.type} query={query} />
          </td>
        );
      case 'name':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size={26} />
              <button
                onClick={onView}
                className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm text-left"
              >
                <Highlight text={customer.name} query={query} />
              </button>
            </div>
          </td>
        );
      case 'email':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
            <Highlight text={customer.email} query={query} />
          </td>
        );
      case 'address':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-slate-600 text-sm max-w-[200px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="line-clamp-2 leading-snug cursor-default">
                  <Highlight text={customer.address} query={query} />
                </span>
              </TooltipTrigger>
              <TooltipContent>{customer.address}</TooltipContent>
            </Tooltip>
          </td>
        );
      case 'phone':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
            <Highlight text={customer.phoneNumber} query={query} />
          </td>
        );
      case 'group':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5">
            <GroupCell groups={groups} expanded={isExpanded} onToggleExpand={onToggleExpand} />
          </td>
        );
      case 'supportingDocs':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              {customer.supportingDocuments.map((doc, i) => (
                <button
                  key={i}
                  onClick={onViewDocs}
                  className="text-violet-600 hover:text-violet-800 hover:underline text-sm text-left"
                >
                  {doc}
                </button>
              ))}
            </div>
          </td>
        );
      case 'notes':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton onClick={onViewNotes}>
                  <Notepad size={15} />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>View notes</TooltipContent>
            </Tooltip>
          </td>
        );
      case 'lastUpdatedAt':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
            {customer.lastUpdatedAt}
          </td>
        );
      case 'dateCreated':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
            {customer.dateCreated}
          </td>
        );
      case 'quickActions':
        return (
          <td key={col.id} style={style} className="px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton>
                    <Copy size={15} />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>Duplicate</TooltipContent>
              </Tooltip>
            </div>
          </td>
        );
      default:
        if (col.id.startsWith('cf_')) {
          const cfVal = customer.customFieldValues?.[col.id.slice(3)];
          const display = Array.isArray(cfVal)
            ? cfVal.join(', ')
            : cfVal != null && cfVal !== ''
              ? String(cfVal)
              : '—';
          return (
            <td key={col.id} className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap" style={style}>
              {display}
            </td>
          );
        }
        return null;
    }
  }

  return (
    <tr className={['transition-colors hover:bg-slate-50', isSelected ? 'bg-violet-50' : ''].join(' ')}>
      {/* Checkbox — always first, frozen left */}
      <td className="sticky left-0 z-[2] px-3 py-2.5" style={{ backgroundColor: rowBg, ...(checkboxSeparator ? { borderRight: '1px solid #d1d5db' } : {}) }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
        />
      </td>

      {/* Dynamic columns */}
      {visibleCols.map((col) => renderCell(col))}

      {/* Kebab — always last */}
      <td className="sticky right-0 z-[2] px-2 py-2.5 [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_white]" style={{ backgroundColor: rowBg }}>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:bg-slate-100 transition-colors outline-none">
            <DotsThreeVertical size={16} weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onEdit}>
              <PencilSimple size={14} className="text-slate-400" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onAssignGroups}>
              <UsersThree size={14} className="text-slate-400" />
              Assign groups
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy size={14} className="text-slate-400" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isArchived ? (
              <DropdownMenuItem onSelect={onUnarchive}>
                <ArrowCounterClockwise size={14} className="text-slate-400" />
                Unarchive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem destructive onSelect={onArchive}>
                <Archive size={14} />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
