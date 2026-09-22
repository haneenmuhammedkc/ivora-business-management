import React from "react";
import { TradingCycleProfitability } from "@/types/profit-loss";

export interface TradingCyclePLTableProps {
  cycles: TradingCycleProfitability[];
}

export function TradingCyclePLTable({ cycles }: TradingCyclePLTableProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">🔄</span>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
            TRADING CYCLE PROFITABILITY BREAKDOWN
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Physical Gold Dispatches
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3.5 font-bold">CYCLE REF</th>
              <th className="px-3.5 py-3.5 font-bold">ENTITY</th>
              <th className="px-3.5 py-3.5 font-bold text-right">PURCHASE</th>
              <th className="px-3.5 py-3.5 font-bold text-right">REALIZATION</th>
              <th className="px-3.5 py-3.5 font-bold text-right">EXPENSES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">GROSS</th>
              <th className="px-3.5 py-3.5 font-bold text-right">NET</th>
              <th className="px-4 py-3.5 font-bold text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {cycles.map((c) => (
              <tr key={c.cycleRef} className="transition-colors hover:bg-gray-50/60">
                <td className="px-4 py-4 font-bold text-gray-950 text-xs">
                  {c.cycleRef}
                </td>
                <td className="px-3.5 py-4 text-gray-800 font-medium text-xs">
                  {c.entity}
                </td>
                <td className="px-3.5 py-4 text-right whitespace-nowrap text-gray-800 font-medium">
                  AED {c.purchaseAED.toLocaleString()}
                </td>
                <td className="px-3.5 py-4 text-right whitespace-nowrap text-gray-900 font-semibold">
                  AED {c.realizationAED.toLocaleString()}
                </td>
                <td className="px-3.5 py-4 text-right whitespace-nowrap text-gray-700 font-medium">
                  AED {c.expensesAED.toLocaleString()}
                </td>
                <td className="px-3.5 py-4 text-right whitespace-nowrap text-gray-900 font-semibold">
                  AED {c.grossAED.toLocaleString()}
                </td>
                <td className="px-3.5 py-4 text-right whitespace-nowrap text-gray-950 font-bold">
                  AED {c.netAED.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white bg-[#0c0d12] rounded uppercase">
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
