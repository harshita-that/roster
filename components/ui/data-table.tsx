"use client";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchColumn?: string;
  isLoading?: boolean;
  totalPages?: number;
  page?: number;
  onPageChange?: (p: number) => void;
  total?: number;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search…",
  searchColumn,
  isLoading,
  totalPages,
  page = 1,
  onPageChange,
  total,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: !!onPageChange,
    pageCount: totalPages ?? -1,
  });

  const serverPagination = !!onPageChange;
  const currentPage = serverPagination ? page : table.getState().pagination.pageIndex + 1;
  const pages = serverPagination ? (totalPages ?? 1) : table.getPageCount();

  return (
    <div className="erp-card overflow-hidden">
      {/* Search */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 max-w-xs h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        {total !== undefined && (
          <span className="text-sm text-muted-foreground ml-auto">{total} total</span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full erp-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(header.column.getCanSort() && "cursor-pointer select-none")}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-muted-foreground">
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, c) => (
                    <td key={c}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-muted-foreground text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📭</span>
                    No records found
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Page {currentPage} of {pages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => serverPagination ? onPageChange!(page - 1) : table.previousPage()}
            disabled={serverPagination ? page <= 1 : !table.getCanPreviousPage()}
            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 text-muted-foreground transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => serverPagination ? onPageChange!(p) : table.setPageIndex(p - 1)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition",
                currentPage === p
                  ? "bg-indigo-600 text-white"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => serverPagination ? onPageChange!(page + 1) : table.nextPage()}
            disabled={serverPagination ? page >= pages : !table.getCanNextPage()}
            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 text-muted-foreground transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
