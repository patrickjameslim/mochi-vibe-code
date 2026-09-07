import { useSyncExternalStore } from 'react';

// ─── Email Templates — shared configuration ────────────────────────────────
// Workflows → Email Templates lets a user edit the Subject and Email content
// of six fixed templates: Send Billing, Payment Reminder, Overdue Notice,
// Payment Confirmation, Proof of Payment, Recurring Billing Agreement.
//
// Placeholder tokens (e.g. "[Organization Name]", "[Due Date]", "[Tags]")
// come from ONE shared registry (ALL_PLACEHOLDERS below) — a token's
// meaning never changes between templates, so e.g. [Due Date] is the exact
// same definition in Send Billing and Overdue Notice, never two separate
// fields. TEMPLATE_PLACEHOLDER_KEYS below is what makes the "Insert
// placeholder" menu context-aware: it just says which of the shared tokens
// apply to which template, without duplicating the token definitions
// themselves.
//
// Mirrors the in-memory (non-localStorage) pattern used by
// `penaltySettings.ts`: a Save applies live for the rest of the current
// session, but a full page refresh always comes back up on the untouched
// defaults, as if nothing had ever been saved.

export type EmailTemplateId =
  | 'send-billing'
  | 'payment-reminder'
  | 'overdue-notice'
  | 'payment-confirmation'
  | 'proof-of-payment'
  | 'recurring-billing-agreement';

export interface EmailTemplateContent {
  // When this email is sent — currently only one timing option exists
  // ("Immediately after billing is created"); shown only for Send Billing.
  sendTiming: string;
  // HTML strings — both fields support rich text formatting (bold, italic,
  // underline, lists, links, alignment), so the saved value is markup, not
  // plain text. Placeholder tokens are wrapped in a small inline <span>
  // (see chip() below) so they render as visually distinct chips.
  subject: string;
  body: string;
  // Extra people who should also receive this email — each tagged 'cc' (visible) or 'bcc' (hidden) — on top of the workflow's normal recipient. Free-form: can mix cc and bcc in the same list.
  additionalRecipients: Recipient[];
  // Account users who would normally receive this workflow email but should NOT — stored by name (same convention as Customer group elsewhere in this app), separate from additionalRecipients/CC/BCC.
  excludedRecipients: string[];
}

export interface PlaceholderDef {
  key: string;
  label: string;
  category: 'Customer' | 'Billing';
}

export type RecipientType = 'to' | 'cc' | 'bcc';

export interface Recipient {
  id: string; // for a selected account user: their AccountUser.id. For a manually-typed email with no matching user: the email string itself.
  name: string; // display name, or the raw email if manually typed with no match
  email: string;
  // Set explicitly by which row (To / Cc / Bcc) the recipient was added
  // through — never inferred from insertion order.
  type: RecipientType;
}

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
  { key: '[Due Date]', label: 'Due Date', category: 'Billing' },
  { key: '[Time Period by Due Date]', label: 'Time Period by Due Date', category: 'Billing' },
  { key: '[Payment Period by Due Date]', label: 'Payment Period by Due Date', category: 'Billing' },
  { key: '[Total Unsettled Invoices]', label: 'Total Unsettled Invoices', category: 'Billing' },
  { key: '[Invoice Total Amount]', label: 'Invoice Total Amount', category: 'Billing' },
];

