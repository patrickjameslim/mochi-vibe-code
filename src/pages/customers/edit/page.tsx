import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  CaretRight,
  CaretDown,
  BellSimple,
  Info,
  Plus,
  Image,
  UploadSimple,
  X,
  MagnifyingGlassPlus,
  Copy,
  Check,
  PencilSimple,
  Trash,
  Eye,
  DownloadSimple,
  DotsThreeVertical,
  FilePdf,
  FileDoc,
  FileXls,
  FileCsv,
  FileZip,
  File as FileIcon,
  WarningCircle,
} from '@phosphor-icons/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useCustomers } from '#/context/CustomersContext';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Input } from '#/components/atoms/Input';
import { TextareaInput as Textarea } from '#/components/atoms/TextareaInput';
import { Label } from '#/components/atoms/Label';
import { Badge } from '#/components/atoms/Badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '#/components/atoms/Tooltip';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/atoms/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '#/components/atoms/Dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/components/atoms/DropdownMenu';
import { GroupCombobox } from '#/components/molecules/GroupCombobox';
import { formatPHPhone } from '#/utils/phoneFormat';
import { Customer, SupportingDocFile, CustomerContact } from '#/data/customers';
import { toast } from 'sonner';

// This page intentionally mirrors src/pages/customers/create/page.tsx —
// same section/card styling, field schema (Individual vs Organization),
// spacing, typography, and component choices — so Create and Edit read as
// the same form in two states (empty vs pre-filled) rather than two designs.

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

// ─── Field label with optional required indicator — identical to Create ──────
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

// ─── Inline field error message — identical to Create ────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
      <WarningCircle size={14} className="shrink-0" />
      {message}
    </p>
  );
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
  return                                             <FileIcon size={28} className={`${cls} text-slate-400`}   />;
}

const ALL_GROUPS = [
  'Azure Tower',
  'BGC Corporate Park',
  'Glasshouse Tower',
  'Metroview Axis Tower',
  'Sterling Tower',
  'Summit One Tower',
  'The Finance Centre',
];

// SectionCard — identical to Create's version (rounded-[8px] / shadow-none /
// !gap-4 card shell, text-[20px] slate-900 section titles).
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

