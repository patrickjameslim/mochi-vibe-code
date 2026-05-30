import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  CaretRight,
  BellSimple,
  Camera,
  Copy,
  Check,
  PencilSimple,
  UploadSimple,
  X,
  FilePdf,
  FileDoc,
  FileXls,
  FileCsv,
  FileZip,
  File as FileIcon,
  User,
  Buildings,
  UsersThree,
} from '@phosphor-icons/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useCustomers } from '#/context/CustomersContext';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { AssignGroupsDrawer } from '#/components/organisms/AssignGroupsDrawer';
import { Button } from '#/components/atoms/Button';
import { Input } from '#/components/atoms/Input';
import { TextareaInput as Textarea } from '#/components/atoms/TextareaInput';
import { Badge } from '#/components/atoms/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '#/components/atoms/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/molecules/Tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/atoms/Select';
import { Separator } from '#/components/atoms/Separator';
import { formatPHPhone } from '#/utils/phoneFormat';
import { Customer, SupportingDocFile } from '#/data/customers';
import { getBillsByCustomer } from '#/data/bills';
import { ReceivablesTable } from '#/components/molecules/ReceivablesTable';
import { CustomerReportsTab } from '#/pages/reports/components/CustomerReportsTab';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')                          return <FilePdf  size={22} className="text-red-500 shrink-0" />;
  if (['doc', 'docx'].includes(ext))          return <FileDoc  size={22} className="text-blue-500 shrink-0" />;
  if (['xls', 'xlsx'].includes(ext))          return <FileXls  size={22} className="text-green-600 shrink-0" />;
  if (ext === 'csv')                          return <FileCsv  size={22} className="text-green-500 shrink-0" />;
  if (['zip', 'rar', '7z'].includes(ext))     return <FileZip  size={22} className="text-yellow-600 shrink-0" />;
  return                                             <FileIcon size={22} className="text-slate-400 shrink-0" />;
}

