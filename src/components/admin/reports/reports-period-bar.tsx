import React from "react";
import { DownloadIcon, PrinterIcon } from "@/components/ui/icons";

export function ReportsPeriodBar() {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-3.5 sm:p-4 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5">
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-500 uppercase text-[10.5px]">
            PERIOD:
          </span>
          <select
            defaultValue="This Month"
            className="h-8 px-2.5 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer"
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Q3 2026">Q3 2026</option>
            <option value="YTD 2026">YTD 2026</option>
          </select>
        </div>

        {/* Date Range Inputs */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center h-8 px-2 rounded-md border border-gray-200 bg-white gap-1.5">
            <span className="text-gray-400">📅</span>
            <input
              type="text"
              defaultValue="01/09/2026"
              className="w-20 text-xs font-medium text-gray-800 focus:outline-none"
            />
          </div>
          <span className="text-gray-400 font-medium">to</span>
          <div className="flex items-center h-8 px-2 rounded-md border border-gray-200 bg-white gap-1.5">
            <span className="text-gray-400">📅</span>
            <input
              type="text"
              defaultValue="10/09/2026"
              className="w-20 text-xs font-medium text-gray-800 focus:outline-none"
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

        {/* Apply & Reset Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="h-8 px-3 rounded-md bg-[#0c0d12] text-white font-semibold text-xs hover:bg-[#1e222d] transition-colors cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Right Export Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <DownloadIcon size={13} />
          <span>Export PDF</span>
        </button>

        <button
          type="button"
          className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
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
          <span>Export Excel</span>
        </button>

        <button
          type="button"
          className="h-8 px-3 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <PrinterIcon size={13} />
          <span>Print Statement</span>
        </button>
      </div>
    </div>
  );
}
