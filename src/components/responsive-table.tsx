import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

// Types for responsive table
export interface Column<T> {
  id: string
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
  hideOnMobile?: boolean
  priority?: 'primary' | 'secondary' | 'tertiary'
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  onRowClick?: (row: T) => void
  emptyMessage?: string
  mobileCardRender?: (row: T, index: number) => React.ReactNode
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  onRowClick,
  emptyMessage = 'No data available',
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedRows(newExpanded)
  }

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row)
    }
    return row[column.accessor] as React.ReactNode
  }

  const primaryColumns = columns.filter((c) => c.priority === 'primary' || !c.hideOnMobile)
  const secondaryColumns = columns.filter((c) => c.hideOnMobile)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={String(row[keyField])}
                className={cn(
                  'border-b transition-colors hover:bg-muted/50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn('px-4 py-3 text-sm', column.className)}
                  >
                    {getCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => {
          const key = String(row[keyField])
          const isExpanded = expandedRows.has(key)

          if (mobileCardRender) {
            return (
              <div key={key} onClick={() => onRowClick?.(row)}>
                {mobileCardRender(row, index)}
              </div>
            )
          }

          return (
            <Card
              key={key}
              className={cn(
                'overflow-hidden transition-shadow',
                onRowClick && 'cursor-pointer active:bg-muted/50'
              )}
            >
              <CardContent className="p-4">
                {/* Primary content - always visible */}
                <div
                  className="flex items-start justify-between gap-4"
                  onClick={() => onRowClick?.(row)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    {primaryColumns.slice(0, 2).map((column) => (
                      <div key={column.id} className="truncate">
                        {column.priority === 'primary' ? (
                          <div className="font-medium">{getCellValue(row, column)}</div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {getCellValue(row, column)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick info badges */}
                  <div className="flex flex-col items-end gap-1">
                    {primaryColumns.slice(2, 4).map((column) => (
                      <div key={column.id} className="text-sm">
                        {getCellValue(row, column)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expandable secondary content */}
                {secondaryColumns.length > 0 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleRow(key)
                      }}
                      className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Show more
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {secondaryColumns.map((column) => (
                          <div key={column.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{column.header}</span>
                            <span>{getCellValue(row, column)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

// Mobile-first list item component
interface MobileListItemProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  meta?: string
  icon?: React.ReactNode
  onClick?: () => void
  actions?: React.ReactNode
}

export function MobileListItem({
  title,
  subtitle,
  badge,
  meta,
  icon,
  onClick,
  actions,
}: MobileListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 bg-card rounded-lg border',
        onClick && 'cursor-pointer active:bg-muted/50'
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
        {meta && (
          <p className="text-xs text-muted-foreground mt-1">{meta}</p>
        )}
      </div>

      {actions && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  )
}
