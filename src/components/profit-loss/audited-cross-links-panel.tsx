import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

export function AuditedCrossLinksPanel() {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-3">
      {/* Header */}
      <div className="pb-2 border-b border-gray-100">
        <h2 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
          AUDITED CROSS-LINKS
        </h2>
      </div>

      <div className="space-y-1.5 text-xs">
        {/* Expenses Ledger */}
        <Link
          href="/expenses"
          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group text-gray-800"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📑</span>
            <span className="font-semibold text-gray-900">
              Open Expenses Ledger (EXP-018 - 023)
            </span>
          </div>
          <ArrowRightIcon
            size={13}
            className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        {/* Trading Cycles */}
        <Link
          href="/trading-cycle"
          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group text-gray-800"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-500">🔄</span>
            <span className="font-semibold text-gray-900">
              Open Trading Cycles (TR-0248)
            </span>
          </div>
          <ArrowRightIcon
            size={13}
            className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        {/* Investor Settlements */}
        <Link
          href="/investors"
          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group text-gray-800"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-500">👥</span>
            <span className="font-semibold text-gray-900">
              Open Investor Settlements
            </span>
          </div>
          <ArrowRightIcon
            size={13}
            className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all"
          />
        </Link>
      </div>
    </div>
  );
}
