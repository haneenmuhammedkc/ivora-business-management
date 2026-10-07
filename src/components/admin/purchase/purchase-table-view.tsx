import React from "react";
import Link from "next/link";
import { PurchaseRecord } from "@/types/purchase";

export interface PurchaseTableViewProps {
  purchases: PurchaseRecord[];
}

function formatBaseAmount(val: number | null | undefined, unit: "GRAM" | "PIECE"): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const unitSuffix = unit === "PIECE" ? "PCS" : "GMS";
  return `AED ${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} / ${unitSuffix}`;
}

function formatTotalAmount(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return `AED ${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PurchaseTableView({ purchases }: PurchaseTableViewProps) {
  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Purchases
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {purchases.length} {purchases.length === 1 ? "Purchase" : "Purchases"}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3.5 font-bold">PURCHASE ID</th>
              <th className="px-4 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold">PURCHASE DATE</th>
              <th className="px-4 py-3.5 font-bold">PRODUCT TYPE</th>
              <th className="px-4 py-3.5 font-bold text-right">QUANTITY</th>
              <th className="px-4 py-3.5 font-bold text-center">UNIT</th>
              <th className="px-4 py-3.5 font-bold text-right">BASE AMOUNT</th>
              <th className="px-4 py-3.5 font-bold text-right">TOTAL PURCHASE AMOUNT</th>
              <th className="px-5 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500">
                  No purchases found.
                </td>
              </tr>
            ) : (
              purchases.map((p) => {
                const targetId = p.rawId || p.id;
                const baseVal = p.baseAmount ?? p.basePricePerUnitAED ?? p.basePriceAED;
                const totalVal = p.totalPurchaseAmount ?? p.baseAcquisitionValue;
                const isGram = p.quantityUnit === "GRAM";

                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-gray-50/70"
                  >
                    {/* Purchase ID */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                        {p.id}
                      </span>
                    </td>

                    {/* Business */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-900 text-xs">
                        {p.business}
                      </span>
                    </td>

                    {/* Purchase Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                      {p.date}
                    </td>

                    {/* Product Type */}
                    <td className="px-4 py-4 font-semibold text-gray-900 text-xs">
                      {p.product}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                        {p.quantity !== undefined && p.quantity !== null
                          ? p.quantity.toLocaleString(undefined, {
                              minimumFractionDigits: isGram && !Number.isInteger(p.quantity) ? 1 : 0,
                              maximumFractionDigits: 3,
                            })
                          : p.quantityGms !== undefined && p.quantityGms !== null
                          ? p.quantityGms.toLocaleString()
                          : "0"}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {p.quantityUnit === "PIECE" ? "PCS" : "GMS"}
                      </span>
                    </td>

                    {/* Base Amount */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-gray-800 text-xs whitespace-nowrap">
                        {formatBaseAmount(baseVal, p.quantityUnit)}
                      </span>
                    </td>

                    {/* Total Purchase Amount */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px] whitespace-nowrap">
                        {formatTotalAmount(totalVal)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/purchase/${targetId}/edit`}
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

      {/* Pagination Footer matching design */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="font-semibold text-gray-900">1-{purchases.length}</strong> of{" "}
            <strong className="font-semibold text-gray-900">{purchases.length}</strong> records
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
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
