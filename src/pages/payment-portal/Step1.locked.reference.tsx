/**
 * ============================================================================
 * 🔒 LOCKED DESIGN — STEP 1: SELECT BILLS TO PAY
 * ============================================================================
 *
 * This file is the PRESERVED, APPROVED snapshot of the Step 1 design.
 *
 * RULES:
 *  - This is the source of truth for Step 1's design.
 *  - The live `Step1` component in `page.tsx` must MATCH this snapshot.
 *  - Do NOT modify Step 1's layout, styling, or behavior while working on
 *    Step 2 / Step 3 / Success page.
 *  - Step 1 may ONLY be changed when the user EXPLICITLY commands:
 *    "change the design of step 1".
 *  - If Step 1 ever drifts from this snapshot unintentionally, restore it
 *    from here.
 *
 * This file is a design reference only — it is NOT imported by the app.
 * Supporting components (BillCard, FilterDrawer, DateRangePicker,
 * PriceRangeSlider, CustomerInfoPanel, Stepper, StatusBadge) and the mock
 * data (BILLS, CUSTOMER, DEFAULT_FILTERS) live in `page.tsx` and are
 * likewise part of the locked Step 1 design.
 *
 * ----------------------------------------------------------------------------
 * STEP 1 STRUCTURE (locked):
 *
 *  Layout: Stepper (left) | Center content column | CustomerInfoPanel (right)
 *
 *  Center content column = scroll area + sticky footer:
 *    • Scroll area (flex-1 overflow-auto p-8 flex flex-col gap-5):
 *        - Title: "Select Bills to Pay" + subtitle
 *        - Search input + Filter button (with active filter count badge)
 *        - Summary card: Total amount due before fees / Number of selected
 *          bills / Number of bills in portal + "Select all" toggle
 *        - Error banner (when no bill selected on Continue)
 *        - Bill cards grid (grid-cols-1 lg:grid-cols-2 gap-4)
 *    • Sticky footer (border-t, bg-white, px-8 py-4, justify-end):
 *        - "Continue" primary button (violet-600), scoped to the middle
 *          content column only (NOT the full viewport).
 *
 *  Bill card (BillCard):
 *    - Header: custom checkbox + clickable #Bill ID + status badge
 *    - Body: bill name, Billed/Due dates (overdue = red), Amount Due,
 *      Overdue Charge (when present)
 *    - Divider + footer: "Download Bill PDF" outline button
 *    - Paid bills are dimmed and non-selectable
 *
 *  Filter drawer (FilterDrawer):
 *    - Status pills, Amount Due range slider, Overdue Charge range slider,
 *      Bill Date range picker, Due Date range picker, Bill Type pills
 *    - Footer: Reset + Apply (right-aligned, rounded-lg)
 *
 * ----------------------------------------------------------------------------
 * Below is the exact JSX of the locked Step 1 component for reference.
 * ============================================================================
 */

export const STEP_1_LOCKED_SNAPSHOT = `
function Step1({ selected, onToggle, showError, onContinue }: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  showError: boolean;
  onContinue: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function applyFilters(b: Bill): boolean {
    if (appliedFilters.status !== 'all' && b.status !== appliedFilters.status) return false;
    if (appliedFilters.billType !== 'all' && b.billType !== appliedFilters.billType) return false;
    if (appliedFilters.amountMin && b.amount < parseFloat(appliedFilters.amountMin)) return false;
    if (appliedFilters.amountMax && b.amount > parseFloat(appliedFilters.amountMax)) return false;
    if (appliedFilters.overdueMin && (b.overdueCharge ?? 0) < parseFloat(appliedFilters.overdueMin)) return false;
    if (appliedFilters.overdueMax && (b.overdueCharge ?? 0) > parseFloat(appliedFilters.overdueMax)) return false;
    return true;
  }

  const filtered = BILLS.filter((b) => {
    const matchSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch && applyFilters(b);
  });

  const payableBills = BILLS.filter(isPayable);
  const allVisiblePayable = filtered.filter(isPayable);
  const allSelected = allVisiblePayable.length > 0 && allVisiblePayable.every((b) => selected.has(b.id));
  const selectedTotal = payableBills
    .filter((b) => selected.has(b.id))
    .reduce((s, b) => s + b.amount + (b.overdueCharge ?? 0), 0);

  function handleSelectAll() {
    if (allSelected) {
      allVisiblePayable.forEach((b) => { if (selected.has(b.id)) onToggle(b.id); });
    } else {
      allVisiblePayable.forEach((b) => { if (!selected.has(b.id)) onToggle(b.id); });
    }
  }

  const activeFilterCount = [
    appliedFilters.status !== 'all',
    appliedFilters.billType !== 'all',
    appliedFilters.amountMin || appliedFilters.amountMax,
    appliedFilters.overdueMin || appliedFilters.overdueMax,
    appliedFilters.billDateFrom || appliedFilters.billDateTo,
    appliedFilters.dueDateFrom || appliedFilters.dueDateTo,
  ].filter(Boolean).length;

  return (
    <>
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        onApply={() => setAppliedFilters(filters)}
        onReset={() => { setFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); }}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Center content column (scroll area + sticky footer) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-8 flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Select Bills to Pay</h1>
              <p className="text-sm text-slate-500 mt-0.5">Choose one or more bills below to proceed with payment.</p>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
                  placeholder="Search by Bill ID or name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className={[
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors',
                  activeFilterCount > 0
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                <FunnelSimple size={15} />
                Filter
                {activeFilterCount > 0 && (
                  <span className="bg-white text-violet-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Top Summary */}
            <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex items-center justify-between">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Total amount due before fees</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(selectedTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Number of selected bills</p>
                  <p className="text-lg font-bold text-slate-900">{selected.size}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Number of bills in portal</p>
                  <p className="text-lg font-bold text-slate-900">{payableBills.length}</p>
                </div>
              </div>
              <button
                onClick={handleSelectAll}
                className="px-6 py-2 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Error banner */}
            {showError && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <Warning size={16} weight="fill" className="shrink-0" />
                Please select at least one bill to continue.
              </div>
            )}

            {/* Bill cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  checked={selected.has(bill.id)}
                  onToggle={() => isPayable(bill) && onToggle(bill.id)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="py-16 text-center text-sm text-slate-400">No bills match your search.</div>
              )}
            </div>
          </div>

          {/* Sticky footer — fixed within the middle content area */}
          <div className="border-t border-slate-200 bg-white px-8 py-4 flex items-center justify-end shrink-0">
            <button
              onClick={onContinue}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>

        {/* Right panel */}
        <CustomerInfoPanel />
      </div>
    </>
  );
}
`;
