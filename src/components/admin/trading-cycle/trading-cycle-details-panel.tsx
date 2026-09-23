import React from "react";
import Link from "next/link";
import { TradingCycleRecord } from "@/types/trading-cycle";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface TradingCycleDetailsPanelProps {
  cycle: TradingCycleRecord;
  onClose?: () => void;
}

export function TradingCycleDetailsPanel({
  cycle,
  onClose,
}: TradingCycleDetailsPanelProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Panel Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-950">
              Trading Cycle Details
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold text-white bg-[#0c0d12] rounded">
              {cycle.id}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
            AUTO-SYNCED WITH DUBAI & INDIA LEDGER
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

      {/* SECTION 1: CYCLE & LINKED CONSIGNMENTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            CYCLE & LINKED CONSIGNMENTS
          </span>
          <span className="text-[10.5px] font-mono font-bold text-gray-700">
            {cycle.matchId}
          </span>
        </div>

        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-xs">
          {/* Operating Business */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-gray-50/40 gap-1.5">
            <span className="text-gray-600 font-medium">Operating Business:</span>
            <div className="text-left sm:text-right">
              <span className="font-bold text-gray-900 block">
                {cycle.businessEntity}
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                Equity Ratio: {cycle.equityRatio}
              </span>
            </div>
          </div>

          {/* Purchase Link */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors gap-2">
            <div>
              <span className="font-bold text-gray-950 block">
                Purchase: {cycle.purchaseId}
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                {cycle.purchaseLocation}
              </span>
            </div>
            <Link
              href="/purchase"
              className="inline-flex items-center gap-1.5 font-bold text-xs text-gray-900 hover:text-black group"
            >
              <span>AED {cycle.purchaseCost.toLocaleString()}</span>
              <ArrowRightIcon
                size={13}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {/* Sale Link */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors gap-2">
            <div>
              <span className="font-bold text-gray-950 block">
                Sale: {cycle.saleId}
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                {cycle.saleLocation}
              </span>
            </div>
            {cycle.realizationAED !== null ? (
              <Link
                href="/sales"
                className="inline-flex items-center gap-1.5 font-bold text-xs text-gray-900 hover:text-black group"
              >
                <span>AED {cycle.realizationAED.toLocaleString()}</span>
                <ArrowRightIcon
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ) : (
              <span className="text-xs text-gray-400 font-medium">Pending Realization</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: FINANCIAL REALIZATION & WATERFALL */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            FINANCIAL REALIZATION & WATERFALL
          </span>
          <span className="text-[10.5px] font-bold text-gray-500 uppercase">
            AED NOMINAL
          </span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Total India Gross Realization</span>
            <span className="font-bold text-gray-950">
              {cycle.realizationAED !== null
                ? `AED ${cycle.realizationAED.toLocaleString()}.00`
                : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <span>Less: Dubai Physical Purchase Cost</span>
            <span>- AED {cycle.purchaseCost.toLocaleString()}.00</span>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <span>Less: Customs, Air Freight & Security</span>
            <span>
              {cycle.expenses !== null
                ? `- AED ${cycle.expenses.toLocaleString()}.00`
                : "—"}
            </span>
          </div>

          {/* Gross Arbitrage Spread */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-semibold">
            <span className="text-gray-700">Gross Arbitrage Spread</span>
            <span className="text-gray-900">
              {cycle.grossProfit !== null
                ? `AED ${cycle.grossProfit.toLocaleString()}.00`
                : "—"}
            </span>
          </div>

          {/* Net Realized Trading Profit Card */}
          <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white -mx-4 -mb-4 p-4 rounded-b-lg border-t border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-950 uppercase tracking-wider block">
                Net Realized Trading Profit
              </span>
              {cycle.marginPercent !== null && (
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">
                  Margin: {cycle.marginPercent.toFixed(2)}% Net
                </span>
              )}
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">
                AED
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-950">
                {cycle.netProfit !== null
                  ? `${cycle.netProfit.toLocaleString()}.00`
                  : "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: DUAL-CURRENCY FX SETTLEMENT */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            DUAL-CURRENCY FX SETTLEMENT
          </span>
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            {cycle.fxSettlementStatus}
          </span>
        </div>

        <div className="rounded-lg border border-gray-200 p-3.5 space-y-2 text-xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">INR Nominal Realized:</span>
            <span className="font-bold text-gray-900">{cycle.inrNominalRealized}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Execution Cross-Rate:</span>
            <span className="font-semibold text-gray-800">{cycle.executionCrossRate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Net Disbursed AED Equivalent:</span>
            <span className="font-bold text-gray-900">
              {cycle.realizationAED !== null
                ? `AED ${cycle.realizationAED.toLocaleString()}.00`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-gray-600">FX Slippage / Variance:</span>
            <span className="font-medium text-gray-700">{cycle.fxSlippageVariance}</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: INVESTOR EQUITY DISTRIBUTION */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            INVESTOR EQUITY DISTRIBUTION
          </span>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
            RATIO: {cycle.partnerSplit.replace("A+B ", "").replace("A+C ", "").replace("(", "").replace(")", "").replace("/", " / ")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Partner B Share */}
          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 flex flex-col justify-between gap-3">
            <div>
              <span className="font-bold text-gray-950 block">
                {cycle.partnerBShare.name}
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 block font-medium">
                {cycle.partnerBShare.subtext}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200/80">
              <span className="text-sm font-bold text-gray-950 block">
                AED {cycle.partnerBShare.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-gray-500 mt-0.5 block font-medium">
                {cycle.partnerBShare.settledInfo}
              </span>
            </div>
          </div>

          {/* Desk Retained Share */}
          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 flex flex-col justify-between gap-3">
            <div>
              <span className="font-bold text-gray-950 block">
                {cycle.deskRetainedShare.name}
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 block font-medium">
                {cycle.deskRetainedShare.subtext}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200/80">
              <span className="text-sm font-bold text-gray-950 block">
                AED {cycle.deskRetainedShare.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-gray-500 mt-0.5 block font-medium">
                {cycle.deskRetainedShare.settledInfo}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          className="w-full h-10 px-4 rounded-lg bg-[#0c0d12] text-white hover:bg-[#1e222d] font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <span>Disburse Partner Settlement</span>
        </button>

        <button
          type="button"
          className="w-full h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Download Audit Voucher (PDF)</span>
        </button>
      </div>
    </div>
  );
}
