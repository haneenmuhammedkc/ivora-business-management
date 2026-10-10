"use client";

import React, { useState, useMemo } from "react";
import { LockIcon, CheckIcon, AlertTriangleIcon } from "@/components/ui/icons";
import { InvestorSettlementOverview } from "@/services/investor/settlement.service";

interface ProfitAllocationSectionProps {
  settlement: InvestorSettlementOverview;
  isAdmin: boolean;
  onAllocationUpdated: () => void;
}

export function ProfitAllocationSection({
  settlement,
  isAdmin,
  onAllocationUpdated,
}: ProfitAllocationSectionProps) {
  const [profitAmount, setProfitAmount] = useState<string>(() =>
    String(settlement.allocatedProfitAED ?? 0)
  );
  const [prevAllocated, setPrevAllocated] = useState<number | null>(settlement.allocatedProfitAED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (settlement.allocatedProfitAED !== prevAllocated) {
    setPrevAllocated(settlement.allocatedProfitAED);
    setProfitAmount(String(settlement.allocatedProfitAED ?? 0));
  }

  const netProfit = settlement.netProfitAED;
  const isLocked = settlement.isAllocationLocked;
  const isExternalInvestor = settlement.investor.participantType === "INVESTOR";

  const numericProfitAmount = useMemo(() => {
    const raw = profitAmount.trim();
    if (!raw || !/^\d+(\.\d+)?$/.test(raw)) return 0;
    const n = Number(raw);
    return isNaN(n) || !isFinite(n) ? 0 : n;
  }, [profitAmount]);

  // Live calculated profit percentage
  const calculatedPercentage = useMemo(() => {
    if (netProfit <= 0 || numericProfitAmount <= 0) return "0.00%";
    const pct = (numericProfitAmount / netProfit) * 100;
    if (isNaN(pct) || !isFinite(pct) || pct < 0) return "0.00%";
    return `${pct.toFixed(2)}%`;
  }, [netProfit, numericProfitAmount]);

  const isExceedingNetProfit = numericProfitAmount > netProfit && netProfit > 0;

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isLocked || !isExternalInvestor) return;

    if (isExceedingNetProfit) {
      setFeedback({
        type: "error",
        message: `Allocated profit cannot exceed total business Net Profit (AED ${netProfit.toLocaleString()}).`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/investors/${encodeURIComponent(settlement.investor.id)}/settlement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocatedProfitAmount: numericProfitAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Failed to update profit allocation.");
      }

      setFeedback({
        type: "success",
        message: json.message || "Profit allocation saved successfully.",
      });
      onAllocationUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFeedback({
        type: "error",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
              Section 1 — Profit Allocation
            </h3>
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded">
                <LockIcon size={11} />
                <span>ALLOCATION LOCKED</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Admin profit allocation and realized net profit distribution schedule.
          </p>
        </div>

        <div>
          {isLocked ? (
            <span className="text-[10.5px] text-gray-400 font-medium">
              Payments commenced • Allocation immutable
            </span>
          ) : !isAdmin ? (
            <span className="text-[10.5px] text-gray-400 font-medium">
              Read-only view
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckIcon size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangleIcon size={14} className="text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveAllocation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Field 1: Total Business Profit (Read-only) */}
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                TOTAL BUSINESS PROFIT (P&L)
              </label>
              <div className="h-10 px-3.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between text-xs font-bold text-gray-900">
                <span>AED {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  REALIZED NET
                </span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                Authoritative Net Profit from sales, purchases & expenses.
              </span>
            </div>

            {/* Field 2: Investor Profit Amount */}
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                INVESTOR PROFIT AMOUNT (AED)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!isAdmin || isLocked || !isExternalInvestor || isSubmitting}
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  className={`w-full h-10 px-3.5 rounded-lg border text-xs font-bold text-gray-900 transition-colors focus:outline-none focus:ring-1 ${
                    isLocked || !isAdmin || !isExternalInvestor
                      ? "bg-gray-50/80 border-gray-200 text-gray-700 cursor-not-allowed"
                      : isExceedingNetProfit
                      ? "border-red-300 focus:ring-red-500 bg-red-50/20"
                      : "border-gray-200 bg-white focus:ring-gray-950"
                  }`}
                  placeholder="0.00"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {isLocked
                  ? "Locked: Cannot be changed after disbursals start."
                  : "Admin-allocated AED share of realized net profit."}
              </span>
            </div>

            {/* Field 3: Profit Percentage (Read-only calculated) */}
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                PROFIT PERCENTAGE
              </label>
              <div className="h-10 px-3.5 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between text-xs font-bold text-gray-950">
                <span>{calculatedPercentage}</span>
                <span className="text-[10px] font-medium text-gray-500">
                  Contractual: {settlement.contractualSharePct}%
                </span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                Calculated: (Investor Profit ÷ Total Profit) × 100.
              </span>
            </div>
          </div>

          {isAdmin && !isLocked && isExternalInvestor && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isExceedingNetProfit}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0c0d12] hover:bg-gray-800 disabled:bg-gray-300 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckIcon size={13} />
                    <span>Save Profit Allocation</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
