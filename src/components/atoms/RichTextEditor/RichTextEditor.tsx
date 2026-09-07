import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  ListBullets,
  ListNumbers,
  LinkSimple,
  ArrowCounterClockwise,
  TextAa,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  CaretDown,
} from '@phosphor-icons/react';
import { cn } from '../../utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../DropdownMenu';

export interface RichTextPlaceholder {
  key: string;
  label: string;
  category: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Suppresses Enter/newlines — for single-line fields like an email subject. */
  singleLine?: boolean;
  className?: string;
  minHeight?: number;
  /** When provided, shows an "Insert placeholder" control in the toolbar, grouped by category. */
  placeholders?: RichTextPlaceholder[];
  /**
   * When true, the editable region stretches to fill its parent's height
   * instead of sizing to `minHeight` — the parent must be a flex container
   * that actually gives this component a definite height to grow into
   * (e.g. a `flex-1` wrapper inside a flex column).
   */
  grow?: boolean;
}

// Wraps a placeholder token in the same subtle NEUTRAL chip style used
// throughout the app's placeholder system (see emailTemplates.ts's chip()).
// `contenteditable="false"` makes the chip an atomic unit inside the
// surrounding contentEditable field — the caret jumps over it as one piece,
// backspace/delete removes the whole token in one step, and a user can't
// edit the individual characters inside it. `draggable="true"` lets the
// browser's own native contentEditable drag-and-drop pick the chip up and
// drop it at a new caret position, with the surrounding text reflowing
// around it — no custom drag logic needed for the move itself.
function placeholderChipHtml(token: string): string {
  return '<span contenteditable="false" draggable="true" style="background-color:#F8FAFC;color:#334155;border:1px solid #E2E8F0;border-radius:4px;padding:0 4px;cursor:grab;">' + token + '</span>';
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // onMouseDown (not onClick) + preventDefault keeps the current text
      // selection inside the editor alive — a click would first steal focus
      // away from the contentEditable, collapsing whatever was selected.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-100 transition-colors',
        active && 'bg-slate-200 text-slate-900',
      )}
    >
      {children}
    </button>
  );
}

