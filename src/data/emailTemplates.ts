import { useSyncExternalStore } from 'react';

// ─── Email Templates — shared configuration ────────────────────────────────
// Workflows → Email Templates lets a user edit the Subject and Email content
// of a fixed set of email templates. Most templates are SHARED — there is
// only ONE stored configuration for e.g. "Payment Reminder", and editing it
// applies everywhere that email is used across the applicable products, not
// a separate copy per product. Only two templates are genuinely
// product-specific (their own distinct email, not a shared one reused
// elsewhere): Billing Agreement (Recurring Billing) and Order Notice
// (Order-based Billing).
//
// Recipients are NOT configurable here — who receives each email is
// determined by the invoice/order itself and the application's own sending
// logic, not by anything stored per-template.
//
// Placeholder tokens (e.g. "[Organization Name]", "[Due Date]", "[Tags]")
// come from ONE shared registry (ALL_PLACEHOLDERS below) — a token's
// meaning never changes between templates, so e.g. [Due Date] is the exact
// same definition everywhere it's offered, never two separate fields.
// TEMPLATE_PLACEHOLDER_KEYS below is what makes the "Insert placeholder"
// menu context-aware: it just says which of the shared tokens apply to
// which template, without duplicating the token definitions themselves.
//
// Mirrors the in-memory (non-localStorage) pattern used by
// `penaltySettings.ts`: a Save applies live for the rest of the current
// session, but a full page refresh always comes back up on the untouched
// defaults, as if nothing had ever been saved.

// Every distinct email — each one stored/edited exactly once. No composite
// per-product key: "Payment Reminder" is a single template, not one copy
// per product it happens to be used by.
export type EmailTemplateId =
  | 'billing-notice'
  | 'payment-reminder'
  | 'payment-overdue'
  | 'payment-confirmation'
  | 'payment-proof'
  | 'billing-agreement'
  | 'order-notice';

// Templates used across multiple products — listed directly under the
// "Email Templates" nav group itself, not nested in a further sub-category
// (there's nothing product-specific to disambiguate: the same saved config
// applies wherever each of these is used).
export const SHARED_TEMPLATE_IDS: EmailTemplateId[] = [
  'billing-notice', 'payment-reminder', 'payment-overdue', 'payment-confirmation', 'payment-proof',
];

// The two templates that are genuinely specific to one product each — a
// distinct email, not a shared one reused elsewhere — so they keep their
// own product-specific nav sub-group instead of living in the shared list.
export const RECURRING_BILLING_TEMPLATE_IDS: EmailTemplateId[] = ['billing-agreement'];
export const ORDER_BASED_BILLING_TEMPLATE_IDS: EmailTemplateId[] = ['order-notice'];

export const TEMPLATE_LABELS: Record<EmailTemplateId, string> = {
  'billing-notice': 'Billing Notice',
  'payment-reminder': 'Payment Reminder',
  'payment-overdue': 'Payment Overdue',
  'payment-confirmation': 'Payment Confirmation',
  'payment-proof': 'Payment Proof',
  'billing-agreement': 'Billing Agreement',
  'order-notice': 'Order Notice',
};

export interface PlaceholderDef {
  key: string;
  label: string;
  category: 'Customer' | 'Billing';
}

// Payment Reminder supports one or more reminder schedules, each relative
// to the invoice's own due date — not a repeating interval. A single
// Payment Reminder template still has exactly one shared Subject/Email
// body; selecting more than one schedule just means that same email goes
// out on more than one of these moments. Listed here in chronological
// order (before the due date, through the due date, to after it).
export type ReminderFrequencyPreset =
  | '1-day-before'
  | '7-days-before'
  | '14-days-before'
  | '30-days-before'
  | '1-day-after'
  | '7-days-after'
  | '14-days-after'
  | '30-days-after'
  // Not a one-time reminder — once selected, the first reminder goes out
  // 30 days after the due date, then again every 30 days after that until
  // the invoice is paid/no longer overdue. See `recurring` on its option
  // definition below, which the UI uses to surface that it repeats.
  | 'every-30-days-after';

