import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@tanstack/react-router';
import { CaretRight, CaretDown, BellSimple, Check } from '@phosphor-icons/react';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Label } from '#/components/atoms/Label';
import { RichTextEditor } from '#/components/atoms/RichTextEditor';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#/components/atoms/Select';
import { RecipientInput } from '#/components/molecules/RecipientInput/RecipientInput';
import { cn } from '#/components/utils';
import { toast } from 'sonner';
import {
  setEmailTemplate,
  useEmailTemplates,
  getPlaceholdersForTemplate,
  type EmailTemplateId,
  type Recipient,
} from '#/data/emailTemplates';
import { ACCOUNT_USERS } from '#/data/accountUsers';

type WorkflowSection =
  | 'email-template-send-billing'
  | 'email-template-payment-reminder'
  | 'email-template-overdue-notice'
  | 'email-template-payment-confirmation'
  | 'email-template-proof-of-payment'
  | 'email-template-recurring-billing-agreement';

const EMAIL_TEMPLATE_SECTION_MAP: Record<WorkflowSection, { id: EmailTemplateId; title: string }> = {
  'email-template-send-billing':                 { id: 'send-billing',                 title: 'Billing Notice Workflow' },
  'email-template-payment-reminder':             { id: 'payment-reminder',             title: 'Payment Reminder Workflow' },
  'email-template-overdue-notice':               { id: 'overdue-notice',               title: 'Payment Overdue Workflow' },
  'email-template-payment-confirmation':         { id: 'payment-confirmation',         title: 'Payment Confirmation Workflow' },
  'email-template-proof-of-payment':             { id: 'proof-of-payment',             title: 'Payment Proof Workflow' },
  'email-template-recurring-billing-agreement':  { id: 'recurring-billing-agreement',  title: 'Billing Agreement Workflow' },
};

const BREADCRUMB_MAP: Record<WorkflowSection, string[]> = {
  'email-template-send-billing':                 ['Workflows', 'Email Templates', 'Billing Notice'],
  'email-template-payment-reminder':             ['Workflows', 'Email Templates', 'Payment Reminder'],
  'email-template-overdue-notice':               ['Workflows', 'Email Templates', 'Payment Overdue'],
  'email-template-payment-confirmation':         ['Workflows', 'Email Templates', 'Payment Confirmation'],
  'email-template-proof-of-payment':             ['Workflows', 'Email Templates', 'Payment Proof'],
  'email-template-recurring-billing-agreement':  ['Workflows', 'Email Templates', 'Billing Agreement'],
};

// ─── Secondary nav ──────────────────────────────────────────────────────────

function SecSubNavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-[40px] flex items-center text-left pl-5 pr-4 text-sm border-l-[3px] transition-colors',
        active
          ? 'border-violet-600 bg-violet-50 text-violet-700 font-medium'
          : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      )}
    >
      {label}
    </button>
  );
}

// ─── Excluded recipients ────────────────────────────────────────────────────

