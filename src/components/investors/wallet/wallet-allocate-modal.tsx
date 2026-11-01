"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CheckIcon, AlertTriangleIcon } from "@/components/ui/icons";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { BusinessSettlementSummaryItem } from "@/types/wallet";

interface WalletAllocateModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  investorName: string;
  availableBalance: number;
  eligibleEntitlements?: number;
  businessSettlements?: BusinessSettlementSummaryItem[];
  onSuccess: () => void;
}

interface BusinessOption {
  id: string;
  name: string;
  code: string;
  businessType: string;
  totalInvestmentAED: number;
  status: string;
}

export function WalletAllocateModal({
  isOpen,
  onClose,
  investorId,
  investorName,
  availableBalance,
  eligibleEntitlements = 0,
  businessSettlements = [],
  onSuccess,
}: WalletAllocateModalProps) {
  const [targetBusinessId, setTargetBusinessId] = useState("");
  const [sourceBusinessId, setSourceBusinessId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Additional Investment Alongside Reinvestment
  const [enableAdditional, setEnableAdditional] = useState(false);
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [additionalPaymentMethod, setAdditionalPaymentMethod] = useState("DIRECT_BANK_WIRE");
  const [additionalReference, setAdditionalReference] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: bizData } = useCachedFetch<{
    success: boolean;
    businesses: BusinessOption[];
  }>("/api/businesses");

  const businesses = bizData?.businesses || [];

  // Closed businesses with remaining unpaid entitlement
  const closedBusinessesWithFunds = businessSettlements.filter(
    (b) => b.isClosed && b.remainingOutstandingEntitlement > 0
  );

  // Total available across wallet balance and eligible closed businesses
  const totalAvailableForReinvestment = availableBalance + eligibleEntitlements;

  // Selected source limit
  const maxSpendableForSelectedSource = sourceBusinessId
    ? (closedBusinessesWithFunds.find((b) => b.businessId === sourceBusinessId)
        ?.remainingOutstandingEntitlement ?? 0)
    : totalAvailableForReinvestment;

  const reinvestNum = Number(amount) || 0;
  const addNum = enableAdditional ? Number(additionalAmount) || 0 : 0;
  const totalAllocationAmount = Number((reinvestNum + addNum).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBusinessId) {
      setError("Please select a target active business.");
      return;
    }

    if (sourceBusinessId && sourceBusinessId === targetBusinessId) {
      setError("Cannot allocate reinvestment funds back into the same business entity.");
      return;
    }

    if (totalAllocationAmount <= 0) {
      setError("Please specify a valid reinvestment amount or additional investment amount greater than 0.");
      return;
    }

    if (reinvestNum > maxSpendableForSelectedSource + 0.005) {
      setError(
        `Requested reinvestment amount (AED ${reinvestNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds available settlement funds (AED ${maxSpendableForSelectedSource.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`
      );
      return;
    }

    if (enableAdditional && addNum <= 0) {
      setError("Please enter a valid positive amount for the additional fresh investment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/investors/${encodeURIComponent(investorId)}/wallet/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: targetBusinessId,
          sourceBusinessId: sourceBusinessId || undefined,
          amount: reinvestNum > 0 ? reinvestNum : undefined,
          additionalAmount: enableAdditional && addNum > 0 ? addNum : undefined,
          additionalPaymentMethod: enableAdditional && addNum > 0 ? additionalPaymentMethod : undefined,
          additionalReference: enableAdditional && additionalReference.trim() ? additionalReference.trim() : undefined,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to allocate investment funds.");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to allocate funds.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reinvest / Allocate Funds — ${investorName}`}
      className="sm:max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 py-1">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangleIcon size={14} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

        {/* POOL OVERVIEW */}
        <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
              Available For Reinvestment
            </span>
            <span className="text-xs text-gray-500">
              {eligibleEntitlements > 0
                ? `Includes AED ${eligibleEntitlements.toLocaleString(undefined, { minimumFractionDigits: 2 })} from closed entities`
                : "Spendable wallet settlement balance"}
            </span>
          </div>
          <span className="text-base font-black text-gray-950 font-mono">
            AED {totalAvailableForReinvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* SOURCE SELECTION (IF CLOSED BUSINESSES EXIST) */}
        {closedBusinessesWithFunds.length > 0 && (
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
              Source Settlement Entity (Optional)
            </label>
            <select
              value={sourceBusinessId}
              onChange={(e) => setSourceBusinessId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            >
              <option value="">Auto-resolve from eligible closed businesses / wallet</option>
              {closedBusinessesWithFunds.map((b) => (
                <option key={b.businessId} value={b.businessId}>
                  {b.businessName} ({b.businessCode}) — Available: AED {b.remainingOutstandingEntitlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-gray-500 mt-1 block">
              Draws directly from the closed business&apos;s unpaid entitlement without requiring an artificial deposit.
            </span>
          </div>
        )}

        {/* TARGET ACTIVE BUSINESS */}
        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
            Target Active Business Entity *
          </label>
          <select
            required
            value={targetBusinessId}
            onChange={(e) => setTargetBusinessId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          >
            <option value="">Select target active business...</option>
            {businesses
              .filter((b) => b.status === "ACTIVE" && b.id !== sourceBusinessId)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) — Cap: AED {Number(b.totalInvestmentAED).toLocaleString()}
                </option>
              ))}
          </select>
        </div>

        {/* REINVESTMENT AMOUNT FROM SETTLEMENT */}
        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
            Reinvestment from Settlement Balance (AED)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max={maxSpendableForSelectedSource}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
            {maxSpendableForSelectedSource > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(maxSpendableForSelectedSource))}
                className="px-3 h-10 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
              >
                Max
              </button>
            )}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Existing investment contract terms and profit-sharing percentages in the target business are strictly preserved.
          </span>
        </div>

        {/* ADDITIONAL FRESH CAPITAL OPTION */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAdditional}
                onChange={(e) => setEnableAdditional(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-900">
                + Add Fresh Capital Alongside Reinvestment
              </span>
            </label>
            <span className="text-[10px] text-gray-400">External funds injection</span>
          </div>

          {enableAdditional && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Additional Amount (AED) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required={enableAdditional}
                    value={additionalAmount}
                    onChange={(e) => setAdditionalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                    Source / Payment Method *
                  </label>
                  <select
                    value={additionalPaymentMethod}
                    onChange={(e) => setAdditionalPaymentMethod(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    <option value="DIRECT_BANK_WIRE">Direct Bank Wire</option>
                    <option value="ESCROW_TRANSFER">Escrow Transfer</option>
                    <option value="CASH_VAULT">Cash Vault Physical Settlement</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                  Bank / External Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ENBD-WIRE-99214"
                  value={additionalReference}
                  onChange={(e) => setAdditionalReference(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>
            </div>
          )}
        </div>

        {/* ALLOCATION BREAKDOWN CARD */}
        <div className="p-3.5 rounded-xl border border-gray-200 bg-white text-xs space-y-1.5 shadow-2xs">
          <div className="flex justify-between text-gray-500">
            <span>Reinvested from Settlement:</span>
            <span className="font-mono font-semibold text-gray-900">
              AED {reinvestNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {enableAdditional && (
            <div className="flex justify-between text-gray-500">
              <span>Additional Fresh Capital:</span>
              <span className="font-mono font-semibold text-gray-900">
                AED {addNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-950 pt-1.5 border-t border-gray-100">
            <span>Total New Investment Allocation:</span>
            <span className="font-mono text-sm text-gray-950">
              AED {totalAllocationAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* REFERENCE & NOTES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
              Internal Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. REINV-B01-DXB"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
          </div>

          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
              Notes / Memo (Optional)
            </label>
            <input
              type="text"
              placeholder="Reinvestment of settled capital..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
          </div>
        </div>
      </div>

        {/* FIXED FOOTER */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 mt-2 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !targetBusinessId ||
              totalAllocationAmount <= 0 ||
              reinvestNum > maxSpendableForSelectedSource
            }
            className="w-44 px-4 py-2 text-xs font-bold text-white bg-[#0c0d12] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            {isSubmitting ? (
              <span>Allocating...</span>
            ) : (
              <>
                <CheckIcon size={14} />
                <span>Confirm Allocation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
