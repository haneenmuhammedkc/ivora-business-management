import React from "react";
import Link from "next/link";
import { ExpenseRecord, getExpenseBusinessName, getExpenseBusinessCode } from "@/types/expenses";

export interface ExpenseTableViewProps {
  expenses: ExpenseRecord[];
  selectedExpenseId?: string | null;
  onSelectExpense?: (expense: ExpenseRecord) => void;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onMarkAsCleared?: () => void;
  onExportSelected?: () => void;
  onDeleteExpense?: (id: string) => void;
  loading?: boolean;
}

const CategoryLabelMap: Record<string, string> = {
  DELIVERY_FREIGHT: "Delivery & Freight",
  "Delivery & Freight": "Delivery & Freight",
  "Delivery / Transport": "Delivery & Freight",
  LABOUR_VAULT: "Labour & Vault",
  Labour: "Labour & Vault",
  "Labour & Vault": "Labour & Vault",
  PROCESSING_ASSAYING: "Processing & Assaying",
  "Processing & Assaying": "Processing & Assaying",
  INDIA_EXPENSE: "India Expense",
  "India Expense": "India Expense",
  TRANSFER_FX_FEES: "Transfer & FX Fees",
  "Transfer / Conversion": "Transfer & FX Fees",
  "Transfer & FX Fees": "Transfer & FX Fees",
  GENERAL_OVERHEAD: "General Overhead",
  "Other Expense": "General Overhead",
  "General Overhead": "General Overhead",
};

export function ExpenseTableView({
  expenses,
  loading = false,
}: ExpenseTableViewProps) {
  const formatDate = (dateVal: string | Date | undefined) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Expenses
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {expenses.length} {expenses.length === 1 ? "Record" : "Records"}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-3.5 py-3.5 font-bold">EXPENSE CODE</th>
              <th className="px-3.5 py-3.5 font-bold">BUSINESS</th>
              <th className="px-3.5 py-3.5 font-bold">DATE</th>
              <th className="px-3.5 py-3.5 font-bold">CATEGORY</th>
              <th className="px-3.5 py-3.5 font-bold">DESCRIPTION</th>
              <th className="px-3.5 py-3.5 font-bold">PAYMENT METHOD</th>
              <th className="px-3.5 py-3.5 font-bold text-right">AMOUNT (AED)</th>
              <th className="px-3.5 py-3.5 font-bold text-center">STATUS</th>
              <th className="px-4 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  Loading expenses...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  No expenses found matching your filters.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => {
                const businessDisplay = getExpenseBusinessName(exp);
                const businessCode = getExpenseBusinessCode(exp);
                const codeDisplay = exp.expenseCode || exp.id;
                const amountVal = Number(exp.amount ?? exp.amountAED ?? 0);
                const categoryLabel = CategoryLabelMap[exp.category] || exp.category;

                return (
                  <tr
                    key={exp.id}
                    className="transition-colors hover:bg-gray-50/70"
                  >
                    {/* Expense Code */}
                    <td className="px-3.5 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px] font-mono">
                        {codeDisplay}
                      </span>
                    </td>

                    {/* Business */}
                    <td className="px-3.5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {businessDisplay}
                        </span>
                        {businessCode && (
                          <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                            {businessCode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3.5 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {formatDate(exp.expenseDate || exp.date)}
                    </td>

                    {/* Category */}
                    <td className="px-3.5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
                        {categoryLabel}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-3.5 py-4">
                      <span className="text-xs text-gray-800 font-medium truncate block max-w-[200px]" title={exp.description}>
                        {exp.description}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-3.5 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-600 font-medium truncate block max-w-[150px]" title={exp.paymentMethod || "—"}>
                        {exp.paymentMethod || "—"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-[13px] font-bold text-gray-950">
                        {amountVal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-4 text-center whitespace-nowrap">
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
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <Link
                        href={`/expenses/${exp.id}/edit`}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs"
                      >
                        Edit
                      </Link>
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
            Showing <strong className="font-semibold text-gray-900">{expenses.length > 0 ? `1-${expenses.length}` : "0"}</strong> of{" "}
            <strong className="font-semibold text-gray-900">{expenses.length}</strong> expenses
          </span>
        </div>
      </div>
    </div>
  );
}
