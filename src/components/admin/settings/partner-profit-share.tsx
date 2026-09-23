import React from "react";
import { PartnerProfitShareItem } from "@/types/settings";
import { Badge } from "@/components/ui/badge";

export interface PartnerProfitShareProps {
  partners: PartnerProfitShareItem[];
}

export function PartnerProfitShare({ partners }: PartnerProfitShareProps) {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            Partner Equity & Manual Profit-Share Configuration
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Capital deposit reconciliation and statutory contractual distribution weights.
          </p>
        </div>
        <Badge variant="outline" className="text-[9.5px] font-bold px-2 py-0.5 tracking-wider uppercase text-gray-700 border-gray-300">
          DIFC ESCROW AUDITED
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Statutory Override Banner */}
        <div className="p-3.5 rounded-lg bg-gray-50/80 border border-gray-200/90 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <span className="text-gray-500 font-bold">ℹ</span>
            <span>Manual Profit Share overrides active — never derived from capital amount.</span>
          </div>
          <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
            Statutory Articles §14.2
          </span>
        </div>

        {/* Profit Share Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-bold">PARTNER ENTITY</th>
                <th className="px-4 py-3 font-bold">ASSIGNED BUSINESS</th>
                <th className="px-4 py-3 font-bold text-right">PAID-IN CAPITAL</th>
                <th className="px-4 py-3 font-bold text-center">PROFIT SPLIT WEIGHT</th>
                <th className="px-4 py-3 font-bold text-right">ALLOCATED PROFIT</th>
                <th className="px-4 py-3 font-bold text-right">OUTSTANDING PAYOUT</th>
                <th className="px-4 py-3 font-bold text-center">OVERRIDE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {partners.map((ptn) => (
                <tr key={ptn.id} className="transition-colors hover:bg-gray-50/60">
                  {/* Partner Entity */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-gray-950 text-xs">
                      {ptn.partnerEntity}
                    </span>
                  </td>

                  {/* Assigned Business */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-xs text-gray-600 font-medium">
                      {ptn.assignedBusiness}
                    </span>
                  </td>

                  {/* Paid-in Capital */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className="font-bold text-gray-900 text-xs">
                      AED {ptn.paidInCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Profit Split Weight */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className="font-extrabold text-xs text-gray-950 font-mono">
                      {ptn.profitSplitWeightPercent.toFixed(2)}%
                    </span>
                  </td>

                  {/* Allocated Profit */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className="font-bold text-gray-950 text-xs">
                      AED {ptn.allocatedProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Outstanding Payout */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className="font-bold text-gray-900 text-xs">
                      AED {ptn.outstandingPayoutAED.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* Override Status Badge */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <Badge variant="active" className="px-2.5 py-0.5 text-[9.5px] font-bold tracking-wider">
                      {ptn.overrideStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