// `label` is the full phrase — used for the trigger field when exactly one
// schedule is selected (e.g. "7 days before due date"). `shortLabel` is
// what's shown inside the dropdown's Before/After tabs, where the active
// tab already establishes "before due date"/"after due date", so repeating
// that in every row would be redundant. `category` is which of the two
// tabs a schedule belongs under.
export const REMINDER_FREQUENCY_OPTIONS: {
  value: ReminderFrequencyPreset;
  label: string;
  shortLabel: string;
  category: 'before' | 'after';
  recurring?: boolean;
}[] = [
  { value: '1-day-before', label: '1 day before due date', shortLabel: '1 day before', category: 'before' },
  { value: '7-days-before', label: '7 days before due date', shortLabel: '7 days before', category: 'before' },
  { value: '14-days-before', label: '14 days before due date', shortLabel: '14 days before', category: 'before' },
  { value: '30-days-before', label: '30 days before due date', shortLabel: '30 days before', category: 'before' },
  { value: '1-day-after', label: '1 day after due date', shortLabel: '1 day after', category: 'after' },
  { value: '7-days-after', label: '7 days after due date', shortLabel: '7 days after', category: 'after' },
  { value: '14-days-after', label: '14 days after due date', shortLabel: '14 days after', category: 'after' },
  { value: '30-days-after', label: '30 days after due date', shortLabel: '30 days after', category: 'after' },
  {
    value: 'every-30-days-after',
    label: 'Every 30 days after due date',
    shortLabel: 'Every 30 days after due date',
    category: 'after',
    recurring: true,
  },
];

// The ordinary shape: a fixed Subject + Email content, no "when to send"
// configuration (that only exists for Payment Reminder — see below).
export interface StandardEmailTemplateContent {
  kind: 'standard';
  // HTML strings — both fields support rich text formatting (Subject is
  // placeholder-only, no formatting toolbar; Email content supports full
  // formatting), so the saved value is markup, not plain text. Placeholder
  // tokens are wrapped in a small inline <span> (see chip() below) so they
  // render as visually distinct chips.
  subject: string;
  body: string;
}

// Payment Reminder's shape: still just ONE Subject + Email content (never
// a separate copy per schedule), plus one or more selected send schedules.
export interface ReminderEmailTemplateContent {
  kind: 'reminder';
  // One or more selected schedules — always non-empty once saved (the UI
  // prevents saving with nothing selected). May include the recurring
  // 'every-30-days-after' preset alongside any of the one-time ones.
  frequencies: ReminderFrequencyPreset[];
  subject: string;
  body: string;
}

export type EmailTemplateContent = StandardEmailTemplateContent | ReminderEmailTemplateContent;

// The single, shared source of truth for every placeholder token that
// exists anywhere in the product — never duplicated per template.
export const ALL_PLACEHOLDERS: PlaceholderDef[] = [
  { key: '[Organization Name]', label: 'Organization Name', category: 'Customer' },
  { key: '[Tags]', label: 'Tags', category: 'Customer' },
  { key: '[Customer Contact Name]', label: 'Customer Contact Name', category: 'Customer' },
  { key: '[Customer Organization Name]', label: 'Customer Organization Name', category: 'Customer' },
  { key: '[Customer Name]', label: 'Customer Name', category: 'Customer' },
  { key: '[Contact Email]', label: 'Contact Email', category: 'Customer' },
  { key: '[Invoice Number]', label: 'Invoice Number', category: 'Billing' },
  { key: '[Order Number]', label: 'Order Number', category: 'Billing' },
  { key: '[Due Date]', label: 'Due Date', category: 'Billing' },
  { key: '[Total Unsettled Invoices]', label: 'Total Unsettled Invoices', category: 'Billing' },
  { key: '[Invoice Total Amount]', label: 'Invoice Total Amount', category: 'Billing' },
];

