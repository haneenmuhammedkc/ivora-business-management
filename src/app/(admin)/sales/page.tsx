"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  SalesKpiCards,
  SalesFilters,
  SalesTableView,
} from "@/components/admin/sales";
import { SaleRecord, SalesSummaryKPIs } from "@/types/sales";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";

interface ApiSaleItem {
  id: string;
  saleCode: string;
  businessId: string;
  saleDate: string;
  liquidationDesk: string | null;
  buyerFirm: string;
  productType: string;
  quantity: number | string;
  quantityUnit: "GRAM" | "PIECE";
  quantityGms?: number | string | null;
  basePricePerUnitAED?: number | string | null;
  totalSellingPriceINR?: number | string | null;
  inrRealizationValue: number | string;
  realizedFxRate: number | string;
  aedEquivalent: number | string;
  status: "PENDING" | "CLEARED";
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

const mapApiSaleToRecord = (s: ApiSaleItem): SaleRecord => {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(s.saleDate));

  const totalINR = Number(s.totalSellingPriceINR || s.inrRealizationValue || 0);
  const inrVal = Number(s.inrRealizationValue || s.totalSellingPriceINR || 0);
  const aedVal = Number(s.aedEquivalent || 0);
  const fxVal = Number(s.realizedFxRate || 1);
  const qtyVal = Number(s.quantity || s.quantityGms || 0);
  const baseVal = s.basePricePerUnitAED ? Number(s.basePricePerUnitAED) : null;

  return {
    id: s.saleCode,
    rawId: s.id,
    businessId: s.businessId,
    business: s.business?.name || "Business",
    businessCode: s.business?.code,
    date: formattedDate,
    productType: s.productType,
    buyerFirm: s.buyerFirm,
    quantity: qtyVal,
    quantityUnit: s.quantityUnit || "GRAM",
    basePricePerUnitAED: baseVal,
    totalSellingPriceINR: totalINR,
    inrRealizationValue: inrVal,
    realizedFxRate: fxVal,
    aedEquivalent: aedVal,
    status: s.status,
    // Backward-compatibility props
    commodity: s.productType,
    locationDesk: s.liquidationDesk || "Direct Settlement",
    quantityGms: s.quantityUnit === "GRAM" ? qtyVal : null,
    priceAED: baseVal ?? 0,
    totalAED: aedVal,
    inrRealizationFormatted: `₹ ${inrVal.toLocaleString("en-IN")}`,
    fxRate: fxVal,
    profitAED: 0,
    selected: false,
  };
};

export default function SalesPage() {
  const { data: salesData, isLoading: isLoadingSales, error: salesError } = useCachedFetch<{
    success: boolean;
    sales: ApiSaleItem[];
    message?: string;
    error?: string;
  }>("/api/sales");

  const { data: businessesData } = useCachedFetch<{
    success: boolean;
    businesses: BusinessItem[];
  }>("/api/businesses");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");

  const sales = useMemo<SaleRecord[]>(() => {
    if (!salesData?.success || !Array.isArray(salesData.sales)) {
      return [];
    }
    return salesData.sales.map(mapApiSaleToRecord);
  }, [salesData]);

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

  const isInitialLoading = isLoadingSales && sales.length === 0;

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = s.id.toLowerCase().includes(query);
        const matchesBusiness = s.business.toLowerCase().includes(query);
        const matchesProduct = s.productType ? s.productType.toLowerCase().includes(query) : false;
        const matchesBuyer = s.buyerFirm ? s.buyerFirm.toLowerCase().includes(query) : false;
        if (!matchesId && !matchesBusiness && !matchesProduct && !matchesBuyer) {
          return false;
        }
      }

      if (selectedBusiness !== "all" && s.businessId !== selectedBusiness) {
        return false;
      }

      return true;
    });
  }, [sales, searchTerm, selectedBusiness]);

  // Dynamic KPI calculation
  const calculatedKPIs: SalesSummaryKPIs = useMemo(() => {
    const totalSales = filteredSales.length;
    const indiaSalesValueAED = filteredSales.reduce((acc, s) => acc + (s.aedEquivalent || 0), 0);

    return {
      totalSales,
      indiaSalesValueAED,
      logisticsOverheadAED: 0,
      grossProfitAED: indiaSalesValueAED,
    };
  }, [filteredSales]);

  // Business dropdown options
  const businessFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "All Businesses" },
      ...businesses.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.code})`,
      })),
    ];
  }, [businesses]);

  const apiError = salesError
    ? salesError.message
    : salesData && !salesData.success
    ? salesData.message || salesData.error || "Failed to load sales data."
    : null;

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Sales"
          subtitle="Manage India Sales, Realization Values, Settlements And Trading Profitability."
        />
      </FadeUp>

      {/* Error state */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <span className="font-bold">Error:</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* KPI Cards */}
      <FadeUp delay={0.1}>
        <SalesKpiCards kpis={calculatedKPIs} />
      </FadeUp>

      {/* Filters and Actions */}
      <FadeUp delay={0.15}>
        <SalesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          businessOptions={businessFilterOptions}
        />
      </FadeUp>

      {/* Realized Sales Register Table */}
      <FadeUp delay={0.2}>
        {isInitialLoading ? (
          <div className="w-full rounded-xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-500">
            Loading sales realizations...
          </div>
        ) : (
          <SalesTableView sales={filteredSales} />
        )}
      </FadeUp>
    </div>
  );
}
