import React from "react";
import { ExpenseImpactData } from "@/types/profit-loss";

export interface ExpenseImpactPanelProps {
  expenseImpact?: ExpenseImpactData;
}

export function ExpenseImpactPanel({ expenseImpact }: ExpenseImpactPanelProps) {
  const expenseToSalesRatio = expenseImpact?.expenseToSalesRatio ?? 0;
  const expenseToGrossProfitRatio = expenseImpact?.expenseToGrossProfitRatio ?? 0;
  const topCostCenterTitle = expenseImpact?.topCostCenterTitle ?? "GENERAL OVERHEAD";
  const topCostCenterAmountAED = expenseImpact?.topCostCenterAmountAED ?? 0;
  const topCostCenterPercent = expenseImpact?.topCostCenterPercent ?? 0;

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h2 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
          EXPENSE IMPACT
        </h2>
        <span className="text-gray-400">📊</span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-gray-700">
          <span>Expense / Sales Ratio:</span>
          <span className="font-bold text-gray-950">{expenseToSalesRatio.toFixed(2)}%</span>
        </div>

        <div className="flex items-center justify-between text-gray-700">
          <span>Expense / Gross Profit:</span>
          <span className="font-bold text-gray-950">{expenseToGrossProfitRatio.toFixed(2)}%</span>
        </div>

        {/* Top Cost Center Callout Box */}
        <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50/70 text-[11px] leading-relaxed text-gray-700 font-medium">
          <span className="font-bold text-gray-900 block mb-0.5">
            TOP COST CENTER:
          </span>
          {topCostCenterTitle.toUpperCase()} (AED {topCostCenterAmountAED.toLocaleString()} CONSOLIDATED, {topCostCenterPercent.toFixed(1)}% OF TOTAL EXPENSES).
        </div>
      </div>
    </div>
  );
}
