"use client";

import React, { useState } from "react";
import { InvestorRecord } from "@/types/investors";
import { CheckIcon } from "@/components/ui/icons";

export interface InvestorDetailsPanelProps {
  investor: InvestorRecord;
  onClose?: () => void;
}

export function InvestorDetailsPanel({
  investor,
  onClose,
}: InvestorDetailsPanelProps) {
  const [settlementAmount, setSettlementAmount] = useState(
    investor.details.outstandingBalance.toFixed(2)
  );
  const [paymentMethod, setPaymentMethod] = useState(
    "Direct Bank Wire (ENBD - DXB Operating Escrow)"
  );
  const [isDisbursed, setIsDisbursed] = useState(false);

  const due = investor.details.outstandingBalance;
  const settleVal = Number(settlementAmount) || 0;
  const remaining = Math.max(0, due - settleVal);

  const handleDisburse = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisbursed(true);
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Panel Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-950">
              Investor Details: {investor.name}
            </h2>
            <span className="px-2 py-0.5 text-[10.5px] font-bold tracking-wider text-gray-900 border border-gray-900 rounded uppercase">
              {investor.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Entity: {investor.entityLabel}
          </p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 text-gray-400">
          <button
            type="button"
            className="p-1 rounded hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Expand"
            aria-label="Expand"
          >
            <span className="text-xs">⤢</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Close"
              aria-label="Close"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Investment</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0c0d12] hover:bg-[#1e222d] rounded-md transition-colors shadow-xs"
          >
            <CheckIcon size={13} />
            <span>Record Settlement</span>
          </button>
        </div>

        <button
          type="button"
          className="p-2 text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          title="Download"
          aria-label="Download"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            TOTAL INVESTMENT
          </span>
          <span className="text-base sm:text-lg font-bold text-gray-950 mt-1">
            AED {investor.details.totalInvestmentAED.toLocaleString()}
          </span>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            PROFIT SHARE
          </span>
          <div>
            <span className="text-base sm:text-lg font-bold text-gray-950 mt-1 block">
              {investor.details.profitShare}
            </span>
            <span className="text-[10.5px] text-gray-500 font-medium block">
              {investor.details.profitShareContract}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            ALLOCATED PROFIT
          </span>
          <span className="text-base sm:text-lg font-bold text-gray-950 mt-1">
            AED {investor.details.allocatedProfit.toLocaleString()}
          </span>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            OUTSTANDING BALANCE
          </span>
          <div>
            <span className="text-base sm:text-lg font-bold text-gray-950 mt-1 block">
              AED {investor.details.outstandingBalance.toLocaleString()}
            </span>
            <span className="text-[10.5px] text-gray-500 font-medium block">
              Paid: AED {investor.details.paidAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: TRADING CYCLE ALLOCATION BREAKDOWN */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            TRADING CYCLE ALLOCATION BREAKDOWN
          </span>
          <span className="text-[10.5px] font-mono font-bold text-gray-700">
            CYCLE: {investor.details.cycleAllocation.cycleId}
          </span>
        </div>

        <div className="rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/60 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-gray-700">
            <span>Net Cycle Profit:</span>
            <span className="font-bold text-gray-950">
              AED {investor.details.cycleAllocation.netCycleProfitAED.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <span>Contracted Ratio:</span>
            <span className="font-semibold text-gray-900">
              {investor.details.cycleAllocation.contractedRatio}
            </span>
          </div>

          <div className="pt-2 border-t border-[#d6e3ed] flex items-center justify-between">
            <span className="font-bold text-gray-900">Investor Profit Credit:</span>
            <span className="text-base font-bold text-gray-950">
              AED {investor.details.cycleAllocation.investorProfitCreditAED.toLocaleString()}
            </span>
          </div>

          <div className="pt-2 border-t border-[#d6e3ed] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-500 font-medium gap-1">
            <span>Allocation Date: {investor.details.cycleAllocation.allocationDate}</span>
            <span className="font-semibold text-gray-700">
              Status: {investor.details.cycleAllocation.status}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: RECORD SETTLEMENT DISBURSAL */}
      <form onSubmit={handleDisburse} className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            RECORD SETTLEMENT DISBURSAL
          </span>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
            DISBURSAL DESK
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                DUE OUTSTANDING
              </label>
              <div className="h-10 px-3.5 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center text-xs font-bold text-gray-900">
                AED {investor.details.outstandingBalance.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                SETTLEMENT AMOUNT
              </label>
              <input
                type="text"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
              PAYMENT METHOD & ESCROW ACCOUNT
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="Direct Bank Wire (ENBD - DXB Operating Escrow)">
                Direct Bank Wire (ENBD - DXB Operating Escrow)
              </option>
              <option value="ADCB Escrow Account #49281">
                ADCB Escrow Account #49281
              </option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 text-xs">
            <span className="text-gray-600 font-medium">
              Projected Remaining Balance:
            </span>
            <span className="font-bold text-gray-950">
              AED {remaining.toFixed(2)} {remaining === 0 ? "(Fully Settled)" : ""}
            </span>
          </div>

          <button
            type="submit"
            className="w-full h-10 px-4 rounded-lg bg-[#0c0d12] text-white hover:bg-[#1e222d] font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <CheckIcon size={14} />
            <span>
              {isDisbursed ? "Settlement Disbursal Confirmed ✓" : "Record Settlement Disbursal"}
            </span>
          </button>
        </div>
      </form>

      {/* SECTION 3: RECENT AUDIT & TRANSACTION HISTORY */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            RECENT AUDIT & TRANSACTION HISTORY
          </span>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
            IMMUTABLE
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {investor.details.recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
            >
              <div>
                <span className="font-bold text-gray-950 block">{tx.title}</span>
                <span className="text-[11px] text-gray-500 mt-0.5 block font-medium">
                  {tx.date} • {tx.reference}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="font-bold text-gray-950 block">
                  {tx.amountFormatted}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 block">
                  {tx.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
