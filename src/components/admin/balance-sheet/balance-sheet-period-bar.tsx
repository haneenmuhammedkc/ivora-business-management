import React from "react";
import { DownloadIcon, PrinterIcon } from "@/components/ui/icons";

export interface BalanceSheetPeriodBarProps {
  asOfDate: string;
  onAsOfDateChange: (date: string) => void;
  onReset?: () => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  isExportingPdf?: boolean;
  isExportingExcel?: boolean;
}

export function BalanceSheetPeriodBar({
  asOfDate,
  onAsOfDateChange,
  onReset,
  onExportPdf,
  onExportExcel,
  onPrint,
  isExportingPdf = false,
  isExportingExcel = false,
}: BalanceSheetPeriodBarProps) {
  const handleToday = () => {
    const today = new Date().toISOString().split("T")[0];
    onAsOfDateChange(today);
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-3.5 sm:p-4 shadow-2xs flex flex-col gap-3">
      {/* Top Controls Row */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5">
        {/* Left Point-In-Time Date Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500 uppercase text-[10.5px]">
              AS-OF DATE:
            </span>
            <div className="flex items-center h-8 px-2.5 rounded-md border border-gray-200 bg-white gap-2">
              <span className="text-gray-400">📅</span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => onAsOfDateChange(e.target.value)}
                className="text-xs font-semibold text-gray-800 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Currency Display */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-500 uppercase text-[10.5px]">
              CURRENCY:
            </span>
            <div className="h-8 px-2.5 rounded-md border border-gray-200 bg-gray-50 flex items-center font-bold text-gray-800">
              AED
            </div>
          </div>

          {/* Today & Reset Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToday}
              className="h-8 px-3 rounded-md bg-[#0c0d12] text-white font-semibold text-xs hover:bg-[#1e222d] transition-colors cursor-pointer"
            >
              Today
            </button>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <DownloadIcon size={13} />
            <span>{isExportingPdf ? "Exporting PDF..." : "Export PDF"}</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={isExportingExcel}
            className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>{isExportingExcel ? "Exporting Excel..." : "Export Excel"}</span>
          </button>

          <button
            type="button"
            onClick={onPrint || (() => window.print())}
            className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <PrinterIcon size={13} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Clean Context Line */}
      <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 font-medium">
        <span>
          Cumulative financial position as of{" "}
          <strong className="text-gray-800 font-semibold">{asOfDate}</strong>
        </span>
        <span className="text-gray-400">
          Inventory valued at landed cost • Transaction-based operational view
        </span>
      </div>
    </div>
  );
}
