import React from "react";
import Link from "next/link";
import { ExpenseRecord } from "@/types/expenses";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface ExpenseDetailsPanelProps {
  expense: ExpenseRecord;
  onClose?: () => void;
}

export function ExpenseDetailsPanel({
  expense,
  onClose,
}: ExpenseDetailsPanelProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Panel Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-950">
              Expense Details: {expense.id}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-white bg-[#0c0d12] rounded uppercase">
              {expense.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
            <span>Entity: {expense.entityLabel}</span>
            <span className="px-2 py-0.2 text-[10.5px] font-bold text-gray-800 border border-gray-300 rounded bg-gray-50">
              {expense.cycle}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-gray-400">
          <button
            type="button"
            className="p-1 rounded hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Expand"
            aria-label="Expand"
          >
            <span className="text-xs">⤢</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
        <button
          type="button"
          className="px-3.5 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
        >
          Edit Expense
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
        >
          Duplicate
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
        >
          Audit Trail
        </button>
      </div>

      {/* SECTION 1: SETTLED AMOUNT */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            SETTLED AMOUNT
          </span>
          <span className="text-xl sm:text-2xl font-black text-gray-950">
            AED {expense.details.settledAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-gray-500">Settlement Currency:</span>
            <span className="font-semibold text-gray-900">
              {expense.details.settlementCurrency}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-gray-500">Disbursed By:</span>
            <span className="font-semibold text-gray-900">
              {expense.details.disbursedBy}
            </span>
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-gray-200/60">
            <span className="text-gray-500">Expense Classification:</span>
            <span className="font-semibold text-gray-900">
              {expense.details.expenseClassification}
            </span>
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-gray-200/60">
            <span className="text-gray-500">Cycle Allocation:</span>
            <span className="font-semibold text-gray-900">
              {expense.details.cycleAllocation}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: CYCLE EXPENSE CATEGORY DISTRIBUTION */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
          CYCLE EXPENSE CATEGORY DISTRIBUTION
        </span>

        <div className="rounded-xl border border-gray-200 p-4 space-y-2.5 text-xs bg-white">
          <div className="flex items-center justify-between text-gray-700">
            <span>Delivery / Freight:</span>
            <span className="font-semibold text-gray-900">
              AED {expense.details.cycleCategoryDistribution.deliveryFreight.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span>Labour & Vault:</span>
            <span className="font-semibold text-gray-900">
              AED {expense.details.cycleCategoryDistribution.labourVault.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span>Processing & Assaying:</span>
            <span className="font-semibold text-gray-900">
              AED {expense.details.cycleCategoryDistribution.processingAssaying.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span>India Realization Exp:</span>
            <span className="font-semibold text-gray-900">
              AED {expense.details.cycleCategoryDistribution.indiaRealizationExp.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span>Transfer / FX Fees:</span>
            <span className="font-semibold text-gray-900">
              AED {expense.details.cycleCategoryDistribution.transferFxFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: CYCLE MARGINAL IMPACT */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
          CYCLE MARGINAL IMPACT
        </span>

        <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-gray-700">
            <span>Cycle Gross Spread:</span>
            <span className="font-semibold text-gray-900">
              AED {expense.details.cycleMarginalImpact.cycleGrossSpread.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span>This Record ({expense.ref}):</span>
            <span className="font-semibold text-gray-900">
              -AED {Math.abs(expense.details.cycleMarginalImpact.thisRecord).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span>Total Cycle Expenses:</span>
            <span className="font-semibold text-gray-900">
              -AED {Math.abs(expense.details.cycleMarginalImpact.totalCycleExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-bold text-gray-950">
            <span>Net Cycle Profit:</span>
            <span>
              AED {expense.details.cycleMarginalImpact.netCycleProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
              <span className="font-normal text-gray-500 text-[11px]">
                ({expense.details.cycleMarginalImpact.netCycleMargin.toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: LINKED CONTRACTS & COMMODITIES */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
          LINKED CONTRACTS & COMMODITIES
        </span>

        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-xs bg-white">
          {/* Purchase Link */}
          <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🛒</span>
              <span className="font-semibold text-gray-900">
                Purchase: {expense.details.linkedContracts.purchaseId} (AED{" "}
                {expense.details.linkedContracts.purchaseCostAED.toLocaleString()})
              </span>
            </div>
            <Link
              href="/purchase"
              className="inline-flex items-center gap-1 font-semibold text-xs text-gray-800 hover:text-black"
            >
              <span>Open</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>

          {/* Sale Link */}
          <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🏷️</span>
              <span className="font-semibold text-gray-900">
                Sale: {expense.details.linkedContracts.saleId} (AED{" "}
                {expense.details.linkedContracts.saleRealizationAED.toLocaleString()})
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

          {/* Cycle Link */}
          <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🔄</span>
              <span className="font-semibold text-gray-900">
                Cycle: {expense.details.linkedContracts.cycleId} (
                {expense.details.linkedContracts.cycleStatus})
              </span>
            </div>
            <Link
              href="/trading-cycle"
              className="inline-flex items-center gap-1 font-semibold text-xs text-gray-800 hover:text-black"
            >
              <span>Open</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
