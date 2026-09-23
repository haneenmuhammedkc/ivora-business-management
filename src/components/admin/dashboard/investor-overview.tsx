import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface InvestorOverviewStat {
  id: string;
  label: string;
  value: string;
}

export const MOCK_INVESTOR_STATS: InvestorOverviewStat[] = [
  {
    id: "total-investors",
    label: "TOTAL INVESTORS",
    value: "08 Entities",
  },
  {
    id: "total-invested",
    label: "TOTAL INVESTED",
    value: "AED 250,000",
  },
  {
    id: "profit-allocated",
    label: "PROFIT ALLOCATED",
    value: "AED 14,940",
  },
  {
    id: "pending-settlement",
    label: "PENDING SETTLEMENT",
    value: "AED 6,250",
  },
];

export interface InvestorOverviewProps {
  stats?: InvestorOverviewStat[];
  className?: string;
}

export function InvestorOverview({
  stats = MOCK_INVESTOR_STATS,
  className = "",
}: InvestorOverviewProps) {
  return (
    <Card
      className={`h-full border border-gray-200/90 shadow-2xs flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-3.5 border-b border-gray-100 bg-white">
        <CardTitle>Investor Overview</CardTitle>
        <Link
          href="/investors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-black transition-colors"
        >
          View Investors
          <ArrowRightIcon size={12} />
        </Link>
      </CardHeader>

      {/* 2x2 Metric Tiles Grid */}
      <CardContent className="grid grid-cols-2 gap-3 pt-4 pb-4 flex-1">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="p-3.5 rounded-lg border border-gray-200/80 bg-white flex flex-col justify-between min-h-[90px] shadow-2xs"
          >
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
              {stat.label}
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight leading-none mt-2">
              {stat.value}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
