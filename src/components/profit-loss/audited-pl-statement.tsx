import React from "react";
import { ProfitLossStatementData } from "@/types/profit-loss";

export interface AuditedPLStatementProps {
  statement: ProfitLossStatementData;
}

export function AuditedPLStatement({ statement }: AuditedPLStatementProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📄</span>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
            AUDITED PROFIT & LOSS STATEMENT
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          IFRS-9 / DIFC Compliant Ledger
        </span>
      </div>

      <div className="p-5 space-y-4 text-xs">
        {/* 1. TRADING REVENUE */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            1. TRADING REVENUE
          </span>
          <div className="space-y-1.5 pl-2">
            {statement.tradingRevenue.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-800">
                <span>{item.title}</span>
                <span className="font-semibold text-gray-900">
                  AED {item.amountAED.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between font-bold text-gray-950">
            <span className="uppercase text-[11px] tracking-wider">TOTAL REVENUE</span>
            <span>AED {statement.totalRevenueAED.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. COST OF BULLION PURCHASED */}
        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            2. COST OF BULLION PURCHASED
          </span>
          <div className="space-y-1.5 pl-2">
            {statement.costOfBullion.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-800">
                <span>{item.title}</span>
                <span className="font-semibold text-gray-900">
                  AED {item.amountAED.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between font-bold text-gray-950">
            <span className="uppercase text-[11px] tracking-wider">TOTAL PURCHASE COST</span>
            <span>AED {statement.totalPurchaseCostAED.toLocaleString()}</span>
          </div>
        </div>

        {/* GROSS PROFIT HIGHLIGHT */}
        <div className="h-10 px-4 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950">
          <span className="uppercase text-xs tracking-wider">
            GROSS PROFIT (SPREAD MARGIN: {statement.grossSpreadMarginPercent.toFixed(2)}%)
          </span>
          <span className="text-sm font-black">
            AED {statement.grossProfitAED.toLocaleString()}
          </span>
        </div>

        {/* 3. OPERATING & TRADING LOGISTICS EXPENSES */}
        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            3. OPERATING & TRADING LOGISTICS EXPENSES
          </span>
          <div className="space-y-1.5 pl-2">
            {statement.operatingExpenses.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-gray-700">
                <span>{item.title}</span>
                <span className="font-semibold text-gray-900">
                  AED {item.amountAED.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="h-9 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between font-bold text-gray-950">
            <span className="uppercase text-[11px] tracking-wider">TOTAL EXPENSES</span>
            <span>AED {statement.totalExpensesAED.toLocaleString()}</span>
          </div>
        </div>

        {/* AUDITED NET PROFIT HIGHLIGHT */}
        <div className="h-11 px-4 rounded-lg bg-[#0c0d12] text-white flex items-center justify-between font-bold shadow-xs">
          <span className="uppercase text-xs tracking-wider">
            AUDITED NET PROFIT{" "}
            <span className="text-gray-400 font-normal">
              (Net Margin: {statement.netMarginPercent.toFixed(2)}%)
            </span>
          </span>
          <span className="text-base sm:text-lg font-black">
            AED {statement.auditedNetProfitAED.toLocaleString()}
          </span>
        </div>

        {/* 4. POST-NET WATERFALL ALLOCATIONS */}
        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            4. POST-NET WATERFALL ALLOCATIONS
          </span>
          <div className="flex items-center justify-between text-gray-700 pl-2">
            <span>
              Less Contracted Investor Share (Aggregate{" "}
              {statement.investorSharePercent.toFixed(2)}%)
            </span>
            <span className="font-semibold text-gray-900">
              - AED {statement.investorShareAED.toLocaleString()}
            </span>
          </div>
        </div>

        {/* NET DESK RETAINED PROFIT HIGHLIGHT */}
        <div className="h-10 px-4 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950">
          <span className="uppercase text-xs tracking-wider">
            NET DESK RETAINED PROFIT ({statement.deskRetainedPercent.toFixed(2)}%)
          </span>
          <span className="text-sm font-black">
            AED {statement.netDeskRetainedProfitAED.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