// ─── Small metadata field helpers ─────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
      {children}
    </p>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  const empty = !children || (typeof children === 'string' && children.trim() === '');
  return (
    <p className="text-sm text-slate-800">
      {empty ? <span className="text-slate-400 italic">—</span> : children}
    </p>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: '/_layout/customers/$id/edit' });
  const { customers, setCustomers, setPendingBanner } = useCustomers();
  const customer = customers.find(c => c.id === id);
  const groups = customer ? [customer.group] : [];

  const [activeTab, setActiveTab] = useState<'General' | 'Receivables' | 'Reports'>('General');
  const [editMode, setEditMode] = useState(true);
  const [copied, setCopied] = useState(false);

  // Editable fields
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(formatPHPhone(customer?.phoneNumber ?? ''));
  const [address, setAddress] = useState(customer?.address ?? '');
  const [tin, setTin] = useState(customer?.tin ?? '');
  const [paymentMethod, setPaymentMethod] = useState(customer?.paymentMethod ?? '');
  const [paymentTerms, setPaymentTerms] = useState(customer?.paymentTerms ?? '');
  const [vatStatus, setVatStatus] = useState<'vatable' | 'zero' | 'exempt'>(
    customer?.vatStatus ?? 'vatable'
  );
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [customerType, setCustomerType] = useState(customer?.type ?? 'Individual');

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(customer?.avatarUrl ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Supporting docs — merge real uploaded files with legacy name-only entries
  const [docs, setDocs] = useState<SupportingDocFile[]>(() => {
    if (!customer) return [];
    if (customer.supportingDocumentFiles && customer.supportingDocumentFiles.length > 0) {
      return customer.supportingDocumentFiles;
    }
    return customer.supportingDocuments.map((name, i) => ({
      id: `legacy-${i}-${name}`,
      name,
      size: '',
      isImage: /\.(png|jpe?g|gif|webp)$/i.test(name),
      url: '',
    }));
  });

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Groups
  const [editedGroups, setEditedGroups] = useState<string[]>(groups);
  const [groupsDrawerOpen, setGroupsDrawerOpen] = useState(false);

  // Reset all fields when cancelling edit
  function cancelEdit() {
    if (!customer) return;
    setName(customer.name);
    setEmail(customer.email);
    setPhone(formatPHPhone(customer.phoneNumber));
    setAddress(customer.address);
    setTin(customer.tin ?? '');
    setPaymentMethod(customer.paymentMethod ?? '');
    setPaymentTerms(customer.paymentTerms ?? '');
    setVatStatus(customer.vatStatus ?? 'vatable');
    setNotes(customer.notes ?? '');
    setCustomerType(customer.type);
    setAvatarUrl(customer.avatarUrl ?? null);
    setDocs(
      customer.supportingDocumentFiles && customer.supportingDocumentFiles.length > 0
        ? customer.supportingDocumentFiles
        : customer.supportingDocuments.map((n, i) => ({
            id: `legacy-${i}-${n}`,
            name: n,
            size: '',
            isImage: /\.(png|jpe?g|gif|webp)$/i.test(n),
            url: '',
          }))
    );
    setEditedGroups(groups);
    setEditMode(false);
    navigate({ to: '/customers' });
  }

  function handleSave() {
    if (!customer) return;
    const updated: Customer = {
      ...customer,
      name,
      email,
      phoneNumber: phone,
      address,
      type: customerType as 'Individual' | 'Organization',
      tin: tin.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      vatStatus,
      notes: notes.trim() || undefined,
      avatarUrl: avatarUrl ?? undefined,
      supportingDocumentFiles: docs,
      supportingDocuments: docs.map((d) => d.name),
    };
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    setPendingBanner(`${updated.name} has been updated successfully.`);
    navigate({ to: '/customers' });
  }

  function handleImageUpload(file: File) {
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

  function removeDoc(id: string) {
    setDocs((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc && doc.url.startsWith('blob:')) URL.revokeObjectURL(doc.url);
      return prev.filter((d) => d.id !== id);
    });
  }

  function copyId() {
    if (!customer) return;
    navigator.clipboard.writeText(customer.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen]);

  const vatLabel =
    vatStatus === 'vatable' ? 'VAT-able'
    : vatStatus === 'zero' ? 'VAT Zero Rated'
    : 'VAT Exempt';

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
        {/* ── Header ── */}
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
              <button onClick={() => navigate({ to: '/customers' })} className="hover:text-slate-700 transition-colors">
                Customers
              </button>
              <CaretRight size={12} />
              <span className="text-slate-900 font-medium">{customer.name}</span>
            </nav>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Tabs (wraps tab nav + scrollable content) ── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Tab nav row */}
          <div className="shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            <TabsList className="gap-0 bg-transparent p-0 h-auto rounded-none">
              <TabsTrigger value="General">General</TabsTrigger>
              <TabsTrigger value="Receivables">Receivables</TabsTrigger>
              <TabsTrigger value="Reports">Reports</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 py-2">
              {editMode ? (
                <>
                  <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                  <Button colorScheme="primary" onClick={handleSave}>Save changes</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  <PencilSimple size={14} />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* ── General tab ── */}
          <TabsContent value="General" className="flex-1 overflow-y-auto px-8 py-6 mt-0">
            <div className="max-w-6xl mx-auto space-y-4">

              {/* Two-column layout */}
              <div className="grid grid-cols-3 gap-4 items-start">

                {/* ── Left: Customer Information (2/3) ── */}
                <Card className="col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle>Customer information</CardTitle>
                    {/* Type badge / toggle */}
                    {editMode ? (
                      <div className="flex items-center gap-1 rounded-lg border border-slate-200 overflow-hidden">
                        {(['Individual', 'Organization'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setCustomerType(t)}
                            className={[
                              'flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors',
                              customerType === t
                                ? 'bg-violet-600 text-white'
                                : 'text-slate-500 hover:bg-slate-50',
                            ].join(' ')}
                          >
                            {t === 'Individual'
                              ? <User size={11} weight="bold" />
                              : <Buildings size={11} weight="bold" />}
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Badge
                        colorScheme={customerType === 'Individual' ? 'secondary' : 'primary'}
                        className={[
                          'gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                          customerType === 'Individual'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-violet-50 text-violet-700 border-violet-200',
                        ].join(' ')}
                      >
                        {customerType === 'Individual'
                          ? <User size={11} weight="bold" />
                          : <Buildings size={11} weight="bold" />}
                        {customerType}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="py-5">
                    {/* Avatar + name / email / phone */}
                    <div className="flex items-start gap-4 mb-6">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <button
                          onClick={() => {
                            if (avatarUrl) setLightboxOpen(true);
                            else if (editMode) imageInputRef.current?.click();
                          }}
                          className="block w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-400"
                          style={{ backgroundColor: avatarUrl ? 'transparent' : customer.avatarColor }}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                              {customer.avatarInitials}
                            </span>
                          )}
                        </button>
                        {editMode && (
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-md"
                          >
                            <Camera size={13} />
                          </button>
                        )}
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.gif"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(f);
                          }}
                        />
                      </div>

                      {/* Basic info */}
                      <div className="flex-1 min-w-0">
                        {editMode ? (
                          <div className="space-y-2">
                            <Input
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Customer name"
                              className="text-lg font-semibold text-slate-900"
                            />
                            <Input
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Email"
                              type="email"
                            />
                            <Input
                              value={phone}
                              onChange={(e) => setPhone(formatPHPhone(e.target.value))}
                              placeholder="+63 9XX XXX XXXX"
                              type="tel"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-slate-900 truncate">{name}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{email || <span className="italic">No email</span>}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{phone || <span className="italic">No phone</span>}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Address + TIN */}
                    <Separator className="my-5" />
                    <div className="space-y-4">
                      <div>
                        <FieldLabel>Address</FieldLabel>
                        {editMode ? (
                          <Textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                            placeholder="Customer address"
                          />
                        ) : (
                          <FieldValue>{address}</FieldValue>
                        )}
                      </div>

                      <div>
                        <FieldLabel>Tax Identification Number (TIN)</FieldLabel>
                        {editMode ? (
                          <Input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="###-###-###" />
                        ) : (
                          <FieldValue>{tin}</FieldValue>
                        )}
                      </div>
                    </div>

                    {/* Metadata grid */}
                    <Separator className="my-5" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">

                        {/* Customer ID */}
                        <div>
                          <FieldLabel>Customer ID</FieldLabel>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-slate-800">{customer.id}</span>
                            <button
                              onClick={copyId}
                              className="inline-flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Copy ID"
                            >
                              {copied
                                ? <Check size={13} className="text-green-500" />
                                : <Copy size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Payment method */}
                        <div>
                          <FieldLabel>Payment method</FieldLabel>
                          {editMode ? (
                            <Select value={paymentMethod || undefined} onValueChange={setPaymentMethod}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                {['Cash', 'Bank Transfer', 'Check', 'Credit Card', 'GCash', 'Maya'].map((m) => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FieldValue>{paymentMethod}</FieldValue>
                          )}
                        </div>

                        {/* VAT status */}
                        <div>
                          <FieldLabel>VAT status</FieldLabel>
                          {editMode ? (
                            <div className="flex flex-wrap items-center gap-3 pt-0.5">
                              {[
                                { value: 'vatable', label: 'VAT-able' },
                                { value: 'zero',    label: 'Zero Rated' },
                                { value: 'exempt',  label: 'Exempt' },
                              ].map(({ value, label }) => (
                                <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="vat-detail"
                                    value={value}
                                    checked={vatStatus === value}
                                    onChange={() => setVatStatus(value as typeof vatStatus)}
                                    className="accent-violet-600 w-3.5 h-3.5"
                                  />
                                  <span className="text-xs text-slate-700">{label}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <FieldValue>{vatLabel}</FieldValue>
                          )}
                        </div>

                        {/* Customer groups */}
                        <div>
                          <FieldLabel>Customer groups</FieldLabel>
                          {editMode ? (
                            <div className="mt-0.5 space-y-2">
                              {/* Current group badges with remove × */}
                              {editedGroups.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {editedGroups.map((g) => (
                                    <span
                                      key={g}
                                      className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700"
                                    >
                                      {g}
                                      <button
                                        type="button"
                                        onClick={() => setEditedGroups((prev) => prev.filter((x) => x !== g))}
                                        className="ml-0.5 text-violet-400 hover:text-violet-700 transition-colors"
                                      >
                                        <X size={10} weight="bold" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {/* Manage button */}
                              <button
                                type="button"
                                onClick={() => setGroupsDrawerOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
                              >
                                <UsersThree size={13} />
                                Manage groups
                              </button>
                            </div>
                          ) : editedGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {editedGroups.map((g) => (
                                <Badge key={g} colorScheme="secondary" className="whitespace-nowrap">
                                  {g}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <FieldValue>{''}</FieldValue>
                          )}
                        </div>

                        {/* Payment terms */}
                        <div>
                          <FieldLabel>Payment terms</FieldLabel>
                          {editMode ? (
                            <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" />
                          ) : (
                            <FieldValue>{paymentTerms}</FieldValue>
                          )}
                        </div>

                        {/* SEC/DTI */}
                        <div>
                          <FieldLabel>SEC/DTI number</FieldLabel>
                          <FieldValue>{''}</FieldValue>
                        </div>
                    </div>

                    {/* Dates footer */}
                    <Separator className="my-5" />
                    <div className="grid grid-cols-2 gap-x-8">
                      <div>
                        <FieldLabel>Date created</FieldLabel>
                        <FieldValue>{customer.dateCreated}</FieldValue>
                      </div>
                      <div>
                        <FieldLabel>Last updated</FieldLabel>
                        <FieldValue>{customer.lastUpdatedAt}</FieldValue>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ── Right: Billing Summary (1/3) ── */}
                <div className="col-span-1 space-y-4">
                  <Card>
                    <CardHeader className="px-5 py-4">
                      <CardTitle>Billing summary</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-4 space-y-3">
                      {[
                        { label: 'Total amount due',  value: '₱ 0.00' },
                        { label: 'Total overdue',     value: '₱ 0.00' },
                        { label: 'Open invoices',     value: '0' },
                        { label: 'Paid invoices',     value: '0' },
                        { label: 'Avg. days to pay',  value: '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className="text-sm font-medium text-slate-800">{value}</span>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setActiveTab('Receivables')}
                        className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors"
                      >
                        View all receivables →
                      </button>
                      <Button
                        size="sm"
                        onClick={() => navigate({ to: '/billings/create', search: { customerId: id } })}
                        className="gap-1.5 text-xs h-7 px-3"
                      >
                        + Create bill
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>

              {/* ── Notes ── */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Add notes about this customer…"
                    />
                  ) : notes ? (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No notes for this customer.</p>
                  )}
                </CardContent>
              </Card>

              {/* ── Supporting Documents ── */}
              <Card>
                <CardHeader>
                  <CardTitle>Supporting documents</CardTitle>
                  <CardDescription>Maximum file size: 25 MB</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drop zone — only in edit mode */}
                  {editMode && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleDocUpload(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={[
                        'flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed py-8 transition-colors cursor-pointer',
                        dragOver
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40',
                      ].join(' ')}
                    >
                      <UploadSimple size={20} className={dragOver ? 'text-violet-400 mb-1' : 'text-slate-300 mb-1'} />
                      <p className="text-sm text-slate-500">Drop files here</p>
                      <p className="text-xs text-slate-400">or</p>
                      <span className="text-sm text-violet-600 font-medium">Browse files</span>
                    </div>
                  )}

                  {/* File list */}
                  {docs.length > 0 ? (
                    <ul className="space-y-2">
                      {docs.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 group"
                        >
                          <div className="shrink-0 w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                            {doc.isImage && doc.url ? (
                              <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <FileTypeIcon name={doc.name} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                            {doc.size && (
                              <p className="text-xs text-slate-400 mt-0.5">{doc.size}</p>
                            )}
                          </div>
                          {editMode && (
                            <button
                              onClick={() => removeDoc(doc.id)}
                              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !editMode && (
                      <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
                    )
                  )}
                </CardContent>
              </Card>

              {/* ── Contacts ── */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <CardTitle>Contacts</CardTitle>
                  {editMode && (
                    <button className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors font-medium">
                      + Add contact
                    </button>
                  )}
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                    <User size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No contacts yet</p>
                  <p className="text-xs text-slate-400">Contacts associated with this customer will appear here.</p>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* ── Receivables tab ── */}
          <TabsContent value="Receivables" className="flex-1 overflow-y-auto px-8 py-6 mt-0">
            <div className="max-w-6xl mx-auto">
              <ReceivablesTable
                bills={getBillsByCustomer(customer.id)}
                onCreateBill={() => navigate({ to: '/billings/create', search: { customerId: id } })}
              />
            </div>
          </TabsContent>

          {/* ── Reports tab ── */}
          <TabsContent value="Reports" className="flex-1 overflow-y-auto px-8 py-6 mt-0">
            <div className="max-w-6xl mx-auto">
              <CustomerReportsTab />
            </div>
          </TabsContent>

        </Tabs>
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
              alt={name}
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
            />
            <p className="text-white text-sm font-medium">{name}</p>
          </div>
        </div>
      )}

      {/* Hidden file input for supporting docs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleDocUpload(e.target.files)}
      />

      {/* Assign Groups Drawer */}
      <AssignGroupsDrawer
        open={groupsDrawerOpen}
        onClose={() => setGroupsDrawerOpen(false)}
        onSave={(updated) => setEditedGroups(updated)}
        customerName={name}
        initialGroups={editedGroups}
      />
    </div>
  );
}
