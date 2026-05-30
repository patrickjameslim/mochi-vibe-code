import { useMemo, useState } from 'react'
import { SmileySadIcon } from '@phosphor-icons/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  Updater,
  ColumnDef,
  ColumnSort,
  SortingState,
  RowSelectionState,
  ColumnPinningState,
  OnChangeFn,
  RowData,
} from '@tanstack/react-table'

import {
  TableRow,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
} from '../../table/table'
import {
  ArrowDownIcon,
  ArrowsVerticalIcon,
  ArrowUpIcon,
  PushPinIcon,
} from '@phosphor-icons/react'
import { Skeleton } from '../../atoms/Skeleton/Skeleton'
import { Checkbox, Text } from '../../atoms'
import { getPinningStyles } from './utils/getPinningStyles'

enum StaticColumnId {
  CHECKBOX = 'select',
}

interface SortingProps {
  by: string
  direction: 'asc' | 'desc'
}

interface ColumnPinningProps {
  left?: string[]
  right?: string[]
}

export interface TableProps<TData = unknown> {
  data: TData[]
  columns: ColumnDef<TData>[]
  enableSorting?: boolean
  enableRowSelection?: boolean
  enableColumnPinning?: boolean
  isLoading?: boolean
  initialSorting?: SortingProps
  initialColumnPinning?: ColumnPinningProps
  numberOfRows?: number
  onSort?: (values: ColumnSort[]) => void
  getRowId?: (row: TData) => string
  rowSelectionProps?: {
    rowSelection: RowSelectionState
    setRowSelection: OnChangeFn<RowSelectionState> | undefined
  }
}

export const Table = <TData = unknown,>({
  data,
  columns,
  enableSorting,
  enableRowSelection,
  enableColumnPinning,
  isLoading = false,
  initialSorting,
  initialColumnPinning,
  numberOfRows = DEFAULT_NUMBER_OF_ROWS,
  onSort,
  getRowId,
  rowSelectionProps,
}: TableProps<TData>) => {
  const initialSortBy = useMemo(() => {
    if (initialSorting?.by && initialSorting.direction) {
      return [
        {
          id: initialSorting.by,
          desc: initialSorting.direction === 'desc',
        },
      ]
    }
    return []
  }, [initialSorting])

  const initialPinning = useMemo(() => {
    return {
      left: initialColumnPinning?.left ?? [],
      right: initialColumnPinning?.right ?? [],
    }
  }, [initialColumnPinning])

  const [sorting, setSorting] = useState<SortingState>(initialSortBy)
  const { rowSelection, setRowSelection } = rowSelectionProps ?? {
    rowSelection: {},
  }
  const [columnPinning, setColumnPinning] =
    useState<ColumnPinningState>(initialPinning)

  const reactTable = useReactTable({
    data,
    columns,
    enableSorting,
    manualSorting: enableSorting,
    enableRowSelection,
    enableColumnPinning,
    state: {
      sorting,
      rowSelection,
      columnPinning,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (change: Updater<SortingState>) => {
      setSorting(change)

      if (typeof change === 'function' && onSort !== undefined) {
        onSort(change(sorting))
      }
    },
    onRowSelectionChange:
      setRowSelection && rowSelection
        ? (updaterOrValue) => {
            if (typeof updaterOrValue === 'function') {
              setRowSelection(updaterOrValue(rowSelection))
            } else {
              setRowSelection(updaterOrValue)
            }
          }
        : undefined,
    onColumnPinningChange: setColumnPinning,
    getRowId,
  })

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <TableHeader>
          {reactTable.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const { style: pinningStyles, shadowProps } = getPinningStyles(
                  header.column
                )

                const width = header.column.columnDef.meta?.width

                return (
                  <TableHead
                    key={header.id}
                    style={{
                      ...pinningStyles,
                      width: width,
                      minWidth: header.column.columnDef.meta?.minWidth ?? width,
                      maxWidth: header.column.columnDef.meta?.maxWidth ?? width,
                    }}
                    className={header.column.columnDef.meta?.headerClassName}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center justify-between">
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-2'
                              : 'flex items-center'
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-xs">
                              {{
                                asc: <ArrowUpIcon />,
                                desc: <ArrowDownIcon />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ArrowsVerticalIcon />
                              )}
                            </span>
                          )}
                        </div>
                        {enableColumnPinning && header.column.getCanPin() && (
                          <div className="flex gap-1 ml-2">
                            {header.column.getIsPinned() === 'left' ? (
                              <button
                                onClick={() => header.column.pin(false)}
                                className="text-xs px-1 py-0.5 rounded hover:bg-accent-foreground/10 bg-accent text-accent-foreground/50"
                                title="Unpin"
                              >
                                <PushPinIcon weight="fill" />
                              </button>
                            ) : (
                              <button
                                onClick={() => header.column.pin('left')}
                                className="text-xs px-1 py-0.5 rounded hover:bg-muted text-muted-foreground/50"
                                title="Pin to left"
                              >
                                <PushPinIcon weight="fill" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {shadowProps.left && (
                      <span
                        className={shadowProps.left.className}
                        style={shadowProps.left.style}
                      />
                    )}
                    {shadowProps.right && (
                      <span
                        className={shadowProps.right.className}
                        style={shadowProps.right.style}
                      />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: numberOfRows }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((column, j) => {
                  const width = column.meta?.width

                  return (
                    <TableCell
                      key={j}
                      className="py-5"
                      style={{
                        width: width,
                        minWidth: column.meta?.minWidth ?? width,
                        maxWidth: column.meta?.maxWidth ?? width,
                      }}
                    >
                      {column.id === StaticColumnId.CHECKBOX ? (
                        <Checkbox />
                      ) : (
                        <Skeleton className="h-4 w-full" />
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : reactTable.getRowModel().rows.length ? (
            reactTable.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => {
                  const { style: pinningStyles, shadowProps } =
                    getPinningStyles(cell.column)

                  const width = cell.column.columnDef.meta?.width

                  return (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...pinningStyles,
                        width: width,
                        minWidth: cell.column.columnDef.meta?.minWidth ?? width,
                        maxWidth: cell.column.columnDef.meta?.maxWidth ?? width,
                      }}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                      {shadowProps.left && (
                        <span
                          className={shadowProps.left.className}
                          style={shadowProps.left.style}
                        />
                      )}
                      {shadowProps.right && (
                        <span
                          className={shadowProps.right.className}
                          style={shadowProps.right.style}
                        />
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24">
                <div className="flex items-center flex-1 flex-col my-4">
                  <SmileySadIcon
                    size={60}
                    className="text-muted-foreground"
                    weight="light"
                  />
                  <Text as="h5" className="text-muted-foreground">
                    No data available
                  </Text>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </table>
    </div>
  )
}

const DEFAULT_NUMBER_OF_ROWS = 10 as const

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string
    cellClassName?: string
    width?: string | number
    minWidth?: string | number
    maxWidth?: string | number
  }
}
