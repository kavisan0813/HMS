import React, { useState, useMemo } from "react";
import { ArrowUpDown, Users, Search, X } from "lucide-react";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  visible?: boolean;
  className?: string;
  headerClassName?: string;
  getValue?: (item: T) => string | number | boolean | null | undefined;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  getRowId?: (item: T, index: number) => string | number;
  selectedRowId?: string | number | null;
  onRowClick?: (item: T) => void;
  // Toolbar & Title Header Options
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerBadge?: React.ReactNode;
  toolbar?: React.ReactNode;
  // Built-in Search Filter Options
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  // Empty State Options
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  // Pagination Options
  pagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  // Custom Styling
  className?: string;
  tableClassName?: string;
  maxHeightClass?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  getRowId,
  selectedRowId,
  onRowClick,
  title,
  subtitle,
  headerBadge,
  toolbar,
  searchable = false,
  searchPlaceholder = "Search in table...",
  searchValue,
  onSearchChange,
  emptyTitle = "No records found.",
  emptySubtitle = "Try adjusting your search query or filters to view records.",
  emptyIcon = <Users size={28} />,
  emptyAction,
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  totalCount,
  className = "",
  tableClassName = "",
  maxHeightClass = "max-h-140",
}: DataTableProps<T>) {
  // Filter visible columns
  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible !== false),
    [columns],
  );

  // Internal Search State
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery =
    searchValue !== undefined ? searchValue : internalSearchQuery;

  const handleQueryChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearchQuery(val);
    }
  };

  // Search filtering logic across data
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return data;

    const q = searchQuery.toLowerCase().trim();
    return data.filter((item) => {
      return visibleColumns.some((col) => {
        let val: unknown;
        if (col.getValue) {
          val = col.getValue(item);
        } else {
          val = (item as Record<string, unknown>)[col.key];
        }
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, searchable, searchQuery, visibleColumns]);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string, sortable = true) => {
    if (!sortable) return;
    if (sortColumn === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    const targetColumn = visibleColumns.find((c) => c.key === sortColumn);

    return filteredData.toSorted((a, b) => {
      let valA: unknown;
      let valB: unknown;

      if (targetColumn?.getValue) {
        valA = targetColumn.getValue(a);
        valB = targetColumn.getValue(b);
      } else {
        valA = (a as Record<string, unknown>)[sortColumn];
        valB = (b as Record<string, unknown>)[sortColumn];
      }

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection, visibleColumns]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalElements =
    totalCount !== undefined ? totalCount : sortedData.length;
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, pagination, safeCurrentPage, pageSize]);

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col space-y-4 p-5 ${className}`}
    >
      {/* Hide scrollbar styles for clean visual presentation */}
      <style>{`
        .table-no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .table-no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Header / Title Bar */}
      {(title || subtitle || headerBadge) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div>
            {title && (
              <h2
                className="text-base font-bold text-[#111827] flex items-center gap-2"
                style={{ fontFamily: PP }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-xs text-[#64748B] mt-0.5"
                style={{ fontFamily: RB }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerBadge && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              {headerBadge}
            </div>
          )}
        </div>
      )}

      {/* Built-in Search Input Bar */}
      {searchable && (
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search table"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              handleQueryChange(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:bg-white focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] shadow-2xs transition-all text-[#111827] placeholder:text-slate-400 font-medium"
            style={{ fontFamily: RB }}
          />
          {searchQuery && (
            <button
              onClick={() => handleQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Toolbar / Search & Filters slot */}
      {toolbar}

      {/* Table Data Grid */}
      {loading ? (
        <div className="p-6 space-y-3 animate-pulse">
          <div className="h-10 bg-slate-100 rounded-xl w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 bg-slate-50 rounded-xl w-full flex items-center justify-between px-4"
            >
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-36 h-4 bg-slate-200 rounded" />
              <div className="w-24 h-4 bg-slate-200 rounded" />
              <div className="w-28 h-4 bg-slate-200 rounded" />
              <div className="w-16 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : sortedData.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0D47A1] flex items-center justify-center mb-3 shadow-inner">
            {emptyIcon}
          </div>
          <h3
            className="text-base font-bold text-[#111827] mb-1"
            style={{ fontFamily: PP }}
          >
            {emptyTitle}
          </h3>
          <p
            className="text-xs text-[#64748B] max-w-sm mb-4"
            style={{ fontFamily: RB }}
          >
            {emptySubtitle}
          </p>
          {emptyAction}
        </div>
      ) : (
        <div
          className={`border border-[#E5E7EB] rounded-xl overflow-x-auto ${maxHeightClass} overflow-y-auto table-no-scrollbar shadow-2xs relative`}
        >
          <table
            className={`w-full border-collapse text-left text-xs ${tableClassName}`}
          >
            {/* Sticky Header with Appointment Management visual language */}
            <thead className="sticky top-0 z-20 bg-[#F1F5F9] border-b-2 border-[#E5E7EB] text-[#0D47A1] uppercase tracking-wider text-xs font-extrabold shadow-xs">
              <tr style={{ fontFamily: PP }}>
                {visibleColumns.map((col) => {
                  const isSortable = col.sortable !== false;
                  const alignClass =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left";

                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key, isSortable)}
                      className={`px-4 py-4.5 ${
                        isSortable
                          ? "cursor-pointer hover:text-[#0c3d8a] transition-colors"
                          : "cursor-default"
                      } border-r border-slate-200/70 last:border-r-0 ${alignClass} ${col.headerClassName || ""}`}
                      style={{ fontFamily: PP }}
                    >
                      <div
                        className={`flex items-center gap-1.5 ${
                          col.align === "right"
                            ? "justify-end"
                            : col.align === "center"
                              ? "justify-center"
                              : "justify-start"
                        }`}
                      >
                        <span className="text-xs font-extrabold tracking-wide">
                          {col.label}
                        </span>
                        {isSortable && (
                          <ArrowUpDown
                            size={14}
                            className="text-[#0D47A1]/80"
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-[#111827]">
              {paginatedData.map((item, idx) => {
                const itemKey =
                  (item as Record<string, unknown>)?.id ??
                  (item as Record<string, unknown>)?.key ??
                  (item as Record<string, unknown>)?.uuid ??
                  (item as Record<string, unknown>)?.code ??
                  (item as Record<string, unknown>)?.name;
                const rowId = getRowId
                  ? getRowId(item, idx)
                  : (itemKey as string | number);
                const isSelected =
                  selectedRowId !== undefined && selectedRowId !== null
                    ? String(selectedRowId) === String(rowId)
                    : false;

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(item)}
                    className={`hover:bg-blue-50/40 transition-colors group ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${isSelected ? "bg-blue-50/70" : ""}`}
                  >
                    {visibleColumns.map((col) => {
                      const value = col.getValue
                        ? col.getValue(item)
                        : (item as Record<string, unknown>)[col.key];

                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3.5 whitespace-nowrap ${col.className || ""}`}
                        >
                          {col.render
                            ? col.render(item, idx)
                            : ((value as React.ReactNode) ?? "-")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && !loading && sortedData.length > 0 && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span>
              Showing{" "}
              <span className="font-bold text-[#111827]">
                {(safeCurrentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-[#111827]">
                {Math.min(safeCurrentPage * pageSize, sortedData.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#111827]">
                {sortedData.length}
              </span>{" "}
              records (total {totalElements})
            </span>
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
              <span>Rows:</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E5E7EB] rounded-lg px-2 py-1 font-semibold text-[#111827] outline-none cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-[#E5E7EB] rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    safeCurrentPage === p
                      ? "bg-[#0D47A1] text-white"
                      : "bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              disabled={safeCurrentPage >= totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-[#E5E7EB] rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
