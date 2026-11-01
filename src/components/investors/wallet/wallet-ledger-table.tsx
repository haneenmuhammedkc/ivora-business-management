"use client";

import React, { useState, useMemo } from "react";
import { WalletEntryDTO, WithdrawalDTO, InvestorWalletSummary } from "@/types/wallet";
import { exportWalletLedgerToPdf } from "@/lib/export/export-wallet-ledger-pdf";
import { exportWalletLedgerToExcel } from "@/lib/export/export-wallet-ledger-excel";

interface WalletLedgerTableProps {
  entries: WalletEntryDTO[];
  pendingWithdrawals?: WithdrawalDTO[];
  isAdmin?: boolean;
  onRefresh?: () => void;
  walletSummary?: InvestorWalletSummary | null;
}

export function WalletLedgerTable({
  entries,
  walletSummary,
}: WalletLedgerTableProps) {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterType === "DIRECT_PAYMENTS") {
        if (e.category !== "DIRECT_PAYMENT") return false;
      } else if (filterType === "REINVESTMENTS") {
        if (
          e.category !== "INTERNAL_TRANSFER" &&
          e.type !== "INVESTMENT_ALLOCATION" &&
          e.type !== "REINVESTMENT_SOURCE_TRANSFER" &&
          e.type !== "REINVESTMENT_ALLOCATION"
        )
          return false;
      } else if (filterType === "ADDITIONAL_CAPITAL") {
        if (e.category !== "FRESH_CAPITAL" && e.type !== "ADDITIONAL_CAPITAL") return false;
      } else if (filterType !== "ALL" && e.type !== filterType) {
        return false;
      }
      if (startDate) {
        const itemDate = new Date(e.createdAt);
        const start = new Date(startDate);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const itemDate = new Date(e.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = e.entryCode.toLowerCase().includes(q);
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchRef = e.reference?.toLowerCase().includes(q);
        const matchBiz = e.businessName?.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchRef && !matchBiz) return false;
      }
      return true;
    });
  }, [entries, filterType, searchTerm, startDate, endDate]);

  const handleExportPdf = () => {
    if (!walletSummary) return;
    const dateRangeLabel = startDate || endDate ? `${startDate || "Start"} to ${endDate || "Present"}` : "All Time";
    exportWalletLedgerToPdf(walletSummary, {
      filteredEntries,
      dateRangeLabel,
      typeFilterLabel: filterType.replace(/_/g, " "),
    });
  };

  const handleExportExcel = () => {
    if (!walletSummary) return;
    const dateRangeLabel = startDate || endDate ? `${startDate || "Start"} to ${endDate || "Present"}` : "All Time";
    exportWalletLedgerToExcel(walletSummary, {
      filteredEntries,
      dateRangeLabel,
      typeFilterLabel: filterType.replace(/_/g, " "),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getTypeBadge = (type: string, category?: string) => {
    const badgeBase =
      "px-2 py-0.5 rounded text-[10px] font-bold print:text-[6.5pt] print:leading-tight print:px-1 print:py-0.2 print:whitespace-normal print:bg-white print:border-gray-400 print:text-black";

    if (category === "DIRECT_PAYMENT" || type === "DIRECT_CAPITAL_RETURN" || type === "DIRECT_PROFIT_DISBURSAL") {
      if (type === "DIRECT_CAPITAL_RETURN") {
        return (
          <span className={`${badgeBase} bg-blue-50 text-blue-700 border border-blue-200`}>
            DIRECT CAPITAL DISBURSAL
          </span>
        );
      }
      return (
        <span className={`${badgeBase} bg-teal-50 text-teal-700 border border-teal-200`}>
          DIRECT PROFIT DISBURSAL
        </span>
      );
    }
    if (category === "FRESH_CAPITAL" || type === "ADDITIONAL_CAPITAL") {
      return (
        <span className={`${badgeBase} bg-sky-50 text-sky-800 border border-sky-200`}>
          ADDITIONAL CAPITAL INVESTED
        </span>
      );
    }
    if (type === "REINVESTMENT_SOURCE_TRANSFER") {
      return (
        <span className={`${badgeBase} bg-purple-50 text-purple-700 border border-purple-200`}>
          SETTLEMENT FUNDS TRANSFERRED
        </span>
      );
    }
    if (type === "REINVESTMENT_ALLOCATION" || type === "INVESTMENT_ALLOCATION") {
      return (
        <span className={`${badgeBase} bg-purple-100 text-purple-800 border border-purple-300`}>
          REINVESTMENT ALLOCATION
        </span>
      );
    }
    switch (type) {
      case "INITIAL_DEPOSIT":
        return <span className={`${badgeBase} bg-blue-50 text-blue-700 border border-blue-200`}>DEPOSIT</span>;
      case "CAPITAL_RETURN_CREDIT":
        return <span className={`${badgeBase} bg-emerald-50 text-emerald-700 border border-emerald-200`}>CAPITAL RETURN</span>;
      case "PROFIT_CREDIT":
        return <span className={`${badgeBase} bg-teal-50 text-teal-700 border border-teal-200`}>PROFIT CREDIT</span>;
      case "WITHDRAWAL_DEBIT":
        return <span className={`${badgeBase} bg-amber-50 text-amber-700 border border-amber-200`}>WITHDRAWAL</span>;
      case "WITHDRAWAL_REVERSAL":
        return <span className={`${badgeBase} bg-gray-100 text-gray-700 border border-gray-300`}>WDR REVERSAL</span>;
      default:
        return <span className={`${badgeBase} bg-gray-100 text-gray-600`}>{type.replace(/_/g, " ")}</span>;
    }
  };

  return (
    <div className="wallet-ledger-print-wrapper space-y-4">
      {/* SCOPED PRINT STYLES FOR SECTION D WALLET LEDGER */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: landscape;
                margin: 8mm 8mm 8mm 8mm;
              }
              html, body {
                width: 100% !important;
                min-width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                background: #ffffff !important;
                color: #0c0d12 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                font-size: 8pt !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Nullify outer layout padding & margins that cause horizontal overflow */
              .lg\\:pl-64, div[class*="lg:pl-64"] {
                padding-left: 0 !important;
                margin-left: 0 !important;
              }
              main, div[class*="overflow-y-auto"], div[class*="overflow-x-auto"] {
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              /* Remove any transforms that might create offset stacking contexts */
              div[style*="transform"],
              div[class*="motion"] {
                transform: none !important;
              }
              /* Hide modals and fixed elements */
              .fixed, [role="dialog"], .backdrop-blur-xs, .backdrop-blur-sm, aside, nav, header, button {
                display: none !important;
              }
              /* Scoped print container */
              .wallet-ledger-print-wrapper {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              /* Table styling */
              .wallet-ledger-print-table {
                width: 100% !important;
                max-width: 100% !important;
                table-layout: fixed !important;
                border-collapse: collapse !important;
                box-sizing: border-box !important;
              }
              .wallet-ledger-print-table thead {
                display: table-header-group !important;
              }
              .wallet-ledger-print-table tbody {
                display: table-row-group !important;
              }
              .wallet-ledger-print-table tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .wallet-ledger-print-table th {
                background-color: #f8fafc !important;
                color: #0f172a !important;
                border-top: 1.5pt solid #0c0d12 !important;
                border-bottom: 1.5pt solid #0c0d12 !important;
                padding: 4.5pt 3pt !important;
                font-size: 7pt !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.04em !important;
                box-sizing: border-box !important;
              }
              .wallet-ledger-print-table td {
                border-bottom: 0.5pt solid #e2e8f0 !important;
                padding: 3.5pt 3pt !important;
                font-size: 7.5pt !important;
                vertical-align: top !important;
                box-sizing: border-box !important;
              }
              /* Precise print column widths summing to 100% */
              .wallet-ledger-print-table th:nth-child(1),
              .wallet-ledger-print-table td:nth-child(1) {
                width: 10% !important;
                max-width: 10% !important;
              }
              .wallet-ledger-print-table th:nth-child(2),
              .wallet-ledger-print-table td:nth-child(2) {
                width: 14% !important;
                max-width: 14% !important;
                white-space: normal !important;
              }
              .wallet-ledger-print-table th:nth-child(3),
              .wallet-ledger-print-table td:nth-child(3) {
                width: 30% !important;
                max-width: 30% !important;
                white-space: normal !important;
                word-break: break-word !important;
              }
              .wallet-ledger-print-table th:nth-child(4),
              .wallet-ledger-print-table td:nth-child(4) {
                width: 16% !important;
                max-width: 16% !important;
                white-space: normal !important;
                word-break: break-word !important;
              }
              .wallet-ledger-print-table th:nth-child(5),
              .wallet-ledger-print-table td:nth-child(5) {
                width: 10% !important;
                max-width: 10% !important;
                text-align: right !important;
                white-space: nowrap !important;
              }
              .wallet-ledger-print-table th:nth-child(6),
              .wallet-ledger-print-table td:nth-child(6) {
                width: 10% !important;
                max-width: 10% !important;
                text-align: right !important;
                white-space: nowrap !important;
              }
              .wallet-ledger-print-table th:nth-child(7),
              .wallet-ledger-print-table td:nth-child(7) {
                width: 10% !important;
                max-width: 10% !important;
                text-align: right !important;
                white-space: normal !important;
              }
            }
          `,
        }}
      />

      {/* PRINT-ONLY HEADER — Strictly displayed during browser printing */}
      <div className="hidden print:block mb-4 pb-3 border-b-2 border-gray-900">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-gray-950 tracking-tight font-sans">
                IVORA
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300 uppercase">
                Official Settlement Ledger
              </span>
            </div>
            <h1 className="text-sm font-bold text-gray-950 mt-1 uppercase tracking-wide">
              Section D — Settlement Payment History & Fund Ledger
            </h1>
            <p className="text-xs text-gray-800 mt-0.5">
              Investor: <strong className="font-bold text-black">{walletSummary?.investor.name || "Investor"}</strong>{" "}
              <span className="font-mono text-gray-600">({walletSummary?.investor.code || "—"})</span>
            </p>
          </div>
          <div className="text-right text-[8.5pt] text-gray-600 space-y-0.5">
            <p>Currency: <span className="font-bold text-gray-950 font-mono">{walletSummary?.wallet.currency || "AED"}</span></p>
            <p>Printed: <span className="font-medium text-gray-800">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></p>
            <p>Total Records: <span className="font-bold text-gray-950">{filteredEntries.length}</span></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2.5 pt-2 border-t border-gray-200 text-[8.5pt]">
          <div>
            <span className="text-gray-500 uppercase tracking-wider text-[7.5pt] font-bold">Transaction Filter: </span>
            <span className="font-semibold text-gray-900">
              {filterType === "ALL"
                ? "All Records"
                : filterType === "DIRECT_PAYMENTS"
                ? "Direct Disbursals"
                : filterType === "REINVESTMENTS"
                ? "Reinvestments"
                : filterType === "ADDITIONAL_CAPITAL"
                ? "Additional Capital"
                : filterType.replace(/_/g, " ")}
            </span>
          </div>
          <div>
            <span className="text-gray-500 uppercase tracking-wider text-[7.5pt] font-bold">Date Range: </span>
            <span className="font-semibold text-gray-900">
              {startDate || endDate ? `${startDate || "Start"} to ${endDate || "Present"}` : "All Time"}
            </span>
          </div>
          {searchTerm.trim() && (
            <div>
              <span className="text-gray-500 uppercase tracking-wider text-[7.5pt] font-bold">Search Query: </span>
              <span className="font-mono font-semibold text-gray-900">&quot;{searchTerm.trim()}&quot;</span>
            </div>
          )}
        </div>
      </div>

      {/* SCREEN-ONLY CONTROLS: FILTERS, DATE RANGE & EXPORT CONTROLS */}
      <div className="space-y-3 pt-2 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "All Records" },
              { id: "DIRECT_PAYMENTS", label: "Direct Disbursals" },
              { id: "REINVESTMENTS", label: "Reinvestments" },
              { id: "ADDITIONAL_CAPITAL", label: "Additional Capital" },
              { id: "PROFIT_CREDIT", label: "Profit Settlements" },
              { id: "CAPITAL_RETURN_CREDIT", label: "Capital Returns" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterType(t.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  filterType === t.id
                    ? "bg-[#0c0d12] text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={!walletSummary || filteredEntries.length === 0}
              className="px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-40 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Download Wallet Ledger as PDF"
            >
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!walletSummary || filteredEntries.length === 0}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-40 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Download Wallet Ledger as Excel"
            >
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Print Wallet Statement"
            >
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Secondary Row: Date Range and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-[10.5px] font-semibold text-gray-500 hover:text-gray-800 underline ml-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Search by code, ref, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
            />
          </div>
        </div>
      </div>

      {/* LEDGER ENTRIES TABLE */}
      <div className="rounded-xl border border-gray-200/90 bg-white overflow-hidden shadow-2xs print:border-none print:shadow-none print:rounded-none print:overflow-visible print:w-full print:max-w-full">
        <div className="overflow-x-auto print:overflow-visible print:w-full print:max-w-full">
          <table className="w-full text-left text-xs wallet-ledger-print-table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-500 text-[10px] font-bold uppercase tracking-wider print:bg-gray-100 print:text-black">
                <th className="py-3 px-4 print:py-1.5 print:px-1 w-[10%]">Date</th>
                <th className="py-3 px-4 print:py-1.5 print:px-1 w-[14%]">Type</th>
                <th className="py-3 px-4 print:py-1.5 print:px-1 w-[30%]">Description</th>
                <th className="py-3 px-4 print:py-1.5 print:px-1 w-[16%]">Entity / Reference</th>
                <th className="py-3 px-4 print:py-1.5 print:px-1 text-right w-[10%]">Debit</th>
                <th className="py-3 px-4 print:py-1.5 print:px-1 text-right w-[10%]">Credit</th>
                <th className="py-3 px-4 print:py-1.5 print:px-1 text-right w-[10%]">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                    No wallet transaction records found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 print:py-1.5 print:px-1 text-gray-600 font-medium text-[11px] print:text-[7.5pt] whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 print:py-1.5 print:px-1 whitespace-nowrap print:whitespace-normal">
                      {getTypeBadge(e.type, e.category)}
                    </td>
                    <td className="py-3 px-4 print:py-1.5 print:px-1 text-gray-900 font-medium print:text-[7.5pt] print:whitespace-normal">
                      <span className="block truncate max-w-xs sm:max-w-md print:max-w-none print:whitespace-normal print:break-words">
                        {e.description}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 print:hidden">
                        <span className="text-[10px] font-mono text-gray-400">{e.entryCode}</span>
                        {e.category === "DIRECT_PAYMENT" && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            DIRECT
                          </span>
                        )}
                        {e.category === "INTERNAL_TRANSFER" && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            TRANSFER
                          </span>
                        )}
                        {e.category === "FRESH_CAPITAL" && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            FRESH CAPITAL
                          </span>
                        )}
                      </div>
                      <span className="hidden print:block text-[6.5pt] font-mono text-gray-500 mt-0.5">
                        {e.entryCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 print:py-1.5 print:px-1 text-gray-600 font-medium text-[11px] print:text-[7.5pt] print:whitespace-normal">
                      {e.businessName ? (
                        <span className="font-semibold text-gray-900 block truncate max-w-xs print:max-w-none print:whitespace-normal print:break-words">
                          {e.businessName}
                        </span>
                      ) : null}
                      <span className="font-mono text-[10px] print:text-[6.5pt] text-gray-400 block print:text-gray-600 print:break-all">
                        {e.reference || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 print:py-1.5 print:px-1 text-right font-mono font-bold text-red-600 print:text-black whitespace-nowrap print:text-[7.5pt]">
                      {e.direction === "DEBIT"
                        ? `AED ${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 print:py-1.5 print:px-1 text-right font-mono font-bold text-emerald-700 print:text-black whitespace-nowrap print:text-[7.5pt]">
                      {e.direction === "CREDIT"
                        ? `AED ${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : e.category === "DIRECT_PAYMENT"
                        ? <span className="text-blue-700 print:text-black">AED {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        : "—"}
                    </td>
                    <td className="py-3 px-4 print:py-1.5 print:px-1 text-right font-mono font-black text-gray-950 whitespace-nowrap print:whitespace-normal print:text-[7.5pt]">
                      {e.balanceAfter !== null && e.balanceAfter !== undefined ? (
                        <span className="print:whitespace-nowrap">
                          AED {e.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : e.category === "INTERNAL_TRANSFER" ? (
                        <span className="text-gray-400 print:text-gray-600 font-sans font-normal text-[10px] print:text-[6.5pt] print:leading-tight block">
                          — (Transfer)
                        </span>
                      ) : e.category === "FRESH_CAPITAL" ? (
                        <span className="text-gray-400 print:text-gray-600 font-sans font-normal text-[10px] print:text-[6.5pt] print:leading-tight block">
                          — (Equity)
                        </span>
                      ) : (
                        <span className="text-gray-400 print:text-gray-600 font-sans font-normal text-[10px] print:text-[6.5pt] print:leading-tight block">
                          — (Payout)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT FOOTER */}
      <div className="hidden print:flex items-center justify-between pt-3 mt-4 border-t border-gray-300 text-[8pt] text-gray-500">
        <span>Ivora Business Management • Official Investor Settlement & Reinvestment Ledger</span>
        <span>Confidential</span>
      </div>
    </div>
  );
}
