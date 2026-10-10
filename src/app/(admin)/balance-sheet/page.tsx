"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { BalanceSheetResponseData } from "@/types/balance-sheet";
import {
  BalanceSheetKpiCards,
  BalanceSheetPeriodBar,
  BalanceSheetFilters,
  BalanceSheetStatement,
  SettlementBreakdownTable,
} from "@/components/admin/balance-sheet";
import { exportBalanceSheetToPdf } from "@/lib/export/export-balance-sheet-pdf";
import { exportBalanceSheetToExcel } from "@/lib/export/export-balance-sheet-excel";

interface BusinessesApiResponse {
  success: boolean;
  businesses?: { id: string; name: string }[];
  data?: { id: string; name: string }[];
}

export default function BalanceSheetPage() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [asOfDate, setAsOfDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Construct API Query URL
  const queryParams = new URLSearchParams();
  if (asOfDate) {
    queryParams.set("asOfDate", asOfDate);
  }
  if (selectedBusiness && selectedBusiness !== "all") {
    queryParams.set("businessId", selectedBusiness);
  }
  if (selectedStatus && selectedStatus !== "all") {
    queryParams.set("status", selectedStatus);
  }
  if (selectedProduct && selectedProduct !== "all") {
    queryParams.set("productType", selectedProduct);
  }

  const balanceSheetApiUrl = `/api/balance-sheet${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  // Fetch Position Statement Data with SWR caching
  const {
    data: bsResponse,
    error,
    isLoading,
  } = useCachedFetch<BalanceSheetResponseData>(balanceSheetApiUrl);

  // Fetch Businesses for the filter dropdown
  const { data: businessesResponse } =
    useCachedFetch<BusinessesApiResponse>("/api/businesses");

  const businessesList = useMemo(() => {
    return businessesResponse?.businesses || businessesResponse?.data || [];
  }, [businessesResponse]);

  const currentBusinessName = useMemo(() => {
    if (selectedBusiness === "all") return "Consolidated Portfolio";
    const found = businessesList.find((b) => b.id === selectedBusiness);
    return found ? found.name : "Selected Business";
  }, [selectedBusiness, businessesList]);

  // Dynamic available products from inventory items
  const availableProducts = useMemo(() => {
    if (!bsResponse?.inventory?.items) return [];
    const set = new Set<string>();
    for (const item of bsResponse.inventory.items) {
      if (item.productType) set.add(item.productType);
    }
    return Array.from(set);
  }, [bsResponse]);

  // Export handlers
  const handleExportPdf = () => {
    if (!bsResponse) return;
    try {
      setIsExportingPdf(true);
      exportBalanceSheetToPdf(bsResponse, {
        businessName: currentBusinessName,
        asOfDate,
        statusLabel: selectedStatus === "all" ? "All Status" : selectedStatus,
        productLabel:
          selectedProduct === "all"
            ? "All Products"
            : selectedProduct.replace(/_/g, " "),
      });
    } catch (err) {
      console.error("[Export PDF Error]", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    if (!bsResponse) return;
    try {
      setIsExportingExcel(true);
      exportBalanceSheetToExcel(bsResponse, {
        businessName: currentBusinessName,
        asOfDate,
        statusLabel: selectedStatus === "all" ? "All Status" : selectedStatus,
        productLabel:
          selectedProduct === "all"
            ? "All Products"
            : selectedProduct.replace(/_/g, " "),
      });
    } catch (err) {
      console.error("[Export Excel Error]", err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleReset = () => {
    setAsOfDate(today);
    setSearchTerm("");
    setSelectedBusiness("all");
    setSelectedStatus("all");
    setSelectedProduct("all");
  };

  return (
    <div className="space-y-6 pb-14 print:space-y-4 print:pb-0">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Balance Sheet"
          subtitle="Financial Position & Holdings"
        />
      </FadeUp>

      {/* Top Period & Export Control Bar */}
      <FadeUp delay={0.08}>
        <BalanceSheetPeriodBar
          asOfDate={asOfDate}
          onAsOfDateChange={setAsOfDate}
          onReset={handleReset}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          onPrint={() => window.print()}
          isExportingPdf={isExportingPdf}
          isExportingExcel={isExportingExcel}
        />
      </FadeUp>

      {/* Error state */}
      {error && (
        <FadeUp delay={0.1}>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            Unable to load balance sheet data. Please check your network
            connection or business access permissions.
          </div>
        </FadeUp>
      )}

      {/* Loading Skeleton */}
      {isLoading && !bsResponse && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100" />
            ))}
          </div>
          <div className="h-10 rounded-xl bg-gray-100" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 rounded-xl bg-gray-100" />
            <div className="h-96 rounded-xl bg-gray-100" />
          </div>
        </div>
      )}

      {/* Loaded Content */}
      {bsResponse && (
        <>
          {/* Summary KPI Metric Cards */}
          <FadeUp delay={0.12}>
            <BalanceSheetKpiCards kpis={bsResponse.kpis} />
          </FadeUp>

          {/* Filter Bar */}
          <FadeUp delay={0.16}>
            <div className="print:hidden">
              <BalanceSheetFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedBusiness={selectedBusiness}
                onBusinessChange={setSelectedBusiness}
                businessesList={businessesList}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedProduct={selectedProduct}
                onProductChange={setSelectedProduct}
                availableProducts={availableProducts}
              />
            </div>
          </FadeUp>

          {/* 2-Column Statement: Investment & Inventory / Sales, Costs & Profit */}
          <FadeUp delay={0.2}>
            <BalanceSheetStatement
              capital={bsResponse.capital}
              inventory={bsResponse.inventory}
              trading={bsResponse.trading}
              selectedBusiness={selectedBusiness}
              onBusinessChange={setSelectedBusiness}
              businessesList={businessesList}
            />
          </FadeUp>

          {/* Investor Settlement Breakdown Table */}
          <FadeUp delay={0.24}>
            <SettlementBreakdownTable
              settlements={bsResponse.settlementBreakdown || []}
              searchTerm={searchTerm}
            />
          </FadeUp>
        </>
      )}
    </div>
  );
}
