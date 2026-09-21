import React from "react";
import { PurchaseRecord } from "@/types/purchase";

export interface PurchaseTableViewProps {
  purchases: PurchaseRecord[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onMarkAsCleared?: () => void;
  onExportSelected?: () => void;
}

export function PurchaseTableView({
  purchases,
  onToggleSelect,
  onSelectAll,
  onMarkAsCleared,
  onExportSelected,
}: PurchaseTableViewProps) {
  const allSelected =
    purchases.length > 0 && purchases.every((p) => p.selected);

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Purchases
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {purchases.length} Consignments
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkAsCleared}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Mark as Cleared
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
              <th className="px-4 py-3.5 font-bold">PURCHASE ID</th>
              <th className="px-4 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold">DATE</th>
              <th className="px-4 py-3.5 font-bold">COMMODITY / PRODUCT</th>
              <th className="px-4 py-3.5 font-bold text-right">QUANTITY</th>
              <th className="px-4 py-3.5 font-bold text-right">BASE PRICE</th>
              <th className="px-4 py-3.5 font-bold text-right">FREIGHT</th>
              <th className="px-4 py-3.5 font-bold text-right">LABOUR</th>
              <th className="px-4 py-3.5 font-bold text-right">TOTAL LANDED</th>
              <th className="px-5 py-3.5 font-bold text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  No purchase records found matching your filters.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr
                  key={p.id}
                  className={`transition-colors hover:bg-gray-50/70 ${
                    p.selected ? "bg-gray-50/50" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={!!p.selected}
                      onChange={() => onToggleSelect(p.id)}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                      aria-label={`Select ${p.id}`}
                    />
                  </td>

                  {/* Purchase ID */}
                  <td className="px-4 py-4">
                    <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                      {p.id}
                    </span>
                  </td>

                  {/* Business & Entity */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-xs">
                        {p.business}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-0.5">
                        {p.businessEntities}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    {p.date}
                  </td>

                  {/* Commodity / Product */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-xs">
                        {p.product}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-0.5">
                        {p.locationVault}
                      </span>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                        {p.quantityGms.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">
                        GMS
                      </span>
                    </div>
                  </td>

                  {/* Base Price */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-900">
                      AED {p.basePriceAED.toFixed(2)}
                    </span>
                  </td>

                  {/* Freight */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-500 font-medium">
                      AED {p.freightAED}
                    </span>
                  </td>

                  {/* Labour */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <span className="text-xs text-gray-500 font-medium">
                      AED {p.labourAED}
                    </span>
                  </td>

                  {/* Total Landed */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <span className="text-xs sm:text-[13px] font-extrabold text-gray-950">
                      AED {p.totalLandedAED.toLocaleString()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    {p.status === "CLEARED" && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-900 border border-gray-900 rounded uppercase">
                        CLEARED
                      </span>
                    )}
                    {p.status === "IN PROGRESS" && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-700 border border-gray-300 rounded uppercase">
                        IN PROGRESS
                      </span>
                    )}
                    {p.status === "DRAFT" && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-500 border border-dashed border-gray-400 rounded uppercase">
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

      {/* Pagination Footer matching design */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="font-semibold text-gray-900">1-{purchases.length}</strong> of{" "}
            <strong className="font-semibold text-gray-900">24</strong> records
          </span>
          <span className="text-gray-300">•</span>
          <span>
            Rows per page: <strong className="font-semibold text-gray-900">10</strong>
          </span>
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
