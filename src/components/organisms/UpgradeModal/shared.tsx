import * as React from 'react';
import { useState } from 'react';
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import { Button } from '#/components/atoms/Button';
import { cn } from '#/components/utils';

export type BillingCycle = 'monthly' | 'annual';

export interface BillingAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
}

export const COUNTRIES = ['Philippines', 'United States', 'Singapore', 'Japan'];

type FailureCode =
  | 'insufficient_funds'
  | 'generic_decline'
  | 'expired_card'
  | 'incorrect_cvc'
  | 'card_not_supported'
  | 'processing_error'
  | 'authentication_failure'
  | 'card_velocity_exceeded';

const FAILURE_MESSAGES: Record<FailureCode, string> = {
  insufficient_funds: 'Your card has insufficient funds. Top up your card or use a different one.',
  generic_decline: 'Your card was declined by your bank. Contact your bank or use a different card.',
  expired_card: 'Your card has expired. Enter a new card to continue.',
  incorrect_cvc: 'The CVV you entered is incorrect. Check your card and try again.',
  card_not_supported: "Your card isn't enabled for online payments. Contact your bank or use a different card.",
  processing_error: 'Something went wrong. Wait a moment and try again.',
  authentication_failure: 'Payment verification failed. Try again or use a different card.',
  card_velocity_exceeded: 'Your card has reached its transaction limit. Use a different card or contact your bank.',
};

// Prototype-only simulator: the card number's last 4 digits pick a deterministic PayMongo failure
// (debit vs. credit isn't distinguished — pending confirmation from the payments team).
const TEST_CARD_FAILURES: Record<string, FailureCode> = {
  '0001': 'insufficient_funds',
  '0002': 'generic_decline',
  '0003': 'expired_card',
  '0004': 'incorrect_cvc',
  '0005': 'card_not_supported',
  '0006': 'processing_error',
  '0007': 'authentication_failure',
  '0008': 'card_velocity_exceeded',
};

export function simulateCharge(cardNumber: string): { ok: true } | { ok: false; message: string } {
  const last4 = cardNumber.replace(/\D/g, '').slice(-4);
  const code = TEST_CARD_FAILURES[last4];
  return code ? { ok: false, message: FAILURE_MESSAGES[code] } : { ok: true };
}

export function peso(amount: number) {
  return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function addCycle(date: Date, cycle: BillingCycle) {
  const next = new Date(date);
  if (cycle === 'monthly') next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const labelCls = 'text-sm font-medium text-slate-700 mb-1.5 block';
export const sectionTitleCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider';
export const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100';
export const inputErrorCls = 'border-red-300 focus:border-red-400 focus:ring-red-100';

export function fieldCls(hasError?: string) {
  return cn(inputCls, hasError && inputErrorCls);
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <WarningCircle size={12} className="shrink-0" />
      {message}
    </p>
  );
}

export function CvvInput({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        inputMode="numeric"
        type={visible ? 'text' : 'password'}
        placeholder="123"
        className={cn(fieldCls(hasError ? 'error' : undefined), 'pr-9')}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {visible ? <EyeSlash size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const RAY_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

export type ResultVariant = 'success' | 'error';

const RESULT_COLORS: Record<ResultVariant, string> = {
  success: '#10b981',
  error: '#ef4444',
};

export function ResultIconBurst({ variant }: { variant: ResultVariant }) {
  const color = RESULT_COLORS[variant];
  return (
    <div className="w-20 h-20">
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
        {RAY_ANGLES.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 60 + Math.cos(rad) * 46;
          const y1 = 60 + Math.sin(rad) * 46;
          const x2 = 60 + Math.cos(rad) * 58;
          const y2 = 60 + Math.sin(rad) * 58;
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              className="animate-success-ray"
              style={{ animationDelay: `${i * 66}ms` }}
            />
          );
        })}
        <circle cx="60" cy="60" r="40" fill={color} className="animate-success-pop" />
        {variant === 'success' ? (
          <path
            d="M40 62 L53 75 L82 44"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            className="animate-success-check"
          />
        ) : (
          <path
            d="M45 45 L75 75 M75 45 L45 75"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            className="animate-success-check"
          />
        )}
      </svg>
    </div>
  );
}

export interface ResultDetail {
  label: string;
  value: string;
  emphasize?: boolean;
}

export type ResultScreenProps =
  | {
      variant: 'success';
      title: string;
      subtitle?: string;
      details?: ResultDetail[];
      footerNote?: React.ReactNode;
      primaryLabel: string;
      onPrimaryAction: () => void;
    }
  | { variant: 'error'; onPrimaryAction: () => void };

export function ResultScreen(props: ResultScreenProps) {
  return (
    <div className="px-6 py-10 flex flex-col items-center text-center gap-5 overflow-y-auto">
      <ResultIconBurst variant={props.variant} />
      {props.variant === 'success' ? (
        <>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{props.title}</h2>
            {props.subtitle && <p className="text-sm text-slate-500 mt-1.5">{props.subtitle}</p>}
          </div>
          {props.details && props.details.length > 0 && (
            <div className="w-full border border-slate-200 rounded-xl p-5 flex flex-col gap-3 text-left">
              {props.details.map(detail => (
                <div key={detail.label} className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-500">{detail.label}</span>
                  <span className={detail.emphasize ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {props.footerNote && <p className="text-sm text-slate-500">{props.footerNote}</p>}
          <Button colorScheme="primary" size="lg" className="w-full" onClick={props.onPrimaryAction}>
            {props.primaryLabel}
          </Button>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment failed</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              We couldn't process your payment. Please check your card details and try again.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Still having trouble? Email{' '}
            <a
              href="mailto:support@mochi.ph"
              className="text-violet-600 hover:text-violet-700 underline underline-offset-2"
            >
              support@mochi.ph
            </a>{' '}
            and we'll help you sort it out.
          </p>
          <Button colorScheme="primary" size="lg" className="w-full" onClick={props.onPrimaryAction}>
            Try Again
          </Button>
        </>
      )}
    </div>
  );
}
