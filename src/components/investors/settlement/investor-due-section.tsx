"use client";

import React from "react";
import { InvestorSettlementOverview } from "@/services/investor/settlement.service";

interface InvestorDueSectionProps {
  settlement: InvestorSettlementOverview;
}

export function InvestorDueSection({ settlement }: InvestorDueSectionProps) {
  const totalInvestment = settlement.totalInvestmentAED;
  const profitAmount = settlement.allocatedProfitAED;
  const dueAmount = settlement.totalDueAED;

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
          Section 2 — Investor Due
        </h3>
        <p className="text-[11px] text-gray-500 font-normal mt-0.5">
          Total gross financial entitlement (Principal Capital + Allocated Profit).
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Field 1: Total Investment */}
          <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              TOTAL INVESTMENT
            </span>
            <span className="text-base font-bold text-gray-900 block">
              AED {totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-400 block">
              Original committed investment capital
            </span>
          </div>

          {/* Field 2: Profit Amount */}
          <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              PROFIT AMOUNT
            </span>
            <span className="text-base font-bold text-emerald-700 block">
              AED {profitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-400 block">
              Allocated share of business net earnings
            </span>
          </div>

          {/* Field 3: Due Amount */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
              DUE AMOUNT (TOTAL ENTITLEMENT)
            </span>
            <span className="text-lg font-black text-gray-950 block">
              AED {dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-500 block font-medium">
              Formula: Total Investment + Profit Amount
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
