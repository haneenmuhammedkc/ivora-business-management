"use client";

import React, { useState, useMemo } from "react";
import { DetailedReportResponse, DetailedReportType } from "@/types/reports";
import {
  exportDetailedReportExcel,
  exportDetailedReportCsv,
} from "@/lib/export/export-report-excel";
import { exportDetailedReportPdf as exportToPdf } from "@/lib/export/export-report-pdf";
import { DownloadIcon } from "@/components/ui/icons";

import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";

export interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportKey: DetailedReportType | null;
  businessId: string;
  period: string;
  startDate?: string;
  endDate?: string;
  status: string;
  product: string;
}

export function ReportDetailModal({
  isOpen,
  onClose,
  reportKey,
  businessId,
  period,
  startDate,
  endDate,
  status,
  product,
}: ReportDetailModalProps) {
  const [tableSearch, setTableSearch] = useState("");

  const queryParams = new URLSearchParams({
    reportType: reportKey || "",
    ...(businessId && businessId !== "all" ? { businessId } : {}),
    ...(period ? { period } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(status && status !== "all" ? { status } : {}),
    ...(product && product !== "all" ? { product } : {}),
  });

  const reportUrl = isOpen && reportKey ? `/api/reports?${queryParams.toString()}` : null;
  const { data: response, isLoading: loading, error: fetchError } = useCachedFetch<{
    success: boolean;
    report?: DetailedReportResponse;
    error?: string;
  }>(reportUrl);

  const data = response?.report || null;
  const error = fetchError ? (fetchError as Error).message : response?.error || null;

  const rows = data?.rows;
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!tableSearch.trim()) return rows;
    const q = tableSearch.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) => String(val ?? "").toLowerCase().includes(q))
    );
  }, [rows, tableSearch]);

  if (!isOpen || !reportKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-gray-950">
                {data?.title || "Report Statement"}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                AUDITED
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {data?.subtitle || "Transaction-backed ledger statement"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-gray-900 mb-3" />
              <p className="text-xs font-semibold text-gray-600">Compiling audited report statement...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">
              <p className="text-sm font-bold">Error loading statement</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Metadata & Summary Cards */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[10.5px]">Scope: </span>
                  <strong className="text-gray-900">{data.entityScope}</strong>
                </div>
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[10.5px]">Range: </span>
                  <strong className="text-gray-900">{data.dateRange}</strong>
                </div>
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[10.5px]">Entries: </span>
                  <strong className="text-gray-900">{data.totalCount} records</strong>
                </div>
              </div>

              {/* KPI metrics strip */}
              {data.summaryMetrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.summaryMetrics.map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-2xs">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        {m.label}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-gray-950 mt-1 block">
                        {m.currency ? `${m.currency} ${m.value}` : m.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Table search & Export Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="w-full sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Search records in statement..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportToPdf(data)}
                    className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <DownloadIcon size={12} />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDetailedReportExcel(data)}
                    className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDetailedReportCsv(data)}
                    className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[48vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#0c0d12] text-white">
                      <tr>
                        {data.columns.map((col) => (
                          <th
                            key={col.key}
                            className={`px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider ${
                              col.align === "right"
                                ? "text-right"
                                : col.align === "center"
                                ? "text-center"
                                : "text-left"
                            }`}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={data.columns.length}
                            className="py-10 text-center text-gray-400 italic"
                          >
                            No records found matching query criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-gray-50/80 transition-colors">
                            {data.columns.map((col) => {
                              const val = row[col.key];
                              const isCode = col.key.toLowerCase().includes("code");
                              const isStatus = col.key === "status";
                              return (
                                <td
                                  key={col.key}
                                  className={`px-3.5 py-2.5 whitespace-nowrap ${
                                    col.align === "right"
                                      ? "text-right font-semibold text-gray-900"
                                      : col.align === "center"
                                      ? "text-center"
                                      : "text-left text-gray-800"
                                  }`}
                                >
                                  {isStatus ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                      {String(val ?? "-")}
                                    </span>
                                  ) : isCode ? (
                                    <span className="font-mono font-bold text-gray-900">
                                      {String(val ?? "-")}
                                    </span>
                                  ) : (
                                    String(val ?? "-")
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-gray-400 font-mono">
            SHA-256 AUDITED LEDGER STATEMENT
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-[#0c0d12] text-white font-semibold text-xs hover:bg-[#1e222d] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
