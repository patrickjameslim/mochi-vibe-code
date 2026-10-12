import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@tanstack/react-router';
import { CaretRight, CaretDown, BellSimple, Check, Question } from '@phosphor-icons/react';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Label } from '#/components/atoms/Label';
import { RichTextEditor } from '#/components/atoms/RichTextEditor';
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
}: {
  selected: ReminderFrequencyPreset[];
  onChange: (next: ReminderFrequencyPreset[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');
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

  // Every time the dropdown opens, land on whichever tab actually holds the
  // current selection — Before if that's the only place selections exist,
  // After if that's the only place, and Before (the default) if selections
  // span both or there aren't any yet. Deliberately only reacts to `open`
  // transitioning, not to `selected` changing — switching tabs mid-session
  // must stay instant and never get silently overridden while open.
  useEffect(() => {
    if (!open) return;
    const categoryOf = (value: ReminderFrequencyPreset) =>
      REMINDER_FREQUENCY_OPTIONS.find((opt) => opt.value === value)?.category;
    const hasBefore = selected.some((v) => categoryOf(v) === 'before');
    const hasAfter = selected.some((v) => categoryOf(v) === 'after');
    setActiveTab(hasAfter && !hasBefore ? 'after' : 'before');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Single selection always shows the full phrase (e.g. "7 days before due
  // date") regardless of which tab it lives under — never the short,
  // tab-scoped label, since the trigger has no tab context of its own.
  let triggerLabel = 'Select schedule';
  if (selected.length === 1) {
    triggerLabel = REMINDER_FREQUENCY_OPTIONS.find((opt) => opt.value === selected[0])?.label ?? 'Select schedule';
  } else if (selected.length > 1) {
    triggerLabel = 'Multiple schedules selected';
  }

  const visibleOptions = REMINDER_FREQUENCY_OPTIONS.filter((opt) => opt.category === activeTab);

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
          <div className="p-2 border-b border-slate-100">
            {/* Subtle segmented control — a very light gray track with a
                compact white (not purple) chip for the active segment,
                just a hairline border for definition, no shadow. Purple
                stays reserved for the checkbox/row selected states below;
                this only needs to read as "current category", not as
                another prominent selected/button state. */}
            <div role="tablist" aria-orientation="horizontal" className="inline-flex w-full items-center rounded-lg bg-slate-50 p-[3px]">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'before'}
                onClick={() => setActiveTab('before')}
                className={cn(
                  'flex-1 h-7 rounded-md text-sm transition-colors',
                  activeTab === 'before'
                    ? 'bg-white text-slate-900 font-medium border border-slate-200'
                    : 'text-slate-500 font-normal border border-transparent hover:text-slate-700',
                )}
              >
                Before due date
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'after'}
                onClick={() => setActiveTab('after')}
                className={cn(
                  'flex-1 h-7 rounded-md text-sm transition-colors',
                  activeTab === 'after'
                    ? 'bg-white text-slate-900 font-medium border border-slate-200'
                    : 'text-slate-500 font-normal border border-transparent hover:text-slate-700',
                )}
              >
                After due date
              </button>
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto py-1">
            {visibleOptions.map((opt) => {
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
                    <span className="flex-1 min-w-0">{opt.shortLabel}</span>
                  </button>
                </li>
              );
            })}
          </ul>
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
  const [subject, setSubject] = useState(saved.subject);
  const [body, setBody] = useState(saved.body);

  const placeholders = getPlaceholdersForTemplate(id);

  const isDirty =
    JSON.stringify(frequencies) !== JSON.stringify(saved.frequencies) ||
    subject !== saved.subject ||
    body !== saved.body;

  function handleSave() {
    setEmailTemplate(id, {
      kind: 'reminder',
      frequencies,
      subject,
      body,
    });
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
              />
            </div>

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
