import React, { useState } from 'react';
import {
  ArrowLeft,
  CaretRight,
  BellSimple,
  Copy,
  Check,
  Info,
  FilePdf,
  FileDoc,
  FileXls,
  FileCsv,
  FileZip,
  File as FileIcon,
  Coins,
  FileText,
  DotsThreeVertical,
  Eye,
  DownloadSimple,
} from '@phosphor-icons/react';
import { useNavigate, useParams, useLocation } from '@tanstack/react-router';
import { useCustomers } from '#/context/CustomersContext';
import { SuccessBanner } from '#/components/molecules/SuccessBanner';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { Button } from '#/components/atoms/Button';
import { Badge } from '#/components/atoms/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '#/components/atoms/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/molecules/Tabs';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '#/components/atoms/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#/components/atoms/DropdownMenu';
import { SupportingDocFile, CustomerContact } from '#/data/customers';
import { ProfileAvatar } from '#/components/molecules/ProfileAvatar';
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

function SectionCard({
  title,
  right,
  children,
  contentClassName = '',
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className="rounded-[8px] shadow-sm border border-[#E4E4E7] py-6 !gap-4 h-full">
      <CardHeader className="px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-[20px] font-medium text-slate-900">{title}</CardTitle>
        {right}
      </CardHeader>
      <CardContent className={['px-6', contentClassName].join(' ')}>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-[14px] font-medium text-slate-900">{label}</p>
        {icon}
      </div>
      <div className="text-[14px] text-slate-800">
        {empty ? <span className="text-slate-400 italic">Not set</span> : value}
      </div>
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
  const location = useLocation();
  const [banner, setBanner] = useState<string | null>(
    (location.state as { successBanner?: string } | null)?.successBanner ?? null
  );

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

  function handleDownloadDoc(doc: SupportingDocFile) {
    if (!doc.url) return;
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const vatLabel =
    customer.vatStatus === 'vatable' ? 'VAT-able'
    : customer.vatStatus === 'zero' ? 'VAT Zero Rated'
    : customer.vatStatus === 'exempt' ? 'VAT Exempt'
    : undefined;

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
          className="flex-1 flex flex-col overflow-hidden gap-0"
        >
          {/* Tab nav row */}
          <div className="shrink-0 bg-white border-b border-slate-200 px-6 flex items-stretch justify-between">
            <TabsList variant="line" className="gap-0 h-auto border-b-0">
              <TabsTrigger value="General" className="px-4">General</TabsTrigger>
              <TabsTrigger value="Receivables" className="px-4">Receivables</TabsTrigger>
              <TabsTrigger value="Reports" className="px-4">Reports</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 py-2 self-center">
              <Button variant="outline" colorScheme="secondary">
                Bulk create bills
              </Button>
              <Button onClick={() => navigate({ to: '/customers/$id/edit', params: { id } })}>
                Edit customer
              </Button>
            </div>
          </div>

          {/* ── Success banner ── */}
          <div className="overflow-hidden shrink-0">
            {banner && (
              <SuccessBanner message={banner} onDismiss={() => setBanner(null)} />
            )}
          </div>

          {/* ── General tab ── */}
          <TabsContent value="General" className="flex-1 overflow-y-auto px-8 py-6 mt-0">
            <div className="max-w-5xl mx-auto space-y-4">

              {/* ── Top row: Customer information + Billing summary ── */}
              <div className="flex flex-wrap items-stretch gap-4">

                {/* ── Customer information (hugs its content) ── */}
                <div className="w-fit max-w-full">
                  <SectionCard title="Customer information">
                    {/* Avatar + name + contact lines */}
                    <div className="flex items-start gap-5">
                      <div
                        className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-white font-semibold text-3xl shrink-0"
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

                      <div className="flex-1 min-w-0 pt-1">
                        <h2 className="text-[20px] font-medium text-slate-900 leading-tight truncate">
                          {customer.name}
                        </h2>
                        <div className="mt-2 space-y-1">
                          {customer.email && (
                            <Tooltip open={copiedEmail || undefined} delayDuration={400}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(customer.email);
                                    setCopiedEmail(true);
                                    setTimeout(() => setCopiedEmail(false), 2000);
                                  }}
                                  className={[
                                    'block text-left text-[14px] transition-colors',
                                    copiedEmail ? 'text-green-600' : 'text-slate-600 hover:text-violet-600 hover:underline',
                                  ].join(' ')}
                                >
                                  {customer.email}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {copiedEmail ? '✓ Copied to clipboard!' : 'Click to copy'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {customer.phoneNumber && (
                            <p className="text-[14px] text-slate-600">{customer.phoneNumber}</p>
                          )}
                          {customer.address && (
                            <p className="text-[14px] text-slate-600 leading-relaxed">{customer.address}</p>
                          )}
                          {customer.tin && (
                            <p className="text-[14px] text-slate-600">TIN #: {customer.tin}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Field grid */}
                    <div className="grid grid-cols-3 gap-x-8 gap-y-4 mt-4">
                      <Field
                        label="Customer ID"
                        icon={<Info size={12} className="text-violet-600" />}
                        value={
                          <span className="inline-flex items-center gap-1.5">
                            {customer.id}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={copyId}
                                  className="text-violet-600 hover:text-violet-700 transition-colors"
                                >
                                  {copied
                                    ? <Check size={13} weight="bold" className="text-green-500" />
                                    : <Copy size={13} />}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{copied ? 'Copied!' : 'Copy ID'}</TooltipContent>
                            </Tooltip>
                          </span>
                        }
                      />
                      <Field label="Payment method" value={customer.paymentMethod} />
                      <Field label="VAT status" value={vatLabel} />

                      <Field
                        label="Customer group"
                        value={
                          groups.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {groups.map((g) => (
                                <Badge
                                  key={g}
                                  className="rounded-full border border-[#E4E4E7] bg-white text-slate-700 text-[12px] px-2.5 py-0.5 font-medium"
                                >
                                  {g}
                                </Badge>
                              ))}
                            </div>
                          ) : undefined
                        }
                      />
                      <Field label="Payment terms" value={customer.paymentTerms} />
                      <Field label="Registration number" value={customer.registrationNumber} />
                    </div>
                  </SectionCard>
                </div>

                {/* ── Billing summary (fills remaining row width) ── */}
                <div className="flex-1 min-w-[320px]">
                  <Card className="rounded-[8px] shadow-sm border border-[#E4E4E7] py-6 !gap-4 h-full">
                    <CardHeader className="px-6 flex flex-row items-center justify-between gap-3">
                      <CardTitle className="text-[20px] font-medium text-slate-900 whitespace-nowrap">
                        Billing summary
                      </CardTitle>
                      <Button
                        variant="outline"
                        colorScheme="secondary"
                        className="shrink-0"
                        onClick={() => navigate({ to: '/billings/create', search: { customerId: id } })}
                      >
                        Create a new bill
                      </Button>
                    </CardHeader>
                    <CardContent className="px-6 space-y-4">
                      <div className="rounded-[8px] border border-[#E4E4E7] p-5">
                        <div className="flex items-start justify-between">
                          <p className="text-[14px] font-medium text-slate-900">Total accounts receivables</p>
                          <Coins size={22} className="text-slate-700 shrink-0" />
                        </div>
                        <p className="text-[28px] font-medium text-slate-900 mt-2">₱0.00</p>
                      </div>
                      <div className="rounded-[8px] border border-[#E4E4E7] p-5">
                        <div className="flex items-start justify-between">
                          <p className="text-[14px] font-medium text-slate-900">No. of unpaid invoices</p>
                          <FileText size={22} className="text-slate-700 shrink-0" />
                        </div>
                        <p className="text-[28px] font-medium text-slate-900 mt-2">0</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ── Notes (read-only, no inner border box) ── */}
              <SectionCard title="Notes">
                {customer.notes ? (
                  <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                ) : (
                  <p className="text-[14px] text-slate-400 italic">No notes added.</p>
                )}
              </SectionCard>

              {/* ── Supporting Documents (read-only: View + Download only) ── */}
              <SectionCard title="Supporting Documents">
                {docs.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No documents attached.</p>
                ) : (
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div
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
                            <DropdownMenuItem
                              className="text-[#18181B]"
                              onSelect={() => doc.url && window.open(doc.url, '_blank')}
                            >
                              <Eye size={14} className="text-[#18181B]" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[#18181B]"
                              onSelect={() => handleDownloadDoc(doc)}
                            >
                              <DownloadSimple size={14} className="text-[#18181B]" />
                              Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* ── Contacts (Organizations only) ── */}
              {customer.type === 'Organization' && (
                <SectionCard title="Contacts">
                  {customer.contacts && customer.contacts.length > 0 ? (
                    <div className="space-y-3">
                      {customer.contacts.map((contact: CustomerContact) => (
                        <div
                          key={contact.id}
                          className="rounded-[8px] border border-[#E4E4E7] p-4 flex items-center gap-3"
                        >
                          <ProfileAvatar imgSrc={contact.avatarUrl} name={contact.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">{contact.name}</span>
                              {contact.isPrimary && (
                                <Badge className="bg-violet-50 text-violet-700 border-violet-200 border text-xs px-2 py-0 rounded-full font-medium">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            {contact.position && (
                              <p className="text-xs text-slate-500 mt-0.5">{contact.position}</p>
                            )}
                            {(contact.phone || contact.email) && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {[contact.phone, contact.email].filter(Boolean).join(' • ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No contacts added.</p>
                  )}
                </SectionCard>
              )}

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
