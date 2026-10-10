"use client";

import React from "react";
import { DisbursalPaymentGroup } from "@/services/investor/settlement.service";

interface DisbursalHistoryTableProps {
  paymentHistory: DisbursalPaymentGroup[];
}

export function DisbursalHistoryTable({ paymentHistory }: DisbursalHistoryTableProps) {
  if (paymentHistory.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
              Section 4 — Settlement Payment History
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Authoritative ledger record of executed capital returns and profit disbursals.
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-md">
            0 Records
          </span>
        </div>

        <div className="p-8 text-center space-y-1 bg-white">
          <p className="text-xs font-semibold text-gray-700">No Disbursals Recorded Yet</p>
          <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
            Executed settlement payments and capital returns will appear here with double-entry ledger audit details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
            Section 4 — Settlement Payment History
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Authoritative ledger record of executed capital returns and profit disbursals.
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
          {paymentHistory.length} {paymentHistory.length === 1 ? "Payment" : "Payments"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Payment Reference</th>
              <th className="py-3 px-4 text-right">Capital Returned</th>
              <th className="py-3 px-4 text-right">Profit Disbursed</th>
              <th className="py-3 px-4 text-right">Total Payment</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4">Bank / Wire Ref</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {paymentHistory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                  {item.date}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                  {item.paymentReference}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-medium text-gray-800 whitespace-nowrap">
                  AED {item.capitalReturned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                  AED {item.profitDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-gray-950 whitespace-nowrap">
                  AED {item.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-gray-600 capitalize whitespace-nowrap">
                  {item.paymentMethod.toLowerCase()}
                </td>
                <td className="py-3.5 px-4 font-mono text-gray-500 whitespace-nowrap">
                  {item.bankReference || "—"}
                </td>
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 text-[9.5px] font-extrabold uppercase rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
