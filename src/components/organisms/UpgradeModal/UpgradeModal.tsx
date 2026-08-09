import { useState } from 'react';
import { X, CreditCard, WarningCircle, CaretDown } from '@phosphor-icons/react';
import { Checkbox } from '#/components/atoms/Checkbox';
import { Button } from '#/components/atoms/Button';
import { cn } from '#/components/utils';
import {
  type BillingAddress,
  type BillingCycle,
  COUNTRIES,
  CvvInput,
  FieldError,
  ResultScreen,
  fieldCls,
  formatCardNumber,
  formatDate,
  formatExpiry,
  inputCls,
  labelCls,
  peso,
  addCycle,
  sectionTitleCls,
  simulateCharge,
} from './shared';

export type { BillingCycle };

const MONTHLY_PRICE = 1899;
const ANNUAL_PRICE = 18990;

interface FormState extends BillingAddress {
  cardNumber: string;
  expiry: string;
  cvv: string;
  nameOnCard: string;
  agreedToTerms: boolean;
}

const EMPTY_FORM: FormState = {
  cardNumber: '',
  expiry: '',
  cvv: '',
  nameOnCard: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  country: 'Philippines',
  zip: '',
  agreedToTerms: false,
};

type Stage = 'form' | 'confirm' | 'success' | 'error';

interface UpgradeModalProps {
  open: boolean;
  cycle: BillingCycle;
  simulateFailure: boolean;
  onClose: () => void;
  onSubscribed: (details: { nextBillingDate: Date; billingAddress: BillingAddress }) => void;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (form.cardNumber.replace(/\D/g, '').length < 12) errors.cardNumber = 'Enter a valid card number.';
  if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errors.expiry = 'Enter the expiration date as MM/YY.';
  if (form.cvv.length < 3) errors.cvv = 'Enter a valid CVV.';
  if (!form.nameOnCard.trim()) errors.nameOnCard = 'Enter the name on the card.';
  if (!form.addressLine1.trim()) errors.addressLine1 = 'Enter your address.';
  if (!form.city.trim()) errors.city = 'Enter your city.';
  if (!form.country.trim()) errors.country = 'Select a country.';
  if (!form.zip.trim()) errors.zip = 'Enter your zip code.';
  if (!form.agreedToTerms) errors.agreedToTerms = 'You must agree to the terms and conditions to continue.';

  return errors;
}

