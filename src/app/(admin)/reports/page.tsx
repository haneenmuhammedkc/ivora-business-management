import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function ReportsPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Reports"
        subtitle="Generate Business, Trading, Financial And Investor Reports."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="TOTAL SALES" currency="AED" value="120,000" />
        <StatCard label="TOTAL PURCHASE" currency="AED" value="245,000" />
        <StatCard label="TOTAL EXPENSES" currency="AED" value="245,000" />
        <StatCard label="NET PROFIT" currency="AED" value="245,000" />
        <StatCard label="INVESTOR SHARE" currency="AED" value="245,000" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchInput placeholder="Search..." />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Select
            options={[{ value: "month", label: "This Month" }]}
            prefixLabel="Period"
            className="w-36"
          />
          <Select
            options={[{ value: "all", label: "All Businesses" }]}
            prefixLabel="Business"
            className="w-40"
          />
        </div>
      </div>

      {/* Module Placeholder */}
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-700">
          Institutional Report Center & SHA-256 Ledger
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          10 configured statement generators, audit exports, and report cards ready for Phase 2.
        </p>
      </div>
    </div>
  );
}
