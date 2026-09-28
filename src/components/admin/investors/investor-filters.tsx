"use client";

import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PlusIcon } from "@/components/ui/icons";

export interface InvestorFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  defaultBusinessId?: string;
}

export function InvestorFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedProduct,
  onProductChange,
  defaultBusinessId,
}: InvestorFiltersProps) {
  const addInvestorHref = defaultBusinessId
    ? `/investors/new?businessId=${encodeURIComponent(defaultBusinessId)}`
    : "/investors/new";

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="w-full lg:max-w-md">
        <SearchInput
          placeholder="Search business, code, or type..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10"
        />
      </div>

      {/* Select Dropdowns and Action Button */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <div className="w-full sm:w-auto min-w-[145px]">
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            prefixLabel="Status"
            className="h-10 text-xs"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[160px]">
          <Select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            options={[
              { value: "all", label: "All Products" },
              { value: "Trading", label: "Trading" },
              { value: "Gold Bullion", label: "Gold Bullion" },
              { value: "999.9 Bullion", label: "999.9 Bullion" },
              { value: "Gold Grain 995", label: "Gold Grain 995" },
            ]}
            prefixLabel="Product"
            className="h-10 text-xs"
          />
        </div>

        <Link
          href={addInvestorHref}
          className="inline-flex items-center justify-center font-semibold transition-colors bg-[#0c0d12] text-white hover:bg-[#1e222d] shadow-xs h-10 px-4 text-xs gap-2 rounded-lg shrink-0 w-full sm:w-auto"
        >
          <PlusIcon size={15} />
          <span>Add Investors</span>
        </Link>
      </div>
    </div>
  );
}
