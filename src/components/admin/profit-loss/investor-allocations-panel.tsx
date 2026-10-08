import React from "react";
import { InvestorAllocationsData } from "@/types/profit-loss";

export interface InvestorAllocationsPanelProps {
  allocations?: InvestorAllocationsData;
}

export function InvestorAllocationsPanel({ allocations }: InvestorAllocationsPanelProps) {
  const totalNet = allocations?.totalNetProfitAED ?? 0;
  const investorShare = allocations?.investorShareAED ?? 0;
  const investorSharePercent = allocations?.investorSharePercent ?? 0;
  const deskShare = allocations?.deskShareAED ?? 0;
  const deskSharePercent = allocations?.deskSharePercent ?? 0;
  const partners = allocations?.partners ?? [];

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h2 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
          INVESTOR ALLOCATIONS
        </h2>
        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
          NET AED {totalNet.toLocaleString()}
        </span>
      </div>

      {/* Allocation Ratio Bar */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
          <span>Investor Share: {investorSharePercent.toFixed(1)}% (AED {investorShare.toLocaleString()})</span>
          <span>Desk: {deskSharePercent.toFixed(1)}% (AED {deskShare.toLocaleString()})</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden flex">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, investorSharePercent))}%` }}
          />
          <div
            className="h-full bg-gray-500 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, deskSharePercent))}%` }}
          />
        </div>
      </div>

      {/* Partner Cards */}
      <div className="space-y-2.5 text-xs">
        {partners.length === 0 ? (
          <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50 text-center text-gray-400">
            No active partner allocations found
          </div>
        ) : (
          partners.map((partner) => (
            <div
              key={partner.id}
              className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2"
            >
              <div className="flex items-center justify-between font-bold text-gray-950">
                <span>{partner.partnerName} ({partner.businessName})</span>
                <span>AED {partner.allocatedProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>Paid: AED {partner.paidAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-gray-700 font-semibold">
                  Pending: AED {partner.pendingAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
