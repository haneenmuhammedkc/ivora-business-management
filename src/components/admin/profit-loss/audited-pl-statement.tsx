import React from "react";
import { ProfitLossStatementData } from "@/types/profit-loss";

export interface AuditedPLStatementProps {
  statement?: ProfitLossStatementData;
}

export function AuditedPLStatement({ statement }: AuditedPLStatementProps) {
  const tradingRevenue = statement?.tradingRevenue ?? [];
  const totalRevenueAED = statement?.totalRevenueAED ?? 0;
  const costOfBullion = statement?.costOfBullion ?? [];
  const totalPurchaseCostAED = statement?.totalPurchaseCostAED ?? 0;
  const grossProfitAED = statement?.grossProfitAED ?? 0;
  const grossSpreadMarginPercent = statement?.grossSpreadMarginPercent ?? 0;
  const operatingExpenses = statement?.operatingExpenses ?? [];
  const totalExpensesAED = statement?.totalExpensesAED ?? 0;
  const netProfitAED = statement?.netProfitAED ?? statement?.auditedNetProfitAED ?? 0;
  const netMarginPercent = statement?.netMarginPercent ?? 0;

  // Format line item titles to simple business terms
  const formatRevenueTitle = (title: string) => {
    if (title.includes("India Sales") || title.includes("Realization Protocol") || title.includes("Sales Transactions")) {
      return "Sales";
    }
    return title;
  };

  const formatPurchaseTitle = (title: string) => {
    if (title.includes("Dubai Physical Bullion") || title.includes("Fine Sourcing") || title.includes("Purchase Transactions")) {
      return "Purchase Cost";
    }
    return title;
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📄</span>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
            PROFIT & LOSS STATEMENT
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Transaction-Based Performance
        </span>
      </div>

      <div className="p-5 space-y-4 text-xs">
        {/* 1. TOTAL SALES / REVENUE */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            1. REVENUE (TOTAL SALES)
          </span>
          <div className="space-y-1.5 pl-2">
            {tradingRevenue.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-800">
                <span>{formatRevenueTitle(item.title)}</span>
                <span className="font-semibold text-gray-900">
                  AED {item.amountAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          <div className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between font-bold text-gray-950">
            <span className="uppercase text-[11px] tracking-wider">TOTAL SALES</span>
            <span>AED {totalRevenueAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* 2. PURCHASE COST */}
        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            2. LESS: PURCHASE COST
          </span>
          <div className="space-y-1.5 pl-2">
            {costOfBullion.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-800">
                <span>{formatPurchaseTitle(item.title)}</span>
                <span className="font-semibold text-gray-900">
                  AED {item.amountAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          <div className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between font-bold text-gray-950">
            <span className="uppercase text-[11px] tracking-wider">PURCHASE COST</span>
            <span>AED {totalPurchaseCostAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* GROSS PROFIT HIGHLIGHT */}
        <div className="h-10 px-4 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950">
          <span className="uppercase text-xs tracking-wider">
            GROSS PROFIT (Gross Margin: {grossSpreadMarginPercent.toFixed(2)}%)
          </span>
          <span className="text-sm font-black">
            AED {grossProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* 3. OPERATING EXPENSES */}
        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            3. LESS: OPERATING EXPENSES
          </span>
          <div className="space-y-1.5 pl-2">
            {operatingExpenses.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-700">
                <span>{item.title}</span>
                <span className="font-semibold text-gray-900">
                  AED {item.amountAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          <div className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between font-bold text-gray-950">
            <span className="uppercase text-[11px] tracking-wider">OPERATING EXPENSES</span>
            <span>AED {totalExpensesAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* NET PROFIT HIGHLIGHT */}
        <div className="h-11 px-4 rounded-lg bg-[#0c0d12] text-white flex items-center justify-between font-bold shadow-xs">
          <span className="uppercase text-xs tracking-wider">
            NET PROFIT{" "}
            <span className="text-gray-400 font-normal">
              (Net Margin: {netMarginPercent.toFixed(2)}%)
            </span>
          </span>
          <span className="text-base sm:text-lg font-black">
            AED {netProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

// Alias for clean import
export const ProfitLossStatement = AuditedPLStatement;
