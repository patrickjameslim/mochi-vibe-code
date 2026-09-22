import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@tanstack/react-router';
import { CaretRight, CaretDown, BellSimple, Check, X, Plus, TrashSimple, Question } from '@phosphor-icons/react';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Label } from '#/components/atoms/Label';
import { RichTextEditor } from '#/components/atoms/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '#/components/atoms/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/atoms/Select';
import { Tooltip, TooltipTrigger, TooltipContent } from '#/components/atoms/Tooltip';
import { cn } from '#/components/utils';
import { toast } from 'sonner';
import {
  setEmailTemplate,
  useEmailTemplates,
  getPlaceholdersForTemplate,
  SHARED_TEMPLATE_IDS,
  RECURRING_BILLING_TEMPLATE_IDS,
  ORDER_BASED_BILLING_TEMPLATE_IDS,
  TEMPLATE_LABELS,
  REMINDER_FREQUENCY_OPTIONS,
  type EmailTemplateId,
  type ReminderFrequencyPreset,
  type ReminderCustomOffset,
  type ReminderOffsetDirection,
  type ReminderOffsetUnit,
  type StandardEmailTemplateContent,
  type ReminderEmailTemplateContent,
} from '#/data/emailTemplates';

const DEFAULT_TEMPLATE_ID: EmailTemplateId = 'billing-notice';

// Which nav sub-group (if any) a template belongs to — drives both the
// sidebar's grouping and the breadcrumb trail. Shared templates (the ones
// NOT listed here) render directly under "Email Templates" with no further
// sub-header, since there's nothing product-specific to disambiguate: the
// same saved configuration applies wherever each one is used.
const PRODUCT_GROUPS: { key: string; label: string; templateIds: EmailTemplateId[] }[] = [
  { key: 'recurring-billing', label: 'Recurring Billing', templateIds: RECURRING_BILLING_TEMPLATE_IDS },
  { key: 'order-based-billing', label: 'Order-based Billing', templateIds: ORDER_BASED_BILLING_TEMPLATE_IDS },
];

function getBreadcrumbsFor(id: EmailTemplateId): string[] {
  const group = PRODUCT_GROUPS.find((g) => g.templateIds.includes(id));
  if (group) return ['Workflows', 'Email Templates', group.label, TEMPLATE_LABELS[id]];
  return ['Workflows', 'Email Templates', TEMPLATE_LABELS[id]];
}

// ─── Secondary nav ──────────────────────────────────────────────────────────

function SecSubNavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-[40px] flex items-center text-left pl-8 pr-4 text-sm border-l-[3px] transition-colors',
        active
          ? 'border-violet-600 bg-violet-50 text-violet-700 font-medium'
          : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      )}
    >
      {label}
    </button>
  );
}

// One collapsible product-specific group (Recurring Billing / Order-based
// Billing) — each lists the small set of templates that are genuinely
// specific to that product (a distinct email, not a shared one reused
// elsewhere). Shared templates never appear inside one of these groups —
// they render directly under the outer "Email Templates" toggle instead
// (see WorkflowsPage), so nothing is ever listed/edited in more than one
// place.
function TemplateNavGroup({
  label,
  templateIds,
  activeId,
  onSelect,
  open,
  onToggleOpen,
}: {
  label: string;
  templateIds: EmailTemplateId[];
  activeId: EmailTemplateId;
  onSelect: (id: EmailTemplateId) => void;
  open: boolean;
  onToggleOpen: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
      >
        {label}
        <CaretDown
          size={10}
          className={cn('shrink-0 transition-transform duration-150', open ? 'rotate-0' : '-rotate-90')}
        />
      </button>
      {open && templateIds.map((id) => (
        <SecSubNavItem
          key={id}
          label={TEMPLATE_LABELS[id]}
          active={activeId === id}
          onClick={() => onSelect(id)}
        />
      ))}
    </div>
  );
}

// ─── Payment Reminder frequency — multi-select checkboxes ──────────────────
// One Payment Reminder still has exactly one shared Subject/Email body —
// checking more than one schedule here just means that same email also
// goes out on the additional selected moments relative to the invoice's
// due date. "Custom" is one of the checkboxes, not a separate mode: once
// checked, a "Set dates"/"Edit dates" action appears inline in its own row
// to open the calendar picker for the specific extra dates, without
// interrupting the rest of the multi-select.

