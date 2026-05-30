import React, { useState } from 'react';
import {
  ArrowLeft,
  CaretRight,
  BellSimple,
  Copy,
  Check,
  PencilSimple,
  Envelope,
  Phone,
  MapPin,
  IdentificationCard,
  CreditCard,
  Receipt,
  ShieldCheck,
  CalendarBlank,
  ClockCounterClockwise,
  FilePdf,
  FileDoc,
  FileXls,
  FileCsv,
  FileZip,
  File as FileIcon,
  User,
  Buildings,
  ArrowSquareOut,
  Note,
  UsersFour,
} from '@phosphor-icons/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useCustomers } from '#/context/CustomersContext';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Badge } from '#/components/atoms/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '#/components/atoms/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/molecules/Tabs';
import { Separator } from '#/components/atoms/Separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '#/components/atoms/Tooltip';
import { SupportingDocFile } from '#/data/customers';
import { getBillsByCustomer } from '#/data/bills';
import { ReceivablesTable } from '#/components/molecules/ReceivablesTable';
import { CustomerReportsTab } from '#/pages/reports/components/CustomerReportsTab';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')                          return <FilePdf  size={20} className="text-red-500 shrink-0" />;
  if (['doc', 'docx'].includes(ext))          return <FileDoc  size={20} className="text-blue-500 shrink-0" />;
  if (['xls', 'xlsx'].includes(ext))          return <FileXls  size={20} className="text-green-600 shrink-0" />;
  if (ext === 'csv')                          return <FileCsv  size={20} className="text-green-500 shrink-0" />;
  if (['zip', 'rar', '7z'].includes(ext))     return <FileZip  size={20} className="text-yellow-600 shrink-0" />;
  return                                             <FileIcon size={20} className="text-slate-400 shrink-0" />;
}

function FieldLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      {icon && <span className="text-slate-400">{icon}</span>}
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{children}</p>
    </div>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  const empty = !children || (typeof children === 'string' && children.trim() === '');
  return (
    <p className="text-sm text-slate-800 leading-relaxed">
      {empty ? <span className="text-slate-400 italic">Not set</span> : children}
    </p>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <FieldLabel icon={icon}>{label}</FieldLabel>
      <FieldValue>{value}</FieldValue>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomerViewPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: '/_layout/customers/$id/view' });
  const { customers } = useCustomers();
  const customer = customers.find(c => c.id === id);
  const groups = customer ? [customer.group] : [];

  const [activeTab, setActiveTab] = useState<'General' | 'Receivables' | 'Reports'>('General');
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Customer not found.</p>
      </div>
    );
  }

  // Resolve supporting docs
  const docs: SupportingDocFile[] =
    customer.supportingDocumentFiles && customer.supportingDocumentFiles.length > 0
      ? customer.supportingDocumentFiles
      : customer.supportingDocuments.map((name, i) => ({
          id: `legacy-${i}-${name}`,
          name,
          size: '',
          isImage: /\.(png|jpe?g|gif|webp)$/i.test(name),
          url: '',
        }));

  function copyId() {
    navigator.clipboard.writeText(customer.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const vatLabel =
    customer.vatStatus === 'vatable' ? 'VAT-able'
    : customer.vatStatus === 'zero' ? 'VAT Zero Rated'
    : customer.vatStatus === 'exempt' ? 'VAT Exempt'
    : undefined;

  const isOrg = customer.type === 'Organization';

  return (
    <TooltipProvider>
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
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <BellSimple size={16} />
            </button>
          </div>
        </header>

        {/* ── Tabs ── */}
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
              <Button variant="outline" onClick={() => navigate({ to: '/customers/$id/edit', params: { id } })}>
                <PencilSimple size={14} />
                Edit
              </Button>
            </div>
          </div>

          {/* ── General tab ── */}
          <TabsContent value="General" className="flex-1 overflow-y-auto px-8 py-6 mt-0">
            <div className="max-w-5xl mx-auto space-y-5">

              {/* ── Profile hero card ── */}
              <Card className="overflow-hidden">
                {/* Accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-violet-500 to-violet-400" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-sm"
                      style={{
                        backgroundColor: customer.avatarUrl ? 'transparent' : customer.avatarColor,
                      }}
                    >
                      {customer.avatarUrl ? (
                        <img
                          src={customer.avatarUrl}
                          alt={customer.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        customer.avatarInitials
                      )}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold text-slate-900 truncate leading-tight">
                            {customer.name}
                          </h2>
                          {/* ID row */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {customer.id}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={copyId}
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  {copied
                                    ? <Check size={13} weight="bold" className="text-green-500" />
                                    : <Copy size={13} />}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{copied ? 'Copied!' : 'Copy ID'}</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Type badge */}
                        <Badge
                          className={[
                            'gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0',
                            isOrg
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200',
                          ].join(' ')}
                        >
                          {isOrg
                            ? <Buildings size={11} weight="bold" />
                            : <User size={11} weight="bold" />}
                          {customer.type}
                        </Badge>
                      </div>

                      {/* Contact info row */}
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Envelope size={14} className="text-slate-400 shrink-0" />
                            <Tooltip
                              open={copiedEmail || undefined}
                              delayDuration={400}
                            >
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(customer.email);
                                    setCopiedEmail(true);
                                    setTimeout(() => setCopiedEmail(false), 2000);
                                  }}
                                  className={[
                                    'transition-colors',
                                    copiedEmail
                                      ? 'text-green-600'
                                      : 'hover:text-violet-600 hover:underline',
                                  ].join(' ')}
                                >
                                  {customer.email}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {copiedEmail ? '✓ Copied to clipboard!' : 'Click to copy'}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                        {customer.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            {customer.phoneNumber}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 max-w-sm">
                            <MapPin size={14} className="text-slate-400 shrink-0 mt-px" />
                            <span className="line-clamp-1">{customer.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Groups */}
                      {groups.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <UsersFour size={14} className="text-slate-400 shrink-0" />
                          {groups.map((g) => (
                            <Badge
                              key={g}
                              className="bg-slate-100 text-slate-600 border-slate-200 text-xs px-2 py-0.5 rounded-full border"
                            >
                              {g}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <Separator className="my-4" />
                  <div className="flex items-center gap-6 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <CalendarBlank size={12} />
                      <span>Created {customer.dateCreated}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClockCounterClockwise size={12} />
                      <span>Last updated {customer.lastUpdatedAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── 2-column grid ── */}
              <div className="grid grid-cols-3 gap-5 items-start">

                {/* ── Left: Details (2 cols) ── */}
                <Card className="col-span-2">
                  <CardHeader className="py-4">
                    <CardTitle>Customer details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 pb-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <InfoRow
                        label="Address"
                        value={customer.address}
                        icon={<MapPin size={13} />}
                      />
                      <InfoRow
                        label="TIN"
                        value={customer.tin}
                        icon={<IdentificationCard size={13} />}
                      />
                      <InfoRow
                        label="Payment method"
                        value={customer.paymentMethod}
                        icon={<CreditCard size={13} />}
                      />
                      <InfoRow
                        label="Payment terms"
                        value={customer.paymentTerms}
                        icon={<Receipt size={13} />}
                      />
                      <InfoRow
                        label="VAT status"
                        value={vatLabel}
                        icon={<ShieldCheck size={13} />}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ── Right: Billing Summary (1 col) ── */}
                <div className="col-span-1">
                  <Card>
                    <CardHeader className="px-5 py-4">
                      <CardTitle>Billing summary</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-4 space-y-3">
                      {[
                        { label: 'Total amount due', value: '₱ 0.00' },
                        { label: 'Total overdue',    value: '₱ 0.00' },
                        { label: 'Open invoices',    value: '0' },
                        { label: 'Paid invoices',    value: '0' },
                        { label: 'Avg. days to pay', value: '—' },
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
              {customer.notes && (
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="flex items-center gap-2">
                      <Note size={16} className="text-slate-400" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {customer.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* ── Supporting Documents ── */}
              <Card>
                <CardHeader className="py-4 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileIcon size={16} className="text-slate-400" />
                    Supporting documents
                  </CardTitle>
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 border text-xs px-2 py-0.5 rounded-full">
                    {docs.length} {docs.length === 1 ? 'file' : 'files'}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-5">
                  {docs.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No documents attached.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group"
                        >
                          <FileTypeIcon name={doc.name} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                            {doc.size && (
                              <p className="text-xs text-slate-400">{doc.size}</p>
                            )}
                          </div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-violet-600"
                            >
                              <ArrowSquareOut size={15} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* ── Receivables tab ── */}
          <TabsContent value="Receivables" className="flex-1 overflow-y-auto px-8 py-6 mt-0">
            <div className="max-w-5xl mx-auto">
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
    </div>
    </TooltipProvider>
  );
}
