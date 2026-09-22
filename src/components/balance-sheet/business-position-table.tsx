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
          <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
            Business Financial Position Comparison
          </h2>
        </div>
        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
          SEGREGATED LEGAL ENTITY PARTITIONS
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold">ENTITY PARTICIPANTS</th>
              <th className="px-4 py-3.5 font-bold text-right">ASSETS</th>
              <th className="px-4 py-3.5 font-bold text-right">LIABILITIES</th>
              <th className="px-4 py-3.5 font-bold text-right">EQUITY</th>
              <th className="px-4 py-3.5 font-bold text-right">NET WORKING CAPITAL</th>
              <th className="px-5 py-3.5 font-bold text-center">BALANCE STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {businesses.map((biz) => {
              const isConsolidated = !!biz.isConsolidated;
              return (
                <tr
                  key={biz.id}
                  className={`transition-colors hover:bg-gray-50/60 ${
                    isConsolidated ? "bg-gray-50/90 font-bold border-t-2 border-gray-300" : ""
                  }`}
                >
                  {/* Business Name */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {!isConsolidated && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-900 shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          isConsolidated
                            ? "font-black text-gray-950 uppercase tracking-wider text-xs"
                            : "font-bold text-gray-900"
                        }`}
                      >
                        {biz.business}
                      </span>
                    </div>
                  </td>

                  {/* Entity Participants */}
                  <td className="px-4 py-4">
                    <span
                      className={`text-xs ${
                        isConsolidated
                          ? "font-bold text-gray-800 uppercase text-[11px] tracking-wider"
                          : "text-gray-600 font-medium"
                      }`}
                    >
                      {biz.entityParticipants}
                    </span>
                  </td>

                  {/* Assets */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="text-[10px] text-gray-500 font-bold uppercase leading-none">AED</div>
                    <span className="text-xs sm:text-[13px] text-gray-950 font-bold">
                      {biz.assetsAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Liabilities */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="text-[10px] text-gray-500 font-bold uppercase leading-none">AED</div>
                    <span className="text-xs sm:text-[13px] text-gray-900 font-semibold">
                      {biz.liabilitiesAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Equity */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="text-[10px] text-gray-500 font-bold uppercase leading-none">AED</div>
                    <span className="text-xs sm:text-[13px] text-gray-900 font-semibold">
                      {biz.equityAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Net Working Capital */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <span className="text-xs sm:text-[13px] font-semibold text-gray-800 font-mono">
                      AED {biz.netWorkingCapitalAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    <Badge
                      variant="active"
                      className="px-3 py-0.5 text-[10.5px] font-bold tracking-wider"
                    >
                      {biz.balanceStatus}
                    </Badge>
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
