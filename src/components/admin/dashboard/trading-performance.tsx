"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface ChartDataPoint {
  date: string;
  sales: number;
  purchase: number;
  profit: number;
  hasMarker?: boolean;
}

export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { date: "10 AUG", sales: 150000, purchase: 90000, profit: 60000, hasMarker: true },
  { date: "17 AUG", sales: 175000, purchase: 110000, profit: 65000, hasMarker: false },
  { date: "24 AUG", sales: 190000, purchase: 125000, profit: 65000, hasMarker: true },
  { date: "31 AUG", sales: 215000, purchase: 145000, profit: 70000, hasMarker: false },
  { date: "07 SEP", sales: 228000, purchase: 160000, profit: 68000, hasMarker: true },
  { date: "CURRENT", sales: 250000, purchase: 185400, profit: 64600, hasMarker: true },
];

export interface TradingPerformanceProps {
  data?: ChartDataPoint[];
  className?: string;
}

export function TradingPerformance({
  data = MOCK_CHART_DATA,
  className = "",
}: TradingPerformanceProps) {
  const [selectedRange, setSelectedRange] = useState<"7d" | "30d" | "3m" | "1y">("30d");

  const ranges: { id: "7d" | "30d" | "3m" | "1y"; label: string }[] = [
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "3m", label: "3 Months" },
    { id: "1y", label: "1 Year" },
  ];

  // Map 0 to 250k onto normalized coordinates for viewBox="0 0 500 180"
  // padding: left: 40, right: 20, top: 15, bottom: 30
  // y ranges from 250000 (top: 15) to 0 (bottom: 150)
  const chartHeight = 150;
  const chartTop = 15;
  const chartLeft = 45;
  const chartRight = 485;
  const chartWidth = chartRight - chartLeft;
  const maxY = 250000;

  const points = data.map((d, index) => {
    const x = chartLeft + (index / (data.length - 1)) * chartWidth;
    const ySales = chartTop + (1 - d.sales / maxY) * (chartHeight - chartTop);
    const yPurchase = chartTop + (1 - d.purchase / maxY) * (chartHeight - chartTop);
    const yProfit = chartTop + (1 - d.profit / maxY) * (chartHeight - chartTop);
    return { ...d, x, ySales, yPurchase, yProfit };
  });

  const salesPath = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.ySales}`, "");
  const purchasePath = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.yPurchase}`, "");
  
  // Profit area polygon: starts at bottom baseline, traces profit/purchase curve, ends at bottom right
  const areaPath = `${purchasePath} L ${chartRight} ${chartHeight} L ${chartLeft} ${chartHeight} Z`;

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
            {ranges.map((range) => (
              <button
                key={range.id}
                onClick={() => setSelectedRange(range.id)}
                className={`px-2.5 py-1 rounded transition-colors text-xs font-semibold ${
                  selectedRange === range.id
                    ? "bg-[#0c0d12] text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {range.label}
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
        <div
          role="img"
          aria-label="Trading performance chart showing sales volume growing from 150K AED to 250K AED and purchase cost rising from 90K AED to 185.4K AED from August 10 to Current"
          className="relative w-full h-48 sm:h-52 flex flex-col justify-end"
        >
          {/* Background Grid Lines & Y-Axis Scale */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-400 font-mono">
            <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
              <span>250K</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
              <span>180K</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
              <span>100K</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100/90 pb-0.5">
              <span>50K</span>
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
              <path
                d={areaPath}
                fill="#f1f5f9"
                opacity="0.85"
              />

              {/* Sales Solid Line (Thick Black) */}
              <path
                d={salesPath}
                fill="none"
                stroke="#0c0d12"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

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
              <path
                d={purchasePath}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* X-Axis Date Labels */}
          <div className="flex justify-between text-[10px] text-gray-400 pt-2.5 font-mono border-t border-gray-200/90">
            {data.map((item) => (
              <span key={item.date}>{item.date}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