// Which shared placeholders are valid/applicable for each template — this
// is the "context-aware" filter for the Insert placeholder menu. [Tags] is
// available everywhere, matching the ticket's requirement that customer
// Tags work in every template, not just Send Billing.
export const TEMPLATE_PLACEHOLDER_KEYS: Record<EmailTemplateId, string[]> = {
  'send-billing': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]',
    '[Time Period by Due Date]', '[Due Date]', '[Invoice Total Amount]',
  ],
  'payment-reminder': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]',
    '[Time Period by Due Date]', '[Payment Period by Due Date]', '[Invoice Total Amount]',
  ],
  'overdue-notice': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]',
    '[Total Unsettled Invoices]', '[Due Date]', '[Invoice Total Amount]',
  ],
  'payment-confirmation': [
    '[Organization Name]', '[Tags]', '[Invoice Number]', '[Customer Contact Name]', '[Invoice Total Amount]',
  ],
  'proof-of-payment': [
    '[Organization Name]', '[Customer Organization Name]', '[Customer Contact Name]',
    '[Invoice Number]', '[Invoice Total Amount]',
  ],
  'recurring-billing-agreement': [
    '[Organization Name]', '[Customer Name]', '[Contact Email]',
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

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplateContent> = {
  'send-billing': {
    additionalRecipients: [],
    excludedRecipients: [],
    sendTiming: 'immediately-after-billing-created',
    subject: `New billing from ${chip('[Organization Name]')} - ${chip('[Tags]')} - ${chip('[Invoice Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      'You have a pending billing due today.<br><br>' +
      `Please settle the amount by <b>${chip('[Due Date]')}</b><br><br>` +
      'If you have already made the payment, kindly provide us with proof of payment or confirmation so we can update our records accordingly.<br><br>' +
      '<b>Note:</b> Penalties for late payment, if applicable, will be billed separately.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  },
  'payment-reminder': {
    additionalRecipients: [],
    excludedRecipients: [],
    sendTiming: 'immediately-after-billing-created',
    subject: `Friendly Reminder: ${chip('[Invoice Number]')} is due on today`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `This is a quick reminder that payment for ${chip('[Invoice Number]')} is due on today.<br><br>` +
      `<b>Current Balance</b> : ${chip('[Invoice Total Amount]')}<br><br>` +
      'To avoid any late fees or service interruptions, please settle the amount online or upload your proof of payment here.<br><br>' +
      '<b>Paying via PDC?</b> If you have already provided a post-dated check for this invoice, ensure your bank account is sufficiently funded prior to the due date to avoid bouncing fees or late penalties.<br><br>' +
      "<b>Already paid online?</b> If you've already sent your payment manually, please use the button below to upload your receipt.<br><br>" +
      'Thank you for your prompt attention to this!<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  },
  'overdue-notice': {
    additionalRecipients: [],
    excludedRecipients: [],
    sendTiming: 'immediately-after-billing-created',
    subject: `Overdue: ${chip('[Invoice Number]')} is now past due`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `Your payment for ${chip('[Invoice Number]')} was due last ${chip('[Due Date]')} and remains unsettled to date.<br><br>` +
      'Please settle this at your earliest convenience to avoid further penalties or interruption of service.<br><br>' +
      'Already paid? If you have already sent your payment, kindly provide us with proof of payment or confirmation so we can update our records accordingly.<br><br>' +
      'Note: Penalties for late payment, if applicable, will be billed separately.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  },
  'payment-confirmation': {
    additionalRecipients: [],
    excludedRecipients: [],
    sendTiming: 'immediately-after-billing-created',
    subject: `Payment received by ${chip('[Organization Name]')} for ${chip('[Invoice Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `We have received your payment of PHP ${chip('[Invoice Total Amount]')} for ${chip('[Invoice Number]')}.<br><br>` +
      'Thank you for settling this on time. Your account is now updated and no further action is needed on your end.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  },
  'proof-of-payment': {
    additionalRecipients: [],
    excludedRecipients: [],
    sendTiming: 'immediately-after-billing-created',
    subject: `Invoice paid by ${chip('[Customer Organization Name]')} for ${chip('[Invoice Number]')}`,
    body:
      `Dear ${chip('[Customer Contact Name]')},<br><br>` +
      `We have received your payment of PHP ${chip('[Invoice Total Amount]')} for ${chip('[Invoice Number]')}.<br><br>` +
      'Thank you for settling this on time. Your account is now updated and no further action is needed on your end.<br><br>' +
      'Best Regards,<br>' +
      `${chip('[Organization Name]')}`,
  },
  'recurring-billing-agreement': {
    additionalRecipients: [],
    excludedRecipients: [],
    sendTiming: 'immediately-after-billing-created',
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
  },
};

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
