import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowsDownUp,
  Funnel,
  DotsThreeVertical,
  PaperPlaneTilt,
  CopySimple,
  CheckCircle,
  Archive,
  FileText,
  Link as LinkIcon,
  BellSimple,
  Prohibit,
  UsersThree,
  Percent,
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/atoms/DropdownMenu';
import { Bill, BillStatus, formatPeso } from '#/data/bills';
import { ColumnManagementDrawer, ColumnDef } from '#/components/molecules/ColumnManagementDrawer';
import { ColumnsButton } from '#/components/molecules/ColumnsButton';
import { Button } from '#/components/atoms/Button';
import { FilterDrawer, 
  FilterSectionDef,
  FilterValue,
  countActiveFilters,
  matchesDateRange,
  matchesNumberRange,
} from '#/components/molecules/FilterDrawer';
import { Highlight } from '#/components/molecules/Highlight';
import { SortTh } from '#/components/molecules/SortTh';
import { useTableSort } from '#/hooks/useTableSort';
import { useStickyColumns } from '#/hooks/useStickyColumns';
import { DataTable, DataTableTabDef } from '#/components/molecules/DataTable';

// ─── Column config ────────────────────────────────────────────────────────────

const DEFAULT_BILLS_COLS: ColumnDef[] = [
  { id: 'status',          label: 'Status',            visible: true,  pin: 'none' },
  { id: 'billID',          label: 'Bill ID',            visible: true,  pin: 'none' },
  { id: 'amount',          label: 'Amount',             visible: true,  pin: 'none' },
  { id: 'billDate',        label: 'Issue date',         visible: true,  pin: 'none' },
  { id: 'dueDate',         label: 'Due date',           visible: true,  pin: 'none' },
  { id: 'customer',        label: 'Customer',           visible: true,  pin: 'none' },
  { id: 'daysOutstanding', label: 'Days outstanding',   visible: true,  pin: 'none' },
  { id: 'link',            label: 'Payment link',       visible: true,  pin: 'none' },
  { id: 'paymentDate',     label: 'Payment date',       visible: true,  pin: 'none' },
  { id: 'paymentMethod',   label: 'Payment method',     visible: true,  pin: 'none' },
  { id: 'referenceNo',     label: 'Reference No.',      visible: true,  pin: 'none' },
  { id: 'quickActions',    label: 'Quick actions',      visible: true,  pin: 'right' },
];

const COL_WIDTH: Record<string, number> = {
  status: 110, billID: 110, amount: 120, billDate: 110,
  dueDate: 110, customer: 155, daysOutstanding: 145, link: 150,
  paymentDate: 120, paymentMethod: 140, quickActions: 130, referenceNo: 190,
};

// The elevated-shadow effect for the pinned Quick actions + kebab region is a
// dedicated overlay rendered by DataTable via `pinnedShadowRight` (box-shadow
// doesn't bleed past a <td>/<th>'s own boundary, so it can't be done on the
// cell itself). The checkbox column is a UI utility, not a "pinned column" in
// the user's sense, so it intentionally doesn't get this treatment. No divider
// border is used anywhere here — the shadow alone communicates the pinned edge.

// ─── Status & type config ─────────────────────────────────────────────────────

