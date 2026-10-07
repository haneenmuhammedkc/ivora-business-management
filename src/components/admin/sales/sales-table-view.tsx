"use client";

import React from "react";
import Link from "next/link";
import { SaleRecord } from "@/types/sales";

export interface SalesTableViewProps {
  sales: SaleRecord[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onMarkAsSettled?: () => void;
  onExportSelected?: () => void;
}

function formatInr(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return `₹ ${val.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAed(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return `AED ${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
            {sales.length} {sales.length === 1 ? "Realization" : "Realizations"}
          </span>
        </div>

        {/* Action Buttons if selectable */}
        {(onMarkAsSettled || onExportSelected) && (
          <div className="flex items-center gap-2">
            {onMarkAsSettled && (
              <button
                type="button"
                onClick={onMarkAsSettled}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
              >
                Mark as Settled
              </button>
            )}
            {onExportSelected && (
              <button
                type="button"
                onClick={onExportSelected}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
              >
                Export Selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {onToggleSelect && onSelectAll && (
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              <th className="px-5 py-3.5 font-bold">SALE ID</th>
              <th className="px-4 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold">SALE DATE</th>
              <th className="px-4 py-3.5 font-bold">PRODUCT TYPE</th>
              <th className="px-4 py-3.5 font-bold">BUYER / CLEARING FIRM</th>
              <th className="px-4 py-3.5 font-bold text-right">QUANTITY</th>
              <th className="px-4 py-3.5 font-bold text-center">UNIT</th>
              <th className="px-4 py-3.5 font-bold text-right">TOTAL SELLING PRICE</th>
              <th className="px-4 py-3.5 font-bold text-right">REALIZED FX RATE</th>
              <th className="px-4 py-3.5 font-bold text-right">AED EQUIVALENT</th>
              <th className="px-5 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sales.length === 0 ? (
              <tr>
                <td
                  colSpan={onToggleSelect ? 12 : 11}
                  className="py-12 text-center text-gray-500"
                >
                  No sales records found matching your filters.
                </td>
              </tr>
            ) : (
              sales.map((s) => {
                const targetId = s.rawId || s.id;
                const isGram = s.quantityUnit === "GRAM";
                const sellingPriceVal = s.totalSellingPriceINR || s.inrRealizationValue;
                const fxRateVal = s.realizedFxRate || s.fxRate;

                return (
                  <tr
                    key={s.id}
                    className={`transition-colors hover:bg-gray-50/70 ${
                      s.selected ? "bg-gray-50/50" : ""
                    }`}
                  >
                    {/* Optional Checkbox */}
                    {onToggleSelect && (
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!s.selected}
                          onChange={() => onToggleSelect(s.id)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                          aria-label={`Select ${s.id}`}
                        />
                      </td>
                    )}

                    {/* Sale ID */}
                    <td className="px-5 py-4">
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
                        {s.businessCode && (
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {s.businessCode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sale Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                      {s.date}
                    </td>

                    {/* Product Type */}
                    <td className="px-4 py-4 font-semibold text-gray-900 text-xs">
                      {s.productType || s.commodity || "—"}
                    </td>

                    {/* Buyer / Clearing Firm */}
                    <td className="px-4 py-4 text-xs text-gray-700">
                      <span className="truncate max-w-[200px] block" title={s.buyerFirm}>
                        {s.buyerFirm || "—"}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                        {s.quantity !== undefined && s.quantity !== null
                          ? s.quantity.toLocaleString(undefined, {
                              minimumFractionDigits: isGram && !Number.isInteger(s.quantity) ? 1 : 0,
                              maximumFractionDigits: 3,
                            })
                          : s.quantityGms !== undefined && s.quantityGms !== null
                          ? s.quantityGms.toLocaleString()
                          : "0"}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {s.quantityUnit === "PIECE" ? "PCS" : "GMS"}
                      </span>
                    </td>

                    {/* Total Selling Price (INR) */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                        {formatInr(sellingPriceVal)}
                      </span>
                    </td>

                    {/* Realized FX Rate */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-xs font-mono font-medium text-gray-700">
                        {fxRateVal ? `₹ ${Number(fxRateVal).toFixed(4)}` : "—"}
                      </span>
                    </td>

                    {/* AED Equivalent Realized */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="font-extrabold text-gray-950 text-xs sm:text-[13px]">
                        {formatAed(s.aedEquivalent || s.totalAED)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/sales/${targetId}/edit`}
                        className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
