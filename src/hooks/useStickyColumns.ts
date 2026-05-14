import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { ColumnDef } from '../components/ColumnManagementDrawer';

const CHECKBOX_W = 40;
const KEBAB_W    = 44;

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

    const lastLeftId   = leftPinned.length > 0 ? leftPinned[leftPinned.length - 1].id : null;
    const firstRightId = rightPinned.length > 0 ? rightPinned[0].id : null;
    const SEP_R = { borderRight: '1px solid #d1d5db' };
    const SEP_L = { borderLeft:  '1px solid #d1d5db' };

    function colHeaderStyle(id: string): CSSProperties {
      if (leftOffsets[id] !== undefined)  return { position: 'sticky', left: leftOffsets[id],   zIndex: 2, backgroundColor: '#f8fafc', ...(id === lastLeftId   ? SEP_R : {}) };
      if (rightOffsets[id] !== undefined) return { position: 'sticky', right: rightOffsets[id], zIndex: 2, backgroundColor: '#f8fafc', ...(id === firstRightId ? SEP_L : {}) };
      return {};
    }

    function colCellStyle(id: string): CSSProperties {
      if (leftOffsets[id] !== undefined)  return { position: 'sticky', left: leftOffsets[id],   zIndex: 1, ...(id === lastLeftId   ? SEP_R : {}) };
      if (rightOffsets[id] !== undefined) return { position: 'sticky', right: rightOffsets[id], zIndex: 1, ...(id === firstRightId ? SEP_L : {}) };
      return {};
    }

    return {
      visibleCols: ordered,
      colHeaderStyle,
      colCellStyle,
      hasLeftPinned:  leftPinned.length > 0,
      hasRightPinned: rightPinned.length > 0,
    };
  }, [columnConfig, colWidths]);
}