function ReminderFrequencyMultiSelect({
  selected,
  onChange,
  customCount,
  onEditCustomSchedule,
  onRemoveCustom,
}: {
  selected: ReminderFrequencyPreset[];
  onChange: (next: ReminderFrequencyPreset[]) => void;
  customCount: number;
  onEditCustomSchedule: () => void;
  onRemoveCustom: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keeps `selected` sorted to match REMINDER_FREQUENCY_OPTIONS' own
  // chronological order (before due date → due date → after due date),
  // regardless of the order items were actually clicked in — so both the
  // trigger's summary text and the saved value are always predictable.
  function toggle(value: ReminderFrequencyPreset) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    next.sort(
      (a, b) =>
        REMINDER_FREQUENCY_OPTIONS.findIndex((opt) => opt.value === a) -
        REMINDER_FREQUENCY_OPTIONS.findIndex((opt) => opt.value === b)
    );
    onChange(next);
  }

  // Custom has its own independent schedule count (customCount) that's
  // unrelated to how many PRESET options are checked — folding both into
  // one combined number (e.g. "7 reminder schedules") reads as one tally
  // when it's really two different things. So Custom's count is only shown
  // on its own when Custom is the ONLY thing selected; the moment a preset
  // is selected alongside it, it's a mix of schedule types and gets the
  // same generic "Multiple schedules selected" treatment as multiple
  // presets, rather than pretending the counts can be combined into one.
  const presetSelected = selected.filter((value) => value !== 'custom');
  const isCustomSelected = selected.includes('custom') && customCount > 0;

  let triggerLabel = 'Select schedule';
  if (isCustomSelected && presetSelected.length === 0) {
    triggerLabel = `Custom — ${customCount} reminder schedule${customCount > 1 ? 's' : ''}`;
  } else if (isCustomSelected && presetSelected.length > 0) {
    triggerLabel = 'Multiple schedules selected';
  } else if (presetSelected.length === 1) {
    triggerLabel = REMINDER_FREQUENCY_OPTIONS.find((opt) => opt.value === presetSelected[0])?.label ?? 'Select schedule';
  } else if (presetSelected.length > 1) {
    triggerLabel = 'Multiple schedules selected';
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white text-sm text-left"
      >
        <span className={cn('flex-1', selected.length === 0 && 'text-muted-foreground')}>
          {triggerLabel}
        </span>
        <CaretDown
          size={14}
          className={cn('shrink-0 text-slate-400 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
          <ul className="max-h-80 overflow-y-auto py-1">
            {REMINDER_FREQUENCY_OPTIONS.filter((opt) => opt.value !== 'custom').map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                      isSelected ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors',
                        isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300',
                      )}
                    >
                      {isSelected && <Check size={10} weight="bold" className="text-white" />}
                    </span>
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* "Custom" is an ACTION — clicking it opens the date-picker
              modal directly — not a checkbox toggle like the presets
              above, so it's deliberately styled differently: a divider
              sets it apart, a chevron (not a checkbox square) hints it
              opens something, and a separate "×" only appears once dates
              are actually configured, as the way to remove it again now
              that there's no checkbox to uncheck. */}
          <div className="border-t border-slate-200 py-1">
            <div
              className={cn(
                'flex items-center gap-1 pl-3 pr-2 py-1 transition-colors',
                selected.includes('custom') ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <button
                type="button"
                onClick={() => { setOpen(false); onEditCustomSchedule(); }}
                className="flex-1 min-w-0 flex items-center justify-between gap-2 py-1 text-sm text-left"
              >
                <span className="truncate">
                  {customCount > 0
                    ? `Custom — ${customCount} schedule${customCount > 1 ? 's' : ''}`
                    : 'Custom'}
                </span>
                <CaretRight size={12} className="shrink-0 text-slate-400" />
              </button>
              {selected.includes('custom') && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveCustom(); }}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-violet-100 transition-colors shrink-0"
                >
                  <X size={11} weight="bold" className="text-violet-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Standard template (fixed Subject + Email body, no send-timing) ───────

function StandardTemplateEditor({
  id,
  title,
  saved,
}: {
  id: EmailTemplateId;
  title: string;
  saved: StandardEmailTemplateContent;
}) {
  const [subject, setSubject] = useState(saved.subject);
  const [body, setBody] = useState(saved.body);

  const placeholders = getPlaceholdersForTemplate(id);

  const isDirty = subject !== saved.subject || body !== saved.body;

  function handleSave() {
    setEmailTemplate(id, { kind: 'standard', subject, body });
    toast.success('Template updated', {
      description: `${title.replace(/ Workflow$/, '')} email template has been saved.`,
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-5xl min-h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">{title}</h1>
            <Button colorScheme="primary" onClick={handleSave} disabled={!isDirty}>
              Save changes
            </Button>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-white p-6 space-y-4 flex-1 flex flex-col min-h-[600px]">
            <div className="shrink-0">
              <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                value={subject}
                onChange={setSubject}
                singleLine
                placeholders={placeholders}
                minHeight={20}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <Label className="block text-sm font-medium text-slate-700 mb-1.5 shrink-0">
                Email body <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholders={placeholders}
                grow
                className="flex-1 min-h-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Custom reminder schedule — relative to the invoice's own due date ─────
// Payment Reminder is ONE shared template applied across invoices that all
// have different due dates, so "Custom" can never mean fixed calendar
// dates — every custom schedule has to be expressed relative to whatever
// due date a given invoice ends up with (e.g. "10 days before", "20 days
// after"), the same way the built-in presets already are. Modeled after a
// Google Calendar-style custom-notification builder: one row per offset
// (a day count + before/after), each independently removable, with an
// "Add another" action to add more — not a fixed-date calendar.

// Resolves an offset to a single day count for sorting/dedup/scheduling —
// "2 Weeks" and "14 Days" both resolve to 14, so they're treated as the
// same schedule even though the user typed them differently.
function resolveOffsetDays(offset: ReminderCustomOffset): number {
  if (offset.direction === 'on') return 0;
  return offset.unit === 'weeks' ? offset.amount * 7 : offset.amount;
}

function ReminderOffsetRow({
  index,
  offset,
  disableOnDueDate,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  offset: ReminderCustomOffset;
  // True when another row already uses "On the due date" — only one
  // schedule may ever represent the due date itself, so this row's own
  // option is greyed out (unless it's the row that already holds it).
  disableOnDueDate: boolean;
  // False when this is the only remaining row — at least one schedule must
  // always exist, so the delete action is disabled rather than removed
  // (removing it would shift layout unexpectedly as rows come and go).
  canRemove: boolean;
  onChange: (patch: Partial<ReminderCustomOffset>) => void;
  onRemove: () => void;
}) {
  const isOnDueDate = offset.direction === 'on';

  function handleDirectionChange(value: string) {
    onChange({ direction: value as ReminderOffsetDirection });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900">Reminder {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove reminder ${index + 1}`}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 transition-colors disabled:opacity-30 disabled:text-slate-400 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
        >
          <TrashSimple size={14} />
        </button>
      </div>
      {/* Row keeps the same three-column shape no matter which timing is
          selected — "On the due date" doesn't need a number or unit, but
          replacing them with matching disabled placeholders (rather than
          removing them) keeps every row visually aligned and avoids the
          timing dropdown awkwardly stretching to fill the row. Both
          placeholders share identical sizing, background, border, and
          centered dash treatment so neither reads as more "disabled" than
          the other. */}
      <div className="flex items-center gap-2">
        {isOnDueDate ? (
          <>
            <div
              aria-hidden="true"
              className="w-[100px] h-10 rounded-[8px] border border-slate-200 bg-muted flex items-center justify-center shrink-0"
            >
              <span className="text-sm font-normal leading-none text-muted-foreground select-none">—</span>
            </div>
            <div
              aria-hidden="true"
              className="w-[140px] h-10 rounded-[8px] border border-slate-200 bg-muted flex items-center justify-center shrink-0"
            >
              <span className="text-sm font-normal leading-none text-muted-foreground select-none">—</span>
            </div>
          </>
        ) : (
          <>
            <input
              type="number"
              min={1}
              max={365}
              value={offset.amount}
              onChange={(e) => onChange({ amount: Math.min(365, Math.max(1, Number(e.target.value) || 1)) })}
              className="w-[100px] h-10 px-2 rounded-[8px] border border-slate-200 bg-white text-sm text-center outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-shadow shrink-0"
            />
            <Select value={offset.unit} onValueChange={(value) => onChange({ unit: value as ReminderOffsetUnit })}>
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Day(s)</SelectItem>
                <SelectItem value="weeks">Week(s)</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        <Select value={offset.direction} onValueChange={handleDirectionChange}>
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before">Before due date</SelectItem>
            <SelectItem value="on" disabled={disableOnDueDate}>On the due date</SelectItem>
            <SelectItem value="after">After due date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Chronological ordering relative to the invoice due date: schedules that
// fire further before the due date come first, then the due-date-itself
// schedule (if any), then after-due-date schedules from soonest to latest.
const OFFSET_DIRECTION_RANK: Record<ReminderOffsetDirection, number> = { before: 0, on: 1, after: 2 };

function compareOffsets(a: ReminderCustomOffset, b: ReminderCustomOffset): number {
  if (a.direction !== b.direction) return OFFSET_DIRECTION_RANK[a.direction] - OFFSET_DIRECTION_RANK[b.direction];
  const daysA = resolveOffsetDays(a);
  const daysB = resolveOffsetDays(b);
  if (a.direction === 'before') return daysB - daysA;
  if (a.direction === 'after') return daysA - daysB;
  return 0;
}

function offsetKey(offset: ReminderCustomOffset): string {
  return offset.direction === 'on' ? 'on' : `${offset.direction}-${resolveOffsetDays(offset)}`;
}

function hasDuplicateOffsets(offsets: ReminderCustomOffset[]): boolean {
  const seen = new Set<string>();
  for (const offset of offsets) {
    const key = offsetKey(offset);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

// The schedule shown by default — both when the modal first opens with
// nothing saved yet, and whenever "Add reminder schedule" is clicked.
function createDefaultOffset(): ReminderCustomOffset {
  return { id: crypto.randomUUID(), amount: 1, unit: 'days', direction: 'before' };
}

// Opened the moment "Custom" is chosen in the "Send this email" dropdown —
// offsets are edited in an isolated draft here and only committed to the
// template on Save, so Cancel always discards any in-progress changes
// without touching whatever was already saved.
function CustomReminderScheduleModal({
  open,
  initialOffsets,
  onCancel,
  onSave,
}: {
  open: boolean;
  initialOffsets: ReminderCustomOffset[];
  onCancel: () => void;
  onSave: (offsets: ReminderCustomOffset[]) => void;
}) {
  const [draftOffsets, setDraftOffsets] = useState<ReminderCustomOffset[]>(() =>
    initialOffsets.length > 0 ? [...initialOffsets].sort(compareOffsets) : [createDefaultOffset()],
  );

  // Re-seed the draft from whatever's currently saved every time the modal
  // opens — so re-opening it later to edit starts from the committed
  // schedule, not from a stale draft left over from a previous, cancelled
  // attempt. Sorted so re-opening always shows the chronological order the
  // schedule was last saved in. When there's nothing saved yet, a single
  // "1 Day Before due date" row is shown right away — no reason to make
  // users click "Add reminder schedule" just to see the first row.
  useEffect(() => {
    if (open) {
      setDraftOffsets(initialOffsets.length > 0 ? [...initialOffsets].sort(compareOffsets) : [createDefaultOffset()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function addOffset() {
    setDraftOffsets((prev) => [...prev, createDefaultOffset()]);
  }

  function updateOffset(id: string, patch: Partial<ReminderCustomOffset>) {
    setDraftOffsets((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function removeOffset(id: string) {
    setDraftOffsets((prev) => prev.filter((o) => o.id !== id));
  }

  const hasOnDueDate = draftOffsets.some((o) => o.direction === 'on');
  const hasDuplicates = hasDuplicateOffsets(draftOffsets);
  const isValid =
    draftOffsets.length > 0 &&
    draftOffsets.every((o) => o.direction === 'on' || o.amount >= 1) &&
    !hasDuplicates;

  function handleSave() {
    onSave([...draftOffsets].sort(compareOffsets));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="max-w-[30rem] sm:max-w-[30rem] max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-4 pb-0 shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">Set Reminder Schedule</DialogTitle>
          {/* Screen-reader-only — no visible supporting text under the
              title, but Radix Dialog still needs a description wired up
              via aria-describedby to stay accessible. */}
          <DialogDescription className="sr-only">
            Configure one or more custom reminder schedules relative to the invoice due date.
          </DialogDescription>
        </DialogHeader>

        {/* Scrolls independently once enough reminder rows are added to
            exceed the modal's max height — header and footer (Cancel/Save)
            stay fixed in place so they're always reachable. */}
        <div className="px-4 pt-3 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {draftOffsets.length === 0 ? (
            <p className="text-sm text-slate-400 py-1">No custom schedule added yet.</p>
          ) : (
            draftOffsets.map((offset, index) => (
              <ReminderOffsetRow
                key={offset.id}
                index={index}
                offset={offset}
                disableOnDueDate={hasOnDueDate && offset.direction !== 'on'}
                canRemove={draftOffsets.length > 1}
                onChange={(patch) => updateOffset(offset.id, patch)}
                onRemove={() => removeOffset(offset.id)}
              />
            ))
          )}

          <Button
            type="button"
            variant="outline"
            colorScheme="secondary"
            size="md"
            onClick={addOffset}
            className="w-full"
          >
            <Plus size={16} weight="bold" />
            Add reminder schedule
          </Button>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 p-4 pt-2 shrink-0 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
          <Button colorScheme="primary" size="md" onClick={handleSave} disabled={!isValid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Reminder — one shared Subject/body, multiple send schedules ───
// A Payment Reminder is still ONE template — one shared Subject and Email
// body — but it can be configured to go out on more than one schedule
// relative to the invoice's due date (see ReminderFrequencyMultiSelect
// above). Selecting several schedules is not the same as having several
// templates: there's no per-schedule Subject/body, only per-schedule
// timing.

function ReminderTemplateEditor({
  id,
  title,
  saved,
}: {
  id: EmailTemplateId;
  title: string;
  saved: ReminderEmailTemplateContent;
}) {
  const [frequencies, setFrequencies] = useState<ReminderFrequencyPreset[]>(saved.frequencies);
  const [customOffsets, setCustomOffsets] = useState<ReminderCustomOffset[]>(saved.customOffsets ?? []);
  const [customScheduleModalOpen, setCustomScheduleModalOpen] = useState(false);
  const [subject, setSubject] = useState(saved.subject);
  const [body, setBody] = useState(saved.body);

  const placeholders = getPlaceholdersForTemplate(id);

  const isDirty =
    JSON.stringify(frequencies) !== JSON.stringify(saved.frequencies) ||
    JSON.stringify(customOffsets) !== JSON.stringify(saved.customOffsets ?? []) ||
    subject !== saved.subject ||
    body !== saved.body;

  function handleSave() {
    setEmailTemplate(id, {
      kind: 'reminder',
      frequencies,
      customOffsets,
      subject,
      body,
    });
    toast.success('Template updated', {
      description: `${title.replace(/ Workflow$/, '')} email template has been saved.`,
    });
  }

  function handleCustomScheduleCancel() {
    setCustomScheduleModalOpen(false);
  }

  function handleCustomScheduleSave(offsets: ReminderCustomOffset[]) {
    setCustomOffsets(offsets);
    if (!frequencies.includes('custom')) setFrequencies((prev) => [...prev, 'custom']);
    setCustomScheduleModalOpen(false);
  }

  // The only way to un-configure Custom now that it's an action (opening a
  // modal) rather than a checkbox — clears both its offsets and its
  // membership in the schedule together, since a custom entry with no
  // offsets wouldn't mean anything.
  function handleRemoveCustom() {
    setCustomOffsets([]);
    setFrequencies((prev) => prev.filter((v) => v !== 'custom'));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-5xl min-h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">{title}</h1>
            <Button colorScheme="primary" onClick={handleSave} disabled={!isDirty || frequencies.length === 0}>
              Save changes
            </Button>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-white p-6 space-y-4 flex-1 flex flex-col min-h-[600px]">
            <div className="w-[320px] shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Label className="text-sm font-medium text-slate-700">Send this email</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center text-violet-500 hover:text-violet-600 transition-colors">
                      <Question size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px]">
                    Choose when to send payment reminders based on the invoice due date. You can select multiple schedules.
                  </TooltipContent>
                </Tooltip>
              </div>
              <ReminderFrequencyMultiSelect
                selected={frequencies}
                onChange={setFrequencies}
                customCount={customOffsets.length}
                onEditCustomSchedule={() => setCustomScheduleModalOpen(true)}
                onRemoveCustom={handleRemoveCustom}
              />
            </div>

            <CustomReminderScheduleModal
              open={customScheduleModalOpen}
              initialOffsets={customOffsets}
              onCancel={handleCustomScheduleCancel}
              onSave={handleCustomScheduleSave}
            />

            <div className="shrink-0">
              <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                value={subject}
                onChange={setSubject}
                singleLine
                placeholders={placeholders}
                minHeight={20}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <Label className="block text-sm font-medium text-slate-700 mb-1.5 shrink-0">
                Email body <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholders={placeholders}
                grow
                className="flex-1 min-h-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Email Templates — dispatches to the right editor by content kind ──────

function EmailTemplateWorkflow({ id, title }: { id: EmailTemplateId; title: string }) {
  const templates = useEmailTemplates();
  const saved = templates[id];

  if (saved.kind === 'reminder') {
    return <ReminderTemplateEditor id={id} title={title} saved={saved} />;
  }
  return <StandardTemplateEditor id={id} title={title} saved={saved} />;
}

// ─── WorkflowsPage ──────────────────────────────────────────────────────────

export function WorkflowsPage() {
  const search = useSearch({ strict: false }) as { section?: string };
  const [activeId, setActiveId] = useState<EmailTemplateId>(
    (search.section as EmailTemplateId) ?? DEFAULT_TEMPLATE_ID
  );
  const [emailTemplatesOpen, setEmailTemplatesOpen] = useState(true);
  // Keyed by product-group `key` (see PRODUCT_GROUPS) — only the two
  // genuinely product-specific groups (Recurring Billing, Order-based
  // Billing) are collapsible sub-groups; shared templates render flat,
  // directly under the outer "Email Templates" toggle, with no group of
  // their own to expand/collapse.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'recurring-billing': true,
    'order-based-billing': true,
  });

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) setActiveId(section as EmailTemplateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = `${TEMPLATE_LABELS[activeId]} Workflow`;
  const breadcrumbs = getBreadcrumbsFor(activeId);

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Dashboard</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={`${crumb}-${i}`} className="flex items-center gap-1.5">
                <CaretRight size={12} />
                <span className={i === breadcrumbs.length - 1 ? 'text-slate-900 font-medium' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Secondary nav */}
          <nav className="w-[228px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto py-2">
            <button
              onClick={() => setEmailTemplatesOpen((o) => !o)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm border-l-[3px] flex items-center justify-between transition-colors',
                'border-violet-600 bg-violet-50 text-violet-700 font-medium',
              )}
            >
              Email Templates
              <CaretDown
                size={11}
                className={cn(
                  'shrink-0 transition-transform duration-150 text-violet-500',
                  emailTemplatesOpen ? 'rotate-0' : '-rotate-90',
                )}
              />
            </button>
            {emailTemplatesOpen && (
              <div className="pb-1">
                {/* Shared templates — listed directly, no sub-header of
                    their own, since there's only ONE stored config per
                    template and nothing product-specific to disambiguate. */}
                {SHARED_TEMPLATE_IDS.map((id) => (
                  <SecSubNavItem
                    key={id}
                    label={TEMPLATE_LABELS[id]}
                    active={activeId === id}
                    onClick={() => setActiveId(id)}
                  />
                ))}
                {PRODUCT_GROUPS.map((group) => (
                  <TemplateNavGroup
                    key={group.key}
                    label={group.label}
                    templateIds={group.templateIds}
                    activeId={activeId}
                    onSelect={setActiveId}
                    open={openGroups[group.key]}
                    onToggleOpen={() => toggleGroup(group.key)}
                  />
                ))}
              </div>
            )}
          </nav>

          {/* Main content */}
          <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <EmailTemplateWorkflow key={activeId} id={activeId} title={title} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
