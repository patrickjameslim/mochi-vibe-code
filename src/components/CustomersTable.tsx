import { useState, useRef, useEffect } from 'react';
import {
  ArrowsDownUp,
  Copy,
  DotsThreeVertical,
  MagnifyingGlass,
  Funnel,
  Columns,
  CaretDown,
  Plus,
  BellSimple,
  CaretRight,
  Notepad,
  PencilSimple,
  UsersThree,
  Archive,
  X,
} from '@phosphor-icons/react';
import { Customer, CUSTOMERS, SupportingDocFile } from '../data/customers';
import { Tooltip, TooltipProvider } from './ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/DropdownMenu';
import AssignGroupsDrawer from './AssignGroupsDrawer';
import SuccessBanner from './SuccessBanner';
import CustomerGroupsTable from './CustomerGroupsTable';
import { Sidebar } from './Sidebar';
import { Sheet, SheetHeader, SheetBody } from './ui/Sheet';
import { Badge } from './ui/Badge';
import {
  FilePdf, FileDoc, FileXls, FileCsv, FileZip,
  File as FileIcon, ArrowSquareOut,
} from '@phosphor-icons/react';

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
function IconButton({
  children,
  ghost = false,
  onClick,
}: {
  children: React.ReactNode;
  ghost?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
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
}

// ─── Sort Header Cell ─────────────────────────────────────────────────────────
function SortTh({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap select-none tracking-[0.06em]">
      <button className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
        {children}
        <ArrowsDownUp size={12} weight="bold" className="text-slate-400" />
      </button>
    </th>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;

  const parts: { str: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  let last = 0;
  let idx = lower.indexOf(q, last);
  while (idx !== -1) {
    if (idx > last) parts.push({ str: text.slice(last, idx), match: false });
    parts.push({ str: text.slice(idx, idx + q.length), match: true });
    last = idx + q.length;
    idx = lower.indexOf(q, last);
  }
  if (last < text.length) parts.push({ str: text.slice(last), match: false });

  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">
            {p.str}
          </mark>
        ) : (
          <span key={i}>{p.str}</span>
        )
      )}
    </>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

// ─── Tab ─────────────────────────────────────────────────────────────────────
function Tab({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
        active
          ? 'border-violet-600 text-violet-700'
          : 'border-transparent text-slate-500 hover:text-slate-700',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

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
        <Badge key={g} variant="default" className="whitespace-nowrap">
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
export default function CustomersTable({
  customers = CUSTOMERS,
  initialBanner = null,
  onBannerShown,
  onCreateCustomer,
  onEdit,
  onViewCustomer,
  groupOverride = null,
  onGroupOverrideApplied,
}: {
  customers?: Customer[];
  initialBanner?: string | null;
  onBannerShown?: () => void;
  onCreateCustomer?: () => void;
  onEdit?: (customer: Customer, groups: string[]) => void;
  onViewCustomer?: (customer: Customer, groups: string[]) => void;
  groupOverride?: { id: string; groups: string[] } | null;
  onGroupOverrideApplied?: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'All' | 'Individual' | 'Organization' | 'Customer groups'>('All');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, customer: null });
  const [banner, setBanner] = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [perPage, setPerPage]       = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Notes drawer
  const [notesDrawer, setNotesDrawer] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });
  // Docs viewer drawer
  const [docsDrawer, setDocsDrawer] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });

  // Synchronized scrollbar refs
  const topScrollRef   = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const spacerRef      = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep spacer width = table scroll width so the top scrollbar thumb is sized correctly
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    if (!tableEl || !spacerRef.current) return;
    const sync = () => {
      if (spacerRef.current && tableEl) {
        spacerRef.current.style.width = tableEl.scrollWidth + 'px';
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(tableEl);
    return () => ro.disconnect();
  }, [activeTab, perPage, currentPage]);
  // Show incoming banner from parent (e.g. after creating a customer)
  useEffect(() => {
    if (initialBanner) {
      setBanner(initialBanner);
      onBannerShown?.();
    }
  }, [initialBanner]); // eslint-disable-line react-hooks/exhaustive-deps

  // per-customer group assignments (overrides data defaults)
  const [customerGroups, setCustomerGroups] = useState<Record<string, string[]>>(
    () => Object.fromEntries(customers.map((c) => [c.id, [c.group]]))
  );

  // Merge any newly added customers into customerGroups
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

  // Apply group override from parent (e.g. after editing in CustomerDetailPage)
  useEffect(() => {
    if (!groupOverride) return;
    setCustomerGroups((prev) => ({ ...prev, [groupOverride.id]: groupOverride.groups }));
    onGroupOverrideApplied?.();
  }, [groupOverride]); // eslint-disable-line react-hooks/exhaustive-deps

  // per-row expand state for the group cell
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const q = search.trim().toLowerCase();

  const filtered = customers.filter((c) => {
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Individual' && c.type === 'Individual') ||
      (activeTab === 'Organization' && c.type === 'Organization') ||
      activeTab === 'Customer groups';

    if (!matchesTab) return false;
    if (!q) return true;

    return (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q) ||
      c.group.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * perPage, safePage * perPage);

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

  function handleSaveGroups(customerId: string, groups: string[]) {
    setCustomerGroups((prev) => ({ ...prev, [customerId]: groups }));
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.delete(customerId);
      return next;
    });
    const customer = CUSTOMERS.find((c) => c.id === customerId);
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

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {/* Top bar */}
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
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
                  onClick={onCreateCustomer}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  <Plus size={15} weight="bold" />
                  Create a new customer
                </button>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-slate-200 px-4 flex items-center gap-0">
                {(['All', 'Individual', 'Organization', 'Customer groups'] as const).map((t) => (
                  <Tab key={t} label={t} active={activeTab === t} onClick={() => handleTabChange(t)} />
                ))}
              </div>

              {/* Synchronized top scrollbar — hidden on Customer groups tab */}
              <div className={activeTab === 'Customer groups' ? 'hidden' : 'border-b border-slate-100'}>
                <div
                  ref={topScrollRef}
                  className="overflow-x-scroll"
                  onScroll={() => {
                    if (tableScrollRef.current && topScrollRef.current)
                      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
                  }}
                >
                  <div ref={spacerRef} style={{ height: 1 }} />
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
                <div className="relative flex-1 max-w-xs">
                  <MagnifyingGlass
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className={`w-full pl-8 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 ${search ? 'pr-7' : 'pr-3'}`}
                  />
                  {search && (
                    <button
                      onClick={() => { setSearch(''); setCurrentPage(1); searchInputRef.current?.blur(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Funnel size={14} />
                    Filter
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <ArrowsDownUp size={14} />
                    Last updated at
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Columns size={14} />
                    Columns
                  </button>
                </div>
              </div>

              {/* ── Customer groups view ── */}
              {activeTab === 'Customer groups' ? (
                <>
                  <CustomerGroupsTable
                    customers={customers}
                    customerGroups={customerGroups}
                    onAssignGroups={openAssignGroups}
                    searchQuery={search}
                  />
                  <Pagination
                    currentPage={1}
                    totalPages={1}
                    perPage={perPage}
                    totalRows={CUSTOMERS.length}
                    onPageChange={() => {}}
                    onPerPageChange={handlePerPageChange}
                  />
                </>
              ) : (
                <>
                  {/* ── Customers table (All / Individual / Organization) ── */}
                  <div
                    ref={tableScrollRef}
                    className="overflow-x-auto"
                    onScroll={() => {
                      if (topScrollRef.current && tableScrollRef.current)
                        topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
                    }}
                  >
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="w-10 px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={(el) => {
                                if (el) el.indeterminate = someChecked;
                              }}
                              onChange={toggleAll}
                              className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
                            />
                          </th>
                          <SortTh>Customer ID</SortTh>
                          <SortTh>Customer type</SortTh>
                          <SortTh>Customer name</SortTh>
                          <SortTh>Customer email</SortTh>
                          <SortTh>Customer address</SortTh>
                          <SortTh>Customer phone number</SortTh>
                          <SortTh>Customer group</SortTh>
                          <SortTh>Supporting documents</SortTh>
                          <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 tracking-[0.06em]">
                            Notes
                          </th>
                          <SortTh>Last updated at</SortTh>
                          <SortTh>Date created</SortTh>
                          <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap select-none tracking-[0.06em]">
                            Quick actions
                          </th>
                          <th className="sticky right-0 z-10 w-10 bg-slate-50 [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_#f9fafb]" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginated.map((customer) => (
                          <CustomerRow
                            key={customer.id}
                            customer={customer}
                            groups={customerGroups[customer.id] ?? [customer.group]}
                            isExpanded={expandedRows.has(customer.id)}
                            isSelected={selected.has(customer.id)}
                            query={q}
                            onToggle={() => toggleRow(customer.id)}
                            onAssignGroups={() => openAssignGroups(customer)}
                            onToggleExpand={() => toggleExpand(customer.id)}
                            onViewNotes={() => setNotesDrawer({ open: true, customer })}
                            onViewDocs={() => setDocsDrawer({ open: true, customer })}
                            onEdit={() => onEdit?.(customer, customerGroups[customer.id] ?? [customer.group])}
                            onView={() => onViewCustomer?.(customer, customerGroups[customer.id] ?? [customer.group])}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    perPage={perPage}
                    totalRows={filtered.length}
                    onPageChange={setCurrentPage}
                    onPerPageChange={handlePerPageChange}
                  />
                </>
              )}
            </div>
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
        <Sheet open={notesDrawer.open} onClose={() => setNotesDrawer({ open: false, customer: null })}>
          <SheetHeader
            title={notesDrawer.customer ? `${notesDrawer.customer.name} — Notes` : 'Notes'}
            onClose={() => setNotesDrawer({ open: false, customer: null })}
          />
          <SheetBody>
            {notesDrawer.customer?.notes ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {notesDrawer.customer.notes}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
                <Notepad size={28} weight="light" />
                <p className="text-sm">No notes for this customer.</p>
              </div>
            )}
          </SheetBody>
        </Sheet>

        {/* Supporting Documents Drawer */}
        <Sheet open={docsDrawer.open} onClose={() => setDocsDrawer({ open: false, customer: null })}>
          <SheetHeader
            title={docsDrawer.customer ? `${docsDrawer.customer.name} — Documents` : 'Documents'}
            onClose={() => setDocsDrawer({ open: false, customer: null })}
          />
          <SheetBody>
            {docsDrawer.customer && <DocsViewer customer={docsDrawer.customer} />}
          </SheetBody>
        </Sheet>
      </div>
    </TooltipProvider>
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

  // Real uploaded files take priority; fall back to name-only legacy list
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
                {/* Thumbnail or icon */}
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

      {/* Image lightbox */}
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

// ─── Per-page dropdown (opens upward) ────────────────────────────────────────
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function PerPageDropdown({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 rounded text-sm hover:bg-slate-50 transition-colors"
      >
        {value}
        <CaretDown
          size={12}
          className={['transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-20 min-w-[72px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {PER_PAGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={[
                'w-full px-3 py-1.5 text-left text-sm transition-colors',
                opt === value
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page number helper ───────────────────────────────────────────────────────
function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  currentPage,
  totalPages,
  perPage,
  totalRows,
  onPageChange,
  onPerPageChange,
}: {
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalRows: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (v: number) => void;
}) {
  const pages = getPageNumbers(currentPage, totalPages);
  const start = (currentPage - 1) * perPage + 1;
  const end   = Math.min(currentPage * perPage, totalRows);

  return (
    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Show</span>
        <PerPageDropdown value={perPage} onChange={onPerPageChange} />
        <span>per page</span>
        <span className="ml-2 text-slate-400">· {start}–{end} of {totalRows}</span>
      </div>

      <div className="flex items-center gap-1 text-sm">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={[
                'w-8 h-8 rounded border text-sm transition-colors',
                p === currentPage
                  ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
        >
          Next <CaretDown size={12} className="-rotate-90" />
        </button>
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function CustomerRow({
  customer,
  groups,
  isSelected,
  isExpanded,
  query = '',
  onToggle,
  onAssignGroups,
  onToggleExpand,
  onViewNotes,
  onViewDocs,
  onEdit,
  onView,
}: {
  customer: Customer;
  groups: string[];
  isSelected: boolean;
  isExpanded: boolean;
  query?: string;
  onToggle: () => void;
  onAssignGroups: () => void;
  onToggleExpand: () => void;
  onViewNotes?: () => void;
  onViewDocs?: () => void;
  onEdit?: () => void;
  onView?: () => void;
}) {
  return (
    <tr className={['transition-colors hover:bg-slate-50', isSelected ? 'bg-violet-50' : ''].join(' ')}>
      {/* Checkbox */}
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="w-4 h-4 rounded border-slate-300 accent-violet-600 cursor-pointer"
        />
      </td>

      {/* Customer ID */}
      <td className="px-3 py-2.5 text-slate-700 font-mono text-xs whitespace-nowrap">
        <Highlight text={customer.id} query={query} />
      </td>

      {/* Customer type */}
      <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
        <Highlight text={customer.type} query={query} />
      </td>

      {/* Customer name */}
      <td className="px-3 py-2.5 whitespace-nowrap">
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

      {/* Email */}
      <td className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
        <Highlight text={customer.email} query={query} />
      </td>

      {/* Address */}
      <td className="px-3 py-2.5 text-slate-600 text-sm max-w-[200px]">
        <Tooltip content={customer.address} wide>
          <span className="line-clamp-2 leading-snug cursor-default">
            <Highlight text={customer.address} query={query} />
          </span>
        </Tooltip>
      </td>

      {/* Phone */}
      <td className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
        <Highlight text={customer.phoneNumber} query={query} />
      </td>

      {/* Group */}
      <td className="px-3 py-2.5">
        <GroupCell
          groups={groups}
          expanded={isExpanded}
          onToggleExpand={onToggleExpand}
        />
      </td>

      {/* Supporting documents */}
      <td className="px-3 py-2.5">
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

      {/* Notes */}
      <td className="px-3 py-2.5 text-center">
        <Tooltip content="View notes">
          <IconButton onClick={onViewNotes}>
            <Notepad size={15} />
          </IconButton>
        </Tooltip>
      </td>

      {/* Last updated at */}
      <td className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
        {customer.lastUpdatedAt}
      </td>

      {/* Date created */}
      <td className="px-3 py-2.5 text-slate-600 text-sm whitespace-nowrap">
        {customer.dateCreated}
      </td>

      {/* Quick actions */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Tooltip content="Duplicate">
            <IconButton>
              <Copy size={15} />
            </IconButton>
          </Tooltip>
        </div>
      </td>

      {/* Kebab menu */}
      <td className="sticky right-0 z-10 px-2 py-2.5 bg-white [box-shadow:-1px_0_0_0_#d1d5db,4px_0_0_0_white]">
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
            <DropdownMenuItem destructive>
              <Archive size={14} />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
