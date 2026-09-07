import { useState, useRef, useEffect, useCallback } from 'react';
import { useCustomFields } from '#/context/CustomFieldsContext';
import { useCustomers } from '#/context/CustomersContext';
import { useNavigate } from '@tanstack/react-router';
import type { SavedCustomField } from '../../../types/customFields';
import {
  ArrowLeft,
  CaretRight,
  CaretDown,
  BellSimple,
  User,
  Buildings,
  Image,
  Plus,
  Info,
  UploadSimple,
  X,
  MagnifyingGlassPlus,
  PencilSimple,
  Trash,
  FilePdf,
  FileDoc,
  FileXls,
  FileCsv,
  FileZip,
  File,
  WarningCircle,
} from '@phosphor-icons/react';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Input } from '#/components/atoms/Input';
import { TextareaInput as Textarea } from '#/components/atoms/TextareaInput';
import { Label } from '#/components/atoms/Label';
import { Badge } from '#/components/atoms/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/atoms/Card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/atoms/Select';
import { GroupCombobox } from '#/components/molecules/GroupCombobox';
import { formatPHPhone } from '#/utils/phoneFormat';
import { Customer, CustomerContact } from '#/data/customers';
import { toast } from 'sonner';

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#6366f1','#ef4444','#14b8a6','#f97316','#a855f7',
];

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatNow(): string {
  const d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = d.getHours();
  return `${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

// ─── Field label with optional required indicator ─────────────────────────────
function FormLabel({
  children,
  required,
  error,
}: {
  children: React.ReactNode;
  required?: boolean;
  error?: boolean;
}) {
  return (
    <Label className={`block text-sm font-medium mb-1 ${error ? 'text-red-600' : 'text-slate-900'}`}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  );
}

// ─── Inline field error message ───────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
      <WarningCircle size={14} className="shrink-0" />
      {message}
    </p>
  );
}

// ─── Supporting document types ────────────────────────────────────────────────
interface DocFile {
  id: string;
  name: string;
  size: string;
  isImage: boolean;
  url: string; // object URL
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const cls = 'shrink-0';
  if (ext === 'pdf')                          return <FilePdf  size={28} className={`${cls} text-red-500`}    />;
  if (['doc','docx'].includes(ext))           return <FileDoc  size={28} className={`${cls} text-blue-500`}   />;
  if (['xls','xlsx'].includes(ext))           return <FileXls  size={28} className={`${cls} text-green-600`}  />;
  if (ext === 'csv')                          return <FileCsv  size={28} className={`${cls} text-green-500`}  />;
  if (['zip','rar','7z'].includes(ext))       return <FileZip  size={28} className={`${cls} text-yellow-600`} />;
  return                                             <File     size={28} className={`${cls} text-slate-400`}   />;
}

// ─── Group combobox ───────────────────────────────────────────────────────────
const ALL_GROUPS = [
  'Azure Tower',
  'BGC Corporate Park',
  'Glasshouse Tower',
  'Metroview Axis Tower',
  'Sterling Tower',
  'Summit One Tower',
  'The Finance Centre',
];

// SectionCard now delegates to shadcn Card components.
// Card container, header and title styling mirror the Bill detail page
// (rounded-[8px] / shadow-none / !gap-4 card shell, text-[20px] slate-900
// section titles) so both pages read as one design language. `titleClassName`
// lets a specific section override the title weight (e.g. Customer
// information uses font-medium instead of the default font-semibold).
function SectionCard({
  title,
  description,
  children,
  titleClassName,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  titleClassName?: string;
}) {
  return (
    <Card className="rounded-[8px] shadow-none py-6 !gap-4">
      <CardHeader className="px-6">
        <CardTitle className={titleClassName ?? 'text-[20px] font-semibold text-slate-900'}>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-6 space-y-4">{children}</CardContent>
    </Card>
  );
}

// ─── Shared inline form used to both add a new contact and edit an existing
// one — same fields, same layout, just a different save handler wired in
// by the caller. Includes a circular photo upload matching the Customer
// image pattern. ─────────────────────────────────────────────────────────────
function ContactFormFields({
  avatarUrl,
  onAvatarChange,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  email,
  onEmailChange,
  position,
  onPositionChange,
  phone,
  onPhoneChange,
  onCancel,
  onSave,
}: {
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
  firstName: string;
  onFirstNameChange: (v: string) => void;
  lastName: string;
  onLastNameChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  position: string;
  onPositionChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="p-4 rounded-lg border border-[#E4E4E7] bg-white space-y-4">
      <div>
        <FormLabel>Photo</FormLabel>
        <div className="relative shrink-0 w-16 h-16">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={[
              'block w-16 h-16 rounded-full overflow-hidden transition-colors',
              avatarUrl
                ? 'border border-slate-200'
                : 'border-2 border-dashed border-slate-200 text-slate-300 hover:border-violet-400 hover:text-violet-400 hover:bg-violet-50 flex items-center justify-center',
            ].join(' ')}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image size={20} />
            )}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Edit photo"
              className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-[#E4E4E7] shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <PencilSimple size={12} />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAvatarChange(URL.createObjectURL(f));
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormLabel>First name</FormLabel>
          <Input value={firstName} onChange={(e) => onFirstNameChange(e.target.value)} placeholder="e.g. Juan" />
        </div>
        <div>
          <FormLabel>Last name</FormLabel>
          <Input value={lastName} onChange={(e) => onLastNameChange(e.target.value)} placeholder="e.g. Dela Cruz" />
        </div>
        <div>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder="e.g. juan@company.com" />
        </div>
        <div>
          <FormLabel>Position</FormLabel>
          <Input value={position} onChange={(e) => onPositionChange(e.target.value)} placeholder="e.g. Finance Manager" />
        </div>
        <div>
          <FormLabel>Phone</FormLabel>
          <div className="flex items-center w-full rounded-[8px] border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-400 transition-shadow">
            <span className="inline-flex items-center gap-1.5 pl-3 pr-2.5 select-none shrink-0">
              <span className="text-base leading-none">🇵🇭</span>
              <CaretDown size={12} className="text-slate-500" />
            </span>
            <span className="w-px self-stretch bg-slate-200 my-2.5" />
            <span className="pl-3 text-sm text-slate-900 select-none shrink-0">+63</span>
            <input
              type="tel"
              value={phone.replace(/^\+63\s*/, '')}
              onChange={(e) => onPhoneChange(formatPHPhone('63' + e.target.value))}
              placeholder="9XX XXX XXXX"
              className="pl-1.5 pr-3 py-2.5 text-sm outline-none bg-transparent flex-1 min-w-0"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button colorScheme="primary" onClick={onSave}>Save contact</Button>
      </div>
    </div>
  );
}

// ─── Custom field input renderer ─────────────────────────────────────────────

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: SavedCustomField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const ph = field.helperText || `Enter ${field.label.toLowerCase()}`;
  const strVal = (value as string) ?? '';
  const numVal = (value as number) ?? 0;
  const arrVal = (value as string[]) ?? [];

  return (
    <div>
      <FormLabel required={field.required}>{field.label}</FormLabel>
      {field.type === 'Text' && (
        <Input value={strVal} onChange={e => onChange(e.target.value)} placeholder={ph} />
      )}
      {field.type === 'Email' && (
        <Input type="email" value={strVal} onChange={e => onChange(e.target.value)} placeholder={ph} />
      )}
      {field.type === 'Number' && (
        <div className="flex items-center w-fit rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
          <button type="button" onClick={() => onChange(numVal - 1)} className="px-3 py-2 text-slate-500 hover:bg-slate-50 border-r border-slate-200">
            <span className="text-sm font-medium">−</span>
          </button>
          <input
            type="number"
            value={numVal}
            onChange={e => onChange(Number(e.target.value))}
            className="w-20 text-center text-sm text-slate-800 bg-white py-2 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button type="button" onClick={() => onChange(numVal + 1)} className="px-3 py-2 text-slate-500 hover:bg-slate-50 border-l border-slate-200">
            <span className="text-sm font-medium">+</span>
          </button>
        </div>
      )}
      {field.type === 'Textarea' && (
        <Textarea value={strVal} onChange={e => onChange(e.target.value)} placeholder={ph} rows={3} />
      )}
      {field.type === 'Select' && (
        <Select value={strVal} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder={field.helperText || 'Select an option'} /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {field.type === 'Multi-select' && (
        <div className="space-y-2 mt-1">
          {(field.options ?? []).map(opt => {
            const checked = arrVal.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? arrVal.filter(v => v !== opt) : [...arrVal, opt])}
                  className="w-4 h-4 rounded border-slate-300 accent-violet-600"
                />
                <span className="text-sm text-slate-700">{opt}</span>
              </label>
            );
          })}
        </div>
      )}
      {field.type === 'Toggle' && (
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            role="switch"
            aria-checked={!!value}
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-violet-600' : 'bg-slate-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-slate-600">{value ? 'On' : 'Off'}</span>
        </div>
      )}
      {field.type === 'Date' && (
        <Input type="date" value={strVal} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CreateCustomerPage() {
  const navigate = useNavigate();
  const { customers, setCustomers, setPendingBanner } = useCustomers();
  const draft = customers.find(c => c.status === 'draft');

  const { savedCustomFields } = useCustomFields();
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>(
    (draft?.customFieldValues as Record<string, unknown>) ?? {}
  );
  const setCustomFieldValue = useCallback((id: string, value: unknown) => {
    setCustomFieldValues(prev => ({ ...prev, [id]: value }));
  }, []);

  const fd = draft?.draftFormData;

  const [customerType, setCustomerType] = useState<'Individual' | 'Organization'>(fd?.customerType ?? draft?.type ?? 'Individual');
  const [vatStatus, setVatStatus] = useState<'vatable' | 'zero' | 'exempt'>(fd?.vatStatus ?? draft?.vatStatus ?? 'vatable');
  const [withholding, setWithholding] = useState(fd?.withholding ?? '0');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; name: string; size: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [idPrefix, setIdPrefix] = useState('CST-');
  const [idNumber, setIdNumber] = useState('2025-0249');
  const [prefixPopoverOpen, setPrefixPopoverOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(fd?.selectedGroups ?? (draft?.group ? [draft.group] : []));
  const [docs, setDocs] = useState<DocFile[]>(draft?.supportingDocumentFiles ?? []);
  const [draftPrefix, setDraftPrefix] = useState('CST-');

  // Form fields — pre-filled from draft when continuing.
  // `name` holds the Organization's company name; Individual customers use
  // firstName/lastName instead and their full name is derived in
  // buildCustomer(). Field visibility (which of these render) is driven by
  // the Individual/Organization schema below.
  const [name, setName] = useState(
    draft?.type === 'Organization' && draft?.name !== 'Untitled Draft' ? (draft?.name ?? '') : ''
  );
  const [firstName, setFirstName] = useState(
    fd?.firstName ?? (draft?.type === 'Individual' ? (draft?.name?.split(' ')[0] ?? '') : '')
  );
  const [lastName, setLastName] = useState(
    fd?.lastName ?? (draft?.type === 'Individual' ? (draft?.name?.split(' ').slice(1).join(' ') ?? '') : '')
  );
  const [email, setEmail] = useState(draft?.email ?? '');
  const [phone, setPhone] = useState(fd?.phone ?? draft?.phoneNumber ?? '');
  const [addrLine1, setAddrLine1] = useState(fd?.addrLine1 ?? '');
  const [addrLine2, setAddrLine2] = useState(fd?.addrLine2 ?? '');
  const [city, setCity] = useState(fd?.city ?? '');
  const [province, setProvince] = useState(fd?.province ?? '');
  const [country, setCountry] = useState(fd?.country ?? 'Philippines');
  const [zip, setZip] = useState(fd?.zip ?? '');
  const [tin, setTin] = useState(fd?.tin ?? draft?.tin ?? '');
  const [registrationNumber, setRegistrationNumber] = useState(fd?.registrationNumber ?? draft?.registrationNumber ?? '');
  const [paymentTerms, setPaymentTerms] = useState(fd?.paymentTerms ?? draft?.paymentTerms ?? '');
  // Payment method is no longer editable via this form (field removed from
  // the UI), but the value is preserved read-only for backward compatibility
  // with any existing customer records that already have one set.
  const [paymentMethod] = useState(fd?.paymentMethod ?? draft?.paymentMethod ?? '');
  const [notes, setNotes] = useState(draft?.notes ?? '');
  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; address?: string; contacts?: string }>({});

  // Refs for scroll-to-error
  const nameFieldRef    = useRef<HTMLDivElement>(null);
  const emailFieldRef   = useRef<HTMLDivElement>(null);
  const addressFieldRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prefixInputRef = useRef<HTMLInputElement>(null);

  // Organization-only contact persons. "+ Add a contact" reveals an inline
  // form (Photo, Full name, Email, Position, Phone) instead of navigating
  // away; clicking the pencil on a saved contact reuses the same form,
  // inline, to edit it in place. Only one of add/edit is ever open at
  // once, so both share the same draft-field state.
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContactAvatarUrl, setNewContactAvatarUrl] = useState('');
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPosition, setNewContactPosition] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  function resetContactForm() {
    setNewContactAvatarUrl('');
    setNewContactFirstName('');
    setNewContactLastName('');
    setNewContactEmail('');
    setNewContactPosition('');
    setNewContactPhone('');
    setAddingContact(false);
    setEditingContactId(null);
  }

  function openAddContact() {
    resetContactForm();
    setAddingContact(true);
  }

  function startEditContact(contact: CustomerContact) {
    setAddingContact(false);
    setEditingContactId(contact.id);
    setNewContactAvatarUrl(contact.avatarUrl ?? '');
    const [first, ...rest] = contact.name.trim().split(/\s+/);
    setNewContactFirstName(first ?? '');
    setNewContactLastName(rest.join(' '));
    setNewContactEmail(contact.email ?? '');
    setNewContactPosition(contact.position ?? '');
    setNewContactPhone(contact.phone ?? '');
  }

  function saveContactForm() {
    const fullName = `${newContactFirstName.trim()} ${newContactLastName.trim()}`.trim();
    if (!fullName) return;
    if (editingContactId) {
      setContacts((prev) => prev.map((c) => (
        c.id === editingContactId
          ? {
              ...c,
              name: fullName,
              email: newContactEmail.trim(),
              position: newContactPosition.trim(),
              phone: newContactPhone.trim(),
              avatarUrl: newContactAvatarUrl || undefined,
            }
          : c
      )));
    } else {
      const contact: CustomerContact = {
        id: `contact-${Date.now()}`,
        name: fullName,
        position: newContactPosition.trim(),
        email: newContactEmail.trim(),
        phone: newContactPhone.trim(),
        avatarUrl: newContactAvatarUrl || undefined,
        isPrimary: contacts.length === 0,
      };
      setContacts((prev) => [...prev, contact]);
    }
    if (errors.contacts) setErrors((p) => ({ ...p, contacts: undefined }));
    resetContactForm();
  }

  function removeContact(contactId: string) {
    setContacts((prev) => {
      const removingPrimary = prev.find((c) => c.id === contactId)?.isPrimary;
      const next = prev.filter((c) => c.id !== contactId);
      if (removingPrimary && next.length > 0 && !next.some((c) => c.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }

  function setPrimaryContact(contactId: string) {
    setContacts((prev) => prev.map((c) => ({ ...c, isPrimary: c.id === contactId })));
    const newPrimary = contacts.find((c) => c.id === contactId);
    if (newPrimary) {
      toast('Primary contact updated', {
        description: `${newPrimary.name} is now the primary contact.`,
      });
    }
  }

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen]);

  // Sync draft from saved prefix each time the popover opens, then focus the input
  useEffect(() => {
    if (!prefixPopoverOpen) return;
    setDraftPrefix(idPrefix);
    setTimeout(() => prefixInputRef.current?.select(), 50);
  }, [prefixPopoverOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close prefix popover on outside click
  const prefixPopoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!prefixPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (prefixPopoverRef.current && !prefixPopoverRef.current.contains(e.target as Node)) {
        setPrefixPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [prefixPopoverOpen]);

  function handleImageUpload(file: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const kb = file.size / 1024;
    const size = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
    setUploadedImage({ url, name: file.name, size });
  }

  function removeImage() {
    if (uploadedImage) URL.revokeObjectURL(uploadedImage.url);
    setUploadedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function handleDocUpload(files: FileList | null) {
    if (!files) return;
    const MAX = 25 * 1024 * 1024;
    const newDocs: DocFile[] = Array.from(files)
      .filter((f) => f.size <= MAX)
      .map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        name: f.name,
        size: formatSize(f.size),
        isImage: f.type.startsWith('image/'),
        url: URL.createObjectURL(f),
      }));
    setDocs((prev) => [...prev, ...newDocs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeDoc(id: string) {
    setDocs((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc) URL.revokeObjectURL(doc.url);
      return prev.filter((d) => d.id !== id);
    });
  }

  /** Build the Customer object from current form state. */
  function buildCustomer(overrides: Partial<Customer> = {}): Customer {
    const addressParts = [addrLine1, addrLine2, city, province, country !== 'Philippines' ? country : '', zip]
      .map((s) => s.trim()).filter(Boolean);
    const address = addressParts.join(', ');
    // Individual customers are named via First + Last name; Organizations
    // via the single company name field — only one of these renders at a
    // time, per the Individual/Organization field schema.
    const resolvedName = customerType === 'Individual'
      ? `${firstName.trim()} ${lastName.trim()}`.trim() || 'Untitled Draft'
      : name.trim() || 'Untitled Draft';

    return {
      id: draft?.id ?? (idPrefix + idNumber),
      type: customerType,
      name: resolvedName,
      avatarInitials: buildInitials(resolvedName),
      avatarColor: pickColor(resolvedName),
      avatarUrl: uploadedImage?.url,
      email: customerType === 'Individual' ? email.trim() : '',
      address,
      phoneNumber: customerType === 'Individual' ? phone.trim() : '',
      group: selectedGroups[0] ?? '',
      tin: customerType === 'Organization' ? (tin.trim() || undefined) : undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      vatStatus: customerType === 'Organization' ? vatStatus : undefined,
      contacts: customerType === 'Organization' ? contacts : undefined,
      notes: notes.trim() || undefined,
      supportingDocuments: docs.map((d) => d.name),
      supportingDocumentFiles: docs,
      lastUpdatedAt: formatNow(),
      dateCreated: draft?.dateCreated ?? formatNow(),
      customFieldValues: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
      ...overrides,
    };
  }

  function handleSaveAsDraft() {
    const customer = buildCustomer({
      status: 'draft',
      draftFormData: {
        customerType,
        firstName,
        lastName,
        addrLine1,
        addrLine2,
        city,
        province,
        country,
        zip,
        phone,
        tin,
        registrationNumber,
        paymentTerms,
        paymentMethod,
        vatStatus,
        withholding,
        selectedGroups,
      },
    });
    setCustomers(prev => {
      const existing = prev.findIndex(c => c.id === customer.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = customer;
        return next;
      }
      return [...prev, customer];
    });
    navigate({ to: '/customers' });
  }

  function validate(): boolean {
    const next: typeof errors = {};

    if (customerType === 'Individual') {
      if (!firstName.trim() || !lastName.trim())
        next.name = 'First and last name are required.';
    } else if (!name.trim()) {
      next.name = 'Company name is required.';
    }

    if (customerType === 'Individual') {
      if (!email.trim())
        next.email = 'Customer email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        next.email = 'Please enter a valid email address.';
    }

    if (!addrLine1.trim())
      next.address = 'Customer address is required.';

    if (customerType === 'Organization' && contacts.length === 0)
      next.contacts = 'At least 1 contact is required for an organization.';

    setErrors(next);

    // Scroll the page to the first error field
    if (next.name)         nameFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (next.email)   emailFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (next.address) addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const customer = buildCustomer({ status: undefined, draftFormData: undefined });
    setCustomers(prev => {
      const existing = prev.findIndex(c => c.id === customer.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = customer;
        return next;
      }
      return [...prev, customer];
    });
    setPendingBanner(`${customer.name} has been created successfully.`);
    navigate({ to: '/customers' });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — breadcrumb + bell only */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/customers' })}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={14} weight="bold" />
            </button>
            <nav className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>Dashboard</span>
              <CaretRight size={12} />
              <button onClick={() => navigate({ to: '/customers' })} className="hover:text-slate-700 transition-colors">Customers</button>
              <CaretRight size={12} />
              <span className="text-slate-900 font-medium">{draft ? 'Continue draft' : 'Create customer'}</span>
            </nav>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* Form action bar */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-end gap-2">
          <Button variant="outline" className="text-slate-700" onClick={() => navigate({ to: '/customers' })}>Cancel</Button>
          <Button variant="outline" className="text-slate-700" onClick={handleSaveAsDraft}>Save as draft</Button>
          <Button colorScheme="primary" onClick={handleSubmit}>Create customer</Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">

          {/* ── Customer information ── */}
          <SectionCard title="Customer information" titleClassName="text-[20px] font-medium text-slate-900">

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-4">
              {(['Individual', 'Organization'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCustomerType(t)}
                  className={[
                    'flex items-center gap-2.5 px-4 py-2.5 h-[50px] rounded-[8px] border text-sm font-medium text-slate-900 bg-white transition-colors',
                    customerType === t
                      ? 'border-violet-500'
                      : 'border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {t === 'Individual'
                    ? <User size={16} className="text-slate-900" />
                    : <Buildings size={16} className="text-slate-900" />}
                  {t}
                </button>
              ))}
            </div>

            {/* Customer image */}
            <div>
              <Label className="text-sm font-medium text-slate-900 mb-1">Customer image</Label>
              <p className="text-[14px] text-[#71717A] mb-2">Accepted formats: .jpg, .png, .gif (max 20MB)</p>

              {uploadedImage ? (
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="relative group shrink-0">
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="block w-16 h-16 rounded-full border border-slate-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <img
                        src={uploadedImage.url}
                        alt={uploadedImage.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay */}
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <MagnifyingGlassPlus size={18} className="text-white" />
                      </span>
                    </button>
                  </div>

                  {/* File info */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[220px]">{uploadedImage.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{uploadedImage.size}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        onClick={removeImage}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-slate-200 text-slate-300 hover:border-violet-400 hover:text-violet-400 hover:bg-violet-50 transition-colors"
                >
                  <Image size={20} />
                </button>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
              />
            </div>

            {/* Customer ID — same combined column width as First name
                (wrapped in the same 2-col grid). Label stays on its own
                row; the prefixed-input box and the "Edit prefix" button
                sit side by side on the row below, sharing that column's
                width so their outer edges align with First name's. */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-900 mb-1">Customer ID</Label>

                <div className="flex items-stretch gap-2">
                  {/* Prefix + number + Generate, all inside one bordered
                      box — explicit 40px height matches the shared Input
                      component's default height so this lines up with
                      every other field. */}
                  <div className="flex items-stretch h-[40px] flex-1 min-w-0 rounded-[8px] border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-400 transition-shadow">
                    <span className="inline-flex items-center px-3 bg-slate-50 border-r border-slate-200 text-sm text-slate-500 font-medium select-none whitespace-nowrap">
                      {idPrefix}
                    </span>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="px-3 text-sm outline-none bg-white flex-1 min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setIdNumber(`${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`)}
                      className="px-3 flex items-center text-sm font-normal text-violet-600 hover:text-violet-800 hover:bg-violet-50 transition-colors whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>

                  {/* Edit prefix — secondary/outlined button, beside the
                      input box; visually secondary since editing the
                      prefix is a config action, not the primary Generate
                      action. */}
                  <div className="relative shrink-0" ref={prefixPopoverRef}>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-slate-700"
                      onClick={() => setPrefixPopoverOpen((o) => !o)}
                    >
                      Edit prefix
                    </Button>

                    {/* Popover */}
                    {prefixPopoverOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4">
                        <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Edit ID prefix</p>
                        <Input
                          ref={prefixInputRef}
                          type="text"
                          value={draftPrefix}
                          onChange={(e) => setDraftPrefix(e.target.value)}
                          placeholder="e.g. CST-"
                          className="mb-3"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { setIdPrefix(draftPrefix); setPrefixPopoverOpen(false); }
                            if (e.key === 'Escape') setPrefixPopoverOpen(false);
                          }}
                        />
                        {/* Preview */}
                        <p className="text-xs text-slate-400 mb-3">
                          Preview: <span className="font-medium text-slate-700">{draftPrefix || '—'}{idNumber}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setIdPrefix(draftPrefix); setPrefixPopoverOpen(false); }}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setPrefixPopoverOpen(false)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Name — Individual: First + Last name. Organization:
                single company name field. Only one renders per the field
                schema (firstName/lastName/name (company) are mutually
                exclusive). */}
            {customerType === 'Individual' ? (
              <div ref={nameFieldRef} className="w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel required error={!!errors.name}>First name</FormLabel>
                    <Input
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                      error={!!errors.name}
                    />
                  </div>
                  <div>
                    <FormLabel error={!!errors.name}>Last name</FormLabel>
                    <Input
                      value={lastName}
                      onChange={(e) => { setLastName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                      error={!!errors.name}
                    />
                  </div>
                </div>
                <FieldError message={errors.name} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div ref={nameFieldRef}>
                  <FormLabel required error={!!errors.name}>Company name</FormLabel>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                    error={!!errors.name}
                  />
                  <FieldError message={errors.name} />
                </div>
              </div>
            )}

            {/* Email + Phone — Individual only, per the field schema
                (Organization has no email/phone fields) — paired side by
                side to match the reference layout. */}
            {customerType === 'Individual' && (
              <div className="grid grid-cols-2 gap-4">
                <div ref={emailFieldRef}>
                  <FormLabel required error={!!errors.email}>Customer email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                    error={!!errors.email}
                  />
                  <FieldError message={errors.email} />
                </div>

                <div>
                  <FormLabel>Customer phone number</FormLabel>
                  <div className="flex items-center w-full rounded-[8px] border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-400 transition-shadow">
                    <span className="inline-flex items-center gap-1.5 pl-3 pr-2.5 select-none shrink-0">
                      <span className="text-base leading-none">🇵🇭</span>
                      <CaretDown size={12} className="text-slate-500" />
                    </span>
                    <span className="w-px self-stretch bg-slate-200 my-2.5" />
                    <span className="pl-3 text-sm text-slate-900 select-none shrink-0">+63</span>
                    <input
                      type="tel"
                      value={phone.replace(/^\+63\s*/, '')}
                      onChange={(e) => setPhone(formatPHPhone('63' + e.target.value))}
                      placeholder="9XX XXX XXXX"
                      className="pl-1.5 pr-3 py-2.5 text-sm outline-none bg-transparent flex-1 min-w-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            <div ref={addressFieldRef} className="w-full">
              <FormLabel required error={!!errors.address}>Customer address</FormLabel>
              <div className="space-y-2">
                <Input
                  placeholder="Address line 1"
                  value={addrLine1}
                  onChange={(e) => { setAddrLine1(e.target.value); if (errors.address) setErrors((p) => ({ ...p, address: undefined })); }}
                  error={!!errors.address}
                />
                <Input placeholder="Address line 2" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Country — shadcn Select */}
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Philippines', 'United States', 'Singapore', 'Japan'].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Zip code" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </div>
              <FieldError message={errors.address} />
            </div>

            {/* VAT status, Withholding tax, and TIN are Organization-only
                per the field schema (Individual has no taxTreatment /
                tinNumber). */}
            {customerType === 'Organization' && (
              <>
                {/* VAT status (taxTreatment) */}
                <div>
                  <FormLabel>VAT status</FormLabel>
                  <div className="flex items-center gap-5 mt-1">
                    {[
                      { value: 'vatable', label: 'VAT-able' },
                      { value: 'zero',    label: 'VAT Zero Rated' },
                      { value: 'exempt',  label: 'VAT Exempt' },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="vat"
                          value={value}
                          checked={vatStatus === value}
                          onChange={() => setVatStatus(value as typeof vatStatus)}
                          className="accent-violet-600 w-3.5 h-3.5"
                        />
                        <span className="text-sm text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Withholding tax */}
                <div>
                  <FormLabel>Withholding tax %</FormLabel>
                  <div className="relative max-w-[150px]">
                    <Input
                      type="number"
                      value={withholding}
                      onChange={(e) => setWithholding(e.target.value)}
                      className="rounded-[8px] pr-8"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                  </div>
                </div>

                {/* TIN (tinNumber) */}
                <div>
                  <FormLabel>Customer TIN</FormLabel>
                  <Input
                    placeholder="###-###-###"
                    className="max-w-[200px]"
                    value={tin}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                      let formatted = digits;
                      if (digits.length > 6) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
                      else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                      setTin(formatted);
                    }}
                  />
                </div>
              </>
            )}

            {/* Company registration number — shared by both Individual and
                Organization. Wrapped in the same 2-col grid used for First/
                Last name so it lands at exactly that column's width instead
                of stretching full width. */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Company registration number</FormLabel>
                <Input
                  placeholder="Enter registration number"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Default payment terms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Label className="text-sm font-medium text-slate-900 mb-0">Default payment terms</Label>
                  <Info size={13} className="text-violet-500" />
                </div>
                <Input placeholder="Enter number of days" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>
            </div>

            {/* Customer group */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Customer group</FormLabel>
                <GroupCombobox selected={selectedGroups} onChange={setSelectedGroups} groups={ALL_GROUPS} />
              </div>
            </div>

          </SectionCard>

          {/* ── Notes ── */}
          <SectionCard title="Notes">
            <Textarea
              rows={4}
              className="w-full min-h-[140px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </SectionCard>

          {/* ── Supporting documents ── */}
          <Card className="rounded-[8px] shadow-none py-6 !gap-4">
            <CardHeader className="px-6">
              <CardTitle className="text-[20px] font-semibold text-slate-900">Supporting documents</CardTitle>
              <CardDescription>Maximum file size: 25MB</CardDescription>
            </CardHeader>
            <CardContent className="px-6 space-y-4">

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleDocUpload(e.dataTransfer.files); }}
                className={[
                  'flex flex-col items-center justify-center gap-1 rounded-[8px] border-2 border-dashed py-10 transition-colors cursor-pointer',
                  dragOver ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40',
                ].join(' ')}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple size={24} className={dragOver ? 'text-violet-400 mb-2' : 'text-slate-400 mb-2'} />
                <p className="text-sm font-semibold text-slate-600">Drag your files here</p>
                <p className="text-sm text-slate-500">or click to browse files</p>
              </div>

              {/* Uploaded file list */}
              {docs.length > 0 && (
                <ul className="space-y-2">
                  {docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-[8px] border border-slate-100 bg-slate-50 group"
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 w-12 h-12 rounded-[8px] border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                        {doc.isImage ? (
                          <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                        ) : (
                          <FileTypeIcon name={doc.name} />
                        )}
                      </div>

                      {/* Name + size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{doc.size}</p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeDoc(doc.id)}
                        className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ── Contacts — Organization only. "+ Add a contact" reveals an
              inline form (Photo, Full name, Email, Position, Phone) instead
              of navigating away; clicking the pencil on a saved contact
              reuses the same form, inline, to edit it in place. ── */}
          {customerType === 'Organization' && (
            <SectionCard
              title="Contacts"
              description={contacts.length === 0 && !addingContact ? 'At least 1 contact is required per customer' : undefined}
            >
              {contacts.length > 0 && (
                <ul className="space-y-2">
                  {contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className={editingContactId === contact.id ? '' : 'flex items-center gap-3 p-4 rounded-lg border border-[#E4E4E7] bg-white group'}
                    >
                      {editingContactId === contact.id ? (
                        <ContactFormFields
                          avatarUrl={newContactAvatarUrl}
                          onAvatarChange={setNewContactAvatarUrl}
                          firstName={newContactFirstName}
                          onFirstNameChange={setNewContactFirstName}
                          lastName={newContactLastName}
                          onLastNameChange={setNewContactLastName}
                          email={newContactEmail}
                          onEmailChange={setNewContactEmail}
                          position={newContactPosition}
                          onPositionChange={setNewContactPosition}
                          phone={newContactPhone}
                          onPhoneChange={setNewContactPhone}
                          onCancel={resetContactForm}
                          onSave={saveContactForm}
                        />
                      ) : (
                        <>
                          {contact.avatarUrl ? (
                            <img
                              src={contact.avatarUrl}
                              alt={contact.name}
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-violet-100 text-violet-700 font-semibold text-sm shrink-0">
                              {buildInitials(contact.name)}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 truncate">{contact.name}</p>
                              {contact.isPrimary && (
                                <Badge className="gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200 shrink-0">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-[#71717A] mt-1">{contact.position}</p>
                            <p className="text-sm text-[#71717A] mt-1">{contact.phone} &bull; {contact.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!contact.isPrimary && (
                              <button
                                type="button"
                                onClick={() => setPrimaryContact(contact.id)}
                                className="text-sm font-medium text-violet-600 hover:text-violet-800 hover:underline transition-colors whitespace-nowrap"
                              >
                                Set as primary
                              </button>
                            )}
                            <button
                              onClick={() => startEditContact(contact)}
                              aria-label="Edit contact"
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E4E4E7] bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <PencilSimple size={16} />
                            </button>
                            <button
                              onClick={() => removeContact(contact.id)}
                              aria-label="Delete contact"
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E4E4E7] bg-white text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {addingContact && (
                <ContactFormFields
                  avatarUrl={newContactAvatarUrl}
                  onAvatarChange={setNewContactAvatarUrl}
                  firstName={newContactFirstName}
                  onFirstNameChange={setNewContactFirstName}
                  lastName={newContactLastName}
                  onLastNameChange={setNewContactLastName}
                  email={newContactEmail}
                  onEmailChange={setNewContactEmail}
                  position={newContactPosition}
                  onPositionChange={setNewContactPosition}
                  phone={newContactPhone}
                  onPhoneChange={setNewContactPhone}
                  onCancel={resetContactForm}
                  onSave={saveContactForm}
                />
              )}

              {!addingContact && !editingContactId && (
                <button
                  onClick={openAddContact}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4E4E7] text-sm font-medium text-slate-900 bg-white hover:bg-slate-50 transition-colors"
                >
                  <Plus size={16} />
                  Add a contact
                </button>
              )}

              <FieldError message={errors.contacts} />
            </SectionCard>
          )}

          {/* ── Custom fields ── */}
          {savedCustomFields.filter(f => f.visible).length > 0 && (
            <SectionCard title="Custom fields">
              {savedCustomFields.filter(f => f.visible).map(field => (
                <CustomFieldInput
                  key={field.id}
                  field={field}
                  value={customFieldValues[field.id]}
                  onChange={v => setCustomFieldValue(field.id, v)}
                />
              ))}
            </SectionCard>
          )}

          {/* Bottom CTAs */}
          <div className="flex items-center justify-end gap-2 py-4">
            <Button variant="outline" className="text-slate-700" onClick={() => navigate({ to: '/customers' })}>Cancel</Button>
            <Button variant="outline" className="text-slate-700" onClick={handleSaveAsDraft}>Save as draft</Button>
            <Button colorScheme="primary" onClick={handleSubmit}>Create customer</Button>
          </div>
          </div>
        </div>

      </div>

      {/* Lightbox */}
      {lightboxOpen && uploadedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} weight="bold" />
          </button>

          {/* Image + caption */}
          <div
            className="flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={uploadedImage.url}
              alt={uploadedImage.name}
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
            />
            <div className="text-center">
              <p className="text-white text-sm font-medium">{uploadedImage.name}</p>
              <p className="text-white/60 text-xs mt-0.5">{uploadedImage.size}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for supporting documents */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleDocUpload(e.target.files)}
      />
    </div>
  );
}
