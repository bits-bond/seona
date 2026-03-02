"use client";

import { useState, useMemo } from "react";
import { Table, Input, Button } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

/**
 * Generic sortable/filterable table using HeroUI Table compound components
 * with pagination and optional search.
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

function getNestedValue(obj: unknown, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

export function DataTable<T extends Record<string, unknown>>({
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
        <Input
          placeholder="Search..."
          value={search}
          onValueChange={handleSearch}
          startContent={<Search className="size-4 text-muted-foreground" />}
          className="max-w-sm"
          size="sm"
        />
      )}

      <Table aria-label="Data table">
        <Table.Header>
          {columns.map((col) => (
            <Table.Column key={col.key}>
              {col.sortable ? (
                <button
                  type="button"
                  className="inline-flex items-center font-medium hover:text-foreground"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon columnKey={col.key} />
                </button>
              ) : (
                col.label
              )}
            </Table.Column>
          ))}
        </Table.Header>
        <Table.Body>
          {paginatedData.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length}>
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              </Table.Cell>
            </Table.Row>
          ) : (
            paginatedData.map((item, rowIndex) => (
              <Table.Row key={(item.id as string) ?? rowIndex}>
                {columns.map((col) => (
                  <Table.Cell key={col.key}>
                    {col.render
                      ? col.render(item)
                      : (getNestedValue(item, col.key) as React.ReactNode) ?? "—"}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {safeCurrentPage} of {totalPages} ({sortedData.length} items)
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              isDisabled={safeCurrentPage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="flat"
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
