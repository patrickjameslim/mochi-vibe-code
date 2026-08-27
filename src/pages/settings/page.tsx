import React, { useEffect, useRef, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCustomFields } from '#/context/CustomFieldsContext';
import {
  BellSimple,
  CaretRight,
  CaretDown,
  Check,
  CheckCircle,
  Circle,
  CreditCard,
  DotsSixVertical,
  DotsThreeVertical,
  DownloadSimple,
  FilePdf,
  MagnifyingGlass,
  Minus,
  Percent,
  Plus,
  Receipt,
  Square,
  Trash,
  UploadSimple,
  User,
  Buildings,
  Info,
  Image as ImageIcon,
  WarningCircle,
  X,
  CurrencyDollar,
} from '@phosphor-icons/react';
import { AppSidebar } from '#/pages/shared/AppSidebar';
import { UpgradeModal } from '#/components/organisms/UpgradeModal';
import { UpdateCardModal } from '#/components/organisms/UpdateCardModal';
import type { BillingAddress } from '#/components/organisms/UpgradeModal/shared';
import { Switch } from '#/components/atoms/Switch';
import { Checkbox } from '#/components/atoms/Checkbox';
import { Button } from '#/components/atoms/Button';
import { Input } from '#/components/atoms/Input';
import { TextareaInput as Textarea } from '#/components/atoms/TextareaInput';
import { Label } from '#/components/atoms/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/atoms/Card';
import { Badge } from '#/components/atoms/Badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '#/components/atoms/Tooltip';
import { Progress } from '#/components/atoms/Progress';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#/components/atoms/DropdownMenu';
import { Paginate, usePaginate, usePaginateStateLocal } from '#/components/molecules/Paginate';
import { SuccessBanner } from '#/components/molecules/SuccessBanner';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#/components/atoms/Select';
import { BILLS } from '#/data/bills';
import { cn } from '#/components/utils';
import { getPenaltySettings, setPenaltySettings, type PenaltyCalcType, type RepeatUnit } from '#/data/penaltySettings';
import { formatPeso } from '#/data/bills';

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES = [
  'Text', 'Email', 'Number', 'Select',
  'Multi-select', 'Textarea', 'Toggle', 'Radio', 'File', 'Date',
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsSection =
  | 'business-info'
  | 'subscription'
  | 'receiving-accounts'
  | 'bir-invoicing'
  | 'template-library'
  | 'custom-fields-form'
  | 'custom-fields-bills'
  | 'customer-payment-portal'
  | 'late-payment-penalties'
  | 'disbursements'
  | 'users'
  | 'developer-settings';

interface FieldRow {
  id: string;
  label: string;
  helperText?: string;
  type: string;
  options?: string[];
  required: boolean;
  visible: boolean;
  isSystem: boolean;
}

interface FieldSection {
  id: string;
  title: string;
  fields: FieldRow[];
}

// ─── System field definitions ─────────────────────────────────────────────────

const SYSTEM_SECTIONS: FieldSection[] = [
  {
    id: 'customer-info',
    title: 'Customer Information',
    fields: [
      { id: 'customerType',  label: 'Customer Type',          type: 'Toggle',       required: false, visible: true, isSystem: true },
      { id: 'uploadedImage', label: 'Customer Image',          type: 'File',         required: false, visible: true, isSystem: true },
      { id: 'customerId',    label: 'Customer ID',             type: 'Text',         required: false, visible: true, isSystem: true },
      { id: 'name',          label: 'Customer Name',           type: 'Text',         required: true,  visible: true, isSystem: true },
      { id: 'email',         label: 'Customer Email',          type: 'Email',        required: true,  visible: true, isSystem: true },
      { id: 'phone',         label: 'Customer Phone Number',   type: 'Tel',          required: false, visible: true, isSystem: true },

    ],
  },
  {
    id: 'address',
    title: 'Address',
    fields: [
      { id: 'addrLine1', label: 'Address Line 1', type: 'Text',   required: true,  visible: true, isSystem: true },
      { id: 'addrLine2', label: 'Address Line 2', type: 'Text',   required: false, visible: true, isSystem: true },
      { id: 'city',      label: 'City',           type: 'Text',   required: false, visible: true, isSystem: true },
      { id: 'province',  label: 'Province',       type: 'Text',   required: false, visible: true, isSystem: true },
      { id: 'country',   label: 'Country',        type: 'Select', required: false, visible: true, isSystem: true },
      { id: 'zip',       label: 'Zip Code',       type: 'Text',   required: false, visible: true, isSystem: true },
    ],
  },
  {
    id: 'tax',
    title: 'Tax & Compliance',
    fields: [
      { id: 'vatStatus',   label: 'VAT Status',        type: 'Radio',  required: false, visible: true, isSystem: true },
      { id: 'withholding', label: 'Withholding Tax %', type: 'Number', required: false, visible: true, isSystem: true },
      { id: 'tin',         label: 'Customer TIN',      type: 'Text',   required: false, visible: true, isSystem: true },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    fields: [
      { id: 'paymentTerms',  label: 'Default Payment Terms', type: 'Text',   required: false, visible: true, isSystem: true },
      { id: 'paymentMethod', label: 'Payment Method',        type: 'Select', required: false, visible: true, isSystem: true },
    ],
  },
  {
    id: 'groups',
    title: 'Groups',
    fields: [
      { id: 'selectedGroups', label: 'Customer Group', type: 'Multi-select', required: false, visible: true, isSystem: true },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    fields: [
      { id: 'docs', label: 'Supporting Documents', type: 'File', required: false, visible: true, isSystem: true },
    ],
  },
];

// ─── Secondary nav components ─────────────────────────────────────────────────

function SecNavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-2 text-sm border-l-[3px] transition-colors',
        active
          ? 'border-violet-600 bg-violet-50 text-violet-700 font-medium'
          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      )}
    >
      {label}
    </button>
  );
}

function SecSubNavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left pl-8 pr-4 py-1.5 text-sm border-l-[3px] transition-colors',
        active
          ? 'border-violet-600 bg-violet-50 text-violet-700 font-medium'
          : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      )}
    >
      {label}
    </button>
  );
}

// ─── Column header ────────────────────────────────────────────────────────────

