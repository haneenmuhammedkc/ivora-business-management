import React from "react";
import { CapitalPositionData, InventoryPositionData } from "@/types/balance-sheet";

export interface CompositionAnalyticsPanelsProps {
  capital: CapitalPositionData;
  inventory: InventoryPositionData;
}

export function CompositionAnalyticsPanels({
  capital,
  inventory,
}: CompositionAnalyticsPanelsProps) {
  // 1. Capital Composition (Admin vs Partner)
  const totalCapital = capital.totalCommittedCapitalAED;
  const adminPct = Number(capital.adminSharePercent.toFixed(1));
  const partnerPct = Number(capital.partnerSharePercent.toFixed(1));

  const capitalSegments = [
    {
      name: "Admin Core Capital",
      percentage: totalCapital > 0 ? adminPct : 0,
      amountFormatted: `AED ${capital.adminCapitalAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      colorClass: "bg-gray-900",
    },
    {
      name: "Partner Committed Capital",
      percentage: totalCapital > 0 ? partnerPct : 0,
      amountFormatted: `AED ${capital.partnerCapitalAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      colorClass: "bg-blue-600",
    },
  ];

  // 2. Bullion Inventory Valuation Composition (by Product Type or Business)
  const totalInvValue = inventory.totalCarryingValueAED;
  const invColors = [
    "bg-amber-500",
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-rose-500",
  ];

  const inventorySegments = inventory.items.length > 0
    ? inventory.items.map((item, idx) => {
        const pct = totalInvValue > 0
          ? Number(((item.carryingValueAED / totalInvValue) * 100).toFixed(1))
          : 0;
        return {
          name: `${item.businessName} (${item.productType.replace(/_/g, " ")})`,
          percentage: pct,
          amountFormatted: `AED ${item.carryingValueAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
          colorClass: invColors[idx % invColors.length],
        };
      })
    : [
        {
          name: "Physical Bullion in Vault",
          percentage: 100,
          amountFormatted: `AED ${totalInvValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
          colorClass: "bg-amber-500",
        },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* 1. CAPITAL COMPOSITION BREAKDOWN */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs sm:text-[13px] font-black text-gray-950 uppercase tracking-wider">
              CAPITAL COMPOSITION BREAKDOWN
            </h3>
            <span className="text-xs font-black text-gray-950 tracking-tight">
              AED {totalCapital.toLocaleString("en-US", { maximumFractionDigits: 0 })} (100%)
            </span>
          </div>

          {/* Segmented Stacked Progress Bar */}
          <div className="mt-4 h-5 w-full rounded-sm overflow-hidden flex bg-gray-100 gap-0.5">
            {totalCapital > 0 ? (
              capitalSegments.map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.colorClass} h-full transition-all relative group cursor-pointer`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.name}: ${item.percentage}% (${item.amountFormatted})`}
                />
              ))
            ) : (
              <div className="bg-gray-200 h-full w-full" title="No capital committed" />
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-1 text-xs">
          {capitalSegments.map((item, idx) => (
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

      {/* 2. BULLION INVENTORY VALUATION COMPOSITION */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs sm:text-[13px] font-black text-gray-950 uppercase tracking-wider">
              BULLION INVENTORY ALLOCATION
            </h3>
            <span className="text-xs font-black text-gray-950 tracking-tight">
              AED {totalInvValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} (100%)
            </span>
          </div>

          {/* Segmented Stacked Progress Bar */}
          <div className="mt-4 h-5 w-full rounded-sm overflow-hidden flex bg-gray-100 gap-0.5">
            {totalInvValue > 0 ? (
              inventorySegments.map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.colorClass} h-full transition-all relative group cursor-pointer`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.name}: ${item.percentage}% (${item.amountFormatted})`}
                />
              ))
            ) : (
              <div className="bg-gray-200 h-full w-full" title="No bullion inventory in vault" />
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-1 text-xs">
          {inventorySegments.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-xs shrink-0 ${item.colorClass}`} />
              <span className="text-gray-800 font-medium truncate">
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
