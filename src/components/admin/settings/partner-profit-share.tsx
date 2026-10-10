"use client";

import React, { useState } from "react";
import { PartnerProfitShareItem } from "@/types/settings";
import { Badge } from "@/components/ui/badge";

export interface PartnerProfitShareProps {
  partners: PartnerProfitShareItem[];
  isLoading?: boolean;
  onToggleOverride?: (partnerId: string, currentStatus: boolean) => Promise<void>;
  updatingPartnerId?: string | null;
  errorMessage?: string | null;
}

export function PartnerProfitShare({
  partners,
  isLoading = false,
  onToggleOverride,
  updatingPartnerId = null,
  errorMessage = null,
}: PartnerProfitShareProps) {
  const [localUpdatingId, setLocalUpdatingId] = useState<string | null>(null);

  const handleToggle = async (partnerId: string, currentStatus: boolean) => {
    if (!onToggleOverride) return;
    try {
      setLocalUpdatingId(partnerId);
      await onToggleOverride(partnerId, currentStatus);
    } finally {
      setLocalUpdatingId(null);
    }
  };

  const isAnyUpdating = (partnerId: string) =>
    updatingPartnerId === partnerId || localUpdatingId === partnerId;

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
        <Badge
          variant="outline"
          className="text-[9.5px] font-bold px-2 py-0.5 tracking-wider uppercase text-gray-700 border-gray-300"
        >
          DIFC ESCROW AUDITED
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                      <span className="text-xs font-semibold">Loading partner data...</span>
                    </div>
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-xs">
                    No partner records found in the database.
                  </td>
                </tr>
              ) : (
                partners.map((ptn) => {
                  const updating = isAnyUpdating(ptn.id);
                  const isOverrideOn = Boolean(ptn.overrideEnabled);

                  return (
                    <tr key={ptn.id} className="transition-colors hover:bg-gray-50/60">
                      {/* Partner Entity */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-950 text-xs">
                            {ptn.partnerEntity}
                          </span>
                          {ptn.email && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {ptn.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Business */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {ptn.assignedBusinesses && ptn.assignedBusinesses.length > 1 ? (
                          <div className="flex flex-col gap-0.5">
                            {ptn.assignedBusinesses.map((b) => (
                              <span key={b.id} className="text-xs text-gray-600 font-medium">
                                {b.name} ({b.code})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">
                            {ptn.assignedBusiness}
                          </span>
                        )}
                      </td>

                      {/* Paid-in Capital */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-bold text-gray-900 text-xs">
                          AED {ptn.paidInCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          AED {ptn.allocatedProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Outstanding Payout */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-bold text-gray-900 text-xs">
                          AED {ptn.outstandingPayoutAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Override Status Toggle */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => handleToggle(ptn.id, isOverrideOn)}
                            aria-label={`Toggle manual profit-share override for ${ptn.partnerEntity}`}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isOverrideOn ? "bg-gray-950" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isOverrideOn ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>

                          <Badge
                            variant={isOverrideOn ? "active" : "outline"}
                            className="px-2 py-0.5 text-[9px] font-bold tracking-wider min-w-[70px] text-center justify-center"
                          >
                            {updating ? "UPDATING..." : isOverrideOn ? "MANUAL LOCK" : "DEFAULT"}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
