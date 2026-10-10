"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardChartPoint, DashboardRange } from "@/types/dashboard";

export interface TradingPerformanceProps {
  data?: DashboardChartPoint[];
  range?: DashboardRange;
  onRangeChange?: (range: DashboardRange) => void;
  className?: string;
}

function formatShortAED(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function TradingPerformance({
  data = [],
  range = "30d",
  onRangeChange,
  className = "",
}: TradingPerformanceProps) {
  const ranges: { id: DashboardRange; label: string }[] = [
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "3m", label: "3 Months" },
    { id: "1y", label: "1 Year" },
  ];

  // Map onto normalized coordinates for viewBox="0 0 500 160"
  const chartHeight = 135;
  const chartTop = 15;
  const chartLeft = 35;
  const chartRight = 485;
  const chartWidth = chartRight - chartLeft;

  // Determine dynamic maximum scale from data
  const rawMax = data.reduce(
    (max, d) => Math.max(max, d.sales, d.purchase, d.profit),
    0
  );
  const maxY = rawMax > 0 ? rawMax * 1.15 : 1000;

  const hasActivity = rawMax > 0 && data.length > 0;

  const points = data.map((d, index) => {
    const divisor = data.length > 1 ? data.length - 1 : 1;
    const x = chartLeft + (index / divisor) * chartWidth;
    const ySales = chartTop + (1 - Math.min(d.sales, maxY) / maxY) * (chartHeight - chartTop);
    const yPurchase = chartTop + (1 - Math.min(d.purchase, maxY) / maxY) * (chartHeight - chartTop);
    const yProfit = chartTop + (1 - Math.min(d.profit, maxY) / maxY) * (chartHeight - chartTop);
    return { ...d, x, ySales, yPurchase, yProfit };
  });

  const salesPath =
    points.length > 0
      ? points.reduce(
          (acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.ySales}`,
          ""
        )
      : "";

  const purchasePath =
    points.length > 0
      ? points.reduce(
          (acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.yPurchase}`,
          ""
        )
      : "";

  // Profit area polygon: starts at bottom baseline, traces profit/purchase curve, ends at bottom right
  const areaPath = purchasePath
    ? `${purchasePath} L ${chartRight} ${chartHeight} L ${chartLeft} ${chartHeight} Z`
    : "";

  return (
    <Card className={`h-full border border-gray-200/90 shadow-2xs flex flex-col justify-between ${className}`}>
      {/* Card Header */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 pb-3.5 border-b border-gray-100 bg-white">
        <div>
          <CardTitle>Trading Performance</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            Aggregated volume vs. net margin trajectory
          </p>
        </div>

        {/* Controls and Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
            {ranges.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onRangeChange?.(r.id)}
                className={`px-2.5 py-1 rounded transition-colors text-xs font-semibold ${
                  range === r.id
                    ? "bg-[#0c0d12] text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Series Legend */}
          <div className="flex items-center gap-3 text-[11px] text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3.5 bg-black inline-block" />
              <span>Sales</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="border-b border-dashed border-gray-500 w-3.5 inline-block" />
              <span>Purchase</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-[#edf3f8] border border-[#d4e2ed] inline-block rounded-2xs" />
              <span>Profit Area</span>
            </span>
          </div>
        </div>
      </CardHeader>

      {/* Chart Canvas */}
      <CardContent className="pt-4 pb-3 flex-1 flex flex-col justify-end">
        {!hasActivity ? (
          <div className="h-48 sm:h-52 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
            <div className="text-xs font-semibold text-gray-500">
              No trading activity recorded for the selected time range.
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Sales and landed purchase costs will appear here as transactions are cleared.
            </div>
          </div>
        ) : (
          <div
            role="img"
            aria-label={`Trading performance chart showing sales, purchases, and margin trends across ${range}`}
            className="relative w-full h-48 sm:h-52 flex flex-col justify-end"
          >
            {/* Background Grid Lines & Y-Axis Scale */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-400 font-mono">
              <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
                <span>{formatShortAED(maxY)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
                <span>{formatShortAED(maxY * 0.75)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
                <span>{formatShortAED(maxY * 0.5)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
                <span>{formatShortAED(maxY * 0.25)}</span>
              </div>
              <div className="flex items-center justify-between pb-0.5">
                <span>0</span>
              </div>
            </div>

            {/* Responsive SVG Chart Vector */}
            <div className="relative w-full h-36 sm:h-40">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 500 160"
                preserveAspectRatio="none"
              >
                {/* Profit Area Shading */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="#f1f5f9"
                    opacity="0.85"
                  />
                )}

                {/* Sales Solid Line (Thick Black) */}
                {salesPath && (
                  <path
                    d={salesPath}
                    fill="none"
                    stroke="#0c0d12"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Point Markers on Sales Series */}
                {points
                  .filter((p) => p.hasMarker)
                  .map((p, index) => (
                    <circle
                      key={index}
                      cx={p.x}
                      cy={p.ySales}
                      r="3"
                      fill="#0c0d12"
                    />
                  ))}

                {/* Purchase Dashed Line */}
                {purchasePath && (
                  <path
                    d={purchasePath}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>

            {/* X-Axis Date Labels */}
            <div className="flex justify-between text-[10px] text-gray-400 pt-2.5 font-mono border-t border-gray-200/90">
              {data.map((item, idx) => (
                <span key={`${item.date}-${idx}`}>{item.date}</span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