/** Live display name while editing, mirroring buildCustomer()'s resolvedName logic on Create. */
function resolvedNameFor(type: 'Individual' | 'Organization', firstName: string, lastName: string, companyName: string): string {
  return type === 'Individual'
    ? `${firstName.trim()} ${lastName.trim()}`.trim() || 'Untitled'
    : companyName.trim() || 'Untitled';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: '/_layout/customers/$id/edit' });
  const { customers, setCustomers } = useCustomers();
  const customer = customers.find(c => c.id === id);

  const [copied, setCopied] = useState(false);

  // Customer type is fixed once created — no toggle in the edit form —
  // but still drives which fields render (Individual vs Organization schema).
  const customerType: 'Individual' | 'Organization' = customer?.type ?? 'Individual';

  // `name` holds the Organization's company name; Individual customers use
  // firstName/lastName instead and their full name is derived on save —
  // same split as the Create form.
  const [name, setName] = useState(customer?.type === 'Organization' ? (customer?.name ?? '') : '');
  const [firstName, setFirstName] = useState(
    customer?.type === 'Individual' ? (customer?.name?.split(' ')[0] ?? '') : ''
  );
  const [lastName, setLastName] = useState(
    customer?.type === 'Individual' ? (customer?.name?.split(' ').slice(1).join(' ') ?? '') : ''
  );
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(formatPHPhone(customer?.phoneNumber ?? ''));
  // Address is stored on Customer as a single joined string, so — unlike
  // Create's multi-field breakdown — it's edited here as one field to avoid
  // lossily re-splitting already-saved data.
  const [address, setAddress] = useState(customer?.address ?? '');
  const [tin, setTin] = useState(customer?.tin ?? '');
  const [registrationNumber, setRegistrationNumber] = useState(customer?.registrationNumber ?? '');
  const [vatStatus, setVatStatus] = useState<'vatable' | 'zero' | 'exempt'>(customer?.vatStatus ?? 'vatable');
  const [withholding, setWithholding] = useState('0');
  const [paymentTerms, setPaymentTerms] = useState(customer?.paymentTerms ?? '');
  // Payment method is no longer editable via this form (field removed from
  // the UI), but the value is preserved read-only for backward compatibility
  // with any existing customer records that already have one set.
  const [paymentMethod] = useState(customer?.paymentMethod ?? '');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(customer?.group ? [customer.group] : []);
  const [notes, setNotes] = useState(customer?.notes ?? '');

  // Organization-only contact persons. "+ Add a contact" reveals an inline
  // form (Photo, Full name, Email, Position, Phone) instead of navigating
  // away; clicking the pencil on an existing contact reuses the same form,
  // pre-filled, to edit it in place. Only one of add/edit is ever open at
  // once, so both share the same draft-field state.
  const [contacts, setContacts] = useState<CustomerContact[]>(customer?.contacts ?? []);
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

  // Validation errors — same shape/behavior as Create
  const [errors, setErrors] = useState<{ name?: string; email?: string; address?: string; contacts?: string }>({});
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const emailFieldRef = useRef<HTMLDivElement>(null);
  const addressFieldRef = useRef<HTMLDivElement>(null);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(customer?.avatarUrl);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Supporting docs — merge real uploaded files with legacy name-only entries
  const [docs, setDocs] = useState<SupportingDocFile[]>(() => {
    if (!customer) return [];
    if (customer.supportingDocumentFiles && customer.supportingDocumentFiles.length > 0) {
      return customer.supportingDocumentFiles;
    }
    return customer.supportingDocuments.map((docName, i) => ({
      id: `legacy-${i}-${docName}`,
      name: docName,
      size: '',
      isImage: /\.(png|jpe?g|gif|webp)$/i.test(docName),
      url: '',
    }));
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen]);

  function handleImageUpload(file: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  }

  function handleDocUpload(files: FileList | null) {
    if (!files) return;
    const MAX = 25 * 1024 * 1024;
    const newDocs: SupportingDocFile[] = Array.from(files)
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

  function removeDoc(docId: string) {
    setDocs((prev) => {
      const doc = prev.find((d) => d.id === docId);
      if (doc && doc.url.startsWith('blob:')) URL.revokeObjectURL(doc.url);
      return prev.filter((d) => d.id !== docId);
    });
  }

  function handleDownloadDoc(doc: SupportingDocFile) {
    if (!doc.url) return;
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Removing a document from an existing customer is destructive, so it's
  // gated behind a confirmation dialog rather than removed immediately.
  const [docPendingRemoval, setDocPendingRemoval] = useState<SupportingDocFile | null>(null);

  function confirmRemoveDoc() {
    if (docPendingRemoval) removeDoc(docPendingRemoval.id);
    setDocPendingRemoval(null);
  }

  function copyId() {
    if (!customer) return;
    navigator.clipboard.writeText(customer.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    if (!address.trim())
      next.address = 'Customer address is required.';

    if (customerType === 'Organization' && contacts.length === 0)
      next.contacts = 'At least 1 contact is required for an organization.';

    setErrors(next);

    if (next.name)         nameFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (next.email)   emailFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (next.address) addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!customer) return;
    if (!validate()) return;

    const resolvedName = customerType === 'Individual'
      ? `${firstName.trim()} ${lastName.trim()}`.trim() || customer.name
      : name.trim() || customer.name;

    const updated: Customer = {
      ...customer,
      type: customerType,
      name: resolvedName,
      avatarInitials: buildInitials(resolvedName),
      avatarColor: avatarUrl ? customer.avatarColor : pickColor(resolvedName),
      avatarUrl,
      email: customerType === 'Individual' ? email.trim() : '',
      address: address.trim(),
      phoneNumber: customerType === 'Individual' ? phone.trim() : '',
      group: selectedGroups[0] ?? '',
      tin: customerType === 'Organization' ? (tin.trim() || undefined) : undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      vatStatus: customerType === 'Organization' ? vatStatus : undefined,
      contacts: customerType === 'Organization' ? contacts : undefined,
      notes: notes.trim() || undefined,
      supportingDocumentFiles: docs,
      supportingDocuments: docs.map((d) => d.name),
      lastUpdatedAt: formatNow(),
    };
    setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    // Preserved from the main-branch enhancement: land on the customer's
    // view page (not the list) with a success banner passed via router
    // state, rather than a separate pending-banner context.
    navigate({
      to: '/customers/$id/view',
      params: { id },
      state: (prev: Record<string, unknown>) => ({ ...prev, successBanner: `${updated.name} has been updated successfully.` }),
    });
  }

  if (!customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — breadcrumb + bell only, same as Create */}
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
              <span className="text-slate-900 font-medium">{customer.name}</span>
            </nav>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* Edit state is a single-purpose form — no General/Receivables/
            Reports tab switcher (that navigation lives on the read-only
            View Customer page instead) and no separate view/edit mode;
            the form is always editable. Action bar keeps the same
            Cancel/Save changes placement as Create's Cancel/Save/Submit row. */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-end gap-2">
            <Button variant="outline" className="text-slate-700" onClick={() => navigate({ to: '/customers/$id/view', params: { id } })}>Cancel</Button>
            <Button colorScheme="primary" onClick={handleSave}>Save changes</Button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-4xl mx-auto flex flex-col gap-4">

              {/* ── Customer information ── */}
              <SectionCard title="Customer information" titleClassName="text-[20px] font-medium text-slate-900">

                {/* Customer image — same "Customer image" label as Create,
                    but the photo + edit-pencil badge instead of Create's
                    empty-state upload button (no Upload/Replace/Remove
                    text links, since there's always an existing avatar or
                    initials fallback to show). */}
                <div>
                <Label className="text-sm font-medium text-slate-900 mb-1">Customer image</Label>
                <div className="relative group shrink-0 w-16 h-16 mt-1">
                  <button
                    onClick={() => (avatarUrl ? setLightboxOpen(true) : imageInputRef.current?.click())}
                    className="block w-16 h-16 rounded-full border border-slate-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-400"
                    style={{ backgroundColor: avatarUrl ? undefined : customer.avatarColor }}
                  >
                    {avatarUrl ? (
                      <>
                        <img src={avatarUrl} alt={resolvedNameFor(customerType, firstName, lastName, name)} className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <MagnifyingGlassPlus size={18} className="text-white" />
                        </span>
                      </>
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                        {customer.avatarInitials}
                      </span>
                    )}
                  </button>
                  {/* Edit badge — overlaid on the avatar's bottom-right
                      corner, replacing the old "Upload/Replace/Remove"
                      text links with a single icon affordance. */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    aria-label="Edit photo"
                    className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-[#E4E4E7] shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <PencilSimple size={12} />
                  </button>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
                </div>

                {/* Customer ID — system-generated and immutable, so it's
                    deliberately NOT styled like an input (no border/box):
                    plain muted text + a copy action. This keeps it legible
                    as identifying metadata while making clear it isn't an
                    editable field — Company name below it is the first
                    real form field. Wrapped in the same 2-col grid Create
                    uses for this field so the width matches First name. */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-900 mb-1">Customer ID</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-900">{customer.id}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={copyId}
                            aria-label="Copy Customer ID"
                            className="text-violet-500 hover:text-violet-700 transition-colors"
                          >
                            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {copied ? 'Copied' : 'Copy Customer ID'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Name — Individual: First + Last name. Organization:
                    single company name field. */}
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

                {/* Email + Phone — Individual only — paired side by side to
                    match Create's layout. */}
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

                {/* Address — single field (Customer.address is stored as one
                    joined string), styled like Create's Address line 1 —
                    full width to match Create's Address wrapper. */}
                <div ref={addressFieldRef} className="w-full">
                  <FormLabel required error={!!errors.address}>Customer address</FormLabel>
                  <Input
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); if (errors.address) setErrors((p) => ({ ...p, address: undefined })); }}
                    error={!!errors.address}
                  />
                  <FieldError message={errors.address} />
                </div>

                {/* VAT status, Withholding tax, and TIN are Organization-only */}
                {customerType === 'Organization' && (
                  <>
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

                {/* Company registration number — shared by both types.
                    Wrapped in the same 2-col grid used for First/Last name
                    so it lands at exactly that column's width, matching
                    Create. */}
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
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full min-h-[140px] resize-y" />
              </SectionCard>

              {/* ── Supporting documents — existing customer, so documents
                  are manageable: a three-dot overflow menu (View / Download
                  / Remove) replaces a prominent trash icon. Remove is
                  destructive, so it's gated behind a confirm dialog rather
                  than firing immediately. ── */}
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
                          className="flex items-center gap-3 p-3 rounded-[8px] border border-slate-100 bg-slate-50"
                        >
                          <div className="shrink-0 w-12 h-12 rounded-[8px] border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                            {doc.isImage && doc.url ? (
                              <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileTypeIcon name={doc.name} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                            {doc.size && <p className="text-xs text-slate-400 mt-0.5">{doc.size}</p>}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              aria-label="Document actions"
                              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-slate-500 hover:bg-slate-100 transition-colors outline-none"
                            >
                              <DotsThreeVertical size={16} weight="bold" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-[#18181B]" onSelect={() => doc.url && window.open(doc.url, '_blank')}>
                                <Eye size={14} className="text-[#18181B]" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[#18181B]" onSelect={() => handleDownloadDoc(doc)}>
                                <DownloadSimple size={14} className="text-[#18181B]" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setDocPendingRemoval(doc)}>
                                <Trash size={14} />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Remove-document confirmation — destructive action on an
                  existing customer record, so it requires explicit confirm. */}
              <Dialog open={!!docPendingRemoval} onOpenChange={(open) => { if (!open) setDocPendingRemoval(null); }}>
                <DialogContent showCloseButton={false} className="max-w-md gap-0 p-0">
                  <DialogHeader className="border-b border-slate-200 p-4">
                    <DialogTitle className="text-base font-semibold text-slate-900">Remove supporting document?</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <p className="text-sm text-slate-600">
                      Are you sure you want to remove{' '}
                      <span className="font-medium text-slate-800">{docPendingRemoval?.name}</span> from this customer?
                    </p>
                  </div>
                  <DialogFooter className="flex-row justify-end gap-2 border-t border-slate-200 p-4">
                    <Button variant="outline" size="md" onClick={() => setDocPendingRemoval(null)}>Cancel</Button>
                    <Button colorScheme="destructive" size="md" onClick={confirmRemoveDoc}>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* ── Contacts — Organization only. "+ Add a contact" reveals
                  an inline form (Photo, Full name, Email, Position, Phone)
                  instead of navigating away; clicking the pencil on a saved
                  contact reuses the same form, inline, to edit it in place. ── */}
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

            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && avatarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
          <div
            className="flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={avatarUrl}
              alt={resolvedNameFor(customerType, firstName, lastName, name)}
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
            />
            <p className="text-white text-sm font-medium">{resolvedNameFor(customerType, firstName, lastName, name)}</p>
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
