/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

interface Column<T> {
  header: string
  accessorKey: keyof T | string
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface AdminDataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (item: T) => void
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  pageNumber?: number
  onPageChange?: (pageNumber: number) => void
  hasNextPage?: boolean
  resultLabel?: string
}

export function AdminDataTable<T>({ 
  columns, 
  data, 
  isLoading, 
  onRowClick,
  searchPlaceholder = "Search...",
  onSearch,
  pageNumber = 1,
  onPageChange,
  hasNextPage = false,
  resultLabel,
}: AdminDataTableProps<T>) {
  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted size-4" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-brand-surface border border-border rounded-[8px] text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>
      )}

      <div className="rounded-[12px] border border-border bg-brand-surface overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-brand-navy/[0.02]">
            <TableRow className="hover:bg-transparent border-b border-border">
              {columns.map((column, i) => (
                <TableHead 
                  key={i} 
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider text-brand-muted h-12",
                    column.width && `w-[${column.width}]`
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-brand-muted">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => (
                <TableRow 
                  key={i} 
                  className={cn(
                    "hover:bg-brand-navy/[0.02] cursor-pointer transition-colors border-b border-border last:border-0",
                    i % 2 === 1 && "bg-brand-navy/[0.01]"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column, j) => (
                    <TableCell key={j} className="py-4 text-sm text-brand-navy font-medium">
                      {column.cell ? column.cell(item) : (item as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-brand-muted">
          {resultLabel || (
            <>
              Showing <span className="font-medium text-brand-navy">{data.length}</span> results
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded-md border border-border hover:bg-brand-navy/5 disabled:opacity-50"
            disabled={pageNumber <= 1}
            onClick={() => onPageChange?.(pageNumber - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="p-1 rounded-md border border-border hover:bg-brand-navy/5 disabled:opacity-50"
            disabled={!hasNextPage}
            onClick={() => onPageChange?.(pageNumber + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
