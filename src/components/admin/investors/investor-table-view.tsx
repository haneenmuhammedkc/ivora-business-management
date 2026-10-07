"use client";

import React from "react";
import Link from "next/link";
import { BusinessInvestorRow } from "@/types/investors";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface InvestorTableViewProps {
  businesses: BusinessInvestorRow[];
  selectedBusinessId?: string | null;
  onSelectBusiness?: (business: BusinessInvestorRow) => void;
  isLoading?: boolean;
}

export function InvestorTableView({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  isLoading = false,
}: InvestorTableViewProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Business
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {businesses.length} Records
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold text-right">TOTAL INVESTMENT</th>
              <th className="px-4 py-3.5 font-bold text-right">ADMIN INVESTMENT</th>
              <th className="px-4 py-3.5 font-bold">PARTNER</th>
              <th className="px-3.5 py-3.5 font-bold text-center">INVESTORS</th>
              <th className="px-3.5 py-3.5 font-bold text-center">STATUS</th>
              <th className="px-5 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                    <span>Loading businesses...</span>
                  </div>
                </td>
              </tr>
            ) : businesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No businesses found matching your filters.
                </td>
              </tr>
            ) : (
              businesses.map((b) => {
                const isCurrent = b.id === selectedBusinessId;

                return (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBusiness && onSelectBusiness(b)}
                    className={`transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-gray-100/90 ring-1 ring-inset ring-gray-900/15 shadow-2xs"
                        : "hover:bg-gray-50/70"
                    }`}
                  >
                    {/* Business */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                          {b.name}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          {b.code} • {b.businessType}
                        </span>
                      </div>
                    </td>

                    {/* Total Investment */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                          AED
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-gray-900 mt-0.5">
                          {b.totalInvestmentAED.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Admin Investment */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                          AED
                        </span>
                        <span className="text-xs font-semibold text-gray-900 mt-0.5">
                          {b.adminInvestmentAED.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Partner */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {b.partnerName}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          AED {b.partnerInvestmentAED.toLocaleString()} ({b.partnerEquityPct}%)
                        </span>
                      </div>
                    </td>

                    {/* External Investors Count */}
                    <td className="px-3.5 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-gray-800 bg-gray-100 rounded-md border border-gray-200">
                        {b.externalInvestorsCount}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-900 border border-gray-900 rounded uppercase">
                        {b.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/investors/business/${encodeURIComponent(b.id)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-950 transition-colors shadow-2xs"
                      >
                        <span>View</span>
                        <ArrowRightIcon size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-gray-100 text-xs text-gray-600">
        <div>
          Showing <strong className="font-semibold text-gray-900">{businesses.length > 0 ? `1-${businesses.length}` : "0"}</strong> of{" "}
          <strong className="font-semibold text-gray-900">{businesses.length}</strong> businesses
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Prev
          </button>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#0c0d12] rounded">
            1
          </span>
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
