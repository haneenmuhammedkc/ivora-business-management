import React from "react";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BusinessOption } from "@/types/reports";

export interface ReportsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  businesses?: BusinessOption[];
  productTypes?: string[];
}

export function ReportsFilters({
  searchTerm,
  onSearchChange,
  selectedBusiness,
  onBusinessChange,
  selectedStatus,
  onStatusChange,
  selectedProduct,
  onProductChange,
  businesses = [],
  productTypes = [],
}: ReportsFiltersProps) {
  const businessOptions = [
    { value: "all", label: "All Businesses" },
    ...businesses.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.code})`,
    })),
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    { value: "CLEARED", label: "Cleared" },
    { value: "PENDING", label: "Pending" },
    { value: "DRAFT", label: "Draft" },
  ];

  const productOptions = [
    { value: "all", label: "All Products" },
    ...productTypes.map((p) => ({
      value: p,
      label: p,
    })),
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="w-full lg:max-w-md">
        <SearchInput
          placeholder="Search statements, reports, or entities..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10"
        />
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <div className="w-full sm:w-auto min-w-[185px]">
          <Select
            value={selectedBusiness}
            onChange={(e) => onBusinessChange(e.target.value)}
            options={businessOptions}
            prefixLabel="Business"
            className="h-10 text-xs"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[145px]">
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            options={statusOptions}
            prefixLabel="Status"
            className="h-10 text-xs"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[160px]">
          <Select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            options={productOptions}
            prefixLabel="Product"
            className="h-10 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
