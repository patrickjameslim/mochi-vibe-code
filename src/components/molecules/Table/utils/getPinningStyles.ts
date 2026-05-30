import { Column } from '@tanstack/react-table'

interface PinningStyles {
  style: React.CSSProperties
  shadowProps: {
    left?: { style: React.CSSProperties; className: string }
    right?: { style: React.CSSProperties; className: string }
  }
}

export function getPinningStyles<TData>(column: Column<TData>): PinningStyles {
  const isPinned = column.getIsPinned()

  if (!isPinned) return { style: {}, shadowProps: {} }

  const style: React.CSSProperties = {
    position: 'sticky',
    zIndex: 10,
    background: 'white',
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
  }

  const shadowProps: PinningStyles['shadowProps'] = {}

  if (isPinned === 'right' && column.getIsFirstColumn('right')) {
    shadowProps.left = {
      className: 'absolute top-0 -left-20 w-20 h-full pointer-events-none',
      style: {
        background: 'linear-gradient(to left, rgba(0,0,0,0.03), transparent)',
      },
    }
  }

  if (isPinned === 'left' && column.getIsLastColumn('left')) {
    shadowProps.right = {
      className: 'absolute top-0 -right-20 w-20 h-full pointer-events-none',
      style: {
        background: 'linear-gradient(to right, rgba(0,0,0,0.03), transparent)',
      },
    }
  }

  return { style, shadowProps }
}