// Which shared placeholders are valid/applicable for each template — this
// is the "context-aware" filter for the Insert placeholder menu.
export const TEMPLATE_PLACEHOLDER_KEYS: Record<EmailTemplateId, string[]> = {
  'billing-notice': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]',
    '[Due Date]', '[Invoice Total Amount]',
  ],
  'payment-reminder': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]',
    '[Due Date]', '[Invoice Total Amount]',
  ],
  'payment-overdue': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]',
    '[Total Unsettled Invoices]', '[Due Date]', '[Invoice Total Amount]',
  ],
  'payment-confirmation': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]', '[Invoice Total Amount]',
  ],
  'payment-proof': [
    '[Organization Name]', '[Customer Organization Name]', '[Customer Contact Name]',
    '[Invoice Number]', '[Invoice Total Amount]',
  ],
  'billing-agreement': [
    '[Organization Name]', '[Customer Name]', '[Contact Email]',
  ],
  'order-notice': [
    '[Organization Name]', '[Tags]', '[Order Number]', '[Customer Contact Name]', '[Invoice Total Amount]',
  ],
};

export function getPlaceholdersForTemplate(id: EmailTemplateId): PlaceholderDef[] {
  const keys = new Set(TEMPLATE_PLACEHOLDER_KEYS[id]);
  return ALL_PLACEHOLDERS.filter((p) => keys.has(p.key));
}

// Wraps a placeholder token in the same subtle NEUTRAL token style (light
// background, thin border, dark slate text — not the app's purple accent)
// the RichTextEditor's "Insert placeholder" control uses when a user
// inserts one — applied here too so the DEFAULT/sample content visually
// matches what a user would see after inserting the same tokens themselves.
// `contenteditable="false"` + `draggable="true"` make these default chips
// movable/atomic tokens too, not just ones inserted after the fact — see
// RichTextEditor's placeholderChipHtml, which mirrors this exact markup.
function chip(token: string): string {
  return `<span contenteditable="false" draggable="true" style="background-color:#F8FAFC;color:#334155;border:1px solid #E2E8F0;border-radius:4px;padding:0 4px;cursor:grab;">${token}</span>`;
}

// ─── Default content, one generator per template — each stored exactly
// once now, not duplicated per product category. ────────────────────────

