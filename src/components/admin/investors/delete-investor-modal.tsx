"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, XIcon, CheckIcon } from "@/components/ui/icons";
import { InvestorRecord } from "@/types/investors";

export interface DeleteInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: InvestorRecord;
  onSuccess?: () => void;
}

export function DeleteInvestorModal({
  isOpen,
  onClose,
  investor,
  onSuccess,
}: DeleteInvestorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Detect whether the investor has recorded transactions
  const transactions = investor.details?.recentTransactions || [];
  const hasTransactions = transactions.length > 0;
  const investmentAmount = investor.details?.totalInvestmentAED ?? investor.investmentAED ?? 0;

  const handleDelete = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/investors/${encodeURIComponent(investor.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceDeactivate: hasTransactions,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        onSuccess?.();
        onClose();
      } else {
        const msg = data.message || data.error || "Failed to process investor deletion.";
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${hasTransactions ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-red-50 border-red-200 text-red-600"}`}>
              <AlertTriangleIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-950">
                {hasTransactions ? "Deactivate Investor" : "Delete Investor"}
              </h2>
              <span className="text-xs text-gray-500 font-mono">
                {investor.code || "INV"} • {investor.business || "Business"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[11px] text-red-800">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Investor Summary Details */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Investor Name:</span>
            <span className="font-bold text-gray-950">{investor.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Committed Capital:</span>
            <span className="font-bold text-gray-950">AED {investmentAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Profit / Equity Share:</span>
            <span className="font-semibold text-gray-800">
              {investor.details?.profitShare || `${investor.sharePercent ?? 0}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Status:</span>
            <span className="font-bold uppercase text-gray-900">{investor.status}</span>
          </div>
        </div>

        {/* Dynamic Warning Message */}
        {hasTransactions ? (
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>Financial Ledger History Detected</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-amber-800">
              This investor has {transactions.length} recorded ledger transaction(s). To protect accounting integrity and audit trails, permanent hard-deletion is blocked.
            </p>
            <p className="text-[11.5px] leading-relaxed font-medium text-amber-900">
              Deactivating this investor will mark their status as <strong>INACTIVE</strong> and release <strong>AED {investmentAmount.toLocaleString()}</strong> in investment capacity back to the business.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-red-50/80 border border-red-200/80 p-3.5 text-xs text-red-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>Permanent Deletion Confirmation</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-red-800">
              This investor has zero recorded transactions. Deletion will permanently remove the investor entity and release <strong>AED {investmentAmount.toLocaleString()}</strong> in investment capacity back to the business.
            </p>
            <p className="text-[11px] text-red-700 font-medium">
              This action cannot be undone.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-xs ${
              hasTransactions
                ? "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300"
                : "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
            }`}
          >
            <CheckIcon size={14} />
            <span>
              {isSubmitting
                ? "Processing..."
                : hasTransactions
                ? "Deactivate Investor"
                : "Permanently Delete Investor"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
