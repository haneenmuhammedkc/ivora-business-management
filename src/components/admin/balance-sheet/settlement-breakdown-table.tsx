"use client";

import React, { useState, useMemo } from "react";
import { InvestorSettlementBreakdownItem } from "@/types/balance-sheet";
import { Badge } from "@/components/ui/badge";

export interface SettlementBreakdownTableProps {
  settlements: InvestorSettlementBreakdownItem[];
  searchTerm?: string;
}

export function SettlementBreakdownTable({
  settlements = [],
  searchTerm = "",
}: SettlementBreakdownTableProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtered list
  const filteredSettlements = useMemo(() => {
    return settlements.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      // Query filter (search in businessName, businessCode, investorName, investorCode)
      const effectiveQuery = (filterQuery || searchTerm).trim().toLowerCase();
      if (effectiveQuery) {
        const matchesBusiness =
          item.businessName.toLowerCase().includes(effectiveQuery) ||
          item.businessCode.toLowerCase().includes(effectiveQuery);
        const matchesInvestor =
          item.investorName.toLowerCase().includes(effectiveQuery) ||
          item.investorCode.toLowerCase().includes(effectiveQuery);
        if (!matchesBusiness && !matchesInvestor) {
          return false;
        }
      }
      return true;
    });
  }, [settlements, filterQuery, searchTerm, statusFilter]);

  // Aggregate totals for the filtered set
  const totals = useMemo(() => {
    return filteredSettlements.reduce(
      (acc, curr) => {
        acc.totalInvestment += curr.totalInvestmentAED;
        acc.profitAmount += curr.profitAmountAED;
        acc.totalDue += curr.totalDueAED;
        acc.capitalPaid += curr.capitalPaidAED;
        acc.profitPaid += curr.profitPaidAED;
        acc.totalPaid += curr.totalPaidAED;
        acc.pendingOutstanding += curr.pendingOutstandingAED;
        return acc;
      },
      {
        totalInvestment: 0,
        profitAmount: 0,
        totalDue: 0,
        capitalPaid: 0,
        profitPaid: 0,
        totalPaid: 0,
        pendingOutstanding: 0,
      }
    );
  }, [filteredSettlements]);

  const getStatusBadge = (status: "Pending" | "Partially Settled" | "Settled") => {
    switch (status) {
      case "Settled":
        return (
          <Badge
            variant="active"
            className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            SETTLED
          </Badge>
        );
      case "Partially Settled":
        return (
          <Badge
            variant="neutral"
            className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-blue-50 text-blue-700 border-blue-200"
          >
            PARTIALLY SETTLED
          </Badge>
        );
      case "Pending":
      default:
        return (
          <Badge
            variant="neutral"
            className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-amber-50 text-amber-700 border-amber-200"
          >
            PENDING
          </Badge>
        );
    }
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#f8fafc]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
              Settlement Breakdown
            </h2>
          </div>
        </div>

        {/* Quick Filter controls in header */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search investor / business..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="h-8 w-44 sm:w-56 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by settlement status"
            className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 focus:border-gray-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Settled">Partially Settled</option>
            <option value="Settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3.5 font-bold">Business</th>
              <th className="px-3.5 py-3.5 font-bold">Investor</th>
              <th className="px-3.5 py-3.5 font-bold text-right">Total Investment</th>
              <th className="px-3.5 py-3.5 font-bold text-right">Profit Allocation</th>
              <th className="px-3.5 py-3.5 font-bold text-right">Total Due</th>
              <th className="px-3.5 py-3.5 font-bold text-right">Paid / Disbursed</th>
              <th className="px-3.5 py-3.5 font-bold text-right">Outstanding Due</th>
              <th className="px-4 py-3.5 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredSettlements.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-8 text-center text-gray-400 font-medium text-xs"
                >
                  No investor settlement records found.
                </td>
              </tr>
            ) : (
              filteredSettlements.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-gray-50/60"
                >
                  {/* Business Name & Code */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{item.businessName}</div>
                    {item.businessCode && (
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                        CODE: {item.businessCode}
                      </div>
                    )}
                  </td>

                  {/* Investor Name & Code */}
                  <td className="px-3.5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-950">
                        {item.investorName}
                      </span>
                      {item.investorType && item.investorType !== "INVESTOR" && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded font-semibold uppercase">
                          {item.investorType}
                        </span>
                      )}
                    </div>
                    {item.investorCode && (
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                        {item.investorCode}
                      </div>
                    )}
                  </td>

                  {/* Total Investment */}
                  <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-900 font-bold">
                      AED{" "}
                      {item.totalInvestmentAED.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  {/* Profit Allocation */}
                  <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                    <span
                      className={`text-xs font-bold ${
                        item.profitAmountAED >= 0
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      AED{" "}
                      {item.profitAmountAED.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  {/* Total Due */}
                  <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-950 font-black">
                      AED{" "}
                      {item.totalDueAED.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  {/* Total Paid / Disbursed */}
                  <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                    <span className="text-xs text-emerald-700 font-bold">
                      AED{" "}
                      {item.totalPaidAED.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {(item.capitalPaidAED > 0 || item.profitPaidAED > 0) && (
                      <div className="text-[10px] text-gray-400 font-normal">
                        Cap: AED {item.capitalPaidAED.toLocaleString("en-US", { maximumFractionDigits: 0 })} | Prof: AED {item.profitPaidAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </div>
                    )}
                  </td>

                  {/* Outstanding Due */}
                  <td className="px-3.5 py-3.5 text-right whitespace-nowrap">
                    <span
                      className={`text-xs sm:text-[13px] font-black ${
                        item.pendingOutstandingAED > 0
                          ? "text-amber-700"
                          : "text-gray-400"
                      }`}
                    >
                      AED{" "}
                      {item.pendingOutstandingAED.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer Summary */}
          {filteredSettlements.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-[#f8fafc] font-bold text-gray-950">
                <td className="px-5 py-3.5 font-black uppercase text-xs" colSpan={2}>
                  Total Portfolio Settlement ({filteredSettlements.length}{" "}
                  {filteredSettlements.length === 1 ? "Record" : "Records"})
                </td>
                <td className="px-3.5 py-3.5 text-right text-xs font-black whitespace-nowrap">
                  AED{" "}
                  {totals.totalInvestment.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3.5 text-right text-xs font-black text-emerald-700 whitespace-nowrap">
                  AED{" "}
                  {totals.profitAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3.5 text-right text-xs font-black whitespace-nowrap">
                  AED{" "}
                  {totals.totalDue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3.5 text-right text-xs font-black text-emerald-700 whitespace-nowrap">
                  AED{" "}
                  {totals.totalPaid.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3.5 py-3.5 text-right text-xs font-black text-amber-700 whitespace-nowrap">
                  AED{" "}
                  {totals.pendingOutstanding.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3.5 text-center text-[10px] text-gray-400 font-bold uppercase">
                  SUMMARY
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
