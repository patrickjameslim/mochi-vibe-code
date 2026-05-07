import React, { useState } from 'react';
import {
  ArrowLeft,
  CaretRight,
  BellSimple,
  Lightbulb,
  Gear,
  Scan,
  Sparkle,
  X,
  ArrowClockwise,
  CalendarBlank,
  Plus,
  Trash,
  ToggleLeft,
  ToggleRight,
  PencilSimple,
  FileText,
} from '@phosphor-icons/react';
import { Sidebar } from './Sidebar';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Separator } from './ui/Separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/Select';
import { Customer } from '../data/customers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  tax: number;
}

type BillingType = 'one-time' | 'recurring' | 'installment';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 mb-4">{children}</h3>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  customer?: Customer;
  onBack: () => void;
  onViewCustomer?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateBillPage({ customer, onBack, onViewCustomer }: Props) {
  const [activeView, setActiveView] = useState<'build' | 'preview'>('build');
  const [tipDismissed, setTipDismissed] = useState(false);
  const [billingType, setBillingType] = useState<BillingType>('one-time');
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [discount, setDiscount] = useState(0);
  const [globalTaxPct, setGlobalTaxPct] = useState(0);
  const [overduePct, setOverduePct] = useState(10);
  const [overdueEnabled, setOverdueEnabled] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(false);
  const [notes, setNotes] = useState(
    'Please settle your payment on or before the due date indicated above. Late payments may be subject to additional charges as outlined in your contract.'
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    'The payment shall be made by way of cash, local cheque, or bank transfer to the following account details:\n\nBank Name: BDO\nAccount Name: Maplecrest Group Inc.\nAccount Number: 1234567890\nBranch: Manila\nSWIFT Code: BNORPHMM'
  );

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', name: '', qty: 1, price: 0, tax: 0 },
  ]);

  // Bill ID (auto-generated for demo)
  const billId = 'BNG-2025-0235';
  const [billName, setBillName] = useState('Untitled bill');

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', qty: 1, price: 0, tax: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem<K extends keyof LineItem>(id: string, key: K, value: LineItem[K]) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
  }

  // Totals
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const taxAmount = items.reduce((s, i) => s + i.qty * i.price * (i.tax / 100), 0) + subtotal * (globalTaxPct / 100);
  const total = subtotal + taxAmount - discount;
  const amountDue = total;

  const billingTypes: { id: BillingType; icon: React.ReactNode; label: string; desc: string }[] = [
    {
      id: 'one-time',
      icon: <FileText size={20} className="text-gray-500" />,
      label: 'One-time',
      desc: 'Charge a single billing',
    },
    {
      id: 'recurring',
      icon: <ArrowClockwise size={20} className="text-gray-500" />,
      label: 'Recurring',
      desc: 'Charge a recurring bill with a fixed periodical schedule',
    },
    {
      id: 'installment',
      icon: <CalendarBlank size={20} className="text-gray-500" />,
      label: 'Installment',
      desc: 'Split bill into multiple scheduled charges',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={14} weight="bold" />
            </button>
            <nav className="flex items-center gap-1.5 text-sm text-gray-500">
              <span>Dashboard</span>
              <CaretRight size={12} />
              <span>Billing</span>
              <CaretRight size={12} />
              <span className="text-gray-900 font-medium">Create bill</span>
            </nav>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Sub-header: name+ID | toggle | actions ── */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-2.5 grid grid-cols-3 items-center gap-4">

          {/* Left – bill name input */}
          <div className="min-w-0">
            <input
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              className="w-80 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-colors"
              placeholder="Untitled bill"
            />
          </div>

          {/* Center – Build / Preview toggle */}
          <div className="flex justify-center">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              {(['build', 'preview'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={[
                    'px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                    activeView === v
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Right – actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline">Save as draft</Button>
            <Button variant="primary">Send now</Button>
          </div>

        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* ── Tip banner ── */}
            {!tipDismissed && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <Lightbulb size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-800 mb-0.5">Tip</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    You can <span className="font-medium">customize your invoices</span> by adding or removing columns to{' '}
                    <span className="font-medium">suit your business</span> by going to{' '}
                    <span className="font-medium">Settings</span>.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    Take me there
                  </button>
                  <button
                    onClick={() => setTipDismissed(true)}
                    className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* ── Action row ── */}
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-colors">
                <Gear size={13} />
                Settings
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 transition-colors">
                <Scan size={13} />
                Scan document
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-xs font-medium text-violet-600 hover:bg-violet-100 transition-colors">
                <Sparkle size={13} weight="fill" />
                Create using AI
              </button>
            </div>

            {/* ── Billing type ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionTitle>Billing type</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                {billingTypes.map(({ id, icon, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setBillingType(id)}
                    className={[
                      'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                      billingType === id
                        ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-400'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {icon}
                    <div>
                      <p className={`text-sm font-semibold ${billingType === id ? 'text-violet-700' : 'text-gray-800'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── From / To / Billing meta ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-100">

                {/* From */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From</p>
                    <button className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors">
                      Update profile
                    </button>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-500">M</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-600">Maplecrest Group Inc.</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        24 Amora Street,<br />
                        Barangay San Isidro,<br />
                        Quezon City, Metro Manila
                      </p>
                    </div>
                  </div>
                </div>

                {/* To */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To</p>
                    <button className="text-xs text-violet-600 hover:text-violet-800 hover:underline transition-colors">
                      Change
                    </button>
                  </div>
                  {customer ? (
                    <div className="flex items-start gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold"
                        style={{ backgroundColor: customer.avatarColor }}
                      >
                        {customer.avatarInitials}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => onViewCustomer?.()}
                          className="text-sm font-semibold text-violet-600 hover:text-violet-800 hover:underline transition-colors text-left"
                        >
                          {customer.name}
                        </button>
                        <p className="text-xs text-gray-500 mt-0.5">{customer.email}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{customer.address}</p>
                      </div>
                    </div>
                  ) : (
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-400 hover:border-violet-400 hover:text-violet-600 transition-colors">
                      <Plus size={12} weight="bold" />
                      Select a customer
                    </button>
                  )}
                </div>

                {/* Billing meta */}
                <div className="p-5 space-y-3">
                  <FieldBlock label="Billing ID">
                    <Input value={billId} readOnly className="bg-gray-50 text-gray-500 text-xs" />
                  </FieldBlock>
                  <FieldBlock label="Purchase order ID">
                    <div className="relative">
                      <Input placeholder="—" className="pr-20 text-sm" />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
                        Generate
                      </button>
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Bill date">
                    <div className="relative">
                      <CalendarBlank size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        className="pl-8 text-sm"
                      />
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Payment terms">
                    <Select value={paymentTerms || undefined} onValueChange={setPaymentTerms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldBlock>
                  <FieldBlock label="Due date">
                    <div className="relative">
                      <CalendarBlank size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="pl-8 text-sm"
                      />
                    </div>
                  </FieldBlock>
                </div>
              </div>
            </div>

            {/* ── Line items ── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <SectionTitle>Line items</SectionTitle>

                {/* Table header */}
                <div className="grid grid-cols-[1fr_80px_120px_80px_100px_36px] gap-2 mb-2">
                  {['Item', 'Qty', 'Price', 'Tax %', 'Subtotal', ''].map((h) => (
                    <p key={h} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</p>
                  ))}
                </div>

                {/* Rows */}
                <div className="space-y-2">
                  {items.map((item) => {
                    const rowSubtotal = item.qty * item.price;
                    return (
                      <div key={item.id} className="grid grid-cols-[1fr_80px_120px_80px_100px_36px] gap-2 items-center">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder="Add an item"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                          className="text-sm text-center"
                        />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₱</span>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.price || ''}
                            onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            className="text-sm pl-6"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={item.tax || ''}
                            onChange={(e) => updateItem(item.id, 'tax', Number(e.target.value))}
                            className="text-sm pr-6"
                            placeholder="0"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium text-right pr-1">
                          {fmt(rowSubtotal)}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add item */}
                <button
                  onClick={addItem}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                >
                  <Plus size={12} weight="bold" />
                  Add line item
                </button>
              </div>

              {/* Totals */}
              <div className="px-5 py-4 bg-gray-50/60">
                <div className="ml-auto max-w-xs space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-800">{fmt(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tax %</span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={globalTaxPct || ''}
                        onChange={(e) => setGlobalTaxPct(Number(e.target.value))}
                        className="w-16 text-xs text-center py-1"
                        placeholder="0"
                      />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                  </div>

                  <button className="text-xs text-violet-600 hover:text-violet-800 transition-colors">
                    + Add withholding tax
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-xs">₱</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={discount || ''}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-24 text-xs text-right py-1"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tax amount</span>
                    <span className="font-medium text-gray-800">{fmt(taxAmount)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-medium">Total</span>
                    <span className="font-semibold text-gray-900">{fmt(total)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">Amount due</span>
                    <span className="text-base font-bold text-violet-600">{fmt(amountDue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Billing ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionTitle>Billing</SectionTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOverdueEnabled((v) => !v)}
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                  >
                    {overdueEnabled
                      ? <ToggleRight size={28} weight="fill" className="text-violet-600" />
                      : <ToggleLeft size={28} />}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Overdue charge</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      An additional fee applied to unpaid bills after the due date
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={overduePct}
                    onChange={(e) => setOverduePct(Number(e.target.value))}
                    disabled={!overdueEnabled}
                    className="w-16 text-sm text-center"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
            </div>

            {/* ── Payment instructions ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionTitle>Payment instructions</SectionTitle>
              <Textarea
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                rows={6}
                className="text-sm text-gray-700"
              />
            </div>

            {/* ── Notes ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionTitle>Notes</SectionTitle>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add a note for the customer…"
                className="text-sm text-gray-700"
              />
            </div>

            {/* ── Advanced ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SectionTitle>Advanced</SectionTitle>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSignatureEnabled((v) => !v)}
                  className="text-gray-400 hover:text-violet-600 transition-colors"
                >
                  {signatureEnabled
                    ? <ToggleRight size={28} weight="fill" className="text-violet-600" />
                    : <ToggleLeft size={28} />}
                </button>
                <div className="flex items-center gap-2">
                  <PencilSimple size={14} className="text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">Add my signature</p>
                </div>
              </div>
            </div>

            {/* bottom spacer */}
            <div className="h-4" />
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-8 py-3 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onBack}>Cancel</Button>
          <Button variant="outline">Save as draft</Button>
          <Button variant="primary">Send now</Button>
        </div>
      </div>
    </div>
  );
}