export function UpgradeModal({ open, cycle, simulateFailure, onClose, onSubscribed }: UpgradeModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [stage, setStage] = useState<Stage>('form');
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ amount: number; nextBillingDate: Date } | null>(null);

  if (!open) return null;

  const amount = cycle === 'monthly' ? MONTHLY_PRICE : ANNUAL_PRICE;
  const billingDate = new Date();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleClose() {
    setStage('form');
    setChargeError(null);
    setFieldErrors({});
    setResult(null);
    onClose();
  }

  function handleSubscribeClick() {
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setChargeError(null);
    setStage('confirm');
  }

  function handleConfirm() {
    setProcessing(true);
    window.setTimeout(() => {
      setProcessing(false);
      if (simulateFailure) {
        setStage('error');
        return;
      }
      const charge = simulateCharge(form.cardNumber);
      if (!charge.ok) {
        setChargeError(charge.message);
        setForm(prev => ({ ...prev, cardNumber: '', expiry: '', cvv: '', nameOnCard: '' }));
        setStage('form');
        return;
      }
      const nextBillingDate = addCycle(billingDate, cycle);
      const billingAddress: BillingAddress = {
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        province: form.province,
        country: form.country,
        zip: form.zip,
      };
      setResult({ amount, nextBillingDate });
      setStage('success');
      onSubscribed({ nextBillingDate, billingAddress });
    }, 1000);
  }

  function handleRetry() {
    setStage('form');
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {stage === 'success' && result ? (
          <ResultScreen
            variant="success"
            title="You're on the Standard plan!"
            subtitle="Your subscription is now active."
            details={[
              { label: 'Plan', value: `Standard (${cycle === 'monthly' ? 'Monthly' : 'Annual'})` },
              { label: 'Amount Charged', value: peso(result.amount), emphasize: true },
              { label: 'Next Billing Date', value: formatDate(result.nextBillingDate) },
            ]}
            primaryLabel="Done"
            onPrimaryAction={handleClose}
          />
        ) : stage === 'error' ? (
          <ResultScreen variant="error" onPrimaryAction={handleRetry} />
        ) : stage === 'confirm' ? (
          <ConfirmStep
            amount={amount}
            cycle={cycle}
            billingDate={billingDate}
            processing={processing}
            onConfirm={handleConfirm}
            onCancel={() => setStage('form')}
          />
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-semibold text-slate-900">Upgrade to Standard</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-6 flex-1 overflow-y-auto">
              {chargeError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <WarningCircle size={18} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 leading-relaxed">{chargeError}</p>
                </div>
              )}

              {/* Charge summary */}
              <div className="flex flex-col gap-3">
                <p className={sectionTitleCls}>Order Summary</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Plan</span>
                    <span className="font-medium text-slate-800">Standard ({cycle === 'monthly' ? 'Monthly' : 'Annual'})</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-semibold text-slate-900">{peso(amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Billing date</span>
                    <span className="font-medium text-slate-800">{formatDate(billingDate)}</span>
                  </div>
                </div>
              </div>

              {/* Payment information */}
              <div className="flex flex-col gap-3">
                <p className={sectionTitleCls}>Payment Information</p>
                <div>
                  <label className={labelCls}>Card Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.cardNumber}
                      onChange={e => set('cardNumber', formatCardNumber(e.target.value))}
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      className={cn(fieldCls(fieldErrors.cardNumber), 'pl-9')}
                    />
                  </div>
                  <FieldError message={fieldErrors.cardNumber} />
                  <p className="text-xs text-slate-400 mt-1">
                    Prototype tip: card numbers ending in 0001–0008 simulate common decline reasons.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Expiration <span className="text-red-500">*</span></label>
                    <input
                      value={form.expiry}
                      onChange={e => set('expiry', formatExpiry(e.target.value))}
                      inputMode="numeric"
                      placeholder="MM/YY"
                      className={fieldCls(fieldErrors.expiry)}
                    />
                    <FieldError message={fieldErrors.expiry} />
                  </div>
                  <div>
                    <label className={labelCls}>CVV <span className="text-red-500">*</span></label>
                    <CvvInput value={form.cvv} onChange={v => set('cvv', v)} hasError={!!fieldErrors.cvv} />
                    <FieldError message={fieldErrors.cvv} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Name on Card <span className="text-red-500">*</span></label>
                  <input
                    value={form.nameOnCard}
                    onChange={e => set('nameOnCard', e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className={fieldCls(fieldErrors.nameOnCard)}
                  />
                  <FieldError message={fieldErrors.nameOnCard} />
                </div>
              </div>

              {/* Billing address */}
              <div className="flex flex-col gap-3">
                <p className={sectionTitleCls}>Billing Address</p>
                <div>
                  <label className={labelCls}>Address Line 1 <span className="text-red-500">*</span></label>
                  <input
                    value={form.addressLine1}
                    onChange={e => set('addressLine1', e.target.value)}
                    placeholder="Street, building, unit"
                    className={fieldCls(fieldErrors.addressLine1)}
                  />
                  <FieldError message={fieldErrors.addressLine1} />
                </div>
                <div>
                  <label className={labelCls}>Address Line 2 (optional)</label>
                  <input
                    value={form.addressLine2}
                    onChange={e => set('addressLine2', e.target.value)}
                    placeholder="Address line 2"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>City <span className="text-red-500">*</span></label>
                    <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" className={fieldCls(fieldErrors.city)} />
                    <FieldError message={fieldErrors.city} />
                  </div>
                  <div>
                    <label className={labelCls}>Province (optional)</label>
                    <input value={form.province} onChange={e => set('province', e.target.value)} placeholder="Province" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Country <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={form.country}
                        onChange={e => set('country', e.target.value)}
                        className={cn(fieldCls(fieldErrors.country), 'appearance-none pr-8')}
                      >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <FieldError message={fieldErrors.country} />
                  </div>
                  <div>
                    <label className={labelCls}>Zip Code <span className="text-red-500">*</span></label>
                    <input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="Zip code" className={fieldCls(fieldErrors.zip)} />
                    <FieldError message={fieldErrors.zip} />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <Checkbox
                    checked={form.agreedToTerms}
                    onCheckedChange={v => set('agreedToTerms', v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-slate-600 leading-relaxed">
                    By checking this box, I agree to the terms and conditions set out in the{' '}
                    <a
                      href="#"
                      onClick={e => e.stopPropagation()}
                      className="text-violet-600 hover:text-violet-700 underline underline-offset-2"
                    >
                      Mochi Main Services Agreement
                    </a>.
                  </span>
                </label>
                <FieldError message={fieldErrors.agreedToTerms} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <Button colorScheme="primary" size="lg" className="w-full" onClick={handleSubscribeClick}>
                Subscribe
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmStep({
  amount,
  cycle,
  billingDate,
  processing,
  onConfirm,
  onCancel,
}: {
  amount: number;
  cycle: BillingCycle;
  billingDate: Date;
  processing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="px-6 py-8 flex flex-col items-center text-center gap-5 overflow-y-auto">
      <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center">
        <CreditCard size={26} className="text-violet-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">Confirm your subscription</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          You're about to be charged <span className="font-semibold text-slate-800">{peso(amount)}</span> for the{' '}
          <span className="font-semibold text-slate-800">Standard</span> plan (
          {cycle === 'monthly' ? 'Monthly' : 'Annual'}), billed on {formatDate(billingDate)}.
        </p>
      </div>
      <div className="w-full flex items-center gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button colorScheme="primary" size="lg" className="flex-1" onClick={onConfirm} isLoading={processing} loadingText="Charging…">
          Confirm & Subscribe
        </Button>
      </div>
    </div>
  );
}
