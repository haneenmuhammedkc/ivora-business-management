import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CrossLinksData } from "@/types/profit-loss";

export interface AuditedCrossLinksPanelProps {
  crossLinks?: CrossLinksData;
}

export function AuditedCrossLinksPanel({ crossLinks }: AuditedCrossLinksPanelProps) {
  const expenseText = crossLinks?.expenseCount
    ? `Open Expenses Ledger (${crossLinks.expenseCodeRange})`
    : "Open Expenses Ledger";

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-3">
      {/* Header */}
      <div className="pb-2 border-b border-gray-100">
        <h2 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
          TRANSACTION CROSS-LINKS
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
              {expenseText}
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
              Open Investor Profiles
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
