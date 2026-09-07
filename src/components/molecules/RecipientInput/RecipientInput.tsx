import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { ProfileAvatar } from '#/components/molecules/ProfileAvatar';
import type { Recipient, RecipientType } from '#/data/emailTemplates';
import type { AccountUser } from '#/data/accountUsers';

interface RecipientInputProps {
  value: Recipient[];
  onChange: (recipients: Recipient[]) => void;
  users: AccountUser[];
}

/**
 * Gmail-style recipient field: a "To" row is always shown; clicking "CC" or
 * "BCC" (on the To row only) reveals its own separate row below — each row
 * is its own independent chip input with its own autocomplete, and a
 * recipient's type is set ONLY by which row it was added through. Adding to
 * one row never touches recipients already sitting in another row.
 *
 * Clicking "CC"/"BCC" ONLY reveals that row — it never opens the
 * suggestion dropdown or focuses the new row's input by itself. The
 * dropdown only appears once the user actually clicks/focuses a row's own
 * input. Once a row is revealed, its toggle button is removed from the
 * trailing controls (so clicking it again can't "re-reveal" anything —
 * there's nothing left to click).
 */
export function RecipientInput({ value, onChange, users }: RecipientInputProps) {
  const [showCc, setShowCc] = useState(() => value.some((r) => r.type === 'cc'));
  const [showBcc, setShowBcc] = useState(() => value.some((r) => r.type === 'bcc'));

  function recipientsOf(type: RecipientType) {
    return value.filter((r) => r.type === type);
  }

  function addTo(type: RecipientType, recipient: Omit<Recipient, 'type'>) {
    onChange([...value, { ...recipient, type }]);
  }

  function removeFrom(type: RecipientType, id: string) {
    onChange(value.filter((r) => !(r.type === type && r.id === id)));
  }

  // Once a row is revealed, its own toggle button disappears from the
  // trailing controls — only the not-yet-revealed ones remain. Once both
  // are revealed, there's nothing left to render there at all.
  const showTrailing = !showCc || !showBcc;

  return (
    <div className="rounded-[8px] border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
      <RecipientRow
        label="To"
        recipients={recipientsOf('to')}
        onAdd={(r) => addTo('to', r)}
        onRemove={(id) => removeFrom('to', id)}
        users={users}
        trailing={
          showTrailing && (
            <div className="ml-auto flex items-center gap-1 shrink-0">
              {!showCc && (
                <button
                  type="button"
                  // Reveal-only: never opens the dropdown or focuses anything.
                  onClick={(e) => { e.stopPropagation(); setShowCc(true); }}
                  className="px-2 py-1 rounded text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  CC
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowBcc(true); }}
                  className="px-2 py-1 rounded text-xs font-medium text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  BCC
                </button>
              )}
            </div>
          )
        }
      />
      {showCc && (
        <RecipientRow
          label="Cc"
          recipients={recipientsOf('cc')}
          onAdd={(r) => addTo('cc', r)}
          onRemove={(id) => removeFrom('cc', id)}
          users={users}
        />
      )}
      {showBcc && (
        <RecipientRow
          label="Bcc"
          recipients={recipientsOf('bcc')}
          onAdd={(r) => addTo('bcc', r)}
          onRemove={(id) => removeFrom('bcc', id)}
          users={users}
        />
      )}
    </div>
  );
}

// ─── A single To/Cc/Bcc row ─────────────────────────────────────────────────
// Each row owns its own chips + inline input + autocomplete dropdown — fully
// independent of the other rows, matching Gmail's behavior where To/Cc/Bcc
// are separate fields, not one field with a "mode".

function RecipientRow({
  label,
  recipients,
  onAdd,
  onRemove,
  users,
  trailing,
}: {
  label: string;
  recipients: Recipient[];
  onAdd: (recipient: Omit<Recipient, 'type'>) => void;
  onRemove: (id: string) => void;
  users: AccountUser[];
  trailing?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Where to render the portaled dropdown — recomputed every time it opens
  // (and kept in sync on scroll/resize while open) so it always sits
  // directly under THIS row, regardless of where in the page it is.
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateDropdownPos() {
    const rect = rowRef.current?.getBoundingClientRect();
    if (rect) setDropdownPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }

  function openDropdown() {
    updateDropdownPos();
    setOpen(true);
  }

  // Close on a click that's outside BOTH the row and the (portaled, so
  // it's not a DOM descendant of the row) dropdown panel.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rowRef.current && !rowRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    // Keep the portaled dropdown glued under the row if the page scrolls
    // or the window resizes while it's open, instead of drifting away.
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [open]);

  function addUser(user: AccountUser) {
    onAdd({ id: user.id, name: user.name, email: user.email });
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function addManualEmail(email: string) {
    onAdd({ id: email, name: email, email });
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const typed = query.trim();
      if (!typed || !typed.includes('@')) return;
      const matched = filtered.find((u) => u.email.toLowerCase() === typed.toLowerCase());
      if (matched) addUser(matched);
      else addManualEmail(typed);
    }
  }

  // A user already added to THIS row shouldn't be suggested again in THIS
  // row, but (unlike the old single-field design) they CAN still be added
  // to a different row — e.g. the same person can be both To and Cc.
  const inThisRow = new Set(recipients.map((r) => r.id));
  const filtered = users.filter(
    (u) =>
      !inThisRow.has(u.id) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div ref={rowRef} className="relative">
      <div
        // Clicking anywhere in the row (not just the input) activates it —
        // this is "clicking the field", distinct from clicking CC/BCC,
        // which only reveals a row and never calls openDropdown/focus.
        onClick={() => { openDropdown(); setTimeout(() => inputRef.current?.focus(), 20); }}
        className="min-h-[38px] w-full flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 cursor-text"
      >
        <span className="text-xs text-slate-400 select-none shrink-0 w-6">{label}</span>

        {recipients.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700"
          >
            {users.some((u) => u.id === r.id) && <ProfileAvatar name={r.name} size="xs" className="size-7" />}
            <span className="text-sm">{r.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(r.id); }}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={10} weight="bold" className="text-slate-500" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); openDropdown(); }}
          onFocus={openDropdown}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-slate-900"
        />

        {trailing}
      </div>

      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          className="bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {filtered.length > 0 ? (
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((user) => (
                <li key={user.id}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addUser(user)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <ProfileAvatar name={user.name} size="xs" />
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-900 truncate">{user.name}</span>
                      <span className="text-xs text-slate-400 truncate">{user.email}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            query.trim() && (
              <p className="px-3 py-2.5 text-sm text-slate-400">No matching recipients</p>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
