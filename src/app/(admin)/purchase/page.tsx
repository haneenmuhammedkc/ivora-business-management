"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  PurchaseKpiCards,
  PurchaseFilters,
  PurchaseTableView,
} from "@/components/admin/purchase";
import { PurchaseRecord, PurchaseSummaryKPIs } from "@/types/purchase";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";

interface ApiPurchaseItem {
  id: string;
  purchaseCode: string;
  businessId: string;
  purchaseDate: string;
  productType: string;
  sourcingVault: string | null;
  quantity: number | string;
  quantityUnit: "GRAM" | "PIECE";
  quantityGms: number | string | null;
  basePricePerGm: number | string | null;
  basePricePerUnitAED?: number | string | null;
  baseAcquisitionValue?: number | string | null;
  transitInsuranceFreight: number | string | null;
  vaultHandlingLabour: number | string | null;
  customsSecurity: number | string | null;
  totalLandedCost: number | string | null;
  status: "DRAFT" | "IN_PROGRESS" | "CLEARED";
  business?: {
    id: string;
    name: string;
    code: string;
  };
}

interface BusinessItem {
  id: string;
  name: string;
  code: string;
}

const mapApiPurchaseToRecord = (p: ApiPurchaseItem): PurchaseRecord => {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(p.purchaseDate));

  const baseAmountNum =
    p.basePricePerUnitAED !== null && p.basePricePerUnitAED !== undefined
      ? Number(p.basePricePerUnitAED)
      : p.basePricePerGm !== null && p.basePricePerGm !== undefined
      ? Number(p.basePricePerGm)
      : null;

  const totalAcqNum =
    p.baseAcquisitionValue !== null && p.baseAcquisitionValue !== undefined
      ? Number(p.baseAcquisitionValue)
      : null;

  return {
    id: p.purchaseCode,
    rawId: p.id,
    businessId: p.businessId,
    business: p.business?.name || "Business",
    businessCode: p.business?.code,
    businessEntities: p.business?.code || "",
    date: formattedDate,
    product: p.productType,
    locationVault: p.sourcingVault,
    quantity: Number(p.quantity),
    quantityUnit: p.quantityUnit,
    quantityGms: p.quantityGms !== null ? Number(p.quantityGms) : null,
    baseAmount: baseAmountNum,
    basePriceAED: baseAmountNum,
    basePricePerUnitAED: baseAmountNum,
    totalPurchaseAmount: totalAcqNum,
    baseAcquisitionValue: totalAcqNum,
    freightAED: p.transitInsuranceFreight !== null ? Number(p.transitInsuranceFreight) : null,
    labourAED: p.vaultHandlingLabour !== null ? Number(p.vaultHandlingLabour) : null,
    customsAED: p.customsSecurity !== null ? Number(p.customsSecurity) : null,
    totalLandedAED: p.totalLandedCost !== null ? Number(p.totalLandedCost) : null,
    status: p.status,
  };
};

export default function PurchasePage() {
  const { data: purchasesData, isLoading: isLoadingPurchases, error: purchasesError } = useCachedFetch<{
    success: boolean;
    purchases: ApiPurchaseItem[];
    message?: string;
    error?: string;
  }>("/api/purchases");

  const { data: businessesData } = useCachedFetch<{
    success: boolean;
    businesses: BusinessItem[];
  }>("/api/businesses");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const purchases = useMemo<PurchaseRecord[]>(() => {
    if (!purchasesData?.success || !Array.isArray(purchasesData.purchases)) {
      return [];
    }
    return purchasesData.purchases.map(mapApiPurchaseToRecord);
  }, [purchasesData]);

  const businesses = useMemo<BusinessItem[]>(() => {
    if (!businessesData?.success || !Array.isArray(businessesData.businesses)) {
      return [];
    }
    return businessesData.businesses.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
    }));
  }, [businessesData]);

  const isInitialLoading = isLoadingPurchases && purchases.length === 0;

  // Compute live KPIs from database purchases
  const kpis: PurchaseSummaryKPIs = useMemo(() => {
    const totalPurchase = purchases.length;
    const totalSourcingCostAED = purchases.reduce(
      (acc, p) => acc + (p.totalLandedAED || 0),
      0
    );
    const logisticsOverheadAED = purchases.reduce(
      (acc, p) => acc + (p.freightAED || 0) + (p.labourAED || 0),
      0
    );

    return {
      totalPurchase,
      totalSourcingCostAED,
      logisticsOverheadAED,
    };
  }, [purchases]);

  // Filter options
  const businessOptions = useMemo(() => {
    return [
      { value: "all", label: "All Businesses" },
      ...businesses.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.code})`,
      })),
    ];
  }, [businesses]);

  const productOptions = useMemo(() => {
    const unique = Array.from(new Set(purchases.map((p) => p.product).filter(Boolean)));
    return [
      { value: "all", label: "All Products" },
      ...unique.map((prod) => ({ value: prod, label: prod })),
    ];
  }, [purchases]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = p.id.toLowerCase().includes(query);
        const matchesBusiness = p.business.toLowerCase().includes(query);
        const matchesEntities = (p.businessEntities || "").toLowerCase().includes(query);
        const matchesProduct = p.product.toLowerCase().includes(query);
        const matchesVault = (p.locationVault || "").toLowerCase().includes(query);
        if (
          !matchesId &&
          !matchesBusiness &&
          !matchesEntities &&
          !matchesProduct &&
          !matchesVault
        ) {
          return false;
        }
      }

      // Business filter (match on businessId or business name)
      if (selectedBusiness !== "all") {
        if (p.businessId !== selectedBusiness && p.business !== selectedBusiness) {
          return false;
        }
      }

      // Product filter
      if (selectedProduct !== "all" && p.product !== selectedProduct) {
        return false;
      }

      return true;
    });
  }, [purchases, searchTerm, selectedBusiness, selectedProduct]);

  const apiError = purchasesError
    ? purchasesError.message
    : purchasesData && !purchasesData.success
    ? purchasesData.message || purchasesData.error || "Failed to load purchases."
    : null;

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Purchase management"
          subtitle="Manage Dubai Purchases, Quantities, Costs And Associated Trading Expenses."
        />
      </FadeUp>

      {/* Error state */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <span className="font-bold">Error:</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* 3 Top KPI Cards */}
      <FadeUp delay={0.1}>
        <PurchaseKpiCards kpis={kpis} />
      </FadeUp>

      {/* Filter Controls Row */}
      <FadeUp delay={0.15}>
        <PurchaseFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          businessOptions={businessOptions}
          productOptions={productOptions}
        />
      </FadeUp>

      {/* Purchases Table Container */}
      <FadeUp delay={0.2}>
        {isInitialLoading ? (
          <div className="w-full rounded-xl border border-gray-200/90 bg-white p-12 text-center text-xs text-gray-500 shadow-2xs">
            Loading purchases...
          </div>
        ) : (
          <PurchaseTableView
            purchases={filteredPurchases}
          />
        )}
      </FadeUp>
    </div>
  );
}
