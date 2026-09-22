import React from "react";
import { ExpenseRecord } from "@/types/expenses";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface ExpenseTableViewProps {
  expenses: ExpenseRecord[];
  selectedExpenseId: string | null;
  onSelectExpense: (expense: ExpenseRecord) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onMarkAsCleared?: () => void;
  onExportSelected?: () => void;
}

export function ExpenseTableView({
  expenses,
  selectedExpenseId,
  onSelectExpense,
  onToggleSelect,
  onSelectAll,
  onMarkAsCleared,
  onExportSelected,
}: ExpenseTableViewProps) {
  const allSelected = expenses.length > 0 && expenses.every((e) => e.selected);

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Expenses
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            24 Records
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkAsCleared}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Mark as Cleared
          </button>
          <button
            type="button"
            onClick={onExportSelected}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Export Selected
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="w-12 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                  aria-label="Select all expenses"
                />
              </th>
              <th className="px-3.5 py-3.5 font-bold">EXPENSE ID</th>
              <th className="px-3.5 py-3.5 font-bold">BUSINESS</th>
              <th className="px-3.5 py-3.5 font-bold">DATE</th>
              <th className="px-3.5 py-3.5 font-bold">CATEGORY</th>
              <th className="px-3.5 py-3.5 font-bold">DESCRIPTION</th>
              <th className="px-3.5 py-3.5 font-bold text-center">CYCLE</th>
              <th className="px-3.5 py-3.5 font-bold">REF</th>
              <th className="px-3.5 py-3.5 font-bold text-right">AMOUNT (AED)</th>
              <th className="px-3.5 py-3.5 font-bold text-center">STATUS</th>
              <th className="px-4 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  No expenses found matching your filters.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => {
                const isCurrent = exp.id === selectedExpenseId;
                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectExpense(exp)}
                    className={`transition-colors cursor-pointer hover:bg-gray-50/70 ${
                      isCurrent || exp.selected ? "bg-gray-50/60" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(exp.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!exp.selected}
                        onChange={() => onToggleSelect(exp.id)}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        aria-label={`Select expense ${exp.id}`}
                      />
                    </td>

                    {/* Expense ID */}
                    <td className="px-3.5 py-4">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                        {exp.id}
                      </span>
                    </td>

                    {/* Business */}
                    <td className="px-3.5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {exp.business}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          {exp.businessEntity}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3.5 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {exp.date}
                    </td>

                    {/* Category */}
                    <td className="px-3.5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
                        {exp.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-3.5 py-4">
                      <span className="text-xs text-gray-800 font-medium truncate block max-w-[180px]">
                        {exp.description}
                      </span>
                    </td>

                    {/* Cycle */}
                    <td className="px-3.5 py-4 text-center whitespace-nowrap">
                      <span className="font-bold text-gray-900 text-xs">
                        {exp.cycle}
                      </span>
                    </td>

                    {/* Ref */}
                    <td className="px-3.5 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500 font-mono">
                        {exp.ref}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-[13px] font-bold text-gray-950">
                        {exp.amountAED.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-4 text-center">
                      {exp.status === "CLEARED" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white bg-[#0c0d12] rounded uppercase">
                          CLEARED
                        </span>
                      )}
                      {exp.status === "PENDING" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-600 border border-gray-300 rounded uppercase">
                          PENDING
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectExpense(exp);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors shadow-2xs"
                      >
                        <span>View</span>
                        <ArrowRightIcon size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="font-semibold text-gray-900">1-{expenses.length}</strong> of{" "}
            <strong className="font-semibold text-gray-900">24</strong> expenses
          </span>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <span>Rows per page:</span>
            <select
              defaultValue="10"
              className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Prev
          </button>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#0c0d12] rounded">
            1
          </span>
          <button
            type="button"
            className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            2
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            3
          </button>
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
