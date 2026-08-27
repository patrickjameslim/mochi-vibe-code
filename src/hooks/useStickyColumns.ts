import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { ColumnDef } from '../components/ColumnManagementDrawer';

export const CHECKBOX_W = 40;
export const KEBAB_W    = 44;

export function useStickyColumns(columnConfig: ColumnDef[], colWidths: Record<string, number>) {
  return useMemo(() => {
    const leftPinned  = columnConfig.filter((c) => c.pin === 'left'  && c.visible);
    const center      = columnConfig.filter((c) => c.pin === 'none'  && c.visible);
    const rightPinned = columnConfig.filter((c) => c.pin === 'right' && c.visible);

    const ordered = [...leftPinned, ...center, ...rightPinned];

    const leftOffsets: Record<string, number> = {};
    let leftCursor = CHECKBOX_W;
    for (const col of leftPinned) {
      leftOffsets[col.id] = leftCursor;
      leftCursor += colWidths[col.id] ?? 130;
    }

    const rightOffsets: Record<string, number> = {};
    let rightCursor = KEBAB_W;
    for (let i = rightPinned.length - 1; i >= 0; i--) {
      rightOffsets[rightPinned[i].id] = rightCursor;
      rightCursor += colWidths[rightPinned[i].id] ?? 130;
    }

    // Total width of each pinned region (checkbox/kebab + any user-pinned columns),
    // for consumers that render a full-panel elevation shadow over the pinned area.
    const leftPinnedTotalWidth  = leftCursor;
    const rightPinnedTotalWidth = rightCursor;

    // No divider border here — pinned columns are communicated by the
    // elevation-shadow panel (see pinnedShadowLeft/pinnedShadowRight in
    // DataTable), not a hard border line.
    function colHeaderStyle(id: string): CSSProperties {
      if (leftOffsets[id] !== undefined)  return { position: 'sticky', left: leftOffsets[id],   zIndex: 2, backgroundColor: '#ffffff' };
      if (rightOffsets[id] !== undefined) return { position: 'sticky', right: rightOffsets[id], zIndex: 2, backgroundColor: '#ffffff' };
      return {};
    }

    function colCellStyle(id: string): CSSProperties {
      if (leftOffsets[id] !== undefined)  return { position: 'sticky', left: leftOffsets[id],   zIndex: 1 };
      if (rightOffsets[id] !== undefined) return { position: 'sticky', right: rightOffsets[id], zIndex: 1 };
      return {};
    }

    return {
      visibleCols: ordered,
      colHeaderStyle,
      colCellStyle,
      hasLeftPinned:  leftPinned.length > 0,
      hasRightPinned: rightPinned.length > 0,
      leftPinnedTotalWidth,
      rightPinnedTotalWidth,
    };
  }, [columnConfig, colWidths]);
}
