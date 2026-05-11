import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  CaretRight,
  BellSimple,
  User,
  Buildings,
  Image,
  Plus,
  Info,
  UploadSimple,
  X,
  MagnifyingGlassPlus,
  FilePdf,
  FileDoc,
  FileXls,
  FileCsv,
  FileZip,
  File,
  WarningCircle,
} from '@phosphor-icons/react';
import { Sidebar } from './Sidebar';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/Select';
import { GroupCombobox } from './ui/GroupCombobox';
import { formatPHPhone } from '../utils/phoneFormat';
import { Customer } from '../data/customers';

interface Props {
  onBack: () => void;
  onSubmit?: (customer: Customer) => void;
}

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
    <Label className={`block text-sm font-medium mb-1 ${error ? 'text-red-600' : 'text-slate-700'}`}>
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

// ─── Group multi-select combobox ──────────────────────────────────────────────
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

// SectionCard now delegates to shadcn Card components
function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CreateCustomerPage({ onBack, onSubmit }: Props) {
  const [customerType, setCustomerType] = useState<'Individual' | 'Organization'>('Individual');
  const [vatStatus, setVatStatus] = useState<'vatable' | 'zero' | 'exempt'>('vatable');
  const [withholding, setWithholding] = useState('0');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; name: string; size: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [idPrefix, setIdPrefix] = useState('CST-');
  const [idNumber, setIdNumber] = useState('2025-0249');
  const [prefixPopoverOpen, setPrefixPopoverOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [draftPrefix, setDraftPrefix] = useState('CST-');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [zip, setZip] = useState('');
  const [tin, setTin] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; address?: string }>({});

  // Refs for scroll-to-error
  const nameFieldRef    = useRef<HTMLDivElement>(null);
  const emailFieldRef   = useRef<HTMLDivElement>(null);
  const addressFieldRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prefixInputRef = useRef<HTMLInputElement>(null);

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

  function validate(): boolean {
    const next: typeof errors = {};

    if (!name.trim())
      next.name = 'Customer name is required.';

    if (!email.trim())
      next.email = 'Customer email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Please enter a valid email address.';

    if (!addrLine1.trim())
      next.address = 'Customer address is required.';

    setErrors(next);

    // Scroll the page to the first error field
    if (next.name)         nameFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (next.email)   emailFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (next.address) addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const addressParts = [addrLine1, addrLine2, city, province, country !== 'Philippines' ? country : '', zip]
      .map((s) => s.trim()).filter(Boolean);
    const address = addressParts.join(', ');

    const customer: Customer = {
      id: idPrefix + idNumber,
      type: customerType,
      name: name.trim(),
      avatarInitials: buildInitials(name.trim()),
      avatarColor: pickColor(name.trim()),
      avatarUrl: uploadedImage?.url,
      email: email.trim(),
      address,
      phoneNumber: phone.trim(),
      group: selectedGroups[0] ?? '',
      tin: tin.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      vatStatus,
      supportingDocuments: docs.map((d) => d.name),
      supportingDocumentFiles: docs,
      notes: note.trim() || undefined,
      lastUpdatedAt: formatNow(),
      dateCreated: formatNow(),
    };

    onSubmit?.(customer);
    onBack();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — breadcrumb + bell only */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={14} weight="bold" />
            </button>
            <nav className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>Dashboard</span>
              <CaretRight size={12} />
              <button onClick={onBack} className="hover:text-slate-700 transition-colors">Customers</button>
              <CaretRight size={12} />
              <span className="text-slate-900 font-medium">Create customer</span>
            </nav>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* Form action bar */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onBack}>Cancel</Button>
          <Button variant="outline">Save as draft</Button>
          <Button variant="primary" onClick={handleSubmit}>Create customer</Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-4">

          {/* ── Customer information ── */}
          <SectionCard title="Customer information">

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-3">
              {(['Individual', 'Organization'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCustomerType(t)}
                  className={[
                    'flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                    customerType === t
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {t === 'Individual'
                    ? <User size={16} className={customerType === t ? 'text-violet-500' : 'text-slate-400'} />
                    : <Buildings size={16} className={customerType === t ? 'text-violet-500' : 'text-slate-400'} />}
                  {t}
                </button>
              ))}
            </div>

            {/* Customer image */}
            <div>
              <Label>Customer image</Label>
              <p className="text-xs text-slate-400 mb-2">Accepted formats: .jpg, .png, .gif (max 20MB)</p>

              {uploadedImage ? (
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="relative group shrink-0">
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="block w-16 h-16 rounded-lg border border-slate-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <img
                        src={uploadedImage.url}
                        alt={uploadedImage.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay */}
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
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
                  className="inline-flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 text-slate-300 hover:border-violet-400 hover:text-violet-400 hover:bg-violet-50 transition-colors"
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

            {/* Customer ID */}
            <div>
              <Label>Customer ID</Label>
              <div className="flex items-center gap-2">
                {/* Prefixed input */}
                <div className="flex items-stretch rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-400 transition-shadow">
                  <span className="inline-flex items-center px-3 bg-slate-50 border-r border-slate-200 text-sm text-slate-500 font-medium select-none whitespace-nowrap">
                    {idPrefix}
                  </span>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="px-3 py-2 text-sm outline-none bg-white w-32"
                  />
                </div>

                {/* Update ID prefix link */}
                <div className="relative" ref={prefixPopoverRef}>
                  <button
                    onClick={() => setPrefixPopoverOpen((o) => !o)}
                    className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors whitespace-nowrap"
                  >
                    Update ID prefix
                  </button>

                  {/* Popover */}
                  {prefixPopoverOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-20 p-4">
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

            {/* Name */}
            <div ref={nameFieldRef}>
              <FormLabel required error={!!errors.name}>Customer name</FormLabel>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                error={!!errors.name}
              />
              <FieldError message={errors.name} />
            </div>

            {/* Email */}
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

            {/* Phone */}
            <div>
              <FormLabel>Customer phone number</FormLabel>
              <Input type="tel" value={phone} onChange={(e) => setPhone(formatPHPhone(e.target.value))} placeholder="+63 9XX XXX XXXX" />
            </div>

            {/* Address */}
            <div ref={addressFieldRef}>
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
                    <SelectTrigger>
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

            {/* VAT status */}
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
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Withholding tax */}
            <div>
              <FormLabel>Withholding tax %</FormLabel>
              <div className="flex items-center gap-2 max-w-[120px]">
                <Input
                  type="number"
                  value={withholding}
                  onChange={(e) => setWithholding(e.target.value)}
                  className="text-right"
                />
                <span className="text-sm text-slate-500 shrink-0">%</span>
              </div>
            </div>

            {/* TIN */}
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

            {/* Default payment terms */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label className="text-[13px] font-medium text-slate-700 mb-0">Default payment terms</Label>
                <Info size={13} className="text-slate-400" />
              </div>
              <Input placeholder="e.g. Net 30" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>

            {/* Payment method — shadcn Select */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label className="text-[13px] font-medium text-slate-700 mb-0">Payment method</Label>
                <Info size={13} className="text-slate-400" />
              </div>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {['Cash', 'Bank Transfer', 'Check', 'Credit Card', 'GCash', 'Maya'].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer group */}
            <div>
              <FormLabel>Customer group</FormLabel>
              <GroupCombobox selected={selectedGroups} onChange={setSelectedGroups} groups={ALL_GROUPS} />
            </div>

            {/* Customer note */}
            <div>
              <FormLabel>Customer note</FormLabel>
              <Textarea
                placeholder="Add additional details about the customer"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

          </SectionCard>

          {/* ── Notes ── */}
          <SectionCard title="Notes">
            <Textarea rows={4} />
          </SectionCard>

          {/* ── Supporting documents ── */}
          <Card>
            <CardHeader>
              <CardTitle>Supporting documents</CardTitle>
              <CardDescription>Maximum file size: 25MB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleDocUpload(e.dataTransfer.files); }}
                className={[
                  'flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed py-10 transition-colors cursor-pointer',
                  dragOver ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40',
                ].join(' ')}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple size={24} className={dragOver ? 'text-violet-400 mb-1' : 'text-slate-300 mb-1'} />
                <p className="text-sm text-slate-500">Drop files here</p>
                <p className="text-xs text-slate-400">or</p>
                <span className="text-sm text-violet-600 font-medium">Browse files</span>
              </div>

              {/* Uploaded file list */}
              {docs.length > 0 && (
                <ul className="space-y-2">
                  {docs.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 group"
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
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

          {/* Bottom CTAs */}
          <div className="flex items-center justify-end gap-2 py-4">
            <Button variant="outline" onClick={onBack}>Cancel</Button>
            <Button variant="outline">Save as draft</Button>
            <Button variant="primary" onClick={handleSubmit}>Create customer</Button>
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
