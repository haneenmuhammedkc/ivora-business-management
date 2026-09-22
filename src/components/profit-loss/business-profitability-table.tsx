import React from "react";
import { BusinessProfitability } from "@/types/profit-loss";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface BusinessProfitabilityTableProps {
  businesses: BusinessProfitability[];
}

export function BusinessProfitabilityTable({
  businesses,
}: BusinessProfitabilityTableProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">🏢</span>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
            BUSINESS PROFITABILITY COMPARISON
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Active Partitions
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3.5 font-bold">BUSINESS</th>
              <th className="px-3.5 py-3.5 font-bold text-right">SALES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">PURCHASE</th>
              <th className="px-3.5 py-3.5 font-bold text-right">EXPENSES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">GROSS PROFIT</th>
              <th className="px-3.5 py-3.5 font-bold text-right">NET PROFIT</th>
              <th className="px-3.5 py-3.5 font-bold text-center">NET MARGIN</th>
              <th className="px-4 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {businesses.map((biz) => {
              const isConsolidated = !!biz.isConsolidated;
              return (
                <tr
                  key={biz.id}
                  className={`transition-colors hover:bg-gray-50/60 ${
                    isConsolidated ? "bg-gray-50/70 font-bold" : ""
                  }`}
                >
                  {/* Business Name */}
                  <td className="px-4 py-4">
                    <span
                      className={`text-xs ${
                        isConsolidated
                          ? "font-black text-gray-950 uppercase tracking-wider"
                          : "font-bold text-gray-900"
                      }`}
                    >
                      {biz.name}
                    </span>
                  </td>

                  {/* Sales */}
                  <td className="px-3.5 py-4 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-900 font-semibold">
                      AED {biz.salesAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Purchase */}
                  <td className="px-3.5 py-4 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-800 font-medium">
                      AED {biz.purchaseAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Expenses */}
                  <td className="px-3.5 py-4 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-700 font-medium">
                      AED {biz.expensesAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Gross Profit */}
                  <td className="px-3.5 py-4 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-900 font-semibold">
                      AED {biz.grossProfitAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Net Profit */}
                  <td className="px-3.5 py-4 text-right whitespace-nowrap">
                    <span className="text-xs sm:text-[13px] font-bold text-gray-950">
                      AED {biz.netProfitAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Net Margin */}
                  <td className="px-3.5 py-4 text-center whitespace-nowrap">
                    <span className="font-semibold text-xs text-gray-800">
                      {biz.netMarginPercent.toFixed(2)}%
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {!isConsolidated ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-gray-800 hover:text-black"
                      >
                        <span>View P&L</span>
                        <ArrowRightIcon size={12} />
                      </button>
                    ) : (
                      <span className="text-gray-400 font-bold">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
