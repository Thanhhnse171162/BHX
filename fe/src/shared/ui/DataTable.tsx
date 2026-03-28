'use client'

import React, { ReactNode } from 'react'

interface Column<T extends object> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], item: T) => ReactNode
  width?: string
}

interface DataTableProps<T extends object> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onRowClick?: (item: T) => void
  className?: string
}

function DataTableInner<T extends object>(
  { data, columns, loading = false, onRowClick, className = '' }: DataTableProps<T>,
  ref: React.Ref<HTMLTableElement>
) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table ref={ref} className={`w-full border-collapse bg-white rounded-lg shadow ${className}`}>
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width }}
                className="px-6 py-3 text-left text-base font-semibold text-gray-800 tracking-wide uppercase"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-700">
                    {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

const DataTableComponent = React.forwardRef(DataTableInner)
DataTableComponent.displayName = 'DataTable'

export const DataTable = DataTableComponent as <T extends object>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLTableElement> }
) => React.ReactElement | null

export default DataTable