function defaultBillingNotice(): StandardEmailTemplateContent {
  return {
    kind: 'standard',
    subject: `New billing from ${chip('[Organization Name]')} - ${chip('[Tags]')} - ${chip('[Invoice Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      'You have a pending billing due today.<br><br>' +
      `Please settle the amount by <b>${chip('[Due Date]')}</b><br><br>` +
      'If you have already made the payment, kindly provide us with proof of payment or confirmation so we can update our records accordingly.<br><br>' +
      '<b>Note:</b> Penalties for late payment, if applicable, will be billed separately.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  };
}

function defaultPaymentReminder(): ReminderEmailTemplateContent {
  return {
    kind: 'reminder',
    // No schedule pre-selected — the user must explicitly choose when this
    // reminder should be sent rather than inheriting an assumed default.
    frequencies: [],
    subject: `🔔 Don't miss your payment with ${chip('[Organization Name]')} - ${chip('[Invoice Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `You have a pending bill due on ${chip('[Due Date]')}.<br>` +
      'Please settle the amount on or before the due date.',
  };
}

function defaultPaymentOverdue(): StandardEmailTemplateContent {
  return {
    kind: 'standard',
    subject: `Overdue: ${chip('[Invoice Number]')} is now past due`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `Your payment for ${chip('[Invoice Number]')} was due last ${chip('[Due Date]')} and remains unsettled to date.<br><br>` +
      'Please settle this at your earliest convenience to avoid further penalties or interruption of service.<br><br>' +
      'Already paid? If you have already sent your payment, kindly provide us with proof of payment or confirmation so we can update our records accordingly.<br><br>' +
      'Note: Penalties for late payment, if applicable, will be billed separately.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  };
}

function defaultPaymentConfirmation(): StandardEmailTemplateContent {
  return {
    kind: 'standard',
    subject: `Payment received by ${chip('[Organization Name]')} for ${chip('[Invoice Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `We have received your payment of PHP ${chip('[Invoice Total Amount]')} for ${chip('[Invoice Number]')}.<br><br>` +
      'Thank you for settling this on time. Your account is now updated and no further action is needed on your end.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  };
}

function defaultPaymentProof(): StandardEmailTemplateContent {
  return {
    kind: 'standard',
    subject: `Invoice paid by ${chip('[Customer Organization Name]')} for ${chip('[Invoice Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `We have received your payment of PHP ${chip('[Invoice Total Amount]')} for ${chip('[Invoice Number]')}.<br><br>` +
      'Thank you for settling this on time. Your account is now updated and no further action is needed on your end.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  };
}

function defaultBillingAgreement(): StandardEmailTemplateContent {
  return {
    kind: 'standard',
    subject: `Your billing cycle contract with ${chip('[Organization Name]')}`,
    body:
      `${chip('[Organization Name]')}<br><br>` +
      `Dear ${chip('[Customer Name]')},<br>` +
      "We're sharing with you the contract for your new billing cycle 📄.<br><br>" +
      'Attached is a copy of your contract, which includes the terms and the number of invoices scheduled within this agreement. Please review the document carefully and keep a copy for your records.<br><br>' +
      'Thank you for your continued trust. If you have any questions, feel free to reach out anytime.<br><br>' +
      'Best regards,<br>' +
      `${chip('[Organization Name]')}<br>` +
      `${chip('[Contact Email]')}`,
  };
}

function defaultOrderNotice(): StandardEmailTemplateContent {
  return {
    kind: 'standard',
    subject: `New order from ${chip('[Organization Name]')} - ${chip('[Order Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `Thank you for your order. Your order ${chip('[Order Number]')} has been received and is now being processed.<br><br>` +
      `<b>Order total</b> : PHP ${chip('[Invoice Total Amount]')}<br><br>` +
      "We'll notify you once your order status changes. If you have any questions in the meantime, feel free to reach out.<br><br>" +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  };
}

function defaultContentFor(id: EmailTemplateId): EmailTemplateContent {
  switch (id) {
    case 'billing-notice': return defaultBillingNotice();
    case 'payment-reminder': return defaultPaymentReminder();
    case 'payment-overdue': return defaultPaymentOverdue();
    case 'payment-confirmation': return defaultPaymentConfirmation();
    case 'payment-proof': return defaultPaymentProof();
    case 'billing-agreement': return defaultBillingAgreement();
    case 'order-notice': return defaultOrderNotice();
  }
}

const ALL_TEMPLATE_IDS: EmailTemplateId[] = [
  ...SHARED_TEMPLATE_IDS,
  ...RECURRING_BILLING_TEMPLATE_IDS,
  ...ORDER_BASED_BILLING_TEMPLATE_IDS,
];

function buildDefaultEmailTemplates(): Record<EmailTemplateId, EmailTemplateContent> {
  const entries = {} as Record<EmailTemplateId, EmailTemplateContent>;
  for (const id of ALL_TEMPLATE_IDS) {
    entries[id] = defaultContentFor(id);
  }
  return entries;
}

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplateContent> = buildDefaultEmailTemplates();

// Plain module-level value — reinitialized to DEFAULT_EMAIL_TEMPLATES on
// every fresh load of the module (i.e. every full page refresh), mutated
// only by setEmailTemplate below, only on an explicit Save.
let currentTemplates: Record<EmailTemplateId, EmailTemplateContent> = DEFAULT_EMAIL_TEMPLATES;
const listeners = new Set<() => void>();

export function getEmailTemplates(): Record<EmailTemplateId, EmailTemplateContent> {
  return currentTemplates;
}

export function setEmailTemplate(id: EmailTemplateId, content: EmailTemplateContent) {
  currentTemplates = { ...currentTemplates, [id]: content };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useEmailTemplates(): Record<EmailTemplateId, EmailTemplateContent> {
  return useSyncExternalStore(subscribe, getEmailTemplates, () => DEFAULT_EMAIL_TEMPLATES);
}
