"use client";

import React, { useState, useMemo } from "react";
import { BusinessProfitability } from "@/types/profit-loss";

export interface BusinessProfitabilityTableProps {
  businesses: BusinessProfitability[];
}

export function BusinessProfitabilityTable({
  businesses,
}: BusinessProfitabilityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevBusinesses, setPrevBusinesses] = useState(businesses);
  const pageSize = 10;

  // Reset page to 1 during render when businesses array reference changes
  if (prevBusinesses !== businesses) {
    setPrevBusinesses(businesses);
    setCurrentPage(1);
  }

  // Sort businesses by createdAt DESC (newest first), keeping consolidated at the end, with deterministic id DESC fallback
  const sortedBusinesses = useMemo(() => {
    return [...businesses].sort((a, b) => {
      if (a.isConsolidated && !b.isConsolidated) return 1;
      if (!a.isConsolidated && b.isConsolidated) return -1;

      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    });
  }, [businesses]);

  const totalRecords = sortedBusinesses.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Ensure currentPage is within valid bounds
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);

  const paginatedBusinesses = useMemo(() => {
    return sortedBusinesses.slice(startIndex, endIndex);
  }, [sortedBusinesses, startIndex, endIndex]);

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

  // Generate array of page numbers to show
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">🏢</span>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
            BUSINESS PROFITABILITY COMPARISON
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {totalRecords} {totalRecords === 1 ? "Active Entity" : "Active Entities"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3.5 font-bold">BUSINESS</th>
              <th className="px-3.5 py-3.5 font-bold text-right">TOTAL SALES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">PURCHASE COST</th>
              <th className="px-3.5 py-3.5 font-bold text-right">OPERATING EXPENSES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">GROSS PROFIT</th>
              <th className="px-3.5 py-3.5 font-bold text-right">NET PROFIT</th>
              <th className="px-3.5 py-3.5 font-bold text-center">NET MARGIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedBusinesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-xs">
                  No business records found matching the selected filters.
                </td>
              </tr>
            ) : (
              paginatedBusinesses.map((biz) => {
                const isConsolidated = !!biz.isConsolidated;
                return (
                  <tr
                    key={biz.id}
                    className={`transition-colors hover:bg-gray-50/60 ${
                      isConsolidated ? "bg-gray-50/70 font-bold" : ""
                    }`}
                  >
                    {/* Business Name */}
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs ${
                          isConsolidated
                            ? "font-black text-gray-950 uppercase tracking-wider"
                            : "font-bold text-gray-900"
                        }`}
                      >
                        {biz.name}
                      </span>
                    </td>

                    {/* Sales */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-900 font-semibold">
                        AED {biz.salesAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Purchase */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-800 font-medium">
                        AED {biz.purchaseAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Expenses */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-700 font-medium">
                        AED {biz.expensesAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Gross Profit */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-900 font-semibold">
                        AED {biz.grossProfitAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Net Profit */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs sm:text-[13px] font-bold text-gray-950">
                        AED {biz.netProfitAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Net Margin */}
                    <td className="px-3.5 py-4 text-center whitespace-nowrap">
                      <span className="font-semibold text-xs text-gray-800">
                        {biz.netMarginPercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
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
              {totalRecords === 1 ? "business" : "businesses"}
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