function ColumnHeader() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
      <div className="w-4 shrink-0" />
      <div className="flex-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Field Name</div>
      <div className="w-32 shrink-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type</div>
      <div className="w-[52px] shrink-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Required</div>
      <div className="w-[44px] shrink-0 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Shown</div>
      <div className="w-7 shrink-0" />
    </div>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRowItem({
  field,
  onUpdate,
  onDelete,
  isDirty = false,
  isNew = false,
  dragHandleListeners,
  dragHandleAttributes,
}: {
  field: FieldRow;
  onUpdate: (id: string, key: keyof FieldRow, value: unknown) => void;
  onDelete: (id: string) => void;
  isDirty?: boolean;
  isNew?: boolean;
  dragHandleListeners?: Record<string, unknown>;
  dragHandleAttributes?: Record<string, unknown>;
}) {
  const isSelectType = field.type === 'Select' || field.type === 'Multi-select';
  const showOptionsEditor = isSelectType && !field.isSystem;
  const options = field.options ?? [];

  function updateOption(i: number, val: string) {
    const next = [...options];
    next[i] = val;
    onUpdate(field.id, 'options', next);
  }

  function removeOption(i: number) {
    onUpdate(field.id, 'options', options.filter((_, idx) => idx !== i));
  }

  function addOption() {
    onUpdate(field.id, 'options', [...options, `Option ${options.length + 1}`]);
  }

  return (
    <div className={cn(
      'border-b border-slate-100 last:border-0 border-l-[3px] transition-colors',
      isDirty && 'bg-amber-50 border-l-amber-400',
      isNew  && 'bg-violet-50/60 border-l-violet-400',
      !isDirty && !isNew && 'border-l-transparent',
    )}>
      {/* Main row */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-2.5 group',
        isDirty && 'hover:bg-amber-50',
        isNew && 'hover:bg-violet-50/70',
        !isDirty && !isNew && 'hover:bg-slate-50/50',
      )}>
        <span
          {...dragHandleListeners}
          {...dragHandleAttributes}
          className={cn(
            'w-4 shrink-0 flex items-center text-slate-300 transition-colors group-hover:text-slate-400',
            dragHandleListeners ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
          )}
        >
          <DotsSixVertical size={15} />
        </span>

        {/* Field name + helper text */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <input
            type="text"
            value={field.label}
            onChange={e => onUpdate(field.id, 'label', e.target.value)}
            placeholder="Column name"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-shadow"
          />
          {!field.isSystem && (
            <input
              type="text"
              value={field.helperText ?? ''}
              onChange={e => onUpdate(field.id, 'helperText', e.target.value)}
              placeholder="Helper text (optional)"
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-shadow"
            />
          )}
        </div>

        {/* Field type — disabled for system fields */}
        <div className="w-32 shrink-0">
          <Select
            value={field.type}
            onValueChange={v => onUpdate(field.id, 'type', v)}
            disabled={field.isSystem}
          >
            <SelectTrigger className={cn(
              'w-full text-xs py-1.5 h-auto',
              field.isSystem && 'bg-slate-50 text-slate-400',
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Required toggle */}
        <div className="w-[52px] shrink-0 flex justify-center">
          <Switch
            checked={field.required}
            onChange={v => onUpdate(field.id, 'required', v)}
          />
        </div>

        {/* Visible toggle */}
        <div className="w-[44px] shrink-0 flex justify-center">
          <Switch
            checked={field.visible}
            onChange={v => onUpdate(field.id, 'visible', v)}
          />
        </div>

        {/* Delete — disabled for system fields */}
        <button
          disabled={field.isSystem}
          onClick={() => onDelete(field.id)}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-md transition-colors shrink-0',
            field.isSystem
              ? 'text-slate-200 cursor-not-allowed'
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50',
          )}
        >
          <Trash size={13} />
        </button>
      </div>

      {/* Options editor — Select / Multi-select only */}
      {showOptionsEditor && (
        <div className="pl-11 pr-4 pb-3 space-y-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              {field.type === 'Select'
                ? <Circle size={13} className="text-slate-300 shrink-0" />
                : <Square size={13} className="text-slate-300 shrink-0" />}
              <input
                type="text"
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 text-sm border-b border-slate-200 bg-transparent py-0.5 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-violet-400 transition-colors"
              />
              <button
                onClick={() => removeOption(i)}
                disabled={options.length <= 1}
                className={cn(
                  'shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors',
                  options.length <= 1
                    ? 'text-slate-200 cursor-not-allowed'
                    : 'text-slate-300 hover:text-red-400',
                )}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={addOption}
            className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 mt-1 transition-colors"
          >
            <Plus size={13} weight="bold" />
            Add option
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sortable wrapper for custom field rows ───────────────────────────────────

function SortableFieldRow(props: Omit<React.ComponentProps<typeof FieldRowItem>, 'dragHandleListeners' | 'dragHandleAttributes'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.field.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <FieldRowItem {...props} dragHandleListeners={listeners as Record<string, unknown>} dragHandleAttributes={attributes as unknown as Record<string, unknown>} />
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  onUpdate,
  onDelete,
  dirtyFieldIds,
}: {
  section: FieldSection;
  onUpdate: (id: string, key: keyof FieldRow, value: unknown) => void;
  onDelete: (id: string) => void;
  dirtyFieldIds: Set<string>;
}) {
  const changedCount = section.fields.filter(f => dirtyFieldIds.has(f.id)).length;

  return (
    <div className={cn(
      'bg-white rounded-xl overflow-hidden border',
      changedCount > 0 ? 'border-amber-200' : 'border-slate-200',
    )}>
      <div className={cn(
        'px-4 py-3 flex items-center justify-between border-b',
        changedCount > 0 ? 'border-amber-100 bg-amber-50/40' : 'border-slate-200',
      )}>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800">{section.title}</h2>
          {changedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              {changedCount} unsaved
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
        </span>
      </div>
      <ColumnHeader />
      {section.fields.map(field => (
        <FieldRowItem
          key={field.id}
          field={field}
          onUpdate={onUpdate}
          onDelete={onDelete}
          isDirty={dirtyFieldIds.has(field.id)}
        />
      ))}
    </div>
  );
}

// ─── Form preview ─────────────────────────────────────────────────────────────

function EmailPreview({ field }: { field: FieldRow }) {
  const [val, setVal] = useState('');
  const [touched, setTouched] = useState(false);
  const isInvalid = touched && val.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  return (
    <div>
      <Input
        type="email"
        value={val}
        onChange={e => { setVal(e.target.value); if (isInvalid) setTouched(false); }}
        onBlur={() => setTouched(true)}
        placeholder={field.helperText || 'Enter email address'}
        error={isInvalid}
      />
      {isInvalid && (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
          <WarningCircle size={14} className="shrink-0" />
          Please enter a valid email address.
        </p>
      )}
    </div>
  );
}

function NumberPreview({ field }: { field: FieldRow }) {
  const [val, setVal] = useState(0);
  return (
    <div className="flex items-center w-fit rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setVal(v => v - 1)}
        className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-r border-slate-200"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={val}
        onChange={e => setVal(Number(e.target.value))}
        placeholder={field.helperText || '0'}
        className="w-20 text-center text-sm text-slate-800 bg-white py-2 focus:outline-none focus:ring-2 focus:ring-violet-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        onClick={() => setVal(v => v + 1)}
        className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-l border-slate-200"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function SelectPreview({ field }: { field: FieldRow }) {
  const [val, setVal] = useState('');
  const options = field.options ?? [];
  return (
    <Select value={val} onValueChange={setVal}>
      <SelectTrigger>
        <SelectValue placeholder={field.helperText || 'Select an option'} />
      </SelectTrigger>
      <SelectContent>
        {options.length > 0
          ? options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)
          : <SelectItem value="__empty__" disabled>No options defined</SelectItem>}
      </SelectContent>
    </Select>
  );
}

function MultiSelectPreview({ field }: { field: FieldRow }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const options = field.options ?? [];

  function toggle(opt: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(opt) ? next.delete(opt) : next.add(opt);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {options.length === 0
        ? <p className="text-sm text-slate-400 italic">No options defined</p>
        : options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className="flex items-center gap-2.5 w-full text-left group"
          >
            <div className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
              selected.has(opt)
                ? 'border-violet-500 bg-violet-500'
                : 'border-slate-300 group-hover:border-slate-400',
            )}>
              {selected.has(opt) && <Check size={10} weight="bold" className="text-white" />}
            </div>
            <span className="text-sm text-slate-700">{opt}</span>
          </button>
        ))}
    </div>
  );
}

function PreviewFieldInput({ field }: { field: FieldRow }) {
  const base =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white ' +
    'text-slate-800 placeholder:text-slate-400 cursor-default focus:outline-none';

  const ph = (fallback: string) => field.helperText || fallback;

  switch (field.type) {
    case 'Email':
      return <EmailPreview field={field} />;
    case 'Number':
      return <NumberPreview field={field} />;
    case 'Select':
      return <SelectPreview field={field} />;
    case 'Multi-select':
      return <MultiSelectPreview field={field} />;
    case 'Text':
      return (
        <input
          readOnly
          type="text"
          placeholder={ph(`Enter ${field.label.toLowerCase()}`)}
          className={base}
        />
      );
    case 'Date':
      return <input readOnly type="date" className={cn(base, 'text-slate-400')} />;
    case 'Textarea':
      return (
        <textarea
          readOnly
          rows={3}
          placeholder={ph(`Enter ${field.label.toLowerCase()}`)}
          className={cn(base, 'resize-none')}
        />
      );
    case 'Toggle':
      return <Switch checked={false} onChange={() => {}} />;
    case 'Radio':
      return (
        <div className="flex gap-5 mt-1">
          {['Option A', 'Option B', 'Option C'].map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-600 cursor-default select-none">
              <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 flex items-center justify-center">
                {opt === 'Option A' && <span className="w-2 h-2 rounded-full bg-violet-600" />}
              </span>
              {opt}
            </label>
          ))}
        </div>
      );
    case 'File':
      return (
        <div className="w-full border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center gap-2 bg-slate-50/70 text-slate-400">
          <UploadSimple size={22} className="text-slate-300" />
          <span className="text-xs text-center">Click to upload or drag and drop</span>
        </div>
      );
    default:
      return <input readOnly placeholder={ph(`Enter ${field.label.toLowerCase()}`)} className={base} />;
  }
}

