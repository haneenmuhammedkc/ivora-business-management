"use client";

import React from "react";
import { BusinessSettlementSummaryItem } from "@/types/wallet";
import { BusinessesIcon, CheckIcon, AlertTriangleIcon } from "@/components/ui/icons";

interface BusinessSettlementSummaryTableProps {
  settlements: BusinessSettlementSummaryItem[];
  selectedBusinessId: string | null;
  onSelectBusiness: (businessId: string) => void;
}

export function BusinessSettlementSummaryTable({
  settlements,
  selectedBusinessId,
  onSelectBusiness,
}: BusinessSettlementSummaryTableProps) {
  if (settlements.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
              Section B — Business Settlement Summary
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Breakdown of contractual capital, profit entitlements, credited amounts, and outstanding balances per business.
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
            0 Businesses
          </span>
        </div>
        <div className="p-8 text-center space-y-1">
          <p className="text-xs font-semibold text-gray-700">No Business Investments Found</p>
          <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
            This investor has not been assigned to any business investments yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide flex items-center gap-2">
            <span>Section B — Business Settlement Summary</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Multi-Business Attribution
            </span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Operational status, final entitlements, wallet credits, direct payments, and remaining obligations by business.
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-md self-start sm:self-auto">
          {settlements.length} {settlements.length === 1 ? "Business" : "Businesses"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="py-3 px-4">Business</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Committed Capital</th>
              <th className="py-3 px-4 text-right">Realized Profit</th>
              <th className="py-3 px-4 text-right">Total Entitlement</th>
              <th className="py-3 px-4 text-right">Credited to Wallet</th>
              <th className="py-3 px-4 text-right">Paid Direct</th>
              <th className="py-3 px-4 text-right">Outstanding</th>
              <th className="py-3 px-4 text-center">Settlement State</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {settlements.map((item) => {
              const isSelected = selectedBusinessId === item.businessId;

              return (
                <tr
                  key={item.businessId}
                  className={`transition-colors hover:bg-gray-50/70 ${
                    isSelected ? "bg-blue-50/30 font-medium" : ""
                  }`}
                >
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700 shrink-0">
                        <BusinessesIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">
                          {item.businessName}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {item.businessCode}
                          {item.closureDate && (
                            <span className="ml-1.5 text-gray-400">
                              (Closed: {new Date(item.closureDate).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-sans">
                    {item.isClosed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                        CLOSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right text-gray-700">
                    AED {item.committedCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold">
                    AED {item.realizedProfitEntitlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-4 text-right text-gray-900 font-bold">
                    AED {item.totalEntitlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-4 text-right text-indigo-600">
                    AED {item.creditedToWallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-4 text-right text-gray-600">
                    AED {item.previouslyPaidDirect.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-bold ${
                        item.remainingOutstandingEntitlement > 0
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      AED {item.remainingOutstandingEntitlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-sans">
                    {item.settlementState === "SETTLED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckIcon className="w-3 h-3" />
                        SETTLED
                      </span>
                    ) : item.settlementState === "PARTIALLY_SETTLED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangleIcon className="w-3 h-3" />
                        PARTIAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        PENDING
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-sans">
                    <button
                      type="button"
                      onClick={() => onSelectBusiness(item.businessId)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#0c0d12] text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      }`}
                    >
                      {isSelected ? "Selected" : "Manage Disbursal"}
                    </button>
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
