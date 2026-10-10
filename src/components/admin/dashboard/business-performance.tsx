import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "@/components/ui/icons";
import { BusinessPerformanceRecord } from "@/types/dashboard";

export interface BusinessPerformanceProps {
  records?: BusinessPerformanceRecord[];
  className?: string;
}

export function BusinessPerformance({
  records = [],
  className = "",
}: BusinessPerformanceProps) {
  const getStatusBadgeVariant = (status: "ACTIVE" | "PENDING" | "COMPLETED") => {
    switch (status) {
      case "ACTIVE":
        return "active";
      case "COMPLETED":
        return "neutral";
      case "PENDING":
      default:
        return "neutral";
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-200/90 bg-white shadow-2xs overflow-hidden ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-gray-100 bg-white gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Business Performance
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Direct partition ledger breakdown and capital utilization
          </p>
        </div>
        <Link
          href="/businesses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-black transition-colors shrink-0"
        >
          View All Businesses
          <ArrowRightIcon size={13} />
        </Link>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-900">
          <thead className="bg-[#f8fafc]/80 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 font-bold">BUSINESS ENTITY</th>
              <th className="px-4 py-3 font-bold text-right">INVESTMENT</th>
              <th className="px-4 py-3 font-bold text-right">PURCHASE</th>
              <th className="px-4 py-3 font-bold text-right">SALES</th>
              <th className="px-4 py-3 font-bold text-right">EXPENSES</th>
              <th className="px-4 py-3 font-bold text-right">NET PROFIT</th>
              <th className="px-4 py-3 font-bold text-center">STATUS</th>
              <th className="px-5 py-3 font-bold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-8 text-center text-gray-400 font-medium text-xs"
                >
                  No active business records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="transition-colors hover:bg-gray-50/70"
                >
                  {/* Business Entity */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-xs sm:text-sm text-gray-900">
                      {record.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono tracking-wider mt-0.5">
                      {record.partitionSubtitle}
                    </div>
                  </td>

                  {/* Investment */}
                  <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-900 tabular-nums whitespace-nowrap">
                    AED{" "}
                    {record.investmentAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Purchase */}
                  <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-900 tabular-nums whitespace-nowrap">
                    AED{" "}
                    {record.purchaseAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Sales */}
                  <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-900 tabular-nums whitespace-nowrap">
                    AED{" "}
                    {record.salesAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Expenses (Muted Gray Text per design) */}
                  <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-400 tabular-nums whitespace-nowrap">
                    AED{" "}
                    {record.expensesAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Net Profit */}
                  <td
                    className={`px-4 py-3.5 text-right font-bold text-xs sm:text-sm tabular-nums whitespace-nowrap ${
                      record.netProfitAED >= 0 ? "text-gray-900" : "text-rose-600"
                    }`}
                  >
                    AED{" "}
                    {record.netProfitAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(record.status)}>
                      {record.status}
                    </Badge>
                  </td>

                  {/* Action Button */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/businesses/${record.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 shadow-2xs hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
