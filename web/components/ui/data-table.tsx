"use client";

import { useState, useMemo } from "react";
import { Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

/**
 * Generic sortable/filterable data table with pagination and optional search.
 * Uses plain HTML table styled with Tailwind for maximum compatibility.
 */
export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: string[];
  emptyMessage?: string;
  className?: string;
}

function getNestedValue(obj: object, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

export function DataTable<T extends object>({
  data,
  columns,
  pageSize = 10,
  searchable = false,
  searchKeys,
  emptyMessage = "No data found",
  className,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search || !searchable) return data;
    const term = search.toLowerCase();
    const keys = searchKeys ?? columns.map((c) => c.key);
    return data.filter((item) =>
      keys.some((key) => {
        const val = getNestedValue(item, key);
        return val != null && String(val).toLowerCase().includes(term);
      })
    );
  }, [data, search, searchable, searchKeys, columns]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = getNestedValue(a, sortColumn);
      const bVal = getNestedValue(b, sortColumn);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  function handleSort(key: string) {
    if (sortColumn === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sortColumn !== columnKey) return <ChevronsUpDown className="ml-1 inline size-3 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 inline size-3" />
    ) : (
      <ChevronDown className="ml-1 inline size-3" />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-divider bg-transparent pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-divider">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider bg-content2/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-foreground/70">
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center hover:text-foreground"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon columnKey={col.key} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <tr
                  key={('id' in item ? String(item.id) : null) ?? rowIndex}
                  className="border-b border-divider last:border-b-0 hover:bg-content2/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render
                        ? col.render(item)
                        : (getNestedValue(item, col.key) as React.ReactNode) ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {safeCurrentPage} of {totalPages} ({sortedData.length} items)
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              isDisabled={safeCurrentPage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isDisabled={safeCurrentPage >= totalPages}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
