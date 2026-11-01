"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CheckIcon, AlertTriangleIcon } from "@/components/ui/icons";

interface WalletWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  investorName: string;
  availableBalance: number;
  onSuccess: () => void;
}

export function WalletWithdrawalModal({
  isOpen,
  onClose,
  investorId,
  investorName,
  availableBalance,
  onSuccess,
}: WalletWithdrawalModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("DIRECT_BANK_WIRE");
  const [bankReference, setBankReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid withdrawal amount greater than 0.");
      return;
    }

    if (num > availableBalance + 0.005) {
      setError(`Withdrawal amount (AED ${num.toLocaleString()}) exceeds available balance (AED ${availableBalance.toLocaleString()}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/investors/${encodeURIComponent(investorId)}/wallet/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: num,
          paymentMethod,
          bankReference: bankReference.trim() || undefined,
          notes: notes.trim() || undefined,
          idempotencyKey: `wdr-${Date.now().toString(36)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to initiate withdrawal.");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate withdrawal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Request Withdrawal — ${investorName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangleIcon size={14} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
            Available to Withdraw
          </span>
          <span className="text-sm font-black text-gray-950 font-mono">
            AED {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Withdrawal Amount (AED) *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={availableBalance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
            {availableBalance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(availableBalance))}
                className="px-3 h-10 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Max
              </button>
            )}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Funds will be placed in Reserved status until payment execution is confirmed.
          </span>
        </div>

        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Disbursement Method *
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          >
            <option value="DIRECT_BANK_WIRE">Direct Bank Wire</option>
            <option value="ESCROW_TRANSFER">Escrow Transfer</option>
            <option value="CASH_VAULT">Cash Vault Physical Settlement</option>
            <option value="CHEQUE">Corporate Cheque</option>
          </select>
        </div>

        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Target Bank / IBAN Reference (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. AE290330000000001234567"
            value={bankReference}
            onChange={(e) => setBankReference(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
        </div>

        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Notes / Audit Reason (Optional)
          </label>
          <input
            type="text"
            placeholder="Investor payout request..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || Number(amount) <= 0 || Number(amount) > availableBalance}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0c0d12] hover:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Initiating...</span>
            ) : (
              <>
                <CheckIcon size={14} />
                <span>Reserve & Initiate Withdrawal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
