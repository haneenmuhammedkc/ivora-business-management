import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface BusinessPerformanceRecord {
  id: string;
  name: string;
  partitionSubtitle: string;
  investment: string;
  purchase: string;
  sales: string;
  expenses: string;
  netProfit: string;
  status: "ACTIVE" | "PENDING" | "COMPLETED";
}

export const MOCK_BUSINESS_RECORDS: BusinessPerformanceRecord[] = [
  {
    id: "b1",
    name: "Business 01 (A + B)",
    partitionSubtitle: "GOLD ARBITRAGE • DUBAI/SURAT",
    investment: "AED 150,000",
    purchase: "AED 112,000",
    sales: "AED 142,000",
    expenses: "AED 8,000",
    netProfit: "AED 24,000",
    status: "ACTIVE",
  },
  {
    id: "b2",
    name: "Business 02 (A + C)",
    partitionSubtitle: "BULLION CONSIGNMENT • MUMBAI",
    investment: "AED 100,000",
    purchase: "AED 73,400",
    sales: "AED 93,600",
    expenses: "AED 4,850",
    netProfit: "AED 13,350",
    status: "ACTIVE",
  },
  {
    id: "b3",
    name: "Business 02 (A + C)",
    partitionSubtitle: "BULLION CONSIGNMENT • MUMBAI",
    investment: "AED 100,000",
    purchase: "AED 73,400",
    sales: "AED 93,600",
    expenses: "AED 4,850",
    netProfit: "AED 13,350",
    status: "ACTIVE",
  },
];

export interface BusinessPerformanceProps {
  records?: BusinessPerformanceRecord[];
  className?: string;
}

export function BusinessPerformance({
  records = MOCK_BUSINESS_RECORDS,
  className = "",
}: BusinessPerformanceProps) {
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
            {records.map((record) => (
              <tr
                key={record.id}
                className="transition-colors hover:bg-gray-50/70"
              >
                {/* Business Entity */}
                <td className="px-5 py-3.5">
                  <div className="font-bold text-xs sm:text-sm text-gray-900">
                    {record.name}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono tracking-wider mt-0.5">
                    {record.partitionSubtitle}
                  </div>
                </td>

                {/* Investment */}
                <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-900 tabular-nums">
                  {record.investment}
                </td>

                {/* Purchase */}
                <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-900 tabular-nums">
                  {record.purchase}
                </td>

                {/* Sales */}
                <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-900 tabular-nums">
                  {record.sales}
                </td>

                {/* Expenses (Muted Gray Text per design) */}
                <td className="px-4 py-3.5 text-right font-medium text-xs sm:text-sm text-gray-400 tabular-nums">
                  {record.expenses}
                </td>

                {/* Net Profit */}
                <td className="px-4 py-3.5 text-right font-bold text-xs sm:text-sm text-gray-900 tabular-nums">
                  {record.netProfit}
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5 text-center">
                  <Badge variant="active">{record.status}</Badge>
                </td>

                {/* Action Button */}
                <td className="px-5 py-3.5 text-right">
                  <Button variant="secondary" size="sm" className="shadow-2xs text-xs font-medium">
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
