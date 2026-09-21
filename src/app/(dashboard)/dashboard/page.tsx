import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function DashboardPage() {
  const businessOptions = [
    { value: "all", label: "All Businesses" },
    { value: "b1", label: "Business 01 (A + B)" },
    { value: "b2", label: "Business 02 (A + C)" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <PageHeader
        title="Good morning"
        subtitle="Thu 10 Sep"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              CURRENT BUSINESS
            </span>
            <Select
              options={businessOptions}
              className="w-48 text-xs font-semibold"
              defaultValue="all"
            />
          </div>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="TOTAL INVESTMENT"
          currency="AED"
          value="250,000"
          description="Across all businesses"
        />
        <StatCard
          label="PURCHASE COST"
          currency="AED"
          value="185,400"
          description="999.9 Bullion & Freight"
        />
        <StatCard
          label="TOTAL EXPENSES"
          currency="AED"
          value="12,850"
          description="Labour + Delivery + Custc"
        />
        <StatCard
          label="TOTAL SALES"
          currency="AED"
          value="235,600"
          description="India Sales (Zaveri)"
        />
        <StatCard
          variant="highlight"
          label="NET PROFIT"
          currency="AED"
          value="37,350"
          description="After all cleared expenses"
        />
        <StatCard
          label="INVESTOR SHARE"
          currency="AED"
          value="14,940"
          description="Profit distributed contract"
        />
      </div>

      {/* Physical Trading Lifecycle Section */}
      <Card className="border border-gray-200/90">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              PHYSICAL TRADING LIFECYCLE
            </h2>
            <Badge variant="tag">DUBAI (DXB) → MUMBAI (BOM)</Badge>
          </div>
          <span className="text-[11px] font-medium text-gray-500">
            Active Cycle Pipeline • 100% Reconciled
          </span>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {[1, 2, 3].map((cycleIndex) => (
            <div
              key={cycleIndex}
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3.5 rounded-lg border border-gray-100 bg-white items-center text-xs"
            >
              {/* Step 1: Dubai Purchase */}
              <div className="lg:col-span-3 p-3 rounded-md bg-gray-50/80 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    1. DUBAI PURCHASE
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
                </div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  AED 185,400
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Physical Bullion Cleared
                </div>
              </div>

              {/* Transition 1: Freight */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-gray-400 py-1">
                <span className="text-[9px] uppercase font-bold text-gray-400">
                  Freight
                </span>
                <ArrowRightIcon size={14} className="text-gray-500" />
              </div>

              {/* Step 2: India Realization */}
              <div className="lg:col-span-3 p-3 rounded-md bg-gray-50/80 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    2. INDIA REALIZATION
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
                </div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  AED 235,600
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                  ₹53,57,544 Settlement
                </div>
              </div>

              {/* Transition 2: Margin */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-gray-400 py-1">
                <span className="text-[9px] uppercase font-bold text-gray-400">
                  Margin
                </span>
                <ArrowRightIcon size={14} className="text-gray-500" />
              </div>

              {/* Gross Margin & Deductions */}
              <div className="lg:col-span-2 flex items-center justify-between px-3 py-2 rounded-md bg-white border border-gray-100">
                <div>
                  <div className="text-[9px] font-bold uppercase text-gray-400">
                    Gross Profit
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    AED 50,200
                  </div>
                  <div className="text-[10px] text-gray-500">+27.07%</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold uppercase text-gray-400">
                    Less
                  </div>
                  <div className="text-xs font-bold text-gray-700">
                    - AED 12.8k
                  </div>
                </div>
              </div>

              {/* Net Realized Badge Box */}
              <div className="lg:col-span-2 p-3 rounded-md bg-[#0c0d12] text-white">
                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  NET REALIZED
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  AED 37,350
                </div>
                <div className="text-[10px] text-gray-300">15.85% Net</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Business Performance Section */}
      <div>
        <SectionHeader
          title="Business Performance"
          subtitle="Direct partition ledger breakdown and capital utilization"
          actions={
            <Link
              href="/businesses"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-black transition-colors"
            >
              View All Businesses
              <ArrowRightIcon size={13} />
            </Link>
          }
        />
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BUSINESS ENTITY</TableHead>
                <TableHead className="text-right">INVESTMENT</TableHead>
                <TableHead className="text-right">PURCHASE</TableHead>
                <TableHead className="text-right">SALES</TableHead>
                <TableHead className="text-right">EXPENSES</TableHead>
                <TableHead className="text-right">NET PROFIT</TableHead>
                <TableHead className="text-center">STATUS</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="font-bold text-gray-900">Business 01 (A + B)</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    GOLD ARBITRAGE • DUBAI/SURAT
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">AED 150,000</TableCell>
                <TableCell className="text-right font-medium">AED 112,000</TableCell>
                <TableCell className="text-right font-medium">AED 142,000</TableCell>
                <TableCell className="text-right font-medium text-gray-500">AED 8,000</TableCell>
                <TableCell className="text-right font-bold text-gray-900">AED 24,000</TableCell>
                <TableCell className="text-center">
                  <Badge variant="active">ACTIVE</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="font-bold text-gray-900">Business 02 (A + C)</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    BULLION CONSIGNMENT • MUMBAI
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">AED 100,000</TableCell>
                <TableCell className="text-right font-medium">AED 73,400</TableCell>
                <TableCell className="text-right font-medium">AED 93,600</TableCell>
                <TableCell className="text-right font-medium text-gray-500">AED 4,850</TableCell>
                <TableCell className="text-right font-bold text-gray-900">AED 13,350</TableCell>
                <TableCell className="text-center">
                  <Badge variant="active">ACTIVE</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Bottom Grid: Trading Performance & Investor Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trading Performance Card */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Trading Performance</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Aggregated volume vs. net margin trajectory
                </p>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                <button className="px-2.5 py-1 text-gray-600 hover:text-gray-900 rounded">
                  7 Days
                </button>
                <button className="px-2.5 py-1 bg-black text-white rounded shadow-2xs">
                  30 Days
                </button>
                <button className="px-2.5 py-1 text-gray-600 hover:text-gray-900 rounded">
                  3 Months
                </button>
                <button className="px-2.5 py-1 text-gray-600 hover:text-gray-900 rounded">
                  1 Year
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Minimalist Data Visualization Representation matching design */}
              <div className="h-44 w-full flex flex-col justify-end relative pt-4">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-400 font-mono">
                  <div className="border-b border-gray-100 pb-1">250K</div>
                  <div className="border-b border-gray-100 pb-1">180K</div>
                  <div className="border-b border-gray-100 pb-1">100K</div>
                  <div className="border-b border-gray-100 pb-1">50K</div>
                  <div>0</div>
                </div>
                {/* Visual Area Gradient / Line */}
                <div className="relative h-28 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                    <path
                      d="M 0 45 L 20 40 L 45 35 L 70 28 L 100 15 L 100 50 L 0 50 Z"
                      fill="#f1f5f9"
                      opacity="0.8"
                    />
                    <path
                      d="M 0 45 L 20 40 L 45 35 L 70 28 L 100 15"
                      fill="none"
                      stroke="#0c0d12"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0 48 L 20 44 L 45 40 L 70 34 L 100 25"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 pt-2 font-mono border-t border-gray-200">
                  <span>10 AUG</span>
                  <span>17 AUG</span>
                  <span>24 AUG</span>
                  <span>31 AUG</span>
                  <span>07 SEP</span>
                  <span>CURRENT</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investor Overview Card */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle>Investor Overview</CardTitle>
              <Link
                href="/investors"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-black transition-colors"
              >
                View Investors
                <ArrowRightIcon size={12} />
              </Link>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-lg border border-gray-200/90 bg-white">
                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                  TOTAL INVESTORS
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">
                  08 Entities
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-gray-200/90 bg-white">
                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                  TOTAL INVESTED
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">
                  AED 250,000
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-gray-200/90 bg-white">
                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                  PROFIT ALLOCATED
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">
                  AED 14,940
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-gray-200/90 bg-white">
                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                  PENDING SETTLEMENT
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">
                  AED 6,250
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
