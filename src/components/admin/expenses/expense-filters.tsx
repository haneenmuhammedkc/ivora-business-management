import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PlusIcon } from "@/components/ui/icons";

export interface ExpenseFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProduct?: string;
  onProductChange?: (value: string) => void;
  businessOptions?: { value: string; label: string }[];
  categoryOptions?: { value: string; label: string }[];
}

export function ExpenseFilters({
  searchTerm,
  onSearchChange,
  selectedBusiness,
  onBusinessChange,
  selectedStatus,
  onStatusChange,
  selectedProduct = "all",
  onProductChange,
  businessOptions,
  categoryOptions,
}: ExpenseFiltersProps) {
  const defaultBusinessOptions = [
    { value: "all", label: "All Businesses" },
  ];

  const actualBusinessOptions =
    businessOptions && businessOptions.length > 0
      ? [{ value: "all", label: "All Businesses" }, ...businessOptions.filter((b) => b.value !== "all")]
      : defaultBusinessOptions;

  const defaultCategoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "DELIVERY_FREIGHT", label: "Delivery & Freight" },
    { value: "LABOUR_VAULT", label: "Labour & Vault" },
    { value: "PROCESSING_ASSAYING", label: "Processing & Assaying" },
    { value: "INDIA_EXPENSE", label: "India Expense" },
    { value: "TRANSFER_FX_FEES", label: "Transfer & FX Fees" },
    { value: "GENERAL_OVERHEAD", label: "General Overhead" },
  ];

  const actualCategoryOptions =
    categoryOptions && categoryOptions.length > 0
      ? categoryOptions
      : defaultCategoryOptions;

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 sm:gap-3 w-full">
      {/* 1. Search Input — Flexible Remaining Width */}
      <div className="flex-1 min-w-[200px]">
        <SearchInput
          placeholder="Search expenses by code, description, or payment method..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 text-xs w-full"
        />
      </div>

      {/* 2. Business Filter */}
      <div className="w-full sm:w-[170px] shrink-0">
        <Select
          value={selectedBusiness}
          onChange={(e) => onBusinessChange(e.target.value)}
          options={actualBusinessOptions}
          prefixLabel="Business"
          className="h-10 text-xs"
        />
      </div>

      {/* 3. Category Filter */}
      {onProductChange && (
        <div className="w-full sm:w-[180px] shrink-0">
          <Select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            options={actualCategoryOptions}
            prefixLabel="Category"
            className="h-10 text-xs"
          />
        </div>
      )}

      {/* 4. Status Filter */}
      <div className="w-full sm:w-[135px] shrink-0">
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

      {/* 5. Add Expense Button */}
      <div className="shrink-0">
        <Link
          href="/expenses/new"
          className="inline-flex items-center justify-center font-semibold transition-colors bg-[#0c0d12] text-white hover:bg-[#1e222d] shadow-xs h-10 px-4 text-xs gap-2 rounded-md w-full sm:w-auto"
        >
          <PlusIcon size={15} />
          <span className="whitespace-nowrap">Add Expense</span>
        </Link>
      </div>
    </div>
  );
}
