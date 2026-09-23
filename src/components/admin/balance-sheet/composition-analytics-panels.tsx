import React from "react";
import { CompositionLegendItem } from "@/types/balance-sheet";

export interface CompositionAnalyticsPanelsProps {
  assetComposition: CompositionLegendItem[];
  capitalLiabilitiesComposition: CompositionLegendItem[];
}

export function CompositionAnalyticsPanels({
  assetComposition,
  capitalLiabilitiesComposition,
}: CompositionAnalyticsPanelsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* 1. ASSET COMPOSITION BREAKDOWN */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs sm:text-[13px] font-black text-gray-950 uppercase tracking-wider">
              ASSET COMPOSITION BREAKDOWN
            </h3>
            <span className="text-xs font-black text-gray-950 tracking-tight">
              AED 270,000 (100%)
            </span>
          </div>

          {/* Segmented Stacked Progress Bar */}
          <div className="mt-4 h-5 w-full rounded-sm overflow-hidden flex bg-gray-100 gap-0.5">
            {assetComposition.map((item, idx) => (
              <div
                key={idx}
                className={`${item.colorClass} h-full transition-all relative group cursor-pointer`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.name}: ${item.percentage}% (${item.amountFormatted})`}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 text-xs">
          {assetComposition.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-xs shrink-0 ${item.colorClass}`} />
              <span className="text-gray-800 font-medium">
                <strong className="text-gray-950 font-bold">{item.name}:</strong>{" "}
                {item.percentage}% ({item.amountFormatted})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CAPITAL & LIABILITIES COMPOSITION */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs sm:text-[13px] font-black text-gray-950 uppercase tracking-wider">
              CAPITAL & LIABILITIES COMPOSITION
            </h3>
            <span className="text-xs font-black text-gray-950 tracking-tight">
              AED 270,000 (100%)
            </span>
          </div>

          {/* Segmented Stacked Progress Bar */}
          <div className="mt-4 h-5 w-full rounded-sm overflow-hidden flex bg-gray-100 gap-0.5">
            {capitalLiabilitiesComposition.map((item, idx) => (
              <div
                key={idx}
                className={`${item.colorClass} h-full transition-all relative group cursor-pointer`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.name}: ${item.percentage}% (${item.amountFormatted})`}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 text-xs">
          {capitalLiabilitiesComposition.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-xs shrink-0 ${item.colorClass}`} />
              <span className="text-gray-800 font-medium">
                <strong className="text-gray-950 font-bold">{item.name}:</strong>{" "}
                {item.percentage}% ({item.amountFormatted})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
