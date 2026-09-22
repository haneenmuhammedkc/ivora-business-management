import React from "react";

export function CapitalWaterfallPanel() {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h2 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
          CAPITAL WATERFALL
        </h2>
        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
          AED REALIZATION
        </span>
      </div>

      <div className="space-y-2 text-xs">
        {/* Step 1: India Gross Realization */}
        <div className="p-3 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950">
          <span>India Gross Realization</span>
          <span>AED 235,600</span>
        </div>

        {/* Transition 1 */}
        <div className="text-center text-[10.5px] text-gray-400 font-medium py-0.5">
          ↓ Purchase Sourcing
        </div>

        {/* Step 2: Bullion Cost Dubai */}
        <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between text-gray-700">
          <span>Bullion Cost Dubai</span>
          <span className="font-semibold text-gray-900">- AED 185,400</span>
        </div>

        {/* Transition 2 */}
        <div className="text-center text-[10.5px] text-gray-400 font-medium py-0.5">
          ↓ Margin Spread
        </div>

        {/* Step 3: Gross Trading Margin */}
        <div className="p-3 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950">
          <span>Gross Trading Margin</span>
          <span>AED 50,200</span>
        </div>

        {/* Transition 3 */}
        <div className="text-center text-[10.5px] text-gray-400 font-medium py-0.5">
          ↓ Operational Demurrage
        </div>

        {/* Step 4: Trade Clearance & Ops */}
        <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between text-gray-700">
          <span>Trade Clearance & Ops</span>
          <span className="font-semibold text-gray-900">- AED 12,850</span>
        </div>

        {/* Transition 4 */}
        <div className="text-center text-[10.5px] text-gray-400 font-medium py-0.5">
          ↓ Audited Operating Net
        </div>

        {/* Step 5: Audited Net Profit */}
        <div className="p-3 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950">
          <span>Audited Net Profit</span>
          <span>AED 37,350</span>
        </div>

        {/* Transition 5 */}
        <div className="text-center text-[10.5px] text-gray-400 font-medium py-0.5">
          ↓ Investor Allocation
        </div>

        {/* Step 6: Investor Share */}
        <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between text-gray-700">
          <span>Investor Share (40%)</span>
          <span className="font-semibold text-gray-900">- AED 14,940</span>
        </div>

        {/* Transition 6 */}
        <div className="text-center text-[10.5px] text-gray-400 font-medium py-0.5">
          ↓ Retained Admin Desk
        </div>

        {/* Step 7: Your Profit (60%) */}
        <div className="p-3.5 rounded-lg bg-[#0c0d12] text-white flex items-center justify-between font-black text-sm shadow-xs">
          <span className="uppercase tracking-wider">Your Profit (60%)</span>
          <span>AED 22,410</span>
        </div>
      </div>
    </div>
  );
}
