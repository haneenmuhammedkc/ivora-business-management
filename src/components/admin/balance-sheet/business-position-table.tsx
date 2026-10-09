import React from "react";
import { BusinessPositionComparison } from "@/types/balance-sheet";
import { Badge } from "@/components/ui/badge";

export interface BusinessPositionTableProps {
  businesses: BusinessPositionComparison[];
}

export function BusinessPositionTable({
  businesses,
}: BusinessPositionTableProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#f8fafc]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
            BUSINESS BREAKDOWN
          </h2>
        </div>
        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
          ENTITY FINANCIAL POSITION & PROFITABILITY
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3.5 font-bold">BUSINESS</th>
              <th className="px-3.5 py-3.5 font-bold text-right">INVESTED CAPITAL</th>
              <th className="px-3.5 py-3.5 font-bold text-right">INVENTORY VALUE</th>
              <th className="px-3.5 py-3.5 font-bold text-right">SALES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">PURCHASE COST</th>
              <th className="px-3.5 py-3.5 font-bold text-right">OPERATING EXPENSES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">NET PROFIT</th>
              <th className="px-3.5 py-3.5 font-bold text-right">PENDING DISBURSAL</th>
              <th className="px-4 py-3.5 font-bold text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {businesses.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-8 text-center text-gray-400 font-medium text-xs"
                >
                  No entities found matching active filters.
                </td>
              </tr>
            ) : (
              businesses.map((biz) => {
                const isConsolidated = !!biz.isConsolidated;
                return (
                  <tr
                    key={biz.id}
                    className={`transition-colors hover:bg-gray-50/60 ${
                      isConsolidated
                        ? "bg-[#f8fafc] font-bold border-t-2 border-gray-300"
                        : ""
                    }`}
                  >
                    {/* Entity Name & Code */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!isConsolidated && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-900 shrink-0" />
                        )}
                        <div>
                          <span
                            className={`text-xs ${
                              isConsolidated
                                ? "font-black text-gray-950 uppercase tracking-wider"
                                : "font-bold text-gray-900"
                            }`}
                          >
                            {biz.business}
                          </span>
                          {!isConsolidated && biz.code && (
                            <div className="text-[10px] text-gray-400 font-medium uppercase">
                              CODE: {biz.code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Invested Capital */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-950 font-bold">
                        AED{" "}
                        {biz.committedCapitalAED.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Inventory Value */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-900 font-semibold">
                        AED{" "}
                        {biz.inventoryValueAED.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <div className="text-[10px] text-gray-500 font-medium">
                        {biz.stockGrams.toLocaleString("en-US", {
                          maximumFractionDigits: 1,
                        })}{" "}
                        g
                      </div>
                    </td>

                    {/* Sales */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-900 font-semibold">
                        AED{" "}
                        {biz.salesAED.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Purchase Cost */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-800 font-medium">
                        AED{" "}
                        {biz.purchaseAED.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Operating Expenses */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-700 font-medium">
                        AED{" "}
                        {biz.expensesAED.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Net Profit */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span
                        className={`text-xs sm:text-[13px] font-bold ${
                          biz.operatingProfitAED >= 0
                            ? "text-emerald-700"
                            : "text-rose-600"
                        }`}
                      >
                        AED{" "}
                        {biz.operatingProfitAED.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Pending Disbursal */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span
                        className={`text-xs sm:text-[13px] font-semibold ${
                          biz.pendingDisbursalAED > 0
                            ? "text-amber-700"
                            : "text-gray-600"
                        }`}
                      >
                        AED{" "}
                        {biz.pendingDisbursalAED.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <Badge
                        variant={isConsolidated ? "neutral" : "active"}
                        className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider"
                      >
                        {isConsolidated ? "CONSOLIDATED" : "ACTIVE"}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
