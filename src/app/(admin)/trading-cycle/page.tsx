import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function TradingCyclePage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Trading Cycle"
        subtitle="Track Complete Dubai-To-India Trading Lifecycles, Realization, And Multi-Entity Partner Profit Settlements."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TOTAL CYCLES" value="03" />
        <StatCard label="COMPLETED CYCLES" value="02" />
        <StatCard label="PENDING CYCLES" value="01" />
        <StatCard variant="highlight" label="NET REALIZED PROFIT" currency="AED" value="35,990" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchInput placeholder="Search..." />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Select
            options={[{ value: "all", label: "All Businesses" }]}
            prefixLabel="Business"
            className="w-40"
          />
          <Select
            options={[{ value: "all", label: "All Status" }]}
            prefixLabel="Status"
            className="w-36"
          />
        </div>
      </div>

      {/* Module Placeholder */}
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-700">
          Trading Cycle Lifecycle & Waterfall Engine
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Dubai & India synchronized ledger, arbitrage spread calculations, dual-currency FX settlement, and partner distribution engine ready for Phase 2.
        </p>
      </div>
    </div>
  );
}
