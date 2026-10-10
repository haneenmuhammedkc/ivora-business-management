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
  const [currentPage, setCurrentPage] = useState(1);
  const [prevFiltered, setPrevFiltered] = useState<InvestorSettlementBreakdownItem[]>([]);
  const pageSize = 10;

  // 1. Filtered list
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

  // Reset page to 1 during render when filtered list reference changes
  if (prevFiltered !== filteredSettlements) {
    setPrevFiltered(filteredSettlements);
    setCurrentPage(1);
  }

  // 2. Sort list by createdAt DESC (newest first) with deterministic id DESC tiebreaker
  const sortedSettlements = useMemo(() => {
    return [...filteredSettlements].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    });
  }, [filteredSettlements]);

  // 3. Paginate sorted list (10 items per page)
  const totalRecords = sortedSettlements.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);

  const paginatedSettlements = useMemo(() => {
    return sortedSettlements.slice(startIndex, endIndex);
  }, [sortedSettlements, startIndex, endIndex]);

  const handlePrevPage = () => {
    if (validPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (validPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageSelect = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  // Aggregate totals for the filtered set (full filtered portfolio summary)
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
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
              Settlement Breakdown
            </h2>
            <span className="text-[11px] font-semibold text-gray-500">
              ({totalRecords} {totalRecords === 1 ? "Record" : "Records"})
            </span>
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
            {paginatedSettlements.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-8 text-center text-gray-400 font-medium text-xs"
                >
                  No investor settlement records found.
                </td>
              </tr>
            ) : (
              paginatedSettlements.map((item) => (
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

      {/* Pagination Footer */}
      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100 bg-white text-xs text-gray-600 print:hidden">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-gray-900 font-semibold">
                {startIndex + 1}-{endIndex}
              </strong>{" "}
              of{" "}
              <strong className="text-gray-900 font-semibold">
                {totalRecords}
              </strong>{" "}
              {totalRecords === 1 ? "settlement" : "settlements"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={validPage <= 1}
              className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1">
              {totalPages <= 7 ? (
                pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageSelect(page)}
                    className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-xs font-semibold rounded-md transition-colors ${
                      page === validPage
                        ? "bg-[#0c0d12] text-white shadow-2xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handlePageSelect(1)}
                    className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-xs font-semibold rounded-md transition-colors ${
                      1 === validPage
                        ? "bg-[#0c0d12] text-white shadow-2xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    1
                  </button>
                  {validPage > 3 && <span className="px-1 text-gray-400">…</span>}
                  {pageNumbers
                    .filter((p) => p > 1 && p < totalPages && Math.abs(p - validPage) <= 1)
                    .map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handlePageSelect(page)}
                        className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-xs font-semibold rounded-md transition-colors ${
                          page === validPage
                            ? "bg-[#0c0d12] text-white shadow-2xs"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  {validPage < totalPages - 2 && <span className="px-1 text-gray-400">…</span>}
                  <button
                    type="button"
                    onClick={() => handlePageSelect(totalPages)}
                    className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 text-xs font-semibold rounded-md transition-colors ${
                      totalPages === validPage
                        ? "bg-[#0c0d12] text-white shadow-2xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={validPage >= totalPages}
              className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
