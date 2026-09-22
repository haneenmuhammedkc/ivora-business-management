import React from "react";
import { BalanceSheetStatementData, BalanceSheetItem } from "@/types/balance-sheet";

export interface BalanceSheetStatementProps {
  statement: BalanceSheetStatementData;
}

function ItemRow({ item }: { item: BalanceSheetItem }) {
  if (item.isHighlighted) {
    return (
      <div className="p-3.5 rounded-lg bg-[#f0f4f8] border border-[#d6e3ed] space-y-1.5 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-1.5">
            <span className="text-gray-900 text-xs mt-0.5">▸</span>
            <div>
              <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                {item.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-black text-gray-950 text-xs sm:text-[13px] tracking-tight">
              AED {item.amountAED.toLocaleString()}
            </span>
            {item.badge && (
              <div className="text-[10px] text-gray-500 font-medium tracking-tight">
                {item.badge}
              </div>
            )}
          </div>
        </div>

        {item.drilldown && (
          <p className="text-[11px] text-gray-600 font-medium pl-4 leading-relaxed">
            {item.drilldown}
          </p>
        )}
        {item.note && (
          <p className="text-[10px] text-gray-500 italic pl-4">
            {item.note}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="py-2.5 space-y-1">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-1.5">
          <span className="text-gray-900 text-xs mt-0.5">▸</span>
          <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
            {item.name}
          </span>
        </div>
        <div className="text-right">
          <span className="font-bold text-gray-900 text-xs sm:text-[13px] tracking-tight">
            AED {item.amountAED.toLocaleString()}
          </span>
          {item.badge && (
            <div className="text-[10.5px] text-gray-500 font-medium tracking-tight">
              {item.badge}
            </div>
          )}
        </div>
      </div>
      {item.drilldown && (
        <p className="text-[11px] text-gray-500 font-normal pl-4 leading-relaxed">
          {item.drilldown}
        </p>
      )}
    </div>
  );
}

export function BalanceSheetStatement({ statement }: BalanceSheetStatementProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* LEFT COLUMN: ASSETS */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#f8fafc]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
                ASSETS
              </h2>
            </div>
            <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
              IN AED EQUIVALENT
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* 1. CURRENT ASSETS */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  CURRENT ASSETS
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  VALUATION BASIS
                </span>
              </div>
              <div className="space-y-1 divide-y divide-gray-100/80">
                {statement.currentAssets.map((item, idx) => (
                  <ItemRow key={idx} item={item} />
                ))}
              </div>

              {/* Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  TOTAL CURRENT ASSETS
                </span>
                <span className="font-extrabold text-sm text-gray-950">
                  AED {statement.totalCurrentAssetsAED.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. NON-CURRENT ASSETS */}
            <div className="space-y-2.5 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  NON-CURRENT ASSETS
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  BOOK VALUE
                </span>
              </div>
              <div className="space-y-1">
                {statement.nonCurrentAssets.map((item, idx) => (
                  <ItemRow key={idx} item={item} />
                ))}
              </div>

              {/* Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  TOTAL NON-CURRENT ASSETS
                </span>
                <span className="font-extrabold text-sm text-gray-950">
                  AED {statement.totalNonCurrentAssetsAED.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Total Box */}
        <div className="p-5 pt-0">
          <div className="h-12 px-4 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950 shadow-2xs">
            <span className="uppercase text-xs tracking-wider font-black">
              TOTAL ASSETS <span className="text-gray-500 font-bold text-[11px]">(CONSOLIDATED)</span>
            </span>
            <span className="text-base sm:text-lg font-black">
              AED {statement.totalAssetsConsolidatedAED.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LIABILITIES & EQUITY */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#f8fafc]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
                LIABILITIES & EQUITY
              </h2>
            </div>
            <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
              IN AED EQUIVALENT
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* 1. CURRENT LIABILITIES */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  CURRENT LIABILITIES
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  OBLIGATION CLASS
                </span>
              </div>
              <div className="space-y-1 divide-y divide-gray-100/80">
                {statement.currentLiabilities.map((item, idx) => (
                  <ItemRow key={idx} item={item} />
                ))}
              </div>

              {/* Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  TOTAL LIABILITIES
                </span>
                <span className="font-extrabold text-sm text-gray-950">
                  AED {statement.totalCurrentLiabilitiesAED.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 2. PARTNER EQUITY */}
            <div className="space-y-2.5 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  PARTNER EQUITY
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  CAPITAL LEDGER
                </span>
              </div>
              <div className="space-y-1 divide-y divide-gray-100/80">
                {statement.partnerEquity.map((item, idx) => (
                  <ItemRow key={idx} item={item} />
                ))}
              </div>

              {/* Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  TOTAL EQUITY
                </span>
                <span className="font-extrabold text-sm text-gray-950">
                  AED {statement.totalEquityAED.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Total Box */}
        <div className="p-5 pt-0">
          <div className="h-12 px-4 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950 shadow-2xs">
            <span className="uppercase text-xs tracking-wider font-black">
              TOTAL LIABILITIES & EQUITY <span className="text-gray-500 font-bold text-[11px]">(CONSOLIDATED)</span>
            </span>
            <span className="text-base sm:text-lg font-black">
              AED {statement.totalLiabilitiesAndEquityConsolidatedAED.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
