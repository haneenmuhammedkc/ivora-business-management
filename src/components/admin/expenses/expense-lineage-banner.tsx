import React from "react";

export interface ExpenseLineageBannerProps {
  cycleId?: string;
  grossAED?: number;
  purchaseCostAED?: number;
  allocatedExpAED?: number;
  netProfitAED?: number;
  investorShareAED?: number;
  deskProfitAED?: number;
}

export function ExpenseLineageBanner({
  cycleId = "TR-0248",
  grossAED = 142000,
  purchaseCostAED = 112000,
  allocatedExpAED = 6000,
  netProfitAED = 24000,
  investorShareAED = 9600,
  deskProfitAED = 14400,
}: ExpenseLineageBannerProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-gray-700">
          CROSS-MODULE EXPENSE & PROFIT IMPACT LINEAGE • {cycleId}
        </span>
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
          STATUS: FULLY AUDITED
        </span>
      </div>

      {/* Horizontal Flow */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs pt-1">
        {/* Step 1: Gross */}
        <div className="flex items-baseline gap-1 font-medium">
          <span className="text-gray-500">Gross:</span>
          <span className="font-bold text-gray-900">
            AED {grossAED.toLocaleString()}
          </span>
        </div>

        <span className="text-gray-300 font-bold text-xs">→</span>

        {/* Step 2: Purchase */}
        <div className="flex items-baseline gap-1 font-medium">
          <span className="text-gray-500">Purchase:</span>
          <span className="font-bold text-gray-900">
            -AED {purchaseCostAED.toLocaleString()}
          </span>
        </div>

        <span className="text-gray-300 font-bold text-xs">→</span>

        {/* Step 3: Allocated Exp */}
        <div className="flex items-baseline gap-1 font-medium">
          <span className="text-gray-500">Allocated Exp:</span>
          <span className="font-bold text-gray-900">
            -AED {allocatedExpAED.toLocaleString()}
          </span>
        </div>

        <span className="text-gray-300 font-bold text-xs">→</span>

        {/* Step 4: Net Profit */}
        <div className="flex items-baseline gap-1 font-medium">
          <span className="text-gray-500">Net Profit:</span>
          <span className="font-bold text-gray-950">
            AED {netProfitAED.toLocaleString()}
          </span>
        </div>

        <span className="text-gray-300 font-bold text-xs">→</span>

        {/* Step 5: Investor (40%) */}
        <div className="flex items-baseline gap-1 font-medium">
          <span className="text-gray-500">Investor (40%):</span>
          <span className="font-bold text-gray-900">
            AED {investorShareAED.toLocaleString()}
          </span>
        </div>

        <span className="text-gray-300 font-bold text-xs">→</span>

        {/* Step 6: Desk Profit */}
        <div className="flex items-baseline gap-1 font-medium">
          <span className="text-gray-500">Desk Profit:</span>
          <span className="font-bold text-gray-900">
            AED {deskProfitAED.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
