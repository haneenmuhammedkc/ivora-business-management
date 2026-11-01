"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { AlertTriangleIcon, CheckIcon } from "@/components/ui/icons";
import { BusinessClosureEligibility } from "@/services/business/business.service";

interface BusinessClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  businessCode: string;
  eligibility: BusinessClosureEligibility | null;
  isLoadingEligibility: boolean;
  onSuccess: () => void;
}

export function BusinessClosureModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  businessCode,
  eligibility,
  isLoadingEligibility,
  onSuccess,
}: BusinessClosureModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEligible = eligibility?.isEligible ?? false;

  const handleExecuteClosure = async () => {
    if (!isEligible || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/businesses/${encodeURIComponent(businessId)}/closure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to execute business closure.");
      }

      setSuccessMessage(data.message || "Business successfully closed. Investor entitlements are finalized and available for settlement or reinvestment.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute business closure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Close Business & Finalize Entitlements — ${businessCode}`}
    >
      <div className="space-y-5">
        {/* Entity Header Banner */}
        <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-950 block">{businessName}</span>
            <span className="text-[11px] text-gray-500 font-mono block mt-0.5">Entity Code: {businessCode}</span>
          </div>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase ${
              eligibility?.status === "SETTLED"
                ? "bg-purple-100 text-purple-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {eligibility?.status || "ACTIVE"}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangleIcon size={14} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckIcon size={14} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLoadingEligibility ? (
          <div className="p-8 text-center space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
            <p className="text-xs text-gray-400">Verifying liquidation checklist and financial accounts...</p>
          </div>
        ) : !eligibility ? (
          <div className="p-4 text-center text-xs text-gray-500">
            Could not load closure eligibility criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Checklist items */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                MANDATORY CLOSURE PREREQUISITES
              </span>

              {/* 1. Inventory Liquidation */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  eligibility.unsoldInventory.length === 0
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                    : "border-red-200 bg-red-50/60 text-red-950"
                }`}
              >
                {eligibility.unsoldInventory.length === 0 ? (
                  <CheckIcon size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangleIcon size={16} className="text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">1. Inventory 100% Liquidated</span>
                  <span className="text-[11px] block mt-0.5 opacity-90">
                    {eligibility.unsoldInventory.length === 0
                      ? "Zero remaining inventory. All purchased physical stock has been sold and reconciled."
                      : `BLOCKED: ${eligibility.totalUnsoldQuantity.toLocaleString()} unsold units remain across ${eligibility.unsoldInventory.length} product(s) (Carrying Value: AED ${eligibility.totalCarryingValueAED.toLocaleString()}).`}
                  </span>
                </div>
              </div>

              {/* 2. Unfinalized Sales Check */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  eligibility.unfinalizedSales.length === 0
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                    : "border-amber-200 bg-amber-50/60 text-amber-950"
                }`}
              >
                <CheckIcon size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">2. Realized Sales & Foreign Exchange</span>
                  <span className="text-[11px] block mt-0.5 opacity-90">
                    All sales realizations recognized. Realized AED gross revenue: AED{" "}
                    {eligibility.financialSummary.totalRevenueAED.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                  </span>
                </div>
              </div>

              {/* 3. Operational Expenses Accounted */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  eligibility.pendingExpenses.length === 0
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                    : "border-amber-200 bg-amber-50/60 text-amber-950"
                }`}
              >
                <CheckIcon size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">3. Operating Expenses Deducted</span>
                  <span className="text-[11px] block mt-0.5 opacity-90">
                    Total recognized expenses: AED{" "}
                    {eligibility.financialSummary.totalExpensesAED.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                FINAL FINANCIAL POSITION SUMMARY
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">Total Revenue</span>
                  <span className="font-bold text-gray-900 block mt-0.5 font-mono">
                    AED {eligibility.financialSummary.totalRevenueAED.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Landed COGS</span>
                  <span className="font-bold text-gray-900 block mt-0.5 font-mono">
                    AED {eligibility.financialSummary.totalPurchasesAED.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Total Expenses</span>
                  <span className="font-bold text-gray-900 block mt-0.5 font-mono">
                    AED {eligibility.financialSummary.totalExpensesAED.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Net Realized Profit</span>
                  <span className="font-bold text-emerald-700 block mt-0.5 font-mono">
                    AED {eligibility.financialSummary.netProfitAED.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Settlement Distribution Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  FINAL SETTLEMENT DISTRIBUTION PREVIEW ({eligibility.settlementPreviews.length})
                </span>
                <span className="text-xs font-bold text-gray-950 font-mono">
                  Total Due: AED {eligibility.totalSettlementDueAED.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3">Participant</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3 text-right">Capital Due</th>
                      <th className="py-2 px-3 text-right">Profit Due</th>
                      <th className="py-2 px-3 text-right">Total Due</th>
                      <th className="py-2 px-3 text-center">Settlement Destination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {eligibility.settlementPreviews.map((p) => (
                      <tr key={p.investorId} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-semibold text-gray-900">
                          {p.investorName} <span className="text-[10px] text-gray-400 font-mono">({p.investorCode})</span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-gray-600">
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-gray-100 text-gray-700">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700">
                          AED {p.outstandingCapitalAED.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                          AED {p.outstandingProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-950">
                          AED {p.totalSettlementDueAED.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            Settlement & Reinvestment Ledger
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClosure}
                disabled={!isEligible || isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Executing Business Closure...</span>
                ) : (
                  <>
                    <CheckIcon size={14} />
                    <span>Confirm Final Business Closure</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
