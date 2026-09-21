import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DownloadIcon, PrinterIcon } from "@/components/ui/icons";

export default function BalanceSheetPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Balance Sheet"
        subtitle="Point-In-Time Statement Of Financial Position (Assets = Liabilities + Equity) Across Trading Businesses."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<DownloadIcon size={14} />}>
              Export PDF
            </Button>
            <Button variant="secondary" size="sm" icon={<PrinterIcon size={14} />}>
              Print Statement
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TOTAL ASSETS" currency="AED" value="120,000" />
        <StatCard label="TOTAL LIABILITIES" currency="AED" value="245,000" />
        <StatCard label="TOTAL EQUITY" currency="AED" value="245,000" />
        <StatCard label="BALANCE CHECK" currency="AED" value="245,000" />
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
          Statement of Financial Position & Entity Partition Comparison
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Asset liquidity, physical bullion valuation, partner equity reconciliations, and capital composition breakdowns ready for Phase 2.
        </p>
      </div>
    </div>
  );
}
