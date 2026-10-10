"use client";

import React, { useState, useMemo } from "react";
import { CheckIcon, AlertTriangleIcon } from "@/components/ui/icons";
import { InvestorSettlementOverview } from "@/services/investor/settlement.service";

interface RecordDisbursalSectionProps {
  settlement: InvestorSettlementOverview;
  isAdmin: boolean;
  onPaymentRecorded: () => void;
}

export function RecordDisbursalSection({
  settlement,
  isAdmin,
  onPaymentRecorded,
}: RecordDisbursalSectionProps) {
  const [capitalAmount, setCapitalAmount] = useState<string>("");
  const [profitAmount, setProfitAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("DIRECT_BANK_WIRE");
  const [bankReference, setBankReference] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const outstandingCap = settlement.outstandingCapitalAED;
  const outstandingPrf = settlement.outstandingProfitAED;
  const totalOutstanding = settlement.totalOutstandingAED;
  const isFullySettled = settlement.isFullySettled || totalOutstanding <= 0.005;

  const parsedCap = useMemo(() => {
    const raw = capitalAmount.trim();
    if (!raw || !/^\d+(\.\d+)?$/.test(raw)) return 0;
    const n = Number(raw);
    return isNaN(n) || !isFinite(n) ? 0 : n;
  }, [capitalAmount]);

  const parsedPrf = useMemo(() => {
    const raw = profitAmount.trim();
    if (!raw || !/^\d+(\.\d+)?$/.test(raw)) return 0;
    const n = Number(raw);
    return isNaN(n) || !isFinite(n) ? 0 : n;
  }, [profitAmount]);

  const totalCurrentPayment = useMemo(() => {
    return Number((parsedCap + parsedPrf).toFixed(2));
  }, [parsedCap, parsedPrf]);

  const isCapExceeded = parsedCap > outstandingCap + 0.005;
  const isPrfExceeded = parsedPrf > outstandingPrf + 0.005;
  const isTotalExceeded = totalCurrentPayment > totalOutstanding + 0.005;

  const handleFillMaxCapital = () => {
    setCapitalAmount(String(outstandingCap));
  };

  const handleFillMaxProfit = () => {
    setProfitAmount(String(outstandingPrf));
  };

  const handleFillFullOutstanding = () => {
    setCapitalAmount(String(outstandingCap));
    setProfitAmount(String(outstandingPrf));
  };

  const handleSubmitDisbursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isFullySettled) return;

    if (totalCurrentPayment <= 0) {
      setFeedback({
        type: "error",
        message: "Payment amount must be greater than zero.",
      });
      return;
    }

    if (isCapExceeded) {
      setFeedback({
        type: "error",
        message: `Capital return amount (AED ${parsedCap.toLocaleString()}) exceeds outstanding capital balance (AED ${outstandingCap.toLocaleString()}).`,
      });
      return;
    }

    if (isPrfExceeded) {
      setFeedback({
        type: "error",
        message: `Profit disbursal amount (AED ${parsedPrf.toLocaleString()}) exceeds outstanding profit balance (AED ${outstandingPrf.toLocaleString()}).`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/investors/${encodeURIComponent(settlement.investor.id)}/settlement/disburse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capitalAmount: parsedCap,
          profitAmount: parsedPrf,
          paymentMethod,
          bankReference: bankReference.trim() || undefined,
          transactionDate: paymentDate,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Failed to record settlement disbursal.");
      }

      setFeedback({
        type: "success",
        message: json.message || "Disbursal payment recorded successfully.",
      });

      // Clear form inputs
      setCapitalAmount("");
      setProfitAmount("");
      setBankReference("");
      setNotes("");

      onPaymentRecorded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process disbursal.";
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
              Section 3 — Payment / Disbursal
            </h3>
            {isFullySettled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded">
                <CheckIcon size={12} />
                <span>FULLY SETTLED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded">
                <span>DISBURSAL DESK</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Execute principal capital returns and profit distribution wire transfers.
          </p>
        </div>

        {isAdmin && !isFullySettled && (
          <button
            type="button"
            onClick={handleFillFullOutstanding}
            className="text-[11px] font-bold text-gray-700 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors cursor-pointer self-start sm:self-auto"
          >
            Settle Full Remaining Balance
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Outstanding Balance Real-time Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/70">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              OUTSTANDING CAPITAL
            </span>
            <span className="text-sm sm:text-base font-bold text-gray-900 block mt-0.5">
              AED {outstandingCap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9.5px] text-gray-400 block mt-0.5">
              Paid: AED {settlement.totalCapitalPaidAED.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              OUTSTANDING PROFIT
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-700 block mt-0.5">
              AED {outstandingPrf.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9.5px] text-gray-400 block mt-0.5">
              Paid: AED {settlement.totalProfitPaidAED.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              TOTAL OUTSTANDING BALANCE
            </span>
            <span className="text-sm sm:text-base font-black text-gray-950 block mt-0.5">
              AED {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9.5px] text-gray-400 block mt-0.5">
              Total Paid: AED {settlement.totalPaidAED.toLocaleString()}
            </span>
          </div>
        </div>

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

        {!isAdmin ? (
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-center space-y-1">
            <span className="text-xs font-bold text-gray-700 block">Read-Only Disbursal View</span>
            <p className="text-[11px] text-gray-500 max-w-md mx-auto">
              You are signed in as a Partner. Disbursal execution and financial settlements are reserved for Administrators.
            </p>
          </div>
        ) : isFullySettled ? (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center space-y-1">
            <span className="text-xs font-bold text-emerald-900 block">Investment Fully Settled</span>
            <p className="text-[11px] text-emerald-700 max-w-md mx-auto">
              All principal capital and allocated profit amounts have been 100% disbursed and cleared. No outstanding balance remains.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitDisbursal} className="space-y-4">
            {/* Input Split: Capital Return vs Profit Disbursal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
                    CAPITAL RETURN (AED)
                  </label>
                  {outstandingCap > 0 && (
                    <button
                      type="button"
                      onClick={handleFillMaxCapital}
                      className="text-[10px] font-bold text-gray-600 hover:text-gray-900 cursor-pointer underline"
                    >
                      Max: AED {outstandingCap.toLocaleString()}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={outstandingCap}
                  placeholder="0.00"
                  value={capitalAmount}
                  onChange={(e) => setCapitalAmount(e.target.value)}
                  className={`w-full h-10 px-3.5 rounded-lg border text-xs font-bold text-gray-900 transition-colors focus:outline-none focus:ring-1 ${
                    isCapExceeded
                      ? "border-red-300 focus:ring-red-500 bg-red-50/20"
                      : "border-gray-200 bg-white focus:ring-gray-950"
                  }`}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Returns original investment capital
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
                    PROFIT DISBURSAL (AED)
                  </label>
                  {outstandingPrf > 0 && (
                    <button
                      type="button"
                      onClick={handleFillMaxProfit}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer underline"
                    >
                      Max: AED {outstandingPrf.toLocaleString()}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={outstandingPrf}
                  placeholder="0.00"
                  value={profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  className={`w-full h-10 px-3.5 rounded-lg border text-xs font-bold text-gray-900 transition-colors focus:outline-none focus:ring-1 ${
                    isPrfExceeded
                      ? "border-red-300 focus:ring-red-500 bg-red-50/20"
                      : "border-gray-200 bg-white focus:ring-gray-950"
                  }`}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Distributes realized business profit
                </span>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                  TOTAL SETTLEMENT AMOUNT
                </label>
                <div className="h-10 px-3.5 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between text-xs font-bold text-gray-950">
                  <span>AED {totalCurrentPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-[10px] font-normal text-gray-500">Current Wire</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Sum of Capital + Profit components
                </span>
              </div>
            </div>

            {/* Payment Method, Bank Reference, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                  PAYMENT METHOD
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
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                  BANK / TRANSFER REFERENCE
                </label>
                <input
                  type="text"
                  placeholder="e.g. ENBD-WIRE-88491"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                  PAYMENT DATE
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>
            </div>

            {/* Optional Notes & Submit Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                  MEMO / NOTES (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Settlement batch description..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || totalCurrentPayment <= 0 || isCapExceeded || isPrfExceeded || isTotalExceeded}
                  className="w-full h-10 px-4 rounded-lg bg-[#0c0d12] hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Processing Disbursal...</span>
                  ) : (
                    <>
                      <CheckIcon size={14} />
                      <span>Execute & Record Disbursal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
