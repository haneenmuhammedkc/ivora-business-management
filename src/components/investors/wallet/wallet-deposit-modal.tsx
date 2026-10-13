"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CheckIcon, AlertTriangleIcon } from "@/components/ui/icons";

interface WalletDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  investorName: string;
  onSuccess: () => void;
}

export function WalletDepositModal({
  isOpen,
  onClose,
  investorId,
  investorName,
  onSuccess,
}: WalletDepositModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("DIRECT_BANK_WIRE");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid deposit amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/investors/${encodeURIComponent(investorId)}/wallet/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: num,
          paymentMethod,
          reference: reference.trim() || undefined,
          date,
          notes: notes.trim() || undefined,
          idempotencyKey: `dep-${Date.now().toString(36)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to record wallet deposit.");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record deposit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Deposit Funds — ${investorName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangleIcon size={14} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Deposit Amount (AED) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
              Payment Method *
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
              Deposit Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
          </div>
        </div>

        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Bank Reference / Voucher # (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. ENBD-DEP-99410"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
        </div>

        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Notes / Remarks (Optional)
          </label>
          <input
            type="text"
            placeholder="Initial capital injection..."
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
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0c0d12] hover:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Recording...</span>
            ) : (
              <>
                <CheckIcon size={14} />
                <span>Confirm Deposit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