function FormPreview({ sections, customFields }: { sections: FieldSection[]; customFields: FieldRow[] }) {
  const allFields = [...sections.flatMap(s => s.fields), ...customFields];
  const f    = (id: string) => allFields.find(x => x.id === id);
  const vis  = (id: string) => f(id)?.visible !== false;
  const req  = (id: string) => f(id)?.required === true;
  const lbl  = (id: string, fallback: string) => f(id)?.label ?? fallback;

  const addressVisible = ['addrLine1','addrLine2','city','province','country','zip'].some(id => vis(id));
  const readOnly = { readOnly: true, className: 'cursor-default focus:ring-0 focus:border-slate-200 focus:shadow-none' };

  function PreviewLabel({ children, required: r }: { children: React.ReactNode; required?: boolean }) {
    return (
      <Label className="block text-sm font-medium text-slate-700 mb-1">
        {children}{r && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

      {/* ── Customer information ── */}
      <Card>
        <CardHeader>
          <CardTitle>Customer information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Customer type toggle */}
          {vis('customerType') && (
            <div className="grid grid-cols-2 gap-3">
              {(['Individual', 'Organization'] as const).map((t, i) => (
                <div key={t} className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium',
                  i === 0 ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600',
                )}>
                  {i === 0
                    ? <User size={16} className="text-violet-500 shrink-0" />
                    : <Buildings size={16} className="text-slate-400 shrink-0" />}
                  {t}
                </div>
              ))}
            </div>
          )}

          {/* Customer image */}
          {vis('uploadedImage') && (
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-1">{lbl('uploadedImage', 'Customer image')}</Label>
              <p className="text-xs text-slate-400 mb-2">Accepted formats: .jpg, .png, .gif (max 20MB)</p>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 text-slate-300">
                <ImageIcon size={20} />
              </div>
            </div>
          )}

          {/* Customer ID */}
          {vis('customerId') && (
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-1">{lbl('customerId', 'Customer ID')}</Label>
              <div className="flex items-stretch rounded-lg border border-slate-200 overflow-hidden w-fit">
                <span className="inline-flex items-center px-3 bg-slate-50 border-r border-slate-200 text-sm text-slate-500 font-medium select-none">CST-</span>
                <input readOnly value="2025-0001" className="px-3 py-2 text-sm outline-none bg-white w-32 cursor-default" />
              </div>
            </div>
          )}

          {/* Name */}
          {vis('name') && (
            <div>
              <PreviewLabel required={req('name')}>{lbl('name', 'Customer name')}</PreviewLabel>
              <Input {...readOnly} placeholder="Enter customer name" />
            </div>
          )}

          {/* Email */}
          {vis('email') && (
            <div>
              <PreviewLabel required={req('email')}>{lbl('email', 'Customer email')}</PreviewLabel>
              <Input {...readOnly} placeholder="Enter customer email" />
            </div>
          )}

          {/* Phone */}
          {vis('phone') && (
            <div>
              <PreviewLabel required={req('phone')}>{lbl('phone', 'Customer phone number')}</PreviewLabel>
              <Input {...readOnly} placeholder="+63 9XX XXX XXXX" />
            </div>
          )}

          {/* Address block */}
          {addressVisible && (
            <div>
              <PreviewLabel required={req('addrLine1')}>Customer address</PreviewLabel>
              <div className="space-y-2">
                {vis('addrLine1') && <Input {...readOnly} placeholder={lbl('addrLine1', 'Address line 1')} />}
                {vis('addrLine2') && <Input {...readOnly} placeholder={lbl('addrLine2', 'Address line 2')} />}
                {(vis('city') || vis('province')) && (
                  <div className="grid grid-cols-2 gap-2">
                    {vis('city')     && <Input {...readOnly} placeholder={lbl('city', 'City')} />}
                    {vis('province') && <Input {...readOnly} placeholder={lbl('province', 'Province')} />}
                  </div>
                )}
                {(vis('country') || vis('zip')) && (
                  <div className="grid grid-cols-2 gap-2">
                    {vis('country') && (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                        <span>Philippines</span>
                        <CaretDown size={13} className="text-slate-400 shrink-0" />
                      </div>
                    )}
                    {vis('zip') && <Input {...readOnly} placeholder={lbl('zip', 'Zip code')} />}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VAT status */}
          {vis('vatStatus') && (
            <div>
              <PreviewLabel>{lbl('vatStatus', 'VAT status')}</PreviewLabel>
              <div className="flex items-center gap-5 mt-1">
                {[
                  { value: 'vatable', label: 'VAT-able' },
                  { value: 'zero',    label: 'VAT Zero Rated' },
                  { value: 'exempt',  label: 'VAT Exempt' },
                ].map(({ value, label: optLabel }, i) => (
                  <span key={value} className="flex items-center gap-1.5 select-none">
                    <span className={cn('w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center',
                      i === 0 ? 'border-violet-600' : 'border-slate-300')}>
                      {i === 0 && <span className="w-2 h-2 rounded-full bg-violet-600" />}
                    </span>
                    <span className="text-sm text-slate-700">{optLabel}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Withholding tax */}
          {vis('withholding') && (
            <div>
              <PreviewLabel>{lbl('withholding', 'Withholding tax %')}</PreviewLabel>
              <div className="flex items-center gap-2 max-w-[120px]">
                <Input {...readOnly} value="0" className={cn(readOnly.className, 'text-right')} />
                <span className="text-sm text-slate-500 shrink-0">%</span>
              </div>
            </div>
          )}

          {/* TIN */}
          {vis('tin') && (
            <div>
              <PreviewLabel>{lbl('tin', 'Customer TIN')}</PreviewLabel>
              <Input {...readOnly} placeholder="###-###-###" className={cn(readOnly.className, 'max-w-[200px]')} />
            </div>
          )}

          {/* Default payment terms */}
          {vis('paymentTerms') && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label className="text-[13px] font-medium text-slate-700">{lbl('paymentTerms', 'Default payment terms')}</Label>
                <Info size={13} className="text-slate-400" />
              </div>
              <Input {...readOnly} placeholder="e.g. Net 30" />
            </div>
          )}

          {/* Payment method */}
          {vis('paymentMethod') && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label className="text-[13px] font-medium text-slate-700">{lbl('paymentMethod', 'Payment method')}</Label>
                <Info size={13} className="text-slate-400" />
              </div>
              <div className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
                <span>Select payment method</span>
                <CaretDown size={13} className="text-slate-400 shrink-0" />
              </div>
            </div>
          )}

          {/* Customer group */}
          {vis('selectedGroups') && (
            <div>
              <PreviewLabel>{lbl('selectedGroups', 'Customer group')}</PreviewLabel>
              <div className="flex items-center justify-between w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
                <span>Select groups…</span>
                <CaretDown size={13} className="text-slate-400 shrink-0" />
              </div>
            </div>
          )}


        </CardContent>
      </Card>

      {/* ── Supporting documents ── */}
      {vis('docs') && (
        <Card>
          <CardHeader>
            <CardTitle>Supporting documents</CardTitle>
            <CardDescription>Maximum file size: 25MB</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 cursor-default">
              <UploadSimple size={24} className="text-slate-300 mb-1" />
              <p className="text-sm text-slate-500">Drop files here</p>
              <p className="text-xs text-slate-400">or</p>
              <span className="text-sm text-violet-600 font-medium">Browse files</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Custom fields ── */}
      {customFields.filter(f => f.visible).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {customFields.filter(f => f.visible).map(field => (
              <div key={field.id}>
                <PreviewLabel required={field.required}>{field.label}</PreviewLabel>
                <PreviewFieldInput field={field} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// ─── Customer form content ────────────────────────────────────────────────────

function CustomerFormContent({
  sections,
  customFields,
  onUpdateSystemField,
  onAddCustomField,
  onUpdateCustomField,
  onDeleteCustomField,
  onReorderCustomFields,
  dirtyFieldIds,
  newFieldIds,
}: {
  sections: FieldSection[];
  customFields: FieldRow[];
  onUpdateSystemField: (id: string, key: keyof FieldRow, value: unknown) => void;
  onAddCustomField: () => void;
  onUpdateCustomField: (id: string, key: keyof FieldRow, value: unknown) => void;
  onDeleteCustomField: (id: string) => void;
  onReorderCustomFields: (fields: FieldRow[]) => void;
  dirtyFieldIds: Set<string>;
  newFieldIds: Set<string>;
}) {
  const [viewMode, setViewMode] = useState<'build' | 'preview'>('build');
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(customFields.length);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = customFields.findIndex(f => f.id === active.id);
      const newIndex = customFields.findIndex(f => f.id === over.id);
      onReorderCustomFields(arrayMove(customFields, oldIndex, newIndex));
    }
  }

  useEffect(() => {
    if (customFields.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevLengthRef.current = customFields.length;
  }, [customFields.length]);

  const customDirtyCount = customFields.filter(f => dirtyFieldIds.has(f.id)).length;
  const customNewCount = customFields.filter(f => newFieldIds.has(f.id)).length;
  const customHasChanges = customDirtyCount > 0 || customNewCount > 0;

  return (
    <>
      {/* Sticky sub-header — always visible regardless of mode */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-2.5 shrink-0 grid grid-cols-3 items-center gap-4">
        {/* Left — reserved for balance */}
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-900">Customer</h1>
          <p className="text-sm text-slate-500">Configure the fields shown in the customer creation form.</p>
        </div>

        {/* Center — Build / Preview toggle */}
        <div className="flex justify-center">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            {(['build', 'preview'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={[
                  'px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                  viewMode === v
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50',
                ].join(' ')}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Right — Add custom field */}
        <div className="flex items-center justify-end">
          <Button
            colorScheme="primary"
            size="md"
            onClick={() => {
              if (viewMode === 'preview') setViewMode('build');
              onAddCustomField();
            }}
          >
            <Plus size={14} weight="bold" />
            Add custom field
          </Button>
        </div>
      </div>

      {/* Content area */}
      {viewMode === 'preview' ? (
        <FormPreview sections={sections} customFields={customFields} />
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

          {/* System field sections */}
          {sections.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              onUpdate={onUpdateSystemField}
              onDelete={() => {}}
              dirtyFieldIds={dirtyFieldIds}
            />
          ))}

          {/* Custom fields section */}
          {customFields.length > 0 && (
            <div className={cn(
              'bg-white rounded-xl overflow-hidden border',
              customHasChanges ? 'border-violet-300' : 'border-slate-200',
            )}>
              <div className={cn(
                'px-4 py-3 flex items-center gap-2 border-b',
                customHasChanges ? 'border-violet-100 bg-violet-50/50' : 'border-slate-200',
              )}>
                <h2 className="text-sm font-semibold text-slate-800">Custom Fields</h2>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700">
                  {customFields.length}
                </span>
                {customNewCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    {customNewCount} new
                  </span>
                )}
                {customDirtyCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {customDirtyCount} unsaved
                  </span>
                )}
              </div>
              <ColumnHeader />
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={customFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {customFields.map(field => (
                    <SortableFieldRow
                      key={field.id}
                      field={field}
                      onUpdate={onUpdateCustomField}
                      onDelete={onDeleteCustomField}
                      isDirty={dirtyFieldIds.has(field.id)}
                      isNew={newFieldIds.has(field.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────

// ─── Settings Portal Preview ────────────────────────────────────────────────────

const PREVIEW_W = 1440;
const PREVIEW_H = 860;

function SettingsPortalPreview({ pinEnabled, showSummary, showCustomerInfo, orgFields, indFields, customerInfoTab, manualUpload, onBack }: {
  pinEnabled: boolean;
  showSummary: boolean;
  showCustomerInfo: boolean;
  orgFields: Record<string, boolean>;
  indFields: Record<string, boolean>;
  customerInfoTab: 'organization' | 'individual';
  manualUpload: boolean;
  onBack: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  useEffect(() => {
    function measure() {
      if (containerRef.current) setScale(containerRef.current.offsetWidth / PREVIEW_W);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scaledH = Math.round(PREVIEW_H * scale);
  const mode = pinEnabled ? 'login' : 'portal';
  // Build visible fields param from the active customer info tab's checkboxes
  const activeFields = customerInfoTab === 'organization' ? orgFields : indFields;
  const visibleFieldKeys = Object.entries(activeFields).filter(([, v]) => v).map(([k]) => k).join(',');
  const src = '/payment-portal?mode=' + mode
    + '&summary=' + (showSummary ? '1' : '0')
    + '&info=' + (showCustomerInfo ? '1' : '0')
    + '&fields=' + encodeURIComponent(visibleFieldKeys)
    + '&upload=' + (manualUpload ? '1' : '0');
  // key changes whenever any setting changes → iframe reloads with new params
  const iframeKey = [mode, showSummary, showCustomerInfo, visibleFieldKeys, manualUpload].join('-');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {pinEnabled ? 'PIN sign-in — enter any 4 digits to explore the portal.' : 'Direct portal access — select bills and navigate through all steps.'}
        </p>
        <button onClick={onBack} className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors shrink-0">← Back to Build</button>
      </div>
      <div ref={containerRef} className="w-full rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white" style={{ height: scaledH }}>
        <div style={{ width: PREVIEW_W, height: PREVIEW_H, transform: 'scale(' + scale + ')', transformOrigin: 'top left' }}>
          <iframe key={iframeKey} src={src} style={{ width: PREVIEW_W, height: PREVIEW_H, border: 'none', display: 'block' }} title="Customer Payment Portal Preview" />
        </div>
      </div>
    </div>
  );
}

// ─── Customer Payment Portal Settings ────────────────────────────────────────

function CustomerPaymentPortalSettings() {
  const [saved, setSaved] = useState(false);
  // Payment Methods state
  const [manualUpload, setManualUpload] = useState(true);
  const [paymongoStatus, setPaymongoStatus] = useState<'not_connected' | 'pending' | 'connected'>('not_connected');
  const [paymongoEnabled, setPaymongoEnabled] = useState(false);
  const [xenditStatus, setXenditStatus] = useState<'not_connected' | 'pending' | 'connected'>('not_connected');
  const [xenditEnabled, setXenditEnabled] = useState(false);
  const [switchGatewayTarget, setSwitchGatewayTarget] = useState<'paymongo' | 'xendit' | null>(null);

  function handlePaymongoToggle(next: boolean) {
    if (next && xenditEnabled) { setSwitchGatewayTarget('paymongo'); return; }
    setPaymongoEnabled(next);
  }
  function handleXenditToggle(next: boolean) {
    if (next && paymongoEnabled) { setSwitchGatewayTarget('xendit'); return; }
    setXenditEnabled(next);
  }
  function confirmSwitchGateway() {
    if (switchGatewayTarget === 'paymongo') { setXenditEnabled(false); setPaymongoEnabled(true); }
    else if (switchGatewayTarget === 'xendit') { setPaymongoEnabled(false); setXenditEnabled(true); }
    setSwitchGatewayTarget(null);
  }

  type CustomMethod = { id: string; name: string; desc: string; requiresRemarks: boolean; requiresProof: boolean; internalOnly: boolean };
  const [customMethods, setCustomMethods] = useState<CustomMethod[]>([]);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({ name: '', desc: '', requiresRemarks: false, requiresProof: true, internalOnly: false });
  const [methodErrors, setMethodErrors] = useState({ name: false, desc: false });

  const [showToast, setShowToast] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-2.5 shrink-0 grid grid-cols-3 items-center gap-4">
        <div />

        <div />

        {/* Right — Discard + Save */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="md" onClick={() => {}} className="text-slate-800">
            Discard changes
          </Button>
          <Button colorScheme="primary" size="md" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">

        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">Customer Payment Portal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your customer payment portal, view how customers sign in, and configure your payment methods.
          </p>
        </div>

        {/* Access & Security */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Access & Security</h2>
            <p className="text-xs text-slate-500 mt-1">How customers securely access their payment portal.</p>
          </div>
          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-sm font-semibold text-slate-800">Email Authentication</p>
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
              <Info size={16} className="text-violet-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <p className="text-sm text-slate-500 leading-relaxed">
                  Customers authenticate using their registered email address. A one-time password (OTP) is sent to their email each time they sign in. The OTP expires after <span className="font-semibold text-slate-700">5 minutes</span> and customers can request a new code if it expires.
                </p>
              </div>
            </div>
          </div>
        </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-6 py-6 flex flex-col gap-6">

          {/* Payment Methods header */}
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Payment Methods</h2>
            <p className="text-xs text-slate-500 mt-1">Choose how your customers can pay invoices through the customer portal.</p>
          </div>

          {/* Manual Payment */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Manual Payment</p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Upload Proof of Payment</p>
                <p className="text-xs text-slate-400 mt-0.5">Customers can upload a receipt and submit payment manually.</p>
              </div>
              <Switch checked={manualUpload} onCheckedChange={setManualUpload} checkedBg="primary" />
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Online Payment Gateways */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Online Payment Gateways</p>
            <div className="flex flex-col gap-3">
              {/* PayMongo */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-extrabold text-violet-700">PM</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">PayMongo</p>
                        <span className={['text-[10px] font-semibold px-2 py-0.5 rounded-full', paymongoStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' : paymongoStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'].join(' ')}>
                          {paymongoStatus === 'connected' ? 'Connected' : paymongoStatus === 'pending' ? 'Pending' : 'Not Connected'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Customers can pay via credit card, debit card, and e-wallets.</p>
                    </div>
                  </div>
                  {/* Toggle always clickable; switching to another active gateway triggers a confirmation modal */}
                  <Switch checked={paymongoEnabled} onCheckedChange={handlePaymongoToggle} checkedBg="primary" />
                </div>
                {/* CTAs only when toggle ON + not yet connected */}
                {paymongoEnabled && paymongoStatus !== 'connected' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPaymongoStatus('pending')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">Request Registration Link</button>
                    <button onClick={() => setPaymongoStatus('connected')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Connect Existing Account</button>
                  </div>
                )}
                {/* Connected + enabled → live indicator */}
                {paymongoEnabled && paymongoStatus === 'connected' && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Live — PayMongo is available to customers in the portal.</p>
                )}
              </div>
              {/* Xendit */}
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-extrabold text-blue-700">XD</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">Xendit</p>
                        <span className={['text-[10px] font-semibold px-2 py-0.5 rounded-full', xenditStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' : xenditStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'].join(' ')}>
                          {xenditStatus === 'connected' ? 'Connected' : xenditStatus === 'pending' ? 'Pending' : 'Not Connected'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Customers can pay via credit card, debit card, and e-wallets.</p>
                    </div>
                  </div>
                  {/* Toggle always clickable; switching to another active gateway triggers a confirmation modal */}
                  <Switch checked={xenditEnabled} onCheckedChange={handleXenditToggle} checkedBg="primary" />
                </div>
                {/* CTAs only when toggle ON + not yet connected */}
                {xenditEnabled && xenditStatus !== 'connected' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setXenditStatus('pending')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">Create Account</button>
                    <button onClick={() => setXenditStatus('connected')} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Connect Existing Account</button>
                  </div>
                )}
                {/* Connected + enabled → live indicator */}
                {xenditEnabled && xenditStatus === 'connected' && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Live — Xendit is available to customers in the portal.</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Custom Payment Methods */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Payment Methods</p>
              <button onClick={() => { setNewMethod({ name: '', desc: '', requiresRemarks: false, requiresProof: true, internalOnly: false }); setMethodErrors({ name: false, desc: false }); setShowAddMethod(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
                <Plus size={12} weight="bold" /> Add Payment Method
              </button>
            </div>
            {customMethods.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-slate-100">No custom payment methods added yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {customMethods.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-3 border border-slate-200 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {m.requiresProof && <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">Requires Proof</span>}
                        {m.requiresRemarks && <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">Requires Remarks</span>}
                        {m.internalOnly && <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Internal Only</span>}
                      </div>
                    </div>
                    <button onClick={() => setCustomMethods((prev) => prev.filter((x) => x.id !== m.id))} className="text-slate-400 hover:text-red-500 transition-colors mt-0.5"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Add Payment Method</h3>
              <button onClick={() => setShowAddMethod(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Name <span className="text-red-400">*</span></label>
                <input value={newMethod.name} onChange={(e) => { setNewMethod((m) => ({ ...m, name: e.target.value })); setMethodErrors((e2) => ({ ...e2, name: false })); }} placeholder="e.g. Bank Transfer, E-wallet, Credit Card" className={['w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-colors', methodErrors.name ? 'border-red-300' : 'border-slate-200 focus:border-violet-400'].join(' ')} />
                {methodErrors.name && <p className="text-xs text-red-500">Name is required.</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Description <span className="text-red-400">*</span></label>
                <textarea value={newMethod.desc} onChange={(e) => { setNewMethod((m) => ({ ...m, desc: e.target.value })); setMethodErrors((e2) => ({ ...e2, desc: false })); }} placeholder="Shown to customers during checkout" rows={2} className={['w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 transition-colors resize-none', methodErrors.desc ? 'border-red-300' : 'border-slate-200 focus:border-violet-400'].join(' ')} />
                {methodErrors.desc && <p className="text-xs text-red-500">Description is required.</p>}
              </div>
              <div className="flex flex-col gap-2">
                {([['requiresRemarks', 'Require customers to add remarks'], ['requiresProof', 'Require proof of payment upload'], ['internalOnly', 'For internal use only']] as [keyof typeof newMethod, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={newMethod[key] as boolean} onChange={(e) => setNewMethod((m) => ({ ...m, [key]: e.target.checked }))} className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 accent-violet-600" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button onClick={() => setShowAddMethod(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => { const nameErr = !newMethod.name.trim(); const descErr = !newMethod.desc.trim(); if (nameErr || descErr) { setMethodErrors({ name: nameErr, desc: descErr }); return; } setCustomMethods((prev) => [...prev, { ...newMethod, id: `cm_${Date.now()}` }]); setShowAddMethod(false); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors">Save Method</button>
            </div>
          </div>
        </div>
      )}

      {switchGatewayTarget && (() => {
        const targetName = switchGatewayTarget === 'paymongo' ? 'PayMongo' : 'Xendit';
        const activeName = switchGatewayTarget === 'paymongo' ? 'Xendit' : 'PayMongo';
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Switch active payment gateway?</h3>
                <button onClick={() => setSwitchGatewayTarget(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
              </div>
              <div className="flex flex-col gap-2 text-sm text-slate-600 leading-relaxed">
                <p>Only one payment gateway can be active at a time.</p>
                <p>To activate <span className="font-semibold text-slate-800">{targetName}</span>, the currently active gateway (<span className="font-semibold text-slate-800">{activeName}</span>) will be automatically disabled.</p>
                <p>Do you want to continue?</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button onClick={() => setSwitchGatewayTarget(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={confirmSwitchGateway} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors">Switch to {targetName}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Save confirmation toast — bottom-left, auto-dismisses */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
          Customer Payment Portal updated successfully
        </div>
      )}
    </div>
    </div>
  );
}

// ─── Shared option metadata (icon/label/desc) for the Calculation Type
// picker — identical choice, reused by both the One-time and Recurring
// rule cards below. ──
const PENALTY_TYPE_OPTIONS: { id: PenaltyCalcType; icon: React.ReactNode; label: string; desc: string }[] = [
  { id: 'percentage', icon: <Percent size={18} />, label: 'Percentage', desc: 'Calculate the penalty as a percentage of the overdue balance.' },
  { id: 'fixed', icon: <CurrencyDollar size={18} />, label: 'Fixed Amount', desc: 'Charge the same penalty amount regardless of the overdue balance.' },
];

// ─── A concrete, minimal example of what compounding actually does — a
// single "before" and "after" step, deliberately generic (not tied to any
// real bill) and only shown when compounding is switched on, so it stays a
// lightweight aid rather than a permanent fixture of the page. Only needs
// Compounding's OWN period (not Repeat Every at all) — compounding is a
// self-contained concept ("the next penalty uses the updated balance"),
// so the example holds regardless of whether the rule it's attached to
// even has a separate repeat schedule (a one-time bill doesn't). ──
function CompoundingExample({
  type,
  value,
  compoundEvery,
  compoundUnit,
}: {
  type: PenaltyCalcType;
  value: number;
  compoundEvery: number;
  compoundUnit: RepeatUnit;
}) {
  const sampleInvoice = 24000;
  const compoundLabel = compoundEvery === 1 ? compoundUnit.replace(/s$/, '').toLowerCase() : compoundUnit.toLowerCase();

  const firstCharge = type === 'percentage' ? sampleInvoice * (value / 100) : value;
  const updatedBalance = sampleInvoice + firstCharge;
  const nextCharge = type === 'percentage' ? updatedBalance * (value / 100) : value;

  return (
    <div className="rounded-lg bg-white border border-violet-100 px-3 py-3 mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Info size={13} className="text-violet-400" />
        <p className="text-xs font-semibold text-slate-700">How compounding works</p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed mb-3">
        {type === 'percentage'
          ? 'When compounding is enabled, each new percentage-based penalty is calculated using the updated balance, including previously added penalties.'
          : 'With a fixed penalty, the same penalty amount is added each time. Compounding does not increase the fixed charge itself.'}
      </p>
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 space-y-2.5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Example</p>
          <div>
            <p className="text-xs text-slate-500">Starting balance</p>
            <p className="text-xs font-mono text-slate-700">{formatPeso(sampleInvoice)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">First penalty — {type === 'percentage' ? `${value}%` : formatPeso(value)}</p>
            <p className="text-xs font-mono text-slate-700">
              {type === 'percentage'
                ? `${formatPeso(sampleInvoice)} × ${value}% = ${formatPeso(firstCharge)} penalty`
                : `${formatPeso(sampleInvoice)} + ${formatPeso(value)} = ${formatPeso(updatedBalance)}`}
            </p>
          </div>
          {type === 'percentage' && (
            <div>
              <p className="text-xs text-slate-500">Updated balance</p>
              <p className="text-xs font-mono text-slate-700">
                {formatPeso(sampleInvoice)} + {formatPeso(firstCharge)} = {formatPeso(updatedBalance)}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-2 pt-1.5 border-t border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            After {compoundEvery} {compoundLabel}
          </p>
          <div>
            <p className="text-xs text-slate-500">Next penalty — {type === 'percentage' ? `${value}%` : formatPeso(value)}</p>
            <p className="text-xs font-mono text-slate-700">
              {type === 'percentage'
                ? `${formatPeso(updatedBalance)} × ${value}% = ${formatPeso(nextCharge)} penalty`
                : `${formatPeso(updatedBalance)} + ${formatPeso(value)} = ${formatPeso(updatedBalance + nextCharge)}`}
            </p>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
        The penalty continues to be applied according to your penalty schedule, while compounding updates the
        balance used for future calculations.
      </p>
    </div>
  );
}

// ─── The single penalty rule card — applies to every bill regardless of
// its own type (one-time or recurring). "Recurring" is never a separate
// penalty configuration here, only a bill category, so there's no
// "Repeat Every" concept anymore: Compounding is the only cadence a rule
// can have. With it off, the charge applies exactly once, when the bill
// becomes overdue; with it on, its own Compound Every period drives
// recalculation for as long as the bill stays unpaid. ──
function PenaltyRuleCard({
  title,
  description,
  enabled,
  onEnabledChange,
  type,
  onTypeChange,
  value,
  onValueChange,
  compounding,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  type: PenaltyCalcType;
  onTypeChange: (v: PenaltyCalcType) => void;
  value: number;
  onValueChange: (v: number) => void;
  compounding: {
    enabled: boolean;
    onEnabledChange: (v: boolean) => void;
    every: number;
    onEveryChange: (v: number) => void;
    unit: RepeatUnit;
    onUnitChange: (v: RepeatUnit) => void;
  };
}) {
  const amountHelper =
    type === 'percentage'
      ? 'The percentage of the overdue balance charged each time this rule applies.'
      : 'The fixed amount charged each time this rule applies.';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-6 py-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{description}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} checkedBg="primary" />
      </div>

      {enabled && (
        <div className="flex flex-col gap-4">
          {/* Calculation Type — the two cards are self-explanatory on
              their own (icon + label + one-line description each), so no
              "Calculation Type" heading sits above them. */}
          <div className="grid grid-cols-2 gap-3">
            {PENALTY_TYPE_OPTIONS.map(({ id, icon, label, desc }) => {
              const selected = type === id;
              return (
                <button
                  key={id}
                  onClick={() => onTypeChange(id)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                    selected
                      ? 'border-violet-300 bg-violet-50/60 ring-1 ring-violet-300'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      selected ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn('text-sm font-semibold', selected ? 'text-violet-700' : 'text-slate-800')}>
                      {label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                  {selected && (
                    <CheckCircle size={16} weight="fill" className="text-violet-500 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Charge — the only decision alongside Penalty Type; there's no
              "Repeat Every" anymore, since Compounding below is the only
              cadence a rule can have. */}
          <div className="flex flex-col gap-2.5 max-w-40">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-900">Charge</label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={13} className="text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>{amountHelper}</TooltipContent>
              </Tooltip>
            </div>
            <div className="relative w-40">
              {type === 'fixed' && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₱</span>
              )}
              <input
                type="number"
                min={0}
                step={type === 'percentage' ? 0.1 : 1}
                value={value}
                onChange={(e) => onValueChange(Math.max(0, Number(e.target.value)))}
                className={cn(
                  'w-full border border-slate-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-colors',
                  type === 'fixed' ? 'pl-7 pr-3' : 'pl-3 pr-7',
                )}
              />
              {type === 'percentage' && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              )}
            </div>
          </div>

          {/* Compounding — the only cadence a rule can have now, applying
              to every bill this rule covers, regardless of that bill's own
              type. The subtext directly explains what happens in each
              state: OFF means the charge only ever applies once; ON means
              its own Compound Every period drives re-application for as
              long as the bill stays unpaid. Everything that appears once
              Compounding is switched on (Compound Every, the worked
              example) is otherwise unchanged. */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="pr-4">
                <p className="text-sm font-semibold text-slate-800">Compounding</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {compounding.enabled
                    ? 'Penalty is applied again at the selected interval while the bill remains unpaid.'
                    : 'Penalty is applied once when the bill becomes overdue.'}
                </p>
              </div>
              <Switch checked={compounding.enabled} onCheckedChange={compounding.onEnabledChange} checkedBg="primary" />
            </div>
            {compounding.enabled && (
              <>
                <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-slate-100">
                  <label className="text-xs font-medium text-slate-900">Compound every</label>
                  <div className="flex items-end gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-600 sr-only">Compound every</label>
                      <input
                        type="number"
                        min={1}
                        value={compounding.every}
                        onChange={(e) => compounding.onEveryChange(Math.max(1, Number(e.target.value)))}
                        className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-600 sr-only">Unit</label>
                      <Select value={compounding.unit} onValueChange={(v) => compounding.onUnitChange(v as RepeatUnit)}>
                        <SelectTrigger size="md" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Days">Days</SelectItem>
                          <SelectItem value="Weeks">Weeks</SelectItem>
                          <SelectItem value="Months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <CompoundingExample type={type} value={value} compoundEvery={compounding.every} compoundUnit={compounding.unit} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LatePaymentPenaltiesSettings() {
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Initial state comes from the last SAVED configuration (getPenaltySettings
  // reads localStorage, falling back to the shared defaults) — this page is
  // the only writer of that shared config, via handleSave below, so every
  // bill-facing surface reading it can never see an in-progress edit, only
  // what was actually saved here.
  const saved0 = getPenaltySettings();

  // A single unified rule applies to every bill, regardless of that bill's
  // own type — "Recurring" is a BILL CATEGORY (matching the Bill data
  // model's own `type` field), never a separate penalty configuration.
  // Compounding is the only cadence this rule can have: off means the
  // charge applies exactly once, on means its own Compound Every period
  // drives recalculation, for as long as the bill stays unpaid.
  const [penaltyEnabled, setPenaltyEnabled] = useState(saved0.penalty.enabled);
  const [penaltyType, setPenaltyType] = useState<PenaltyCalcType>(saved0.penalty.type);
  const [penaltyValue, setPenaltyValue] = useState(saved0.penalty.value);
  const [penaltyCompounding, setPenaltyCompounding] = useState(saved0.penalty.compounding);
  const [penaltyCompoundEvery, setPenaltyCompoundEvery] = useState(saved0.penalty.compoundEvery);
  const [penaltyCompoundUnit, setPenaltyCompoundUnit] = useState<RepeatUnit>(saved0.penalty.compoundUnit);

  function handleSave() {
    setPenaltySettings({
      penalty: {
        enabled: penaltyEnabled,
        type: penaltyType,
        value: penaltyValue,
        compounding: penaltyCompounding,
        compoundEvery: penaltyCompoundEvery,
        compoundUnit: penaltyCompoundUnit,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-2.5 shrink-0 grid grid-cols-3 items-center gap-4">
        <div />
        <div />
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="md" onClick={() => {}} className="text-slate-800">
            Discard changes
          </Button>
          <Button colorScheme="primary" size="md" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-10 flex flex-col gap-8">

          {/* Page header — a short, single-line description that uses the
              full available width instead of being squeezed into a narrow
              column, so it reads as one spacious line rather than wrapping
              across several. */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Overdue Payment Penalties</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Automate penalties for overdue bills across all bill types, including one-time and recurring bills.
              Changes apply to future penalty calculations; existing accrued penalties won’t be affected.
            </p>
          </div>

          <PenaltyRuleCard
            title="Overdue Penalties"
            description="Automatically apply penalties to overdue bills, whether they’re one-time or recurring."
            enabled={penaltyEnabled}
            onEnabledChange={setPenaltyEnabled}
            type={penaltyType}
            onTypeChange={setPenaltyType}
            value={penaltyValue}
            onValueChange={setPenaltyValue}
            compounding={{
              enabled: penaltyCompounding,
              onEnabledChange: setPenaltyCompounding,
              every: penaltyCompoundEvery,
              onEveryChange: setPenaltyCompoundEvery,
              unit: penaltyCompoundUnit,
              onUnitChange: setPenaltyCompoundUnit,
            }}
          />
        </div>
      </div>

      {/* Save confirmation toast — bottom-left, auto-dismisses */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
          Overdue Payment Penalties updated successfully
        </div>
      )}
    </div>
  );
}

function PlaceholderContent({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center py-32">
      <p className="text-base font-medium text-slate-700">{label}</p>
      <p className="text-sm text-slate-400">This section hasn't been configured yet.</p>
    </div>
  );
}

// ─── Save bar ─────────────────────────────────────────────────────────────────

function SaveBar({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  return (
    <div className="shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10">
      <div className="w-full px-6 py-3.5 flex items-center justify-between">
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          You have unsaved changes
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={onDiscard}>
            Discard changes
          </Button>
          <Button colorScheme="primary" size="md" onClick={onSave}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription ─────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual';

const MONTHLY_PRICE = 1899;
const ANNUAL_PRICE = 18990;
const ANNUAL_EFFECTIVE_MONTHLY = ANNUAL_PRICE / 12;

const TRIAL_DAYS = 30;
// Prototype-only: no real trial-start timestamp exists yet, so mock one a few days in the past.
const TRIAL_START_DATE = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);

function daysLeftInTrial(startDate: Date, totalDays: number) {
  const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, totalDays - elapsedDays);
}

function peso(amount: number) {
  return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function addCycle(date: Date, cycle: BillingCycle) {
  const next = new Date(date);
  if (cycle === 'monthly') next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

/** Prototype-only: lets stakeholders flip between the trial and subscribed views without running the full upgrade flow. */
function DemoPlanToggle({ subscribed, onChange }: { subscribed: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur border border-slate-200 rounded-full shadow-md pl-3.5 pr-2.5 py-2 text-xs text-slate-400">
      <span className="font-medium tracking-wide uppercase">Preview</span>
      <span className={cn('font-medium', !subscribed ? 'text-slate-700' : 'text-slate-300')}>Trial</span>
      <Switch checked={subscribed} onCheckedChange={onChange} checkedBg="primary" />
      <span className={cn('font-medium', subscribed ? 'text-slate-700' : 'text-slate-300')}>Standard</span>
    </div>
  );
}

/** Prototype-only: forces the next payment attempt (upgrade or card update) to fail, so the decline experience can be demoed without a specific test card number. */
function DemoPaymentOutcomeToggle({ simulateFailure, onChange }: { simulateFailure: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur border border-slate-200 rounded-full shadow-md pl-3.5 pr-2.5 py-2 text-xs text-slate-400">
      <span className="font-medium tracking-wide uppercase">Payments</span>
      <span className={cn('font-medium', !simulateFailure ? 'text-slate-700' : 'text-slate-300')}>Success</span>
      <Switch
        checked={simulateFailure}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-red-500"
      />
      <span className={cn('font-medium', simulateFailure ? 'text-red-600' : 'text-slate-300')}>Failed</span>
    </div>
  );
}

function BillingCycleToggle({ cycle, onChange }: { cycle: BillingCycle; onChange: (c: BillingCycle) => void }) {
  return (
    <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => onChange('monthly')}
        className={cn(
          'px-4 py-2 text-sm font-medium transition-colors',
          cycle === 'monthly' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50',
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange('annual')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
          cycle === 'annual' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50',
        )}
      >
        Annual
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
              cycle === 'annual' ? 'bg-violet-200' : 'bg-green-100',
            )}>
              <Percent size={11} weight="bold" className={cycle === 'annual' ? 'text-violet-700' : 'text-green-600'} />
            </span>
          </TooltipTrigger>
          <TooltipContent>2 months free with annual billing</TooltipContent>
        </Tooltip>
      </button>
    </div>
  );
}

function PlanCard({
  highlighted,
  badgeLabel,
  stripBadge,
  name,
  price,
  priceSuffix,
  originalPrice,
  billingNote,
  savingsNote,
  savingsTone = 'emerald',
  featuresHeading,
  features,
  ctaLabel,
  ctaHref,
  ctaOnClick,
  ctaDisabled,
  ctaVariant = 'primary',
}: {
  highlighted?: boolean;
  badgeLabel?: string;
  stripBadge?: boolean;
  name: string;
  price: string;
  priceSuffix: string;
  originalPrice?: string;
  billingNote?: string;
  savingsNote?: string;
  savingsTone?: 'emerald' | 'yellow';
  featuresHeading: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  ctaDisabled?: boolean;
  ctaVariant?: 'primary' | 'outline';
}) {
  const ctaClass = cn(
    'w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
    ctaDisabled
      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
      : ctaVariant === 'outline'
        ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        : 'bg-violet-600 text-white hover:bg-violet-700',
  );

  return (
    <div className={cn(
      'flex flex-col rounded-2xl border bg-white overflow-hidden',
      highlighted ? 'border-violet-200' : 'border-slate-200',
    )}>
      {stripBadge && badgeLabel && (
        <div className={cn(
          'px-4 py-2 text-center text-xs font-semibold border-b',
          highlighted ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-slate-100 text-slate-600 border-slate-200',
        )}>
          {badgeLabel}
        </div>
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
        {!stripBadge && badgeLabel && (
          <div className="h-6">
            <span className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600">
              {badgeLabel}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900">{name}</h3>
          {savingsNote && (
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap',
              savingsTone === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700',
            )}>
              {savingsNote}
            </span>
          )}
        </div>

        <div>
          <p className="text-3xl font-extrabold text-slate-900">{price}</p>
          <p className="text-sm mt-0.5 text-slate-500">{priceSuffix}</p>
          {originalPrice && (
            <p className="text-sm text-slate-400 line-through mt-1">{originalPrice}</p>
          )}
          {billingNote && (
            <p className="text-xs mt-1.5 text-slate-500">{billingNote}</p>
          )}
        </div>

        <div className="border-t border-slate-100" />

        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold text-slate-800">{featuresHeading}</p>
          <ul className="flex flex-col gap-2">
            {features.map(item => (
              <li key={item} className="flex items-start gap-2">
                <Check size={14} weight="bold" className="shrink-0 mt-0.5 text-violet-500" />
                <span className="text-sm text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-6 pt-0">
        {ctaHref
          ? <a href={ctaHref} className={ctaClass}>{ctaLabel}</a>
          : <button disabled={ctaDisabled} onClick={ctaOnClick} className={ctaClass}>{ctaLabel}</button>}
      </div>
    </div>
  );
}

// Prototype-only: no team/seats data source exists yet, so usage is mocked against the
// "Up to 5 user accounts" cap already established in the plan feature lists above.
const USER_ACCOUNTS_USED = 3;
const USER_ACCOUNTS_LIMIT = 5;
const INVOICE_LIMIT = 1000;

function MetricCard({
  icon: Icon,
  label,
  used,
  limit,
  unit,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const nearLimit = pct >= 90;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-violet-600" />
        </div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900">{used.toLocaleString('en-PH')}</span>
          <span className="text-sm text-slate-400">/ {limit.toLocaleString('en-PH')} {unit}</span>
        </div>
        <Progress value={pct} color={nearLimit ? 'danger' : 'violet'} className="mt-3" />
        <p className={cn('text-xs mt-1.5', nearLimit ? 'text-red-500 font-medium' : 'text-slate-400')}>
          {limit - used} {unit} left this cycle
        </p>
      </div>
    </div>
  );
}

function CurrentPlanPanel({
  cycle,
  nextBillingDate,
  onCancelClick,
  onUpdateCardClick,
}: {
  cycle: BillingCycle;
  nextBillingDate: Date | null;
  onCancelClick: () => void;
  onUpdateCardClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-slate-900">Standard</h2>
          <Badge colorScheme="violet" className="border-violet-700">Active</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {cycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}
          {nextBillingDate && <> · Next billing date: <span className="font-medium text-slate-700">{formatDate(nextBillingDate)}</span></>}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button colorScheme="primary" size="sm" className="gap-1.5" onClick={onUpdateCardClick}>
          <CreditCard size={14} />
          Update payment information
        </Button>
        <button
          onClick={onCancelClick}
          className="text-sm text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
        >
          Cancel subscription
        </button>
      </div>
    </div>
  );
}

const CANCEL_REASONS = [
  'Too expensive for what I need',
  'Missing features I was looking for',
  'Switching to a different tool',
  'Not using it enough right now',
  'Found it difficult to use',
  'Ran into bugs or technical issues',
  'Just taking a temporary break',
  'Other',
];

function CancelSubscriptionModal({
  open,
  onKeepPlan,
  onConfirmCancel,
}: {
  open: boolean;
  onKeepPlan: () => void;
  onConfirmCancel: () => void;
}) {
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState('');

  function toggleReason(reason: string) {
    setSelectedReasons(prev => {
      const next = new Set(prev);
      if (next.has(reason)) next.delete(reason);
      else next.add(reason);
      return next;
    });
  }

  function reset() {
    setSelectedReasons(new Set());
    setFeedback('');
  }

  function handleKeepPlan() {
    onKeepPlan();
  }

  function handleConfirmCancel() {
    reset();
    onConfirmCancel();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center p-4" onClick={handleKeepPlan}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Cancel your subscription?</h2>
          <button onClick={handleKeepPlan} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto flex flex-col gap-5">
          <p className="text-sm text-slate-500 leading-relaxed">
            By cancelling your subscription, you'll lose access to Standard features, and your invoice and customer limits will revert to the free trial plan.
          </p>

          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Why are you canceling?</p>
            <div className="flex flex-col gap-2">
              {CANCEL_REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <Checkbox checked={selectedReasons.has(reason)} onCheckedChange={() => toggleReason(reason)} />
                  <span className="text-sm text-slate-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Anything else you'd like to share? <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Tell us more about why you're leaving…"
              minRows={3}
              className="text-sm border-slate-200 focus-visible:ring-violet-100 focus-visible:border-violet-300"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2">
          <Button variant="outline" colorScheme="secondary" size="md" onClick={handleKeepPlan}>Keep plan</Button>
          <Button colorScheme="destructive" size="md" onClick={handleConfirmCancel}>Cancel subscription</Button>
        </div>
      </div>
    </div>
  );
}

interface BillingHistoryRow {
  id: string;
  label: string;
  billingDate: Date;
  amount: number;
}

function generateBillingHistory(nextBillingDate: Date, cycle: BillingCycle, count = 12): BillingHistoryRow[] {
  const rows: BillingHistoryRow[] = [];
  const cursor = new Date(nextBillingDate);
  for (let i = 0; i < count; i++) {
    if (cycle === 'monthly') cursor.setMonth(cursor.getMonth() - 1);
    else cursor.setFullYear(cursor.getFullYear() - 1);
    const monthName = cursor.toLocaleDateString('en-PH', { month: 'long' });
    const year = cursor.getFullYear();
    rows.push({
      id: `INV-${year}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      label: `Invoice_${monthName}_${year}`,
      billingDate: new Date(cursor),
      amount: cycle === 'monthly' ? MONTHLY_PRICE : ANNUAL_PRICE,
    });
  }
  return rows;
}

const HISTORY_PAGE_SIZE = 7;

function BillingHistorySection({ cycle, nextBillingDate }: { cycle: BillingCycle; nextBillingDate: Date | null }) {
  const [query, setQuery] = useState('');
  const allRows = nextBillingDate ? generateBillingHistory(nextBillingDate, cycle) : [];
  const filtered = query.trim()
    ? allRows.filter(r => r.label.toLowerCase().includes(query.trim().toLowerCase()))
    : allRows;

  const { currentPage, handlePageChange } = usePaginateStateLocal();
  const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE));
  const paginateProps = usePaginate({ currentPage, onPageChange: handlePageChange, totalPages });
  const pageRows = filtered.slice((currentPage - 1) * HISTORY_PAGE_SIZE, currentPage * HISTORY_PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Billing History</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); handlePageChange(1); }}
              placeholder="Search"
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 w-40"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <DownloadSimple size={14} />
            Download all
          </Button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Invoice</th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Billing date</th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
            <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
            <th className="w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pageRows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                No billing history yet.
              </td>
            </tr>
          )}
          {pageRows.map(row => (
            <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <FilePdf size={18} className="text-slate-300 shrink-0" />
                  <span className="font-medium text-slate-700">{row.label}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-slate-500">{formatDate(row.billingDate)}</td>
              <td className="px-5 py-3 text-slate-500">
                Standard {cycle === 'monthly' ? 'Monthly' : 'Annual'}
              </td>
              <td className="px-5 py-3 text-slate-700 font-medium">{peso(row.amount)}</td>
              <td className="px-2 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:bg-slate-100 transition-colors outline-none">
                    <DotsThreeVertical size={16} weight="bold" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Receipt size={14} className="text-slate-400" />
                      View invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <DownloadSimple size={14} className="text-slate-400" />
                      Download CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FilePdf size={14} className="text-slate-400" />
                      Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400 shrink-0">
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
          </p>
          {totalPages > 1 && (
            <div>
              <Paginate {...paginateProps} currentPage={currentPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubscribedOverview({
  cycle,
  nextBillingDate,
  billingAddress,
  simulatePaymentFailure,
  onCancelSubscription,
  onCardUpdated,
}: {
  cycle: BillingCycle;
  nextBillingDate: Date | null;
  billingAddress: BillingAddress;
  simulatePaymentFailure: boolean;
  onCancelSubscription: () => void;
  onCardUpdated: (billingAddress: BillingAddress) => void;
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUpdateCard, setShowUpdateCard] = useState(false);
  const invoicesUsed = BILLS.length;

  return (
    <>
      <CurrentPlanPanel
        cycle={cycle}
        nextBillingDate={nextBillingDate}
        onCancelClick={() => setShowCancelConfirm(true)}
        onUpdateCardClick={() => setShowUpdateCard(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <MetricCard icon={Receipt} label="Invoices this month" used={invoicesUsed} limit={INVOICE_LIMIT} unit="invoices" />
        <MetricCard icon={User} label="User accounts" used={USER_ACCOUNTS_USED} limit={USER_ACCOUNTS_LIMIT} unit="accounts" />
      </div>

      <BillingHistorySection cycle={cycle} nextBillingDate={nextBillingDate} />

      <CancelSubscriptionModal
        open={showCancelConfirm}
        onKeepPlan={() => setShowCancelConfirm(false)}
        onConfirmCancel={() => { setShowCancelConfirm(false); onCancelSubscription(); }}
      />

      {nextBillingDate && (
        <UpdateCardModal
          open={showUpdateCard}
          cycle={cycle}
          nextBillingDate={nextBillingDate}
          billingAddress={billingAddress}
          simulateFailure={simulatePaymentFailure}
          onClose={() => setShowUpdateCard(false)}
          onUpdated={onCardUpdated}
        />
      )}
    </>
  );
}

const EMPTY_BILLING_ADDRESS: BillingAddress = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  country: 'Philippines',
  zip: '',
};

function SubscriptionSettings() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currentPlan, setCurrentPlan] = useState<'trial' | 'standard'>('trial');
  const [nextBillingDate, setNextBillingDate] = useState<Date | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState<BillingAddress>(EMPTY_BILLING_ADDRESS);
  const [simulatePaymentFailure, setSimulatePaymentFailure] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const trialDaysLeft = daysLeftInTrial(TRIAL_START_DATE, TRIAL_DAYS);

  function handleDemoToggle(subscribed: boolean) {
    if (subscribed) {
      setCurrentPlan('standard');
      setNextBillingDate(addCycle(new Date(), cycle));
    } else {
      setCurrentPlan('trial');
      setNextBillingDate(null);
    }
  }

  function handleCancelSubscription() {
    setCurrentPlan('trial');
    setNextBillingDate(null);
    setBanner('Your subscription has been cancelled successfully.');
  }

  return (
    <div className="flex flex-col h-full">
      {banner && (
        <SuccessBanner message={banner} onDismiss={() => setBanner(null)} />
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6 w-full">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Subscription</h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentPlan === 'standard'
              ? 'Manage your plan, usage, and billing history.'
              : 'Compare plans and choose the billing cycle that works best for you.'}
          </p>
        </div>

        {currentPlan === 'standard' ? (
          <SubscribedOverview
            cycle={cycle}
            nextBillingDate={nextBillingDate}
            billingAddress={billingAddress}
            simulatePaymentFailure={simulatePaymentFailure}
            onCancelSubscription={handleCancelSubscription}
            onCardUpdated={setBillingAddress}
          />
        ) : (
        <>
          <div className="flex items-center justify-center">
            <BillingCycleToggle cycle={cycle} onChange={setCycle} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            <PlanCard
              stripBadge
              badgeLabel="Current Plan"
              name="Trial"
              price="Free"
              priceSuffix={`${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`}
              featuresHeading="Free trial includes:"
              features={[
                'Up to 5 user accounts',
                'Unlimited invoices for 60 days',
                'Payment links',
                'Payment reminders',
                'Customer management',
                'Workflow automations',
                'Billing and Collections report',
              ]}
              ctaLabel="Current Plan"
              ctaDisabled
            />

            <PlanCard
              highlighted
              stripBadge
              badgeLabel="Most Popular"
              name="Standard"
              price={cycle === 'monthly' ? peso(MONTHLY_PRICE) : peso(ANNUAL_EFFECTIVE_MONTHLY)}
              priceSuffix="per month"
              originalPrice={cycle === 'annual' ? `${peso(MONTHLY_PRICE)}/mo` : undefined}
              billingNote={cycle === 'annual' ? `${peso(ANNUAL_PRICE)} billed annually` : undefined}
              savingsNote={cycle === 'annual' ? '2 months free' : undefined}
              featuresHeading="Everything in trial plus:"
              features={['Up to 1,000 invoices and customers per month']}
              ctaLabel="Upgrade to Standard"
              ctaOnClick={() => setUpgradeOpen(true)}
            />

            <PlanCard
              name="Premium"
              price="Contact us"
              priceSuffix="at contactus@mochi.ph"
              featuresHeading="Everything in standard plus:"
              features={[
                'As many user accounts as you want',
                'As many invoices as you need',
                'Integration with own accounting systems',
                'Added security features',
              ]}
              ctaLabel="Contact us"
              ctaHref="mailto:contactus@mochi.ph"
              ctaVariant="outline"
            />
          </div>
        </>
      )}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        cycle={cycle}
        simulateFailure={simulatePaymentFailure}
        onClose={() => setUpgradeOpen(false)}
        onSubscribed={(details) => {
          setCurrentPlan('standard');
          setNextBillingDate(details.nextBillingDate);
          setBillingAddress(details.billingAddress);
        }}
      />

      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
        <DemoPaymentOutcomeToggle simulateFailure={simulatePaymentFailure} onChange={setSimulatePaymentFailure} />
        <DemoPlanToggle subscribed={currentPlan === 'standard'} onChange={handleDemoToggle} />
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

let _customFieldCounter = 0;

export function SettingsPage() {
  const { saveCustomFields } = useCustomFields();
  const search = useSearch({ strict: false }) as { section?: SettingsSection };
  const [activeSection, setActiveSection] = useState<SettingsSection>(search.section ?? 'custom-fields-form');
  const [customFieldsOpen, setCustomFieldsOpen] = useState(true);

  // Deep-link support — other pages (e.g. the Bill Info page's "Manage
  // penalty" action) link here with ?section=late-payment-penalties to
  // land directly on a specific settings section instead of the default.
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) setActiveSection(section as SettingsSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Committed (saved) state
  const [savedSections, setSavedSections] = useState<FieldSection[]>(SYSTEM_SECTIONS);
  const [savedCustomFields, setSavedCustomFields] = useState<FieldRow[]>([]);

  // Draft (in-progress) state — all edits go here
  const [draftSections, setDraftSections] = useState<FieldSection[]>(SYSTEM_SECTIONS);
  const [draftCustomFields, setDraftCustomFields] = useState<FieldRow[]>([]);

  const hasPendingChanges =
    JSON.stringify(draftSections) !== JSON.stringify(savedSections) ||
    JSON.stringify(draftCustomFields) !== JSON.stringify(savedCustomFields);

  // Field-level change tracking
  const dirtyFieldIds = new Set<string>();
  const newFieldIds = new Set<string>();

  for (const draftSection of draftSections) {
    const savedSection = savedSections.find(s => s.id === draftSection.id);
    if (!savedSection) continue;
    for (const df of draftSection.fields) {
      const sf = savedSection.fields.find(f => f.id === df.id);
      if (sf && JSON.stringify(df) !== JSON.stringify(sf)) dirtyFieldIds.add(df.id);
    }
  }

  const savedCustomIds = new Set(savedCustomFields.map(f => f.id));
  for (const df of draftCustomFields) {
    if (!savedCustomIds.has(df.id)) {
      newFieldIds.add(df.id);
    } else {
      const sf = savedCustomFields.find(f => f.id === df.id);
      if (sf && JSON.stringify(df) !== JSON.stringify(sf)) dirtyFieldIds.add(df.id);
    }
  }

  // ── Draft mutations ────────────────────────────────────────────────────────

  function updateSystemField(fieldId: string, key: keyof FieldRow, value: unknown) {
    setDraftSections(prev =>
      prev.map(section => ({
        ...section,
        fields: section.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f),
      }))
    );
  }

  function addCustomField() {
    _customFieldCounter += 1;
    setDraftCustomFields(prev => [
      ...prev,
      {
        id: `custom-${_customFieldCounter}`,
        label: 'New field',
        helperText: '',
        type: 'Text',
        required: false,
        visible: true,
        isSystem: false,
      },
    ]);
  }

  function updateCustomField(fieldId: string, key: keyof FieldRow, value: unknown) {
    setDraftCustomFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;
      const updated = { ...f, [key]: value };
      if (key === 'type' && (value === 'Select' || value === 'Multi-select') && !f.options?.length) {
        updated.options = ['Option 1'];
      }
      return updated;
    }));
  }

  function deleteCustomField(fieldId: string) {
    setDraftCustomFields(prev => prev.filter(f => f.id !== fieldId));
  }

  function reorderCustomFields(fields: FieldRow[]) {
    setDraftCustomFields(fields);
  }

  // ── Commit / discard ───────────────────────────────────────────────────────

  function handleSave() {
    setSavedSections(draftSections);
    setSavedCustomFields(draftCustomFields);
    saveCustomFields(draftCustomFields.map(({ isSystem: _s, ...rest }) => rest));
  }

  function handleDiscard() {
    setDraftSections(savedSections);
    setDraftCustomFields(savedCustomFields);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isCustomFieldsActive =
    activeSection === 'custom-fields-form' || activeSection === 'custom-fields-bills';

  const breadcrumbMap: Record<SettingsSection, string[]> = {
    'business-info':       ['Settings', 'Business Information'],
    'subscription':        ['Settings', 'Subscription'],
    'receiving-accounts':  ['Settings', 'Receiving Accounts'],
    'bir-invoicing':       ['Settings', 'BIR Invoicing Registration'],
    'template-library':    ['Settings', 'Template Library'],
    'custom-fields-form':  ['Settings', 'Custom Fields', 'Customer'],
    'custom-fields-bills': ['Settings', 'Custom Fields', 'Bills'],
    'customer-payment-portal': ['Settings', 'Customer Payment Portal'],
    'late-payment-penalties': ['Settings', 'Overdue Payment Penalties'],
    'disbursements':       ['Settings', 'Disbursements'],
    'users':               ['Settings', 'Users'],
    'developer-settings':  ['Settings', 'Developer Settings'],
  };

  const placeholderLabels: Record<SettingsSection, string> = {
    'business-info':       'Business Information',
    'subscription':        'Subscription',
    'receiving-accounts':  'Receiving Accounts',
    'bir-invoicing':       'BIR Invoicing Registration',
    'template-library':    'Template Library',
    'custom-fields-form':  'Customer',
    'custom-fields-bills': 'Bills',
    'customer-payment-portal': 'Customer Payment Portal',
    'late-payment-penalties': 'Overdue Payment Penalties',
    'disbursements':       'Disbursements',
    'users':               'Users',
    'developer-settings':  'Developer Settings',
  };

  const breadcrumbs = breadcrumbMap[activeSection];

  function renderContent() {
    if (activeSection === 'custom-fields-form') {
      return (
        <CustomerFormContent
          sections={draftSections}
          customFields={draftCustomFields}
          onUpdateSystemField={updateSystemField}
          onAddCustomField={addCustomField}
          onUpdateCustomField={updateCustomField}
          onDeleteCustomField={deleteCustomField}
          onReorderCustomFields={reorderCustomFields}
          dirtyFieldIds={dirtyFieldIds}
          newFieldIds={newFieldIds}
        />
      );
    }
    if (activeSection === 'customer-payment-portal') {
      return <CustomerPaymentPortalSettings />;
    }
    if (activeSection === 'late-payment-penalties') {
      return <LatePaymentPenaltiesSettings />;
    }
    if (activeSection === 'subscription') {
      return <SubscriptionSettings />;
    }
    return <PlaceholderContent label={placeholderLabels[activeSection]} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Dashboard</span>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={`${crumb}-${i}`}>
                <CaretRight size={12} />
                <span className={i === breadcrumbs.length - 1 ? 'text-slate-900 font-medium' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
            <BellSimple size={16} />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Secondary nav — compact */}
          <nav className="w-48 shrink-0 bg-white border-r border-slate-200 overflow-y-auto py-2">
            <SecNavItem label="Business Information"       active={activeSection === 'business-info'}       onClick={() => setActiveSection('business-info')} />
            <SecNavItem label="Receiving Accounts"         active={activeSection === 'receiving-accounts'}   onClick={() => setActiveSection('receiving-accounts')} />
            <SecNavItem label="BIR Invoicing Registration" active={activeSection === 'bir-invoicing'}        onClick={() => setActiveSection('bir-invoicing')} />
            <SecNavItem label="Template Library"           active={activeSection === 'template-library'}     onClick={() => setActiveSection('template-library')} />

            {/* Custom Fields — expandable */}
            <button
              onClick={() => setCustomFieldsOpen(o => !o)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm border-l-[3px] flex items-center justify-between transition-colors',
                isCustomFieldsActive
                  ? 'border-violet-600 bg-violet-50 text-violet-700 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              Custom Fields
              <CaretDown
                size={11}
                className={cn(
                  'shrink-0 transition-transform duration-150',
                  isCustomFieldsActive ? 'text-violet-500' : 'text-slate-400',
                  customFieldsOpen ? 'rotate-0' : '-rotate-90',
                )}
              />
            </button>
            {customFieldsOpen && (
              <>
                <SecSubNavItem label="Customer" active={activeSection === 'custom-fields-form'}  onClick={() => setActiveSection('custom-fields-form')} />
                <SecSubNavItem label="Bills"    active={activeSection === 'custom-fields-bills'} onClick={() => setActiveSection('custom-fields-bills')} />
              </>
            )}

            <SecNavItem label="Customer Payment Portal" active={activeSection === 'customer-payment-portal'} onClick={() => setActiveSection('customer-payment-portal')} />
            <SecNavItem label="Overdue Payment Penalties" active={activeSection === 'late-payment-penalties'} onClick={() => setActiveSection('late-payment-penalties')} />
            <SecNavItem label="Disbursements"      active={activeSection === 'disbursements'}      onClick={() => setActiveSection('disbursements')} />
            <SecNavItem label="Users"              active={activeSection === 'users'}              onClick={() => setActiveSection('users')} />
            <SecNavItem label="Subscription"       active={activeSection === 'subscription'}       onClick={() => setActiveSection('subscription')} />
            <SecNavItem label="Developer Settings" active={activeSection === 'developer-settings'} onClick={() => setActiveSection('developer-settings')} />
          </nav>

          {/* Main content */}
          <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            <div className={['flex-1', activeSection === 'customer-payment-portal' || activeSection === 'late-payment-penalties' ? 'flex overflow-hidden' : 'overflow-y-auto'].join(' ')}>
              {renderContent()}
            </div>
            {hasPendingChanges && activeSection !== 'customer-payment-portal' && activeSection !== 'late-payment-penalties' && (
              <SaveBar onSave={handleSave} onDiscard={handleDiscard} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
