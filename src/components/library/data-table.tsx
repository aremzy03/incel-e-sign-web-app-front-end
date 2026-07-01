import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface DataTableColumn<T> {
  key: string
  header: string
  className?: string
  hideOnMobile?: boolean
  render: (row: T) => React.ReactNode
  mobileLabel?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  selectable?: boolean
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
  rowActions?: (row: T) => React.ReactNode
  className?: string
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectable,
  selectedKeys,
  onSelectionChange,
  rowActions,
  className,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-body-sm text-muted">{emptyMessage}</p>
    )
  }

  const toggleRow = (key: string) => {
    if (!onSelectionChange || !selectedKeys) return
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSelectionChange(next)
  }

  const toggleAll = () => {
    if (!onSelectionChange || !selectedKeys) return
    if (selectedKeys.size === data.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map(keyExtractor)))
    }
  }

  return (
    <>
      {/* Desktop table */}
      <div className={cn('hidden overflow-x-auto md:block', className)}>
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedKeys?.size === data.length && data.length > 0}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="rounded border-border text-secondary focus:ring-status-your-turn"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'text-caption-xs font-semibold uppercase tracking-wider text-muted',
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const key = keyExtractor(row)
              return (
                <TableRow
                  key={key}
                  className={cn(
                    'border-border transition-colors hover:bg-surface-container-low',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedKeys?.has(key)}
                        onChange={() => toggleRow(key)}
                        aria-label={`Select row ${key}`}
                        className="rounded border-border text-secondary focus:ring-status-your-turn"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>{rowActions(row)}</TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => {
          const key = keyExtractor(row)
          return (
            <div
              key={key}
              className={cn(
                'rounded-xl border border-border bg-surface-container-lowest p-4 shadow-card',
                onRowClick && 'cursor-pointer active:bg-surface-container-low',
              )}
              onClick={() => onRowClick?.(row)}
            >
              <div className="flex items-start justify-between gap-2">
                {selectable && (
                  <input
                    type="checkbox"
                    checked={selectedKeys?.has(key)}
                    onChange={() => toggleRow(key)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select row ${key}`}
                    className="mt-1 rounded border-border text-secondary"
                  />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  {columns
                    .filter((c) => !c.hideOnMobile)
                    .map((col) => (
                      <div key={col.key} className="flex items-start justify-between gap-2">
                        <span className="text-caption-xs font-medium uppercase text-muted">
                          {col.mobileLabel ?? col.header}
                        </span>
                        <span className="text-right text-body-sm text-on-surface">{col.render(row)}</span>
                      </div>
                    ))}
                </div>
                {rowActions && (
                  <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
