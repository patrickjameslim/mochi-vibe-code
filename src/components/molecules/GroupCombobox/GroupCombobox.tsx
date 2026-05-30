import { useState, useRef, useEffect } from 'react';
import { CaretDown, Check, Plus, X } from '@phosphor-icons/react';
import { Badge } from '#/components/atoms/Badge';

interface GroupComboboxProps {
  selected: string[];
  onChange: (groups: string[]) => void;
  groups: string[];
}

export function GroupCombobox({ selected, onChange, groups: initialGroups }: GroupComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>(initialGroups);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  function toggle(group: string) {
    onChange(
      selected.includes(group)
        ? selected.filter((g) => g !== group)
        : [...selected, group]
    );
  }

  function remove(group: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(selected.filter((g) => g !== group));
  }

  const filtered = availableGroups.filter((g) =>
    g.toLowerCase().includes(query.toLowerCase())
  );

  const canCreate =
    query.trim() !== '' &&
    !availableGroups.some((g) => g.toLowerCase() === query.trim().toLowerCase()) &&
    !selected.some((g) => g.toLowerCase() === query.trim().toLowerCase());

  function createGroup() {
    const name = query.trim();
    if (!name) return;
    setAvailableGroups((prev) => [...prev, name]);
    onChange([...selected, name]);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger box */}
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 20); }}
        className={[
          'min-h-[38px] w-full flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm cursor-text transition-shadow',
          open
            ? 'border-violet-400 ring-2 ring-violet-200'
            : 'border-slate-200 hover:border-slate-300',
        ].join(' ')}
      >
        {/* Selected pills */}
        {selected.map((g) => (
          <Badge key={g} colorScheme="primary" className="gap-1 pl-2 pr-1 py-0.5 rounded-md font-medium">
            {g}
            <button
              onClick={(e) => remove(g, e)}
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded hover:bg-violet-200 transition-colors"
            >
              <X size={9} weight="bold" />
            </button>
          </Badge>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? 'Select customer groups…' : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
        />

        <CaretDown
          size={13}
          className={`ml-auto shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && !canCreate && (
              <li className="px-3 py-3 text-xs text-slate-400 text-center">No groups found</li>
            )}
            {filtered.map((group) => {
              const isSelected = selected.includes(group);
              return (
                <li key={group}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(group)}
                    className={[
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                      isSelected ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors',
                        isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300',
                      ].join(' ')}
                    >
                      {isSelected && <Check size={10} weight="bold" className="text-white" />}
                    </span>
                    {group}
                  </button>
                </li>
              );
            })}

            {canCreate && (
              <li>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={createGroup}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 transition-colors text-left"
                >
                  <Plus size={13} weight="bold" />
                  Create &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            )}
          </ul>

          {selected.length > 0 && (
            <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">{selected.length} selected</span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
