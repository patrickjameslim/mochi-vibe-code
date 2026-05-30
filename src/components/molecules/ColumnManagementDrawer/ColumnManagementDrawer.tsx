import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical } from '@phosphor-icons/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '#/components/atoms/Sheet';
import { Switch } from '#/components/atoms/Switch';

export interface ColumnDef {
  id: string;
  label: string;
  visible: boolean;
  pin: 'none' | 'left' | 'right';
}

interface Props {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  onChange: (columns: ColumnDef[]) => void;
}

// ─── Inline SVG pin icons ─────────────────────────────────────────────────────
function PinLeft({ active }: { active: boolean }) {
  const c = active ? '#7c3aed' : '#94a3b8';
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="2" height="12" rx="1" fill={c} />
      <path d="M5 7h7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 4l3 3-3 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinRight({ active }: { active: boolean }) {
  const c = active ? '#7c3aed' : '#94a3b8';
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="11" y="1" width="2" height="12" rx="1" fill={c} />
      <path d="M9 7H2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 4L2 7l3 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Pin/action buttons (shared) ──────────────────────────────────────────────
function PinButtons({
  col,
  onPin,
}: {
  col: ColumnDef;
  onPin: (pin: 'none' | 'left' | 'right') => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => onPin(col.pin === 'left' ? 'none' : 'left')}
        title={col.pin === 'left' ? 'Unpin' : 'Pin to left'}
        className={[
          'inline-flex items-center justify-center w-6 h-6 rounded transition-colors',
          col.pin === 'left'
            ? 'bg-violet-100 text-violet-700'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
        ].join(' ')}
      >
        <PinLeft active={col.pin === 'left'} />
      </button>
      <button
        onClick={() => onPin(col.pin === 'right' ? 'none' : 'right')}
        title={col.pin === 'right' ? 'Unpin' : 'Pin to right'}
        className={[
          'inline-flex items-center justify-center w-6 h-6 rounded transition-colors',
          col.pin === 'right'
            ? 'bg-violet-100 text-violet-700'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
        ].join(' ')}
      >
        <PinRight active={col.pin === 'right'} />
      </button>
    </div>
  );
}

// ─── Draggable sortable item (only used for unpinned columns inside DndContext)
function SortableItem({
  col,
  onToggle,
  onPin,
}: {
  col: ColumnDef;
  onToggle: () => void;
  onPin: (pin: 'none' | 'left' | 'right') => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 0,
      }}
      className={[
        'flex items-center gap-2.5 px-3 py-2.5 bg-white border rounded-lg transition-shadow',
        isDragging ? 'shadow-lg border-violet-200' : 'border-slate-200',
      ].join(' ')}
    >
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
      >
        <DotsSixVertical size={16} weight="bold" />
      </button>

      <Switch checked={col.visible} onChange={onToggle} />

      <span className={['flex-1 text-sm select-none transition-colors', col.visible ? 'text-slate-800 font-medium' : 'text-slate-400'].join(' ')}>
        {col.label}
      </span>

      <PinButtons col={col} onPin={onPin} />
    </div>
  );
}

// ─── Static item for pinned columns (no drag, sits outside DndContext) ─────────
function PinnedItem({
  col,
  onToggle,
  onPin,
}: {
  col: ColumnDef;
  onToggle: () => void;
  onPin: (pin: 'none' | 'left' | 'right') => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-violet-50 border border-violet-200 rounded-lg">
      {/* Placeholder for drag handle alignment */}
      <span className="w-4 flex-shrink-0" />

      <Switch checked={col.visible} onChange={onToggle} />

      <span className={['flex-1 text-sm select-none', col.visible ? 'text-slate-800 font-medium' : 'text-slate-400'].join(' ')}>
        {col.label}
      </span>

      <PinButtons col={col} onPin={onPin} />
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
export function ColumnManagementDrawer({ open, onClose, columns, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const unpinned = columns.filter((c) => c.pin === 'none');
  const pinnedLeft = columns.filter((c) => c.pin === 'left');
  const pinnedRight = columns.filter((c) => c.pin === 'right');

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.id === active.id);
    const newIndex = columns.findIndex((c) => c.id === over.id);
    onChange(arrayMove(columns, oldIndex, newIndex));
  }

  function toggleVisible(id: string) {
    onChange(columns.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  }

  function setPin(id: string, pin: 'none' | 'left' | 'right') {
    onChange(columns.map((c) => (c.id === id ? { ...c, pin } : c)));
  }

  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" size="md" className="p-0">
        <SheetHeader className="border-b border-slate-200 p-4">
          <SheetTitle className="text-base font-semibold text-slate-900">Manage columns</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400">
            <span className="font-medium text-slate-600">{visibleCount}</span> of {columns.length} visible
            {unpinned.length > 0 && (
              <>
                <span className="mx-1.5">·</span>
                Drag <DotsSixVertical size={11} className="inline -mt-0.5" weight="bold" /> to reorder
              </>
            )}
          </p>
          <button
            onClick={() => onChange(columns.map((c) => ({ ...c, visible: true, pin: 'none' })))}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Reset to default
          </button>
        </div>

        {/* Pinned left */}
        {pinnedLeft.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Pinned left
            </p>
            <div className="flex flex-col gap-1.5">
              {pinnedLeft.map((col) => (
                <PinnedItem
                  key={col.id}
                  col={col}
                  onToggle={() => toggleVisible(col.id)}
                  onPin={(pin) => setPin(col.id, pin)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Unpinned — sortable */}
        {unpinned.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={unpinned.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1.5">
                {unpinned.map((col) => (
                  <SortableItem
                    key={col.id}
                    col={col}
                    onToggle={() => toggleVisible(col.id)}
                    onPin={(pin) => setPin(col.id, pin)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Pinned right */}
        {pinnedRight.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
              Pinned right
            </p>
            <div className="flex flex-col gap-1.5">
              {pinnedRight.map((col) => (
                <PinnedItem
                  key={col.id}
                  col={col}
                  onToggle={() => toggleVisible(col.id)}
                  onPin={(pin) => setPin(col.id, pin)}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
