import React from "react";

export function InvestorAllocationsPanel() {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h2 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
          INVESTOR ALLOCATIONS
        </h2>
        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
          NET AED 37,350
        </span>
      </div>

      {/* Allocation Ratio Bar */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
          <span>Investor Share: 40% (AED 14,940)</span>
          <span>Desk: 60% (AED 22,410)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden flex">
          <div className="h-full bg-gray-900 w-[40%]" />
          <div className="h-full bg-gray-500 w-[60%]" />
        </div>
      </div>

      {/* Partner Cards */}
      <div className="space-y-2.5 text-xs">
        {/* Partner B */}
        <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2">
          <div className="flex items-center justify-between font-bold text-gray-950">
            <span>Partner B (Business 01)</span>
            <span>AED 9,600.00</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Paid: AED 6,000.00</span>
            <span className="text-gray-700 font-semibold">Pending: AED 3,600.00</span>
          </div>
        </div>

        {/* Partner C */}
        <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2">
          <div className="flex items-center justify-between font-bold text-gray-950">
            <span>Partner C (Business 02)</span>
            <span>AED 4,672.50</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Paid: AED 2,690.00</span>
            <span className="text-gray-700 font-semibold">Pending: AED 1,982.50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