function ExcludedRecipientsSelect({
  selected,
  onChange,
  options,
}: {
  selected: string[];
  onChange: (names: string[]) => void;
  options: string[];
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

  function toggle(name: string) {
    onChange(
      selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[38px] flex items-center justify-between px-2.5 py-1.5 rounded-[8px] border border-slate-200 bg-white text-sm text-left"
      >
        <span className={selected.length === 0 ? 'text-muted-foreground' : 'text-slate-900'}>
          {selected.length === 0 ? 'Select users to exclude...' : selected.join(', ')}
        </span>
        <CaretDown
          size={14}
          className={`ml-2 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map((name) => {
              const isSelected = selected.includes(name);
              return (
                <li key={name}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggle(name)}
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
                    {name}
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

// ─── Email Templates ────────────────────────────────────────────────────────

function EmailTemplateWorkflow({ templateId, title }: { templateId: EmailTemplateId; title: string }) {
  const templates = useEmailTemplates();
  const saved = templates[templateId];
  const [sendTiming, setSendTiming] = useState(saved.sendTiming);
  const [subject, setSubject] = useState(saved.subject);
  const [body, setBody] = useState(saved.body);
  const [additionalRecipients, setAdditionalRecipients] = useState<Recipient[]>(saved.additionalRecipients);
  const [excludedRecipients, setExcludedRecipients] = useState<string[]>(saved.excludedRecipients);

  const placeholders = getPlaceholdersForTemplate(templateId);

  const isDirty =
    sendTiming !== saved.sendTiming ||
    subject !== saved.subject ||
    body !== saved.body ||
    JSON.stringify(additionalRecipients) !== JSON.stringify(saved.additionalRecipients) ||
    JSON.stringify(excludedRecipients) !== JSON.stringify(saved.excludedRecipients);

  function handleSave() {
    setEmailTemplate(templateId, { sendTiming, subject, body, additionalRecipients, excludedRecipients });
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
              <Label className="block text-sm font-medium text-slate-700 mb-1.5">Additional recipients</Label>
              <RecipientInput value={additionalRecipients} onChange={setAdditionalRecipients} users={ACCOUNT_USERS} />
            </div>
            <div className="shrink-0">
              <Label className="block text-sm font-medium text-slate-700 mb-1.5">Excluded recipients</Label>
              <ExcludedRecipientsSelect
                selected={excludedRecipients}
                onChange={setExcludedRecipients}
                options={ACCOUNT_USERS.map((u) => u.name)}
              />
            </div>

            <div className="w-[320px] shrink-0">
              <Label className="block text-sm font-medium text-slate-700 mb-1.5">
                Send this email
              </Label>
              <Select value={sendTiming} onValueChange={setSendTiming}>
                <SelectTrigger size="md" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately-after-billing-created">
                    Immediately after billing is created
                  </SelectItem>
                  <SelectItem value="on-the-due-date">
                    On the due date
                  </SelectItem>
                  <SelectItem value="before-the-due-date">
                    Before the due date
                  </SelectItem>
                  <SelectItem value="after-the-due-date">
                    After the due date
                  </SelectItem>
                  <SelectItem value="custom-schedule">
                    Custom schedule
                  </SelectItem>
                </SelectContent>
              </Select>
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
                Email content <span className="text-red-500">*</span>
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

// ─── WorkflowsPage ──────────────────────────────────────────────────────────

export function WorkflowsPage() {
  const search = useSearch({ strict: false }) as { section?: WorkflowSection };
  const [activeSection, setActiveSection] = useState<WorkflowSection>(
    search.section ?? 'email-template-send-billing'
  );
  const [emailTemplatesOpen, setEmailTemplatesOpen] = useState(true);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) setActiveSection(section as WorkflowSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breadcrumbs = BREADCRUMB_MAP[activeSection];
  const emailTemplateSection = EMAIL_TEMPLATE_SECTION_MAP[activeSection];

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
              <>
                <SecSubNavItem label="Billing Notice"       active={activeSection === 'email-template-send-billing'}                onClick={() => setActiveSection('email-template-send-billing')} />
                <SecSubNavItem label="Payment Reminder"     active={activeSection === 'email-template-payment-reminder'}            onClick={() => setActiveSection('email-template-payment-reminder')} />
                <SecSubNavItem label="Payment Overdue"      active={activeSection === 'email-template-overdue-notice'}              onClick={() => setActiveSection('email-template-overdue-notice')} />
                <SecSubNavItem label="Payment Confirmation" active={activeSection === 'email-template-payment-confirmation'}         onClick={() => setActiveSection('email-template-payment-confirmation')} />
                <SecSubNavItem label="Payment Proof"        active={activeSection === 'email-template-proof-of-payment'}            onClick={() => setActiveSection('email-template-proof-of-payment')} />
                <SecSubNavItem label="Billing Agreement"    active={activeSection === 'email-template-recurring-billing-agreement'} onClick={() => setActiveSection('email-template-recurring-billing-agreement')} />
              </>
            )}
          </nav>

          {/* Main content */}
          <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <EmailTemplateWorkflow
                key={emailTemplateSection.id}
                templateId={emailTemplateSection.id}
                title={emailTemplateSection.title}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
