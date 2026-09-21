import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PlusIcon } from "@/components/ui/icons";

export default function BusinessesPage() {
  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Businesses"
        subtitle="All Active Business Partnerships And Trading Workspaces."
        actions={
          <Button variant="primary" icon={<PlusIcon size={14} />}>
            Create Business
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="TOTAL BUSINESSES" value="03" />
        <StatCard label="ACTIVE BUSINESSES" value="02" />
        <StatCard label="TOTAL PARTNERS" value="03" />
        <StatCard label="COMBINED INVESTMENT" currency="AED" value="235,600" />
        <StatCard variant="highlight" label="COMBINED NET PROFIT" currency="AED" value="37,350" />
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
              { value: "active", label: "Active" },
            ]}
            prefixLabel="Status"
            className="w-36"
          />
          <Select
            options={[
              { value: "all", label: "All Products" },
              { value: "gold", label: "Gold Bullion" },
            ]}
            prefixLabel="Product"
            className="w-40"
          />
        </div>
      </div>

      {/* Module Placeholder Card */}
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-700">
          Businesses Module Foundation Ready
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Table view and workspace cards will be connected in subsequent phase.
        </p>
      </div>
    </div>
  );
}
