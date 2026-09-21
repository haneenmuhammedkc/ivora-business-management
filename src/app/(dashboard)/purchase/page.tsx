import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PlusIcon } from "@/components/ui/icons";

export default function PurchasePage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Purchase management"
        subtitle="Manage Dubai Purchases, Quantities, Costs And Associated Trading Expenses."
        actions={
          <Button variant="primary" icon={<PlusIcon size={14} />}>
            New Purchase
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="TOTAL PURCHASE" value="03" />
        <StatCard label="TOTAL SOURCING COST" currency="AED" value="186,000" />
        <StatCard label="LOGISTICS & OVERHEAD" currency="AED" value="1,200" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchInput placeholder="Search..." />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Select
            options={[
              { value: "all", label: "All Businesses" },
              { value: "b1", label: "Business 01" },
            ]}
            prefixLabel="Business"
            className="w-40"
          />
          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "cleared", label: "Cleared" },
            ]}
            prefixLabel="Status"
            className="w-36"
          />
        </div>
      </div>

      {/* Module Placeholder */}
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-700">
          Purchase Consignments & Landed Cost Module
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Purchase entries, landed cost formula calculators, and Dubai bullion ledger ready for Phase 2.
        </p>
      </div>
    </div>
  );
}
