import React from "react";
import { BusinessEntity } from "@/types/business";
import {
  ArrowRightIcon,
  MoreVerticalIcon,
  TableViewIcon,
  WorkspaceCardsIcon,
} from "@/components/ui/icons";

export interface BusinessTableViewProps {
  businesses: BusinessEntity[];
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  onOpenWorkspace?: (business: BusinessEntity) => void;
}

export function BusinessTableView({
  businesses,
  viewMode,
  onViewModeChange,
  onOpenWorkspace,
}: BusinessTableViewProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Businesses
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {businesses.length} Entities
          </span>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center p-0.5 rounded-lg border border-gray-200 bg-gray-50/70">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "table"
                ? "bg-[#0c0d12] text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <TableViewIcon size={14} />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "cards"
                ? "bg-[#0c0d12] text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <WorkspaceCardsIcon size={14} />
            <span>Workspace Cards</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold">PARTNERS</th>
              <th className="px-4 py-3.5 font-bold text-right">INVESTMENT</th>
              <th className="px-4 py-3.5 font-bold text-right">PURCHASE COST</th>
              <th className="px-4 py-3.5 font-bold text-right">SALES (INDIA)</th>
              <th className="px-4 py-3.5 font-bold text-right">EXPENSES</th>
              <th className="px-4 py-3.5 font-bold text-right">NET PROFIT</th>
              <th className="px-4 py-3.5 font-bold text-center">MARGIN</th>
              <th className="px-4 py-3.5 font-bold text-center">STATUS</th>
              <th className="px-4 py-3.5 font-bold">CREATED</th>
              <th className="px-5 py-3.5 font-bold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  No businesses found matching your filters.
                </td>
              </tr>
            ) : (
              businesses.map((b) => (
                <tr
                  key={b.id}
                  className="transition-colors hover:bg-gray-50/70 group"
                >
                  {/* Business info */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                        {b.name}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        {b.subtitle}
                      </span>
                    </div>
                  </td>

                  {/* Partners */}
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-700 font-medium">
                      {b.partnersSummary}
                    </span>
                  </td>

                  {/* Investment */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 font-bold uppercase leading-none">
                        AED
                      </span>
                      <span className="font-bold text-gray-900 text-xs sm:text-[13px] mt-1">
                        {b.investmentAED.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Purchase Cost */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 font-bold uppercase leading-none">
                        AED
                      </span>
                      <span className="font-medium text-gray-800 text-xs sm:text-[13px] mt-1">
                        {b.purchaseCostAED.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Sales */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 font-bold uppercase leading-none">
                        AED
                      </span>
                      <span className="font-medium text-gray-800 text-xs sm:text-[13px] mt-1">
                        {b.salesIndiaAED.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Expenses */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 font-bold uppercase leading-none">
                        AED
                      </span>
                      <span className="font-medium text-gray-800 text-xs sm:text-[13px] mt-1">
                        {b.expensesAED.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Net Profit */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 font-bold uppercase leading-none">
                        AED
                      </span>
                      <span className="font-bold text-gray-900 text-xs sm:text-[13px] mt-1">
                        {b.netProfitAED.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Margin */}
                  <td className="px-4 py-4 text-center">
                    <span className="font-bold text-gray-900 text-xs">
                      {b.marginPercentage.toFixed(2)}%
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-800 border border-gray-300 rounded uppercase">
                      {b.status}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    {b.createdAt}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenWorkspace?.(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0c0d12] hover:bg-gray-800 rounded-lg shadow-xs transition-colors"
                      >
                        <span>Open Workspace</span>
                        <ArrowRightIcon size={12} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        title="More options"
                        aria-label="More options"
                      >
                        <MoreVerticalIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching design */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 px-5 py-3.5 bg-white border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            defaultValue="10"
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-900"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#0c0d12] rounded">
            1
          </span>
          <button
            type="button"
            disabled
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
