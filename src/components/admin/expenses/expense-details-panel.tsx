import React from "react";
import Link from "next/link";
import { ExpenseRecord, getExpenseBusinessName } from "@/types/expenses";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface ExpenseDetailsPanelProps {
  expense: ExpenseRecord;
  onClose?: () => void;
  onDelete?: (id: string) => void;
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

export function ExpenseDetailsPanel({
  expense,
  onClose,
  onDelete,
}: ExpenseDetailsPanelProps) {
  const codeDisplay = expense.expenseCode || expense.id;
  const amountVal = Number(expense.amount ?? expense.amountAED ?? 0);
  const entityDisplay = getExpenseBusinessName(expense);
  const categoryDisplay = CategoryLabelMap[expense.category] || expense.category;
  const paymentMethodDisplay = expense.paymentMethod || expense.details?.disbursedBy || "—";

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Panel Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-950 font-mono">
              Expense: {codeDisplay}
            </h2>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase ${
                expense.status === "CLEARED"
                  ? "text-white bg-[#0c0d12]"
                  : "text-gray-600 border border-gray-300 bg-white"
              }`}
            >
              {expense.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
            <span>Business: {entityDisplay}</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-gray-400">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(expense.id)}
            className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors shadow-2xs cursor-pointer"
          >
            Delete Expense
          </button>
        )}
      </div>

      {/* SECTION 1: SETTLED AMOUNT */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            RECORDED AMOUNT
          </span>
          <span className="text-xl sm:text-2xl font-black text-gray-950">
            AED {amountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500">Payment / Disbursement Method:</span>
            <span className="font-semibold text-gray-900">
              {paymentMethodDisplay}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-gray-500">Expense Classification:</span>
            <span className="font-semibold text-gray-900">
              {categoryDisplay}
            </span>
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-gray-200/60 sm:col-span-2">
            <span className="text-gray-500">Description / Purpose:</span>
            <span className="font-semibold text-gray-900">
              {expense.description}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: LINKED TRANSACTIONS */}
      {expense.details?.linkedContracts && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            LINKED TRANSACTIONS
          </span>

          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-xs bg-white">
            {/* Purchase Link */}
            {expense.details.linkedContracts.purchaseId && (
              <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🛒</span>
                  <span className="font-semibold text-gray-900">
                    Purchase: {expense.details.linkedContracts.purchaseId} (AED{" "}
                    {Number(expense.details.linkedContracts.purchaseCostAED || 0).toLocaleString()})
                  </span>
                </div>
                <Link
                  href="/purchases"
                  className="inline-flex items-center gap-1 font-semibold text-xs text-gray-800 hover:text-black"
                >
                  <span>Open</span>
                  <ArrowRightIcon size={12} />
                </Link>
              </div>
            )}

            {/* Sale Link */}
            {expense.details.linkedContracts.saleId && (
              <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🏷️</span>
                  <span className="font-semibold text-gray-900">
                    Sale: {expense.details.linkedContracts.saleId} (AED{" "}
                    {Number(expense.details.linkedContracts.saleRealizationAED || 0).toLocaleString()})
                  </span>
                </div>
                <Link
                  href="/sales"
                  className="inline-flex items-center gap-1 font-semibold text-xs text-gray-800 hover:text-black"
                >
                  <span>Open</span>
                  <ArrowRightIcon size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
