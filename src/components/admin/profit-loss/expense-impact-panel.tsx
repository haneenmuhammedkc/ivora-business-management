import React from "react";
import { ExpenseImpactData } from "@/types/profit-loss";

export interface ExpenseImpactPanelProps {
  expenseImpact?: ExpenseImpactData;
}

export function ExpenseImpactPanel({ expenseImpact }: ExpenseImpactPanelProps) {
  const expenseToSalesRatio = expenseImpact?.expenseToSalesRatio ?? 0;
  const expenseToGrossProfitRatio = expenseImpact?.expenseToGrossProfitRatio ?? 0;
  const topCostCenterTitle = expenseImpact?.topCostCenterTitle ?? "General Overhead";
  const topCostCenterAmountAED = expenseImpact?.topCostCenterAmountAED ?? 0;
  const topCostCenterPercent = expenseImpact?.topCostCenterPercent ?? 0;

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📊</span>
          <h2 className="text-sm font-bold text-gray-950 uppercase tracking-wide">
            EXPENSE SUMMARY & RATIOS
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Operational Overhead Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Metric 1: Expense to Sales */}
        <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Expense / Sales Ratio
          </span>
          <span className="text-base font-bold text-gray-950">
            {expenseToSalesRatio.toFixed(2)}%
          </span>
        </div>

        {/* Metric 2: Expense to Gross Profit */}
        <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Expense / Gross Profit
          </span>
          <span className="text-base font-bold text-gray-950">
            {expenseToGrossProfitRatio.toFixed(2)}%
          </span>
        </div>

        {/* Metric 3: Top Cost Center */}
        <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Top Cost Center
          </span>
          <span className="text-xs font-bold text-gray-950 truncate">
            {topCostCenterTitle} (AED {topCostCenterAmountAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {topCostCenterPercent.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// Alias
export const ExpenseSummaryPanel = ExpenseImpactPanel;
