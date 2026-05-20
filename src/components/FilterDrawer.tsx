import { useEffect, useState } from 'react';
import { Sheet, SheetHeader, SheetBody, SheetFooter } from './ui/Sheet';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterValue = Record<string, string[]>;
// checkbox  : value[id] = selected option values (empty array = no filter)
// dateRange : value[id] = [from, to] in YYYY-MM-DD (empty string = no bound)
// numberRange: value[id] = [min, max] as numeric strings (empty string = no bound)

export interface CheckboxSection {
  id: string;
  label: string;
  type: 'checkbox';
  options: { value: string; label: string }[];
}

export interface DateRangeSection {
  id: string;
  label: string;
  type: 'dateRange';
}

export interface NumberRangeSection {
  id: string;
  label: string;
  type: 'numberRange';
  prefix?: string;
}

export type FilterSectionDef = CheckboxSection | DateRangeSection | NumberRangeSection;

interface Props {
  open: boolean;
  onClose: () => void;
  sections: FilterSectionDef[];
  value: FilterValue;
  onApply: (value: FilterValue) => void;
}

// ─── Filter-matching helpers (exported for use in table components) ────────────

export function countActiveFilters(sections: FilterSectionDef[], value: FilterValue): number {
  let count = 0;
  for (const section of sections) {
    const v = value[section.id] ?? [];
    if (section.type === 'checkbox' && v.length > 0) count++;
    else if (
      (section.type === 'dateRange' || section.type === 'numberRange') &&
      (v[0] || v[1])
    )
      count++;
  }
  return count;
}

export function matchesDateRange(dateStr: string | undefined, range: string[]): boolean {
  if (!range || (!range[0] && !range[1])) return true;
  if (!dateStr) return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  if (range[0]) {
    const from = new Date(range[0] + 'T00:00:00');
    if (!isNaN(from.getTime()) && d < from) return false;
  }
  if (range[1]) {
    const to = new Date(range[1] + 'T23:59:59');
    if (!isNaN(to.getTime()) && d > to) return false;
  }
  return true;
}

export function matchesNumberRange(num: number | undefined, range: string[]): boolean {
  if (!range || (!range[0] && !range[1])) return true;
  if (num === undefined || num === null) return true;
  if (range[0] !== '' && range[0] !== undefined) {
    const min = parseFloat(range[0]);
    if (!isNaN(min) && num < min) return false;
  }
  if (range[1] !== '' && range[1] !== undefined) {
    const max = parseFloat(range[1]);
    if (!isNaN(max) && num > max) return false;
  }
  return true;
}

// ─── Checkbox item ────────────────────────────────────────────────────────────

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={[
        'flex items-center gap-2.5 px-3 py-2.5 border rounded-lg text-left transition-colors w-full',
        checked
          ? 'bg-violet-50 border-violet-200'
          : 'bg-white border-slate-200 hover:bg-slate-50',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors',
          checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300 bg-white',
        ].join(' ')}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4l2.5 2.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        className={[
          'text-sm select-none flex-1',
          checked ? 'text-slate-800 font-medium' : 'text-slate-600',
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Shared input class ───────────────────────────────────────────────────────

const INPUT_CLS =
  'flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ' +
  'transition-shadow focus:ring-2 focus:ring-violet-200 focus:border-violet-400 ' +
  'placeholder:text-slate-400';

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
      {children}
    </p>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export default function FilterDrawer({ open, onClose, sections, value, onApply }: Props) {
  const [draft, setDraft] = useState<FilterValue>({});

  useEffect(() => {
    if (open) setDraft(value);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = countActiveFilters(sections, draft);

  function toggleCheckbox(sectionId: string, optionValue: string) {
    setDraft((prev) => {
      const current = prev[sectionId] ?? [];
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      return { ...prev, [sectionId]: next };
    });
  }

  function setRange(sectionId: string, index: 0 | 1, val: string) {
    setDraft((prev) => {
      const current = [...(prev[sectionId] ?? ['', ''])];
      current[index] = val;
      return { ...prev, [sectionId]: current };
    });
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleCancel() {
    setDraft(value);
    onClose();
  }

  return (
    <Sheet open={open} onClose={handleCancel}>
      <SheetHeader title="Filters" onClose={handleCancel} />

      <SheetBody>
        {/* Meta row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-600">{activeCount}</span>{' '}
            active filter{activeCount !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => setDraft({})}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Reset all
          </button>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-5">
          {sections.map((section) => (
            <div key={section.id}>
              <SectionLabel>{section.label}</SectionLabel>

              {section.type === 'checkbox' && (
                <div className="flex flex-col gap-1.5">
                  {section.options.map((opt) => (
                    <CheckboxItem
                      key={opt.value}
                      label={opt.label}
                      checked={(draft[section.id] ?? []).includes(opt.value)}
                      onChange={() => toggleCheckbox(section.id, opt.value)}
                    />
                  ))}
                </div>
              )}

              {section.type === 'dateRange' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1 pl-1">From</label>
                    <input
                      type="date"
                      value={draft[section.id]?.[0] ?? ''}
                      onChange={(e) => setRange(section.id, 0, e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1 pl-1">To</label>
                    <input
                      type="date"
                      value={draft[section.id]?.[1] ?? ''}
                      onChange={(e) => setRange(section.id, 1, e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              )}

              {section.type === 'numberRange' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1 pl-1">
                      Min{section.prefix ? ` (${section.prefix})` : ''}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min={0}
                      value={draft[section.id]?.[0] ?? ''}
                      onChange={(e) => setRange(section.id, 0, e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1 pl-1">
                      Max{section.prefix ? ` (${section.prefix})` : ''}
                    </label>
                    <input
                      type="number"
                      placeholder="No limit"
                      min={0}
                      value={draft[section.id]?.[1] ?? ''}
                      onChange={(e) => setRange(section.id, 1, e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetBody>

      <SheetFooter>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            Apply filters
          </button>
        </div>
      </SheetFooter>
    </Sheet>
  );
}
