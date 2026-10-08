import React from "react";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface BalanceSheetFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  businessesList?: { id: string; name: string }[];
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  availableProducts?: string[];
}

export function BalanceSheetFilters({
  searchTerm,
  onSearchChange,
  selectedBusiness,
  onBusinessChange,
  businessesList = [],
  selectedStatus,
  onStatusChange,
  selectedProduct,
  onProductChange,
  availableProducts = [],
}: BalanceSheetFiltersProps) {
  const businessOptions = [
    { value: "all", label: "All Businesses" },
    ...businessesList.map((b) => ({ value: b.id, label: b.name })),
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "CLEARED", label: "Cleared Only" },
    { value: "PENDING", label: "Pending Only" },
  ];

  const productOptions = [
    { value: "all", label: "All Products" },
    ...availableProducts.map((p) => ({
      value: p,
      label: p.replace(/_/g, " "),
    })),
  ];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="w-full lg:max-w-md">
        <SearchInput
          placeholder="Search entities, codes, or descriptions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10"
        />
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <div className="w-full sm:w-auto min-w-[175px]">
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
