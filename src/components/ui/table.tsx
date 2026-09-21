import React from "react";

export function TableContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-gray-200/90 bg-white ${className}`}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({
  children,
  className = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={`w-full text-left text-xs text-gray-900 ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-[#f8fafc] border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-gray-100 bg-white ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = "",
  selected = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      className={`transition-colors hover:bg-gray-50/70 ${
        selected ? "bg-gray-50/90" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-semibold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3.5 text-xs text-gray-900 ${className}`} {...props}>
      {children}
    </td>
  );
}

export interface TablePaginationProps {
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  rowsPerPage?: number;
  startRecord?: number;
  endRecord?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords,
  rowsPerPage = 10,
  startRecord = 1,
  endRecord = 3,
  className = "",
}: TablePaginationProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-200 text-xs text-gray-600 ${className}`}
    >
      <div className="flex items-center gap-2">
        {totalRecords !== undefined ? (
          <span>
            Showing <strong className="text-gray-900 font-semibold">{startRecord}-{endRecord}</strong> of{" "}
            <strong className="text-gray-900 font-semibold">{totalRecords}</strong> records
          </span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
        <span className="text-gray-300">•</span>
        <span>
          Rows per page: <strong className="text-gray-900 font-semibold">{rowsPerPage}</strong>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={currentPage <= 1}
          className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-black rounded">
          {currentPage}
        </span>
        <button
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