const STATUS_CFG: Record<BillStatus, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-slate-50 text-slate-600 border-slate-300' },
  sent:      { label: 'Sent',      className: 'bg-violet-50 text-violet-700 border-violet-300' },
  scheduled: { label: 'Scheduled', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  verifying: { label: 'Verifying', className: 'bg-amber-50 text-amber-700 border-amber-300' },
  paid:      { label: 'Paid',      className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  overdue:   { label: 'Overdue',   className: 'bg-red-50 text-red-700 border-red-300' },
  void:      { label: 'Void',      className: 'bg-slate-50 text-slate-400 border-slate-300' },
  archived:  { label: 'Archived',  className: 'bg-slate-50 text-slate-400 border-slate-300' },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type Filter = 'all' | BillStatus;

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'draft',     label: 'Draft' },
  { value: 'overdue',   label: 'Overdue' },
  { value: 'paid',      label: 'Paid' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sent',      label: 'Sent' },
  { value: 'verifying', label: 'Verifying' },
  { value: 'void',      label: 'Void' },
  { value: 'archived',  label: 'Archived' },
];

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = 'id' | 'amount' | 'billDate' | 'dueDate' | 'daysOutstanding' | 'lastUpdatedAt' | 'customer';

const COL_SORT_KEY: Partial<Record<string, SortKey>> = {
  billID: 'id', amount: 'amount', billDate: 'billDate',
  dueDate: 'dueDate', daysOutstanding: 'daysOutstanding', lastUpdatedAt: 'lastUpdatedAt', customer: 'customer',
};

// ─── Pin indicator ────────────────────────────────────────────────────────────
// A small violet bar marking a column header as pinned/frozen.

function PinIndicator() {
  return <span className="inline-block w-1 h-3 rounded-sm bg-violet-400 mr-1 opacity-70 shrink-0" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  bills: Bill[];
  onCreateBill?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReceivablesTable({ bills: initialBills, onCreateBill: _onCreateBill }: Props) {
  const navigate = useNavigate();
  const [bills, setBills]       = useState<Bill[]>(initialBills);
  const [filter, setFilter]     = useState<Filter>('all');
  const [search, setSearch]     = useState('');
  const { sortKey, sortAsc, toggleSort } = useTableSort<SortKey>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage]   = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedLink, setCopiedLink]   = useState<string | null>(null);

  const [columnConfig, setColumnConfig] = useState<ColumnDef[]>(DEFAULT_BILLS_COLS);
  const [colDrawerOpen, setColDrawerOpen] = useState(false);

  // Filter drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterValue>({});

  // Assign Groups Drawer (single-row)
  const [assignGroupsDrawer, setAssignGroupsDrawer] = useState<{ open: boolean; bill: Bill | null }>({ open: false, bill: null });

  const counts = bills.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const afterFilter = filter === 'all' ? bills : bills.filter((b) => b.status === filter);
  const q = search.trim().toLowerCase();
  const afterSearch = q
    ? afterFilter.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q),
      )
    : afterFilter;

  const afterDrawerFilter = afterSearch.filter((b) => {
    const fStatus = appliedFilters.status ?? [];
    if (fStatus.length > 0 && !fStatus.includes(b.status)) return false;

    const fType = appliedFilters.billingType ?? [];
    if (fType.length > 0 && !fType.includes(b.type)) return false;

    if (!matchesNumberRange(b.amount,         appliedFilters.amount          ?? [])) return false;
    if (!matchesNumberRange(b.daysOutstanding, appliedFilters.daysOutstanding ?? [])) return false;

    if (!matchesDateRange(b.billDate,    appliedFilters.billDate    ?? [])) return false;
    if (!matchesDateRange(b.dueDate,     appliedFilters.dueDate     ?? [])) return false;
    if (!matchesDateRange(b.paymentDate, appliedFilters.paymentDate ?? [])) return false;

    const fPM = appliedFilters.paymentMethod ?? [];
    if (fPM.length > 0 && !(b.paymentMethod && fPM.includes(b.paymentMethod))) return false;

    const fTags = appliedFilters.tags ?? [];
    if (fTags.length > 0 && !(b.tags && fTags.some((t) => b.tags!.includes(t)))) return false;

    return true;
  });

  const sorted = sortKey === null ? [...afterDrawerFilter] : [...afterDrawerFilter].sort((a, b) => {
    let cmp = 0;
    if      (sortKey === 'amount')          cmp = a.amount - b.amount;
    else if (sortKey === 'daysOutstanding') cmp = a.daysOutstanding - b.daysOutstanding;
    else if (sortKey === 'id')              cmp = a.id.localeCompare(b.id);
    else if (sortKey === 'billDate')        cmp = new Date(a.billDate).getTime() - new Date(b.billDate).getTime();
    else if (sortKey === 'dueDate')         cmp = new Date(a.dueDate).getTime()  - new Date(b.dueDate).getTime();
    else if (sortKey === 'customer')        cmp = a.customerName.localeCompare(b.customerName);
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setCurrentPage(1);
    setSearch('');
  }

  const allChecked  = paginated.length > 0 && paginated.every((b) => selected.has(b.id));
  const someChecked = paginated.some((b) => selected.has(b.id)) && !allChecked;

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(paginated.map((b) => b.id)));
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 1500);
  }

  const { visibleCols, colHeaderStyle, colCellStyle, hasLeftPinned, rightPinnedTotalWidth } =
    useStickyColumns(columnConfig, COL_WIDTH);

  // Only the right side has a real pinned column (Quick actions) — the
  // checkbox is a UI utility, not a "pinned column" in the user's sense, so it
  // doesn't get the elevation-shadow treatment.
  const pinnedShadowRight = rightPinnedTotalWidth;

  const activeColChanges = columnConfig.filter((c) => !c.visible || c.pin !== 'none').length;

  const filterSections = useMemo((): FilterSectionDef[] => {
    const pmOptions = [...new Set(bills.flatMap((b) => (b.paymentMethod ? [b.paymentMethod] : [])))].sort();
    const tagOptions = [...new Set(bills.flatMap((b) => b.tags ?? []))].filter(Boolean).sort();
    return [
      {
        id: 'status',
        label: 'Status',
        type: 'checkbox',
        options: [
          { value: 'draft',     label: 'Draft' },
          { value: 'sent',      label: 'Sent' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'verifying', label: 'Verifying' },
          { value: 'paid',      label: 'Paid' },
          { value: 'overdue',   label: 'Overdue' },
          { value: 'void',      label: 'Void' },
          { value: 'archived',  label: 'Archived' },
        ],
      },
      {
        id: 'billingType',
        label: 'Billing type',
        type: 'checkbox',
        options: [
          { value: 'one-time',    label: 'One-time' },
          { value: 'recurring',   label: 'Recurring' },
          { value: 'installment', label: 'Installment' },
        ],
      },
      { id: 'amount',          label: 'Amount',           type: 'numberRange', prefix: '₱' },
      { id: 'billDate',        label: 'Issue date',       type: 'dateRange' },
      { id: 'dueDate',         label: 'Due date',         type: 'dateRange' },
      { id: 'daysOutstanding', label: 'Days outstanding', type: 'numberRange' },
      { id: 'paymentDate',     label: 'Payment date',     type: 'dateRange' },
      ...(pmOptions.length > 0
        ? [{ id: 'paymentMethod', label: 'Payment method', type: 'checkbox' as const, options: pmOptions.map((v) => ({ value: v, label: v })) }]
        : []),
      ...(tagOptions.length > 0
        ? [{ id: 'tags', label: 'Tags', type: 'checkbox' as const, options: tagOptions.map((v) => ({ value: v, label: v })) }]
        : []),
    ];
  }, [bills]);

  const activeFilterCount = countActiveFilters(filterSections, appliedFilters);

  const tabs: DataTableTabDef[] = FILTER_TABS.map(({ value, label }) => ({
    value,
    label,
    count: value === 'all' ? bills.length : (counts[value] ?? 0),
  }));

  // ─── Headers ─────────────────────────────────────────────────────────────────
  const headers = visibleCols.map((col) => {
    const baseHeaderStyle = colHeaderStyle(col.id);
    const style = col.id === 'quickActions'
      ? { ...baseHeaderStyle, zIndex: 3 }
      : baseHeaderStyle;
    const isPinned = !!style.position;
    return (
      <SortTh
        key={col.id}
        colSortKey={COL_SORT_KEY[col.id]}
        activeSortKey={sortKey}
        sortAsc={sortAsc}
        onSort={toggleSort as (key: string) => void}
        align={col.id === 'amount' ? 'right' : 'left'}
        style={style}
      >
        <span className="inline-flex items-center">
          {isPinned && <PinIndicator />}{col.label}
        </span>
      </SortTh>
    );
  });

  // ─── Rows ─────────────────────────────────────────────────────────────────────
  const rows = paginated.map((bill) => {
    const isSel = selected.has(bill.id);
    const rowBg = isSel ? '#f5f3ff' : '#ffffff';
    const status = STATUS_CFG[bill.status];

    return (
      <tr
        key={bill.id}
        className={['transition-colors hover:bg-slate-50', isSel ? 'bg-violet-50' : ''].join(' ')}
      >
        <td
          className="sticky left-0 z-[2] px-3 py-2.5"
          style={{ backgroundColor: rowBg }}
        >
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => toggleRow(bill.id)}
            className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
          />
        </td>

        {visibleCols.map((col) => {
          const style = { ...colCellStyle(col.id), backgroundColor: rowBg };

          switch (col.id) {
            case 'status':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`inline-flex items-center justify-center w-[88px] rounded-full border py-1 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </td>
              );
            case 'billID':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
                  <button
                    onClick={() => navigate({ to: '/billings/$id/info', params: { id: bill.id } })}
                    className="text-violet-600 hover:text-violet-800 hover:underline font-medium text-sm text-left transition-colors"
                  >
                    <Highlight text={bill.id} query={q} />
                  </button>
                </td>
              );
            case 'amount':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-medium text-slate-700 tabular-nums">
                  {formatPeso(bill.amount)}
                </td>
              );
            case 'billDate':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
                  {bill.billDate}
                </td>
              );
            case 'dueDate':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
                  {bill.dueDate}
                </td>
              );
            case 'customer':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-white font-semibold shrink-0"
                      style={{ backgroundColor: bill.customerAvatarColor, fontSize: 10 }}
                    >
                      {bill.customerInitials}
                    </span>
                    <span className="text-slate-700 text-sm max-w-[130px] truncate">
                      <Highlight text={bill.customerName} query={q} />
                    </span>
                  </div>
                </td>
              );
            case 'daysOutstanding':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                  <span className={bill.daysOutstanding > 0 ? 'text-red-600 font-medium' : 'text-slate-600'}>
                    {bill.daysOutstanding}
                  </span>
                </td>
              );
            case 'link':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-violet-600">{bill.link}</span>
                    <button
                      onClick={() => copyLink(bill.link)}
                      className="text-slate-400 hover:text-violet-500 transition-colors"
                      title="Copy link"
                    >
                      {copiedLink === bill.link
                        ? <LinkIcon size={12} className="text-emerald-500" />
                        : <CopySimple size={12} />}
                    </button>
                  </div>
                </td>
              );
            case 'paymentDate':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
                  {bill.paymentDate ?? <span className="text-slate-400">N/A</span>}
                </td>
              );
            case 'paymentMethod':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-600">
                  {bill.paymentMethod ?? <span className="text-slate-400">N/A</span>}
                </td>
              );
            case 'referenceNo':
              return (
                <td key={col.id} style={style} className="px-3 py-2.5 whitespace-nowrap">
                  {bill.referenceNo ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-violet-600">{bill.referenceNo}</span>
                      <button
                        onClick={() => copyLink(bill.referenceNo!)}
                        className="text-slate-400 hover:text-violet-500 transition-colors"
                        title="Copy reference no."
                      >
                        {copiedLink === bill.referenceNo
                          ? <LinkIcon size={12} className="text-emerald-500" />
                          : <CopySimple size={12} />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">N/A</span>
                  )}
                </td>
              );
            case 'quickActions':
              return (
                <td
                  key={col.id}
                  style={{ ...style, backgroundColor: '#ffffff', zIndex: 2 }}
                  className="px-3 py-2.5 whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    {bill.status === 'overdue' && (
                      <Button
                        variant="outline"
                        colorScheme="secondary"
                        size="icon"
                        className="h-8 w-8"
                        title="Manage penalty"
                        onClick={() => navigate({ to: '/billings/$id/view', params: { id: bill.id } })}
                      >
                        <Percent size={16} />
                      </Button>
                    )}
                    {bill.status === 'overdue' && (
                      <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="Send reminder">
                        <BellSimple size={16} />
                      </Button>
                    )}
                    {(bill.status === 'overdue' || bill.status === 'verifying') && (
                      <Button
                        variant="outline"
                        colorScheme="secondary"
                        size="icon"
                        className="h-8 w-8"
                        title={bill.status === 'verifying' ? 'Confirm payment' : 'Mark as paid'}
                      >
                        <CheckCircle size={16} />
                      </Button>
                    )}
                    {bill.status !== 'overdue' && bill.status !== 'verifying' && (
                      <Button variant="outline" colorScheme="secondary" size="icon" className="h-8 w-8" title="View details">
                        <FileText size={16} />
                      </Button>
                    )}
                  </div>
                </td>
              );
            default:
              return null;
          }
        })}

        <td
          className="sticky right-0 z-[2] px-2 py-2.5 [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_white]"
          style={{ backgroundColor: rowBg }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:bg-slate-100 transition-colors outline-none">
              <DotsThreeVertical size={16} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <PaperPlaneTilt size={14} className="text-slate-400" />
                Send
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CopySimple size={14} className="text-slate-400" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CheckCircle size={14} className="text-slate-400" />
                Mark as paid
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <Archive size={14} />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  });

  const emptyMessage = q
    ? 'Try a different search term.'
    : filter !== 'all'
    ? `No ${STATUS_CFG[filter as BillStatus]?.label.toLowerCase()} bills.`
    : 'No bills have been created yet.';

  return (
    <>
      <DataTable
        tabs={tabs}
        activeTab={filter}
        onTabChange={(v) => handleFilterChange(v as Filter)}
        tabVariant="pill"
        search={search}
        onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
        searchPlaceholder="Enter a billing ID or customer"
        toolbarEnd={
          <>
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className={[
                'relative inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border text-sm transition-colors',
                activeFilterCount > 0
                  ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
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
            <button className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors">
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
        pinnedShadowRight={pinnedShadowRight}
        rows={rows}
        isEmpty={paginated.length === 0}
        emptyIcon={<FileText size={22} />}
        emptyTitle="No bills found"
        emptyMessage={emptyMessage}
        currentPage={safePage}
        totalPages={totalPages}
        perPage={perPage}
        totalRows={sorted.length}
        onPageChange={setCurrentPage}
        onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
      />

      <ColumnManagementDrawer
        open={colDrawerOpen}
        onClose={() => setColDrawerOpen(false)}
        columns={columnConfig}
        onChange={setColumnConfig}
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sections={filterSections}
        value={appliedFilters}
        onApply={setAppliedFilters}
      />

      {/* Single-row Assign Groups Drawer */}
      {assignGroupsDrawer.bill && (
        <AssignGroupsDrawer
          open={assignGroupsDrawer.open}
          onClose={() => setAssignGroupsDrawer({ open: false, bill: null })}
          onSave={handleSingleGroupsSave}
          customerName={assignGroupsDrawer.bill.customerName}
          entityLabel={assignGroupsDrawer.bill.title}
          initialGroups={assignGroupsDrawer.bill.groups ?? []}
        />
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <BulkActionsBar
          selectedCount={selected.size}
          subtitle={`${formatPeso(selectedTotal)} in total`}
          actions={bulkActions}
          onDismiss={() => setSelected(new Set())}
        />
      )}
    </>
  );
}
