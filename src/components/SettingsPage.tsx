import React, { useEffect, useRef, useState } from 'react';
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
import { useCustomFields } from '../context/CustomFieldsContext';
import {
  BellSimple,
  CaretRight,
  CaretDown,
  Check,
  Circle,
  DotsSixVertical,
  Eye,
  Minus,
  Sliders,
  Plus,
  Square,
  Trash,
  UploadSimple,
  User,
  Buildings,
  Info,
  Image as ImageIcon,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { Sidebar } from './Sidebar';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/Select';
import { cn } from '../lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES = [
  'Text', 'Email', 'Number', 'Select',
  'Multi-select', 'Textarea', 'Toggle', 'Radio', 'File', 'Date',
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsSection =
  | 'business-info'
  | 'receiving-accounts'
  | 'bir-invoicing'
  | 'template-library'
  | 'custom-fields-form'
  | 'custom-fields-bills'
  | 'payment-portal'
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
      { id: 'note',          label: 'Customer Note',           type: 'Textarea',     required: false, visible: true, isSystem: true },
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

          {/* Customer note */}
          {vis('note') && (
            <div>
              <PreviewLabel>{lbl('note', 'Customer note')}</PreviewLabel>
              <Textarea readOnly rows={3} placeholder="Add additional details about the customer"
                className="cursor-default focus:ring-0 focus:border-slate-200 focus:shadow-none resize-none" />
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
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Customer form</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure the fields shown in the customer creation form.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode('build')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all',
                viewMode === 'build'
                  ? 'bg-white text-slate-900 font-medium shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <Sliders size={13} />
              Build
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all',
                viewMode === 'preview'
                  ? 'bg-white text-slate-900 font-medium shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <Eye size={13} />
              Preview
            </button>
          </div>
          <Button
            variant="primary"
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
          <Button variant="primary" size="md" onClick={onSave}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

let _customFieldCounter = 0;

export default function SettingsPage() {
  const { saveCustomFields } = useCustomFields();
  const [activeSection, setActiveSection] = useState<SettingsSection>('custom-fields-form');
  const [customFieldsOpen, setCustomFieldsOpen] = useState(true);

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
    'receiving-accounts':  ['Settings', 'Receiving Accounts'],
    'bir-invoicing':       ['Settings', 'BIR Invoicing Registration'],
    'template-library':    ['Settings', 'Template Library'],
    'custom-fields-form':  ['Settings', 'Custom Fields', 'Customer form'],
    'custom-fields-bills': ['Settings', 'Custom Fields', 'Bills fields'],
    'payment-portal':      ['Settings', 'Payment Portal'],
    'disbursements':       ['Settings', 'Disbursements'],
    'users':               ['Settings', 'Users'],
    'developer-settings':  ['Settings', 'Developer Settings'],
  };

  const placeholderLabels: Record<SettingsSection, string> = {
    'business-info':       'Business Information',
    'receiving-accounts':  'Receiving Accounts',
    'bir-invoicing':       'BIR Invoicing Registration',
    'template-library':    'Template Library',
    'custom-fields-form':  'Customer form',
    'custom-fields-bills': 'Bills fields',
    'payment-portal':      'Payment Portal',
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
    return <PlaceholderContent label={placeholderLabels[activeSection]} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

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
                <SecSubNavItem label="Customer form" active={activeSection === 'custom-fields-form'}  onClick={() => setActiveSection('custom-fields-form')} />
                <SecSubNavItem label="Bills fields"  active={activeSection === 'custom-fields-bills'} onClick={() => setActiveSection('custom-fields-bills')} />
              </>
            )}

            <SecNavItem label="Payment Portal"     active={activeSection === 'payment-portal'}     onClick={() => setActiveSection('payment-portal')} />
            <SecNavItem label="Disbursements"      active={activeSection === 'disbursements'}      onClick={() => setActiveSection('disbursements')} />
            <SecNavItem label="Users"              active={activeSection === 'users'}              onClick={() => setActiveSection('users')} />
            <SecNavItem label="Developer Settings" active={activeSection === 'developer-settings'} onClick={() => setActiveSection('developer-settings')} />
          </nav>

          {/* Main content */}
          <main className="flex-1 flex flex-col bg-slate-50">
            <div className="flex-1 overflow-y-auto">
              {renderContent()}
            </div>
            {hasPendingChanges && (
              <SaveBar onSave={handleSave} onDiscard={handleDiscard} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
