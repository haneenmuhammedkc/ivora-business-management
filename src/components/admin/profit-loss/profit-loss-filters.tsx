import React from "react";
import { Select } from "@/components/ui/select";

export interface ProfitLossFiltersProps {
  selectedBusiness: string;
  onBusinessChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  businessesList?: { id: string; name: string }[];
  productList?: string[];
}

export function ProfitLossFilters({
  selectedBusiness,
  onBusinessChange,
  selectedStatus,
  onStatusChange,
  selectedProduct,
  onProductChange,
  businessesList = [],
  productList = [],
}: ProfitLossFiltersProps) {
  const businessOptions = [
    { value: "all", label: "All Businesses" },
    ...businessesList.map((b) => ({ value: b.id, label: b.name })),
  ];

  // Combine default products with any available products from the database
  const combinedProducts = Array.from(
    new Set(["999.9 Bullion", "Gold Grain 995", ...productList])
  ).filter(Boolean);

  const productOptions = [
    { value: "all", label: "All Products" },
    ...combinedProducts.map((p) => ({ value: p, label: p })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-full sm:w-auto min-w-[200px] flex-1 sm:flex-initial">
        <Select
          value={selectedBusiness}
          onChange={(e) => onBusinessChange(e.target.value)}
          options={businessOptions}
          prefixLabel="Business"
          className="h-10 text-xs"
        />
      </div>

      <div className="w-full sm:w-auto min-w-[160px] flex-1 sm:flex-initial">
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

      <div className="w-full sm:w-auto min-w-[180px] flex-1 sm:flex-initial">
        <Select
          value={selectedProduct}
          onChange={(e) => onProductChange(e.target.value)}
          options={productOptions}
          prefixLabel="Product"
          className="h-10 text-xs"
        />
      </div>
    </div>
  );
}
