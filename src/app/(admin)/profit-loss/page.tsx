"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { ProfitLossResponseData } from "@/types/profit-loss";
import {
  ProfitLossHeaderBar,
  ProfitLossKpiCards,
  ProfitLossFilters,
  BusinessProfitabilityTable,
  ProfitLossStatement,
} from "@/components/admin/profit-loss";
import { exportProfitLossToPdf } from "@/lib/export/export-pnl-pdf";
import { exportProfitLossToExcel } from "@/lib/export/export-pnl-excel";

interface BusinessesApiResponse {
  success: boolean;
  businesses?: { id: string; name: string }[];
  data?: { id: string; name: string }[];
}

function getPeriodDates(period: string): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (period) {
    case "this_month": {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case "last_month": {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case "q3_2026": {
      return { start: "2026-07-01", end: "2026-09-30" };
    }
    case "ytd_2026": {
      return { start: "2026-01-01", end: "2026-12-31" };
    }
    case "all":
    default:
      return { start: "", end: "" };
  }
}

export default function ProfitLossPage() {
  const initialDates = getPeriodDates("this_month");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Construct API Query URL
  const queryParams = new URLSearchParams();
  if (selectedBusiness && selectedBusiness !== "all") {
    queryParams.set("businessId", selectedBusiness);
  }
  if (selectedStatus && selectedStatus !== "all") {
    queryParams.set("status", selectedStatus);
  }
  if (selectedProduct && selectedProduct !== "all") {
    queryParams.set("productType", selectedProduct);
  }
  if (period === "all") {
    queryParams.set("period", "all");
  } else if (period === "custom") {
    if (startDate) queryParams.set("startDate", startDate);
    if (endDate) queryParams.set("endDate", endDate);
  } else if (period) {
    queryParams.set("period", period);
    if (startDate) queryParams.set("startDate", startDate);
    if (endDate) queryParams.set("endDate", endDate);
  }

  const pnlApiUrl = `/api/profit-loss${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  // Fetch P&L Data with SWR caching
  const { data: pnlResponse, error } = useCachedFetch<
    { success: boolean } & ProfitLossResponseData
  >(pnlApiUrl);

  // Fetch Businesses for the filter dropdown
  const { data: businessesResponse } = useCachedFetch<BusinessesApiResponse>("/api/businesses");

  const businessesList = useMemo(() => {
    return businessesResponse?.businesses || businessesResponse?.data || [];
  }, [businessesResponse]);

  const currentBusinessName = useMemo(() => {
    if (selectedBusiness === "all") return "Consolidated (All Businesses)";
    const found = businessesList.find((b) => b.id === selectedBusiness);
    return found ? found.name : "Selected Business";
  }, [selectedBusiness, businessesList]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    const dates = getPeriodDates(newPeriod);
    setStartDate(dates.start);
    setEndDate(dates.end);
  };

  const handleStartDateChange = (d: string) => {
    setStartDate(d);
    setPeriod("custom");
  };

  const handleEndDateChange = (d: string) => {
    setEndDate(d);
    setPeriod("custom");
  };

  const handleResetFilters = () => {
    const dates = getPeriodDates("this_month");
    setSelectedBusiness("all");
    setSelectedStatus("all");
    setSelectedProduct("all");
    setPeriod("this_month");
    setStartDate(dates.start);
    setEndDate(dates.end);
    setExportError(null);
  };

  // Handle PDF Export
  const handleExportPdf = async () => {
    if (!pnlResponse) {
      setExportError("Unable to export: Profit & Loss data is not loaded.");
      return;
    }
    try {
      setIsExportingPdf(true);
      setExportError(null);
      exportProfitLossToPdf(pnlResponse, {
        businessName: currentBusinessName,
        periodLabel: period === "custom" ? "Custom Range" : period,
        startDate,
        endDate,
        statusLabel: selectedStatus === "all" ? "All Status" : selectedStatus,
        productLabel: selectedProduct === "all" ? "All Products" : selectedProduct,
      });
    } catch (err) {
      console.error("[Export PDF Error]", err);
      setExportError("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Excel Export
  const handleExportExcel = async () => {
    if (!pnlResponse) {
      setExportError("Unable to export: Profit & Loss data is not loaded.");
      return;
    }
    try {
      setIsExportingExcel(true);
      setExportError(null);
      exportProfitLossToExcel(pnlResponse, {
        businessName: currentBusinessName,
        periodLabel: period === "custom" ? "Custom Range" : period,
        startDate,
        endDate,
        statusLabel: selectedStatus === "all" ? "All Status" : selectedStatus,
        productLabel: selectedProduct === "all" ? "All Products" : selectedProduct,
      });
    } catch (err) {
      console.error("[Export Excel Error]", err);
      setExportError("Failed to generate Excel workbook. Please try again.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-14 print:space-y-4 print:pb-0">
      {/* 1. Page Header */}
      <FadeUp delay={0.03}>
        <PageHeader
          title="Profit & Loss"
          subtitle="Sales, Purchase Costs, Expenses & Net Profit"
        />
      </FadeUp>

      {/* 2. Top Period & Export Header Bar */}
      <FadeUp delay={0.05}>
        <ProfitLossHeaderBar
          period={period}
          onPeriodChange={handlePeriodChange}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          endDate={endDate}
          onEndDateChange={handleEndDateChange}
          onApply={() => {}}
          onReset={handleResetFilters}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
          isExportingPdf={isExportingPdf}
          isExportingExcel={isExportingExcel}
        />
      </FadeUp>

      {/* Error Banners if any */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium print:hidden">
          Failed to load Profit & Loss data. Please verify your connection or permissions.
        </div>
      )}

      {exportError && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium print:hidden">
          {exportError}
        </div>
      )}

      {/* 3. Five Core KPI Cards */}
      <FadeUp delay={0.1}>
        <ProfitLossKpiCards kpis={pnlResponse?.kpis} />
      </FadeUp>

      {/* 4. Secondary Dropdown Filters (Business, Status, Product) */}
      <div className="print:hidden">
        <FadeUp delay={0.15}>
          <ProfitLossFilters
            selectedBusiness={selectedBusiness}
            onBusinessChange={setSelectedBusiness}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedProduct={selectedProduct}
            onProductChange={setSelectedProduct}
            businessesList={businessesList}
            productList={pnlResponse?.availableProducts}
          />
        </FadeUp>
      </div>

      {/* 5. Main Profit & Loss Statement (Hero Card) */}
      <FadeUp delay={0.2}>
        <ProfitLossStatement statement={pnlResponse?.statement} />
      </FadeUp>

      {/* 6. Business Performance Comparison Table */}
      <FadeUp delay={0.25}>
        <BusinessProfitabilityTable
          businesses={pnlResponse?.businesses || []}
        />
      </FadeUp>
    </div>
  );
}
