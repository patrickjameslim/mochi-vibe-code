import { useState, useMemo } from 'react';
import { MagnifyingGlass, Plus, Check } from '@phosphor-icons/react';
import { Sheet, SheetHeader, SheetBody, SheetFooter } from './ui/Sheet';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

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
}

export default function AssignGroupsDrawer({
  open,
  onClose,
  onSave,
  customerName,
  initialGroups,
}: AssignGroupsDrawerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(initialGroups));
  const [groups, setGroups] = useState<string[]>(ALL_GROUPS);

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

  return (
    <Sheet open={open} onClose={handleCancel}>
      <SheetHeader title="Assign groups" onClose={handleCancel} />

      <SheetBody>
        {/* Customer label */}
        <p className="mb-4 text-sm text-gray-500">
          Assigning groups to{' '}
          <span className="font-medium text-gray-900">{customerName}</span>
        </p>

        {/* Assigned groups summary */}
        {assignedGroups.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
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
        {assignedGroups.length > 0 && <hr className="mb-5 border-gray-100" />}

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
            <p className="text-sm text-gray-500">
              No group found for{' '}
              <span className="font-medium text-gray-700">
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
                  <p className="px-1 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
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
          </div>
        )}
      </SheetBody>

      <SheetFooter>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            Save changes
          </Button>
        </div>
      </SheetFooter>
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
        checked ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50',
      ].join(' ')}
    >
      {/* Checkbox visual */}
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked
            ? 'border-violet-600 bg-violet-600'
            : 'border-gray-300 bg-white',
        ].join(' ')}
      >
        {checked && <Check size={10} weight="bold" className="text-white" />}
      </span>
      <span className="flex-1 text-left font-medium">{group}</span>
    </button>
  );
}
