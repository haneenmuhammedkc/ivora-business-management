"use client";

import React from "react";
import Link from "next/link";
import { SearchInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";

export interface BusinessFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  onCreateBusinessClick?: () => void;
}

export function BusinessFilters({
  searchTerm,
  onSearchChange,
  selectedBusiness,
  onBusinessChange,
  selectedStatus,
  onStatusChange,
  selectedProduct,
  onProductChange,
  onCreateBusinessClick,
}: BusinessFiltersProps) {
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
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        <div className="w-full sm:w-auto min-w-[170px]">
          <Select
            value={selectedBusiness}
            onChange={(e) => onBusinessChange(e.target.value)}
            options={[
              { value: "all", label: "All Businesses" },
              { value: "b1", label: "Business 01" },
              { value: "b2", label: "Business 02" },
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
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "PENDING", label: "Pending" },
            ]}
            prefixLabel="Status"
            className="h-10 text-xs"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[165px]">
          <Select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            options={[
              { value: "all", label: "All Products" },
              { value: "Gold Bullion", label: "Gold Bullion" },
              { value: "Granulated Silver", label: "Granulated Silver" },
            ]}
            prefixLabel="Product"
            className="h-10 text-xs"
          />
        </div>

        {onCreateBusinessClick ? (
          <Button
            onClick={onCreateBusinessClick}
            variant="primary"
            icon={<PlusIcon size={15} />}
            className="h-10 px-4 text-xs font-bold rounded-lg shadow-xs shrink-0 w-full sm:w-auto"
          >
            Add Business
          </Button>
        ) : (
          <Link href="/businesses/new" className="w-full sm:w-auto">
            <Button
              variant="primary"
              icon={<PlusIcon size={15} />}
              className="h-10 px-4 text-xs font-bold rounded-lg shadow-xs shrink-0 w-full sm:w-auto"
            >
              Add Business
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
