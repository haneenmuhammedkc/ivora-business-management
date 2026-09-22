import React from "react";
import { SaleRecord } from "@/types/sales";

export interface SalesTableViewProps {
  sales: SaleRecord[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onMarkAsSettled?: () => void;
  onExportSelected?: () => void;
}

export function SalesTableView({
  sales,
  onToggleSelect,
  onSelectAll,
  onMarkAsSettled,
  onExportSelected,
}: SalesTableViewProps) {
  const allSelected = sales.length > 0 && sales.every((s) => s.selected);

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            Realized Sales Register
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {sales.length} Realizations
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkAsSettled}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Mark as Settled
          </button>
          <button
            type="button"
            onClick={onExportSelected}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Export Selected
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="w-12 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
              <th className="px-4 py-3.5 font-bold">SALE ID</th>
              <th className="px-4 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold">DATE</th>
              <th className="px-4 py-3.5 font-bold text-center">CYCLE</th>
              <th className="px-4 py-3.5 font-bold">COMMODITY</th>
              <th className="px-4 py-3.5 font-bold text-right">QTY (GMS)</th>
              <th className="px-4 py-3.5 font-bold text-right">PRICE (AED)</th>
              <th className="px-4 py-3.5 font-bold text-right">TOTAL (AED)</th>
              <th className="px-4 py-3.5 font-bold text-right">INR REALIZATION</th>
              <th className="px-4 py-3.5 font-bold text-right">PROFIT</th>
              <th className="px-5 py-3.5 font-bold text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-gray-500">
                  No sales records found matching your filters.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr
                  key={s.id}
                  className={`transition-colors hover:bg-gray-50/70 ${
                    s.selected ? "bg-gray-50/50" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={!!s.selected}
                      onChange={() => onToggleSelect(s.id)}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                      aria-label={`Select ${s.id}`}
                    />
                  </td>

                  {/* Sale ID */}
                  <td className="px-4 py-4">
                    <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                      {s.id}
                    </span>
                  </td>

                  {/* Business */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-xs">
                        {s.business}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                        {s.partnersShare}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    {s.date}
                  </td>

                  {/* Cycle Link */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold text-gray-900 underline underline-offset-2 cursor-pointer hover:text-black">
                      {s.cycle}
                    </span>
                  </td>

                  {/* Commodity */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-xs">
                        {s.commodity}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-0.5">
                        {s.locationDesk}
                      </span>
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-gray-950 text-xs sm:text-[13px]">
                      {s.quantityGms.toLocaleString()}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-700">
                      {s.priceAED.toFixed(2)}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-950">
                      {s.totalAED.toLocaleString()}
                    </span>
                  </td>

                  {/* INR Realization */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                        {s.inrRealizationFormatted}
                      </span>
                      {s.fxRate ? (
                        <span className="text-[10.5px] text-gray-500 mt-0.5">
                          @ ₹{s.fxRate.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-amber-600 font-semibold mt-0.5">
                          FX Pending
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Profit */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 font-bold uppercase leading-none">
                        AED
                      </span>
                      <span className="text-xs sm:text-[13px] font-extrabold text-gray-950 mt-0.5">
                        {s.profitAED.toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    {s.status === "CLEARED" && (
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-900 border border-gray-900 rounded uppercase">
                        CLEARED
                      </span>
                    )}
                    {s.status === "PENDING" && (
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-500 border border-gray-300 rounded uppercase">
                        PENDING
                      </span>
                    )}
                    {s.status === "DRAFT" && (
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-500 border border-dashed border-gray-400 rounded uppercase">
                        DRAFT
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="font-semibold text-gray-900">1-{sales.length}</strong> of{" "}
            <strong className="font-semibold text-gray-900">24</strong> records
          </span>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <span>Rows:</span>
            <select
              defaultValue="10"
              className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
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
            className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            2
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            3
          </button>
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
