import React from "react";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface ProfitLossFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
}

export function ProfitLossFilters({
  searchTerm,
  onSearchChange,
  selectedBusiness,
  onBusinessChange,
  selectedStatus,
  onStatusChange,
  selectedProduct,
  onProductChange,
}: ProfitLossFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="w-full lg:max-w-md">
        <SearchInput
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10"
        />
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <div className="w-full sm:w-auto min-w-[170px]">
          <Select
            value={selectedBusiness}
            onChange={(e) => onBusinessChange(e.target.value)}
            options={[
              { value: "all", label: "All Businesses" },
              { value: "Business 01", label: "Business 01" },
              { value: "Business 02", label: "Business 02" },
            ]}
            prefixLabel="Business"
            className="h-10 text-xs"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[145px]">
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "CLEARED", label: "Cleared" },
              { value: "PENDING", label: "Pending" },
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
              { value: "999.9 Bullion", label: "999.9 Bullion" },
              { value: "Gold Grain 995", label: "Gold Grain 995" },
            ]}
            prefixLabel="Product"
            className="h-10 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
