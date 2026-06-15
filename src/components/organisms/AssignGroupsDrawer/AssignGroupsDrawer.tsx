import { useState, useMemo, useEffect } from 'react';
import { MagnifyingGlass, Plus, Check } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '#/components/atoms/Sheet';
import { Input } from '#/components/atoms/Input';
import { Button } from '#/components/atoms/Button';

const ALL_GROUPS = [
  'Metroview Axis Tower',
  'Sterling Tower',
  'Glasshouse Tower',
  'Summit One Tower',
  'The Finance Centre',
  'BGC Corporate Park',
  'Makati Prime Tower',
];

interface AssignGroupsDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (groups: string[]) => void;
  customerName: string;
  initialGroups: string[];
  entityLabel?: string;
}

export function AssignGroupsDrawer({
  open,
  onClose,
  onSave,
  customerName,
  initialGroups,
  entityLabel,
}: AssignGroupsDrawerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(initialGroups));
  const [groups, setGroups] = useState<string[]>(() => {
    const extra = initialGroups.filter((g) => !ALL_GROUPS.includes(g));
    return extra.length > 0 ? [...ALL_GROUPS, ...extra] : ALL_GROUPS;
  });

  // Re-sync state whenever the drawer opens so it always reflects the latest initialGroups
  useEffect(() => {
    if (open) {
      setSelected(new Set(initialGroups));
      setSearch('');
      setGroups((prev) => {
        const extra = initialGroups.filter((g) => !prev.includes(g));
        return extra.length > 0 ? [...prev, ...extra] : prev;
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? groups.filter((g) => g.toLowerCase().includes(q)) : groups;
  }, [search, groups]);

  const assignedGroups = groups.filter((g) => selected.has(g));
  const unassignedFiltered = filtered.filter((g) => !selected.has(g));
  const assignedFiltered = filtered.filter((g) => selected.has(g));

  function toggle(group: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  function createGroup() {
    const name = search.trim();
    if (!name || groups.includes(name)) return;
    setGroups((prev) => [...prev, name]);
    setSelected((prev) => new Set([...prev, name]));
    setSearch('');
  }

  function handleSave() {
    onSave(Array.from(selected));
    onClose();
  }

  function handleCancel() {
    setSelected(new Set(initialGroups));
    setSearch('');
    onClose();
  }

  const noResults = filtered.length === 0;
  const trimmedSearch = search.trim();
  const canCreate =
    trimmedSearch !== '' &&
    !groups.some((g) => g.toLowerCase() === trimmedSearch.toLowerCase());

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <SheetContent side="right" size="md" className="p-0">
        <SheetHeader className="border-b border-slate-200 p-4">
          <SheetTitle className="text-base font-semibold text-slate-900">Assign groups</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
        {/* Entity label */}
        <p className="mb-4 text-sm text-slate-500">
          Assigning groups to{' '}
          <span className="font-medium text-slate-900">{entityLabel ?? customerName}</span>
        </p>

        {/* Assigned groups summary */}
        {assignedGroups.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Assigned ({assignedGroups.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {assignedGroups.map((g) => (
                <button
                  key={g}
                  onClick={() => toggle(g)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
                >
                  <Check size={11} weight="bold" />
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider if both sections shown */}
        {assignedGroups.length > 0 && <hr className="mb-5 border-slate-100" />}

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Search groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Group list */}
        {noResults ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-slate-500">
              No group found for{' '}
              <span className="font-medium text-slate-700">
                &ldquo;{search}&rdquo;
              </span>
            </p>
            <button
              onClick={createGroup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-violet-400 px-4 py-2 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50"
            >
              <Plus size={14} weight="bold" />
              Create &ldquo;{search}&rdquo;
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Show assigned at top when searching */}
            {search && assignedFiltered.length > 0 && (
              <>
                {assignedFiltered.map((group) => (
                  <GroupRow
                    key={group}
                    group={group}
                    checked={true}
                    onToggle={() => toggle(group)}
                  />
                ))}
                {unassignedFiltered.length > 0 && (
                  <p className="px-1 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Unassigned
                  </p>
                )}
              </>
            )}

            {/* Unassigned (or all when not searching) */}
            {(search ? unassignedFiltered : filtered).map((group) => (
              <GroupRow
                key={group}
                group={group}
                checked={selected.has(group)}
                onToggle={() => toggle(group)}
              />
            ))}

            {/* Inline create option when search has no exact match */}
            {canCreate && (
              <button
                onClick={createGroup}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-violet-300 px-3 py-2.5 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50"
              >
                <Plus size={14} weight="bold" className="shrink-0" />
                <span>Create &ldquo;{trimmedSearch}&rdquo;</span>
              </button>
            )}
          </div>
        )}
        </div>

        <SheetFooter className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1 text-violet-700">
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleSave} className="flex-1">
              Save changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function GroupRow({
  group,
  checked,
  onToggle,
}: {
  group: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={[
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
        checked ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      {/* Checkbox visual */}
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-violet-600 bg-violet-600'
            : 'border-slate-300 bg-white',
        ].join(' ')}
      >
        {checked && <Check size={10} weight="bold" className="text-white" />}
      </span>
      <span className="flex-1 text-left font-medium">{group}</span>
    </button>
  );
}
