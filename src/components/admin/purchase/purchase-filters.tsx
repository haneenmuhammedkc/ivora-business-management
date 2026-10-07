import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PlusIcon } from "@/components/ui/icons";

export interface PurchaseFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  businessOptions?: { value: string; label: string }[];
  productOptions?: { value: string; label: string }[];
}

export function PurchaseFilters({
  searchTerm,
  onSearchChange,
  selectedBusiness,
  onBusinessChange,
  selectedProduct,
  onProductChange,
  businessOptions = [{ value: "all", label: "All Businesses" }],
  productOptions = [{ value: "all", label: "All Products" }],
}: PurchaseFiltersProps) {
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

      {/* Select Dropdowns and Action Button */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
        <div className="w-full sm:w-auto min-w-[170px]">
          <Select
            value={selectedBusiness}
            onChange={(e) => onBusinessChange(e.target.value)}
            options={businessOptions}
            prefixLabel="Business"
            className="h-10 text-xs"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[165px]">
          <Select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            options={productOptions}
            prefixLabel="Product"
            className="h-10 text-xs"
          />
        </div>

        <Link
          href="/purchase/new"
          className="inline-flex items-center justify-center font-semibold transition-colors bg-[#0c0d12] text-white hover:bg-[#1e222d] shadow-xs h-10 px-4 text-xs gap-2 rounded-lg shrink-0 w-full sm:w-auto"
        >
          <PlusIcon size={15} />
          <span>New Purchase</span>
        </Link>
      </div>
    </div>
  );
}