/**
 * A minimal rich-text field: a small formatting toolbar (bold/italic/
 * underline, bullet/numbered lists, hyperlink, alignment), an optional
 * "Insert placeholder" menu grouped by category — items already present in
 * this field's own value are disabled, insertion happens exactly at the
 * (restored) cursor position — plus a contentEditable region.
 *
 * Uses the browser's `document.execCommand` — deprecated, but still broadly
 * supported for exactly this kind of basic WYSIWYG formatting, and avoids
 * pulling in a full editor library for a handful of formatting commands.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  singleLine = false,
  className,
  minHeight = 40,
  placeholders = [],
  grow = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // Opening the "Insert placeholder" menu moves browser focus away from the
  // contentEditable, which loses its caret position — so we snapshot the
  // last known Range on blur and restore it before inserting, instead of
  // relying on focus() alone to put the caret back where it was.
  const savedRangeRef = useRef<Range | null>(null);
  // The placeholder chip currently being dragged (or null when no chip drag
  // is in progress) — set on dragstart, read on drop/dragover to know which
  // node to relocate. Native contentEditable drag-and-drop does NOT reliably
  // move a `contenteditable="false"` child to a new position on its own
  // across browsers, so the actual move is done by hand: remove the chip
  // from its old spot and insert it at the exact caret position under the
  // cursor — and, for live feedback, this happens continuously on every
  // dragover (not just once on drop), so the chip visually follows the
  // cursor through the surrounding text as the user drags.
  const draggedChipRef = useRef<HTMLElement | null>(null);
  // Where the chip started — restored if the drag is cancelled (dropped
  // outside a valid target, or aborted) instead of completed.
  const dragOriginRef = useRef<{ parent: Node; nextSibling: ChildNode | null } | null>(null);
  // The last drop-point resolved during this drag, so repeated dragover
  // events over the exact same spot don't keep re-inserting the chip.
  const dragLastPosRef = useRef<{ container: Node; offset: number } | null>(null);
  const isEmpty = value.trim() === '' || value.trim() === '<br>';

  // Uncontrolled-style sync: only push `value` into the DOM (including on
  // first mount, to render the initial content) when it actually differs
  // from what's already there. `handleInput` keeps `value` equal to the
  // DOM's own innerHTML as the user types, so this never re-fires — and
  // never resets the caret — from the component's own onChange calls; it
  // only fires for changes that came from OUTSIDE (e.g. switching templates
  // or an initial default value).
  const lastValueRef = useRef<string | null>(null);
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    lastValueRef.current = value;
  }, [value]);

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  }

  function handleInput() {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  }

  function handleLink() {
    const url = window.prompt('Enter a URL');
    if (url) exec('createLink', url);
  }

  // execCommand('fontSize') only understands the legacy 1–7 HTML size
  // levels, not pixel values — so we apply size "7" as a marker, then
  // immediately swap the <font size="7"> element(s) it produces for a
  // <span style="font-size:Npx"> with the actual requested size.
  function setFontSize(px: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('fontSize', false, '7');
    if (editorRef.current) {
      editorRef.current.querySelectorAll('font[size="7"]').forEach((el) => {
        const span = document.createElement('span');
        span.style.fontSize = px + 'px';
        while (el.firstChild) span.appendChild(el.firstChild);
        el.replaceWith(span);
      });
    }
    handleInput();
  }

  const [textColor, setTextColor] = useState('#0F172A');
  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const color = e.target.value;
    setTextColor(color);
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('foreColor', false, color);
    handleInput();
  }

  function handleBlur() {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (el && sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }

  function restoreSelection() {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (savedRangeRef.current) {
      sel.addRange(savedRangeRef.current);
    } else {
      // Never focused before — place the caret at the end.
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.addRange(range);
    }
  }

  // True when the (restored) cursor sits at the very beginning of the
  // field's content — used so the first placeholder in an empty/blank
  // spot doesn't get a leading " - " with nothing before it to separate.
  function isCursorAtStart(): boolean {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(el);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length === 0;
  }

  function insertPlaceholder(token: string) {
    editorRef.current?.focus();
    restoreSelection();
    // Visually distinguish inserted placeholders from ordinary typed text —
    // a subtle NEUTRAL token (light background, thin border, dark slate
    // text), not the app's purple accent, so it reads as dynamic template
    // data rather than a clickable button, while still flowing inline as
    // part of the sentence. A leading " - " is added automatically so
    // consecutive placeholders/text read as a dash-separated list without
    // the user having to type the separator themselves — skipped when
    // there's nothing before the cursor to separate from.
    const separator = isCursorAtStart() ? '' : ' - ';
    document.execCommand('insertHTML', false, separator + placeholderChipHtml(token));
    handleInput();
  }

  // A placeholder chip is any child with contenteditable="false" — that
  // attribute is what marks a node as an atomic, draggable token (see
  // placeholderChipHtml above), so checking for it (rather than guessing
  // from styling) is what identifies a drag as "moving a placeholder".
  // Accepts any Node (not just Element) since callers check siblings —
  // which can just as easily be plain Text nodes — not just elements.
  function isPlaceholderChip(node: Node | null): node is HTMLElement {
    return !!node && node.nodeType === Node.ELEMENT_NODE && (node as Element).getAttribute('contenteditable') === 'false';
  }

  function handleChipDragStart(e: React.DragEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest('[contenteditable="false"]');
    if (isPlaceholderChip(target) && editorRef.current?.contains(target)) {
      draggedChipRef.current = target;
      dragOriginRef.current = { parent: target.parentNode as Node, nextSibling: target.nextSibling };
      dragLastPosRef.current = null;
      e.dataTransfer.effectAllowed = 'move';
      // Firefox requires data to actually be set for the drag to proceed.
      e.dataTransfer.setData('text/plain', target.textContent ?? '');
      // Visually mark the chip as "being previewed" rather than settled —
      // distinct from its normal resting appearance while it's following
      // the cursor through the surrounding text.
      target.style.opacity = '0.5';
    } else {
      draggedChipRef.current = null;
      dragOriginRef.current = null;
    }
  }

  // Resolves a mouse position to a caret Range — the standard (if oddly
  // named/prefixed differently per browser) way to turn "where the user's
  // cursor currently is" into "which exact text position that corresponds
  // to", used continuously during drag to preview the drop, not just once
  // on drop itself.
  function caretRangeFromPoint(x: number, y: number): Range | null {
    const doc = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };
    if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
    if (doc.caretPositionFromPoint) {
      const pos = doc.caretPositionFromPoint(x, y);
      if (!pos) return null;
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
      return range;
    }
    return null;
  }

  // A text node made up ENTIRELY of dashes/whitespace — never real prose,
  // so this is the one thing safe to treat as "just a separator" and
  // rewrite freely. A real sentence (or a hyphen a user typed on purpose)
  // always has other characters in it and will never match this.
  function isSeparatorText(node: ChildNode | null): node is Text {
    return !!node && node.nodeType === Node.TEXT_NODE && /^[\s-]+$/.test(node.textContent ?? '');
  }

  // Cleans up whatever the chip leaves behind at its OLD spot, using its
  // exact old neighbors — captured right when it's removed, before any
  // DOM merging can blur a pure "-" separator together with the ordinary
  // prose next to it (which is what would otherwise hide it from
  // normalizeChipSeparators' whole-node check below):
  //  - chip had a separator on both sides ("X - chip - Y") → collapse to
  //    the single " - " now needed to join X and Y directly;
  //  - chip had a separator on only one side (it was the first or last
  //    item in its run) → that separator is now dangling, remove it;
  //  - chip had no adjacent separator at all → nothing to do.
  function cleanupVacatedSeparator(oldPrev: ChildNode | null, oldNext: ChildNode | null) {
    const prevIsSep = isSeparatorText(oldPrev);
    const nextIsSep = isSeparatorText(oldNext);
    if (prevIsSep && nextIsSep) {
      oldNext.remove();
      oldPrev.textContent = ' - ';
    } else if (prevIsSep) {
      oldPrev.remove();
    } else if (nextIsSep) {
      oldNext.remove();
    }
  }

  // Keeps "-" separators correct between placeholder chips at the chip's
  // NEW position after a move — treating a run of only dashes/whitespace
  // between two chips as a single structural separator that belongs to the
  // chip *pair*, not to either chip individually:
  //  - two chips left directly adjacent (nothing at all between them, or
  //    only whitespace/dashes) end up joined by exactly one " - ";
  //  - a chip left adjacent to ordinary text/the edge of the field (not
  //    another chip) has any dangling dash there demoted to a plain space,
  //    so nothing is left "hanging" at the new position.
  function normalizeChipSeparators(el: HTMLDivElement) {
    el.normalize(); // merge any adjacent text nodes split apart by the move

    let node: ChildNode | null = el.firstChild;
    while (node) {
      const next: ChildNode | null = node.nextSibling;
      if (isSeparatorText(node)) {
        const prevIsChip = isPlaceholderChip(node.previousSibling);
        const nextIsChip = isPlaceholderChip(node.nextSibling);
        if (prevIsChip && nextIsChip) {
          node.textContent = ' - ';
        } else if (prevIsChip || nextIsChip) {
          // Only one side is a chip — the other is either ordinary text
          // (keep a single space so words/chip don't run together) or the
          // very edge of the field (nothing there to separate from, so
          // remove the dangling dash entirely instead of leaving a stray
          // trailing/leading space).
          const atStart = !node.previousSibling;
          const atEnd = !node.nextSibling;
          if ((prevIsChip && atEnd) || (nextIsChip && atStart)) {
            node.remove();
          } else {
            node.textContent = ' ';
          }
        }
      } else if (isPlaceholderChip(node) && isPlaceholderChip(next)) {
        // Two chips left touching with no text node between them at all.
        el.insertBefore(document.createTextNode(' - '), next);
      }
      node = next;
    }
  }

  // Moves the dragged chip live to wherever the cursor currently is, so the
  // surrounding text visually reflows around the potential drop position
  // before the user ever releases the mouse button — this is the actual
  // "live insertion feedback" the drag interaction provides.
  function previewChipMove(chip: HTMLElement, el: HTMLDivElement, clientX: number, clientY: number) {
    const dropRange = caretRangeFromPoint(clientX, clientY);
    if (!dropRange || !el.contains(dropRange.startContainer)) return;
    // Hovering back over/inside the chip itself isn't a real target.
    if (chip.contains(dropRange.startContainer) || dropRange.startContainer === chip) return;

    // Skip redoing the move if this resolves to the same spot as last time
    // — dragover fires far more often than the cursor visibly moves.
    const last = dragLastPosRef.current;
    if (last && last.container === dropRange.startContainer && last.offset === dropRange.startOffset) return;
    dragLastPosRef.current = { container: dropRange.startContainer, offset: dropRange.startOffset };

    // Capture the chip's neighbors at its CURRENT spot before touching
    // anything — cleaning up whatever separator it leaves behind has to
    // happen with these exact references, before the chip is removed and
    // (later) el.normalize() has a chance to merge a now-dangling "-" into
    // the ordinary prose next to it, which would hide it from the
    // whole-node check normalizeChipSeparators relies on.
    const oldPrev = chip.previousSibling;
    const oldNext = chip.nextSibling;

    chip.remove();
    cleanupVacatedSeparator(oldPrev, oldNext);

    dropRange.insertNode(chip);
    normalizeChipSeparators(el);
  }

  function handleChipDragOver(e: React.DragEvent<HTMLDivElement>) {
    // Only hijack dragover when a chip (from this field) is what's being
    // dragged — any other drag (e.g. a normal text-selection drag, which
    // contentEditable already supports natively) is left completely alone.
    const chip = draggedChipRef.current;
    const el = editorRef.current;
    if (!chip || !el) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // previewChipMove already no-ops when the resolved position hasn't
    // actually changed since the last call, so calling it directly here
    // (rather than batching through requestAnimationFrame) still only
    // touches the DOM when the live preview genuinely needs to move.
    previewChipMove(chip, el, e.clientX, e.clientY);
  }

  function handleChipDrop(e: React.DragEvent<HTMLDivElement>) {
    const chip = draggedChipRef.current;
    const el = editorRef.current;
    draggedChipRef.current = null;
    dragOriginRef.current = null;
    dragLastPosRef.current = null;
    if (!chip) return;
    e.preventDefault();

    // The live preview during dragover has usually already moved the chip
    // to exactly where it should land — this call is a no-op in that case
    // (previewChipMove skips redoing an unchanged position) but guards
    // against a drop that fires without a matching dragover at the same
    // spot, e.g. a very fast drag or a synthetic drop.
    if (el) previewChipMove(chip, el, e.clientX, e.clientY);

    // Restore the chip's normal appearance and place the caret right after
    // it, matching where a typed/inserted placeholder leaves it.
    chip.style.opacity = '';
    const caret = document.createRange();
    caret.setStartAfter(chip);
    caret.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(caret);

    handleInput();
  }

  function handleChipDragEnd() {
    const chip = draggedChipRef.current;
    const origin = dragOriginRef.current;
    draggedChipRef.current = null;
    dragOriginRef.current = null;
    dragLastPosRef.current = null;
    // dragend always fires after drop too — but a successful drop already
    // cleared draggedChipRef above, so reaching here with a chip still set
    // means the drag was cancelled (dropped outside any valid target,
    // Escape pressed, etc.) and the live preview move needs undoing.
    if (!chip) return;
    chip.style.opacity = '';
    if (origin) origin.parent.insertBefore(chip, origin.nextSibling);
  }

  // Group placeholders by category (preserving the order they were passed
  // in) for the "Customer" / "Billing" section headers in the dropdown.
  const groupedPlaceholders: { category: string; items: RichTextPlaceholder[] }[] = [];
  for (const p of placeholders) {
    let group = groupedPlaceholders.find((g) => g.category === p.category);
    if (!group) {
      group = { category: p.category, items: [] };
      groupedPlaceholders.push(group);
    }
    group.items.push(p);
  }

  return (
    <div className={cn(
      'rounded-[8px] border border-slate-200 bg-white overflow-hidden',
      grow && 'h-full flex flex-col',
      className,
    )}>
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-slate-200 bg-slate-50 flex-wrap shrink-0">
        <select
          aria-label="Font size"
          title="Font size"
          defaultValue="14"
          onChange={(e) => setFontSize(e.target.value)}
          className="h-7 px-1 rounded text-xs text-slate-600 bg-transparent hover:bg-slate-100 outline-none cursor-pointer border-none"
        >
          {['12', '14', '16', '18', '20', '24', '28', '32'].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <div
          className="relative inline-flex items-center justify-center w-7 h-7 rounded text-slate-600 hover:bg-slate-100 transition-colors"
          title="Text color"
        >
          <TextAa size={14} />
          <span
            className="absolute bottom-1 left-1.5 right-1.5 h-[2px] rounded-full"
            style={{ backgroundColor: textColor }}
          />
          <input
            type="color"
            aria-label="Text color"
            value={textColor}
            onChange={handleColorChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolbarButton label="Bold" onClick={() => exec('bold')}>
          <TextB size={14} weight="bold" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec('italic')}>
          <TextItalic size={14} />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec('underline')}>
          <TextUnderline size={14} />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => exec('strikeThrough')}>
          <TextStrikethrough size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolbarButton label="Bullet list" onClick={() => exec('insertUnorderedList')}>
          <ListBullets size={14} />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec('insertOrderedList')}>
          <ListNumbers size={14} />
        </ToolbarButton>
        <ToolbarButton label="Insert link" onClick={handleLink}>
          <LinkSimple size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolbarButton label="Align left" onClick={() => exec('justifyLeft')}>
          <TextAlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => exec('justifyCenter')}>
          <TextAlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => exec('justifyRight')}>
          <TextAlignRight size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <ToolbarButton label="Undo" onClick={() => exec('undo')}>
          <ArrowCounterClockwise size={14} />
        </ToolbarButton>

        {placeholders.length > 0 && (
          <>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors outline-none">
                Insert placeholder
                <CaretDown size={10} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                {groupedPlaceholders.map((group, i) => (
                  <React.Fragment key={group.category}>
                    {i > 0 && <DropdownMenuSeparator />}
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide select-none">
                      {group.category}
                    </div>
                    {group.items.map((p) => (
                      <DropdownMenuItem
                        key={p.key}
                        disabled={value.includes(p.key)}
                        onSelect={() => insertPlaceholder(p.key)}
                      >
                        {p.label}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <div className={cn('relative', grow && 'flex-1 overflow-y-auto')}>
        {isEmpty && placeholder && (
          <p className="absolute top-2 left-3 text-sm text-slate-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (singleLine && e.key === 'Enter') e.preventDefault();
          }}
          onPaste={(e) => {
            if (!singleLine) return;
            // Keep single-line fields (the Subject) from picking up
            // newlines pasted in from elsewhere.
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain').replace(/[\r\n]+/g, ' ');
            document.execCommand('insertText', false, text);
          }}
          onDragStart={handleChipDragStart}
          onDragOver={handleChipDragOver}
          onDrop={handleChipDrop}
          onDragEnd={handleChipDragEnd}
          style={grow ? undefined : { minHeight }}
          className={cn(
            'px-3 py-2 text-sm text-slate-900 outline-none [&_a]:text-violet-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
            grow && 'h-full',
          )}
        />
      </div>
    </div>
  );
}
