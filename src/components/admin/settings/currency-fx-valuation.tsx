import React from "react";
import { Badge } from "@/components/ui/badge";

export function CurrencyFxValuation() {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            Currency & Real-Time FX Valuation Desk
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Central monetary baseline, multi-currency conversion feeds, and spot hedging protocols.
          </p>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
          PROVIDER: BLOOMBERG B-PIPE DIRECT
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Base Denomination */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                BASE DENOMINATION
              </span>
              <span className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase bg-[#0c0d12] text-white">
                PEGGED BASE
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                AED 1.0000
              </div>
              <p className="text-[11px] text-gray-500 font-normal mt-1 leading-relaxed">
                United Arab Emirates Dirham — Sovereign reporting baseline across all trading ledgers.
              </p>
            </div>
          </div>

          {/* Card 2: Secondary Trade Pair */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                SECONDARY TRADE PAIR
              </span>
              <Badge variant="outline" className="text-[9.5px] font-bold px-1.5 py-0.5 border-gray-300 text-gray-800">
                ₹22.74 ↑
              </Badge>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                INR (Indian Rupee)
              </div>
              <div className="text-[11px] text-gray-600 font-medium mt-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span>Execution Feeds:</span>
                  <span className="font-bold text-gray-900">Real-time Transaction Rate</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hedge Lock Status:</span>
                  <span className="font-bold text-gray-950 uppercase text-[10px]">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Statutory Peg */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                STATUTORY PEG
              </span>
              <Badge variant="outline" className="text-[9.5px] font-bold px-1.5 py-0.5 border-gray-300 text-gray-800">
                3.6725 / AED
              </Badge>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                USD (US Dollar)
              </div>
              <p className="text-[11px] text-gray-500 font-normal mt-1 leading-relaxed">
                UAE Central Bank fixed exchange peg. Zero delta slip threshold tolerated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
