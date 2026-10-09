"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import {
  ReportsKpiCards,
  ReportsFilters,
  ReportsPeriodBar,
  QuickDeskTabs,
  QuickDeskContent,
  InstitutionalReportGrid,
  ReportDetailModal,
  mockQuickDeskTabs,
} from "@/components/admin/reports";
import {
  ReportsOverviewResponse,
  DetailedReportType,
  ReportsSummaryKPIs,
} from "@/types/reports";
import { exportReportsOverviewPdf } from "@/lib/export/export-report-pdf";
import { exportReportsOverviewExcel } from "@/lib/export/export-report-excel";

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
    case "this_quarter":
    case "q3_2026": {
      const qStartMonth = Math.floor(month / 3) * 3;
      const start = new Date(year, qStartMonth, 1);
      const end = new Date(year, qStartMonth + 3, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case "ytd_2026": {
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
    case "all":
    default:
      return { start: "", end: "" };
  }
}

const emptyKPIs: ReportsSummaryKPIs = {
  totalSalesAED: 0,
  totalPurchaseAED: 0,
  totalExpensesAED: 0,
  netProfitAED: 0,
  investorShareAED: 0,
};

export default function ReportsPage() {
  const initialDates = getPeriodDates("this_month");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [activeQuickTab, setActiveQuickTab] = useState("monthly");
  const [activeDetailReport, setActiveDetailReport] = useState<DetailedReportType | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Applied filter state (applied when user clicks "Apply" or changes dropdowns)
  const [appliedFilters, setAppliedFilters] = useState({
    businessId: "all",
    status: "all",
    product: "all",
    period: "this_month",
    startDate: initialDates.start,
    endDate: initialDates.end,
  });

  // Construct API Query URL
  const queryParams = new URLSearchParams();
  if (appliedFilters.businessId && appliedFilters.businessId !== "all") {
    queryParams.set("businessId", appliedFilters.businessId);
  }
  if (appliedFilters.status && appliedFilters.status !== "all") {
    queryParams.set("status", appliedFilters.status);
  }
  if (appliedFilters.product && appliedFilters.product !== "all") {
    queryParams.set("product", appliedFilters.product);
  }
  if (appliedFilters.period === "all") {
    queryParams.set("period", "all");
  } else if (appliedFilters.period) {
    queryParams.set("period", appliedFilters.period);
    if (appliedFilters.startDate) queryParams.set("startDate", appliedFilters.startDate);
    if (appliedFilters.endDate) queryParams.set("endDate", appliedFilters.endDate);
  }

  const reportsApiUrl = `/api/reports${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  // SWR fetch real reports data
  const { data: reportsResponse, isLoading, mutate } = useCachedFetch<
    { success: boolean } & ReportsOverviewResponse
  >(reportsApiUrl);

  const kpis = reportsResponse?.kpis || emptyKPIs;

  const businessesList = useMemo(() => {
    return reportsResponse?.businesses || [];
  }, [reportsResponse?.businesses]);

  const productTypesList = useMemo(() => {
    return reportsResponse?.productTypes || [];
  }, [reportsResponse?.productTypes]);

  const reportCards = useMemo(() => {
    return reportsResponse?.reportCards || [];
  }, [reportsResponse?.reportCards]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    const dates = getPeriodDates(newPeriod);
    setStartDate(dates.start);
    setEndDate(dates.end);
    setAppliedFilters((prev) => ({
      ...prev,
      period: newPeriod,
      startDate: dates.start,
      endDate: dates.end,
    }));
  };

  const handleStartDateChange = (d: string) => {
    setStartDate(d);
  };

  const handleEndDateChange = (d: string) => {
    setEndDate(d);
  };

  const handleBusinessChange = (biz: string) => {
    setSelectedBusiness(biz);
    setAppliedFilters((prev) => ({ ...prev, businessId: biz }));
  };

  const handleStatusChange = (st: string) => {
    setSelectedStatus(st);
    setAppliedFilters((prev) => ({ ...prev, status: st }));
  };

  const handleProductChange = (prod: string) => {
    setSelectedProduct(prod);
    setAppliedFilters((prev) => ({ ...prev, product: prod }));
  };

  const handleApply = () => {
    setAppliedFilters({
      businessId: selectedBusiness,
      status: selectedStatus,
      product: selectedProduct,
      period,
      startDate,
      endDate,
    });
    mutate();
  };

  const handleResetFilters = () => {
    const dates = getPeriodDates("this_month");
    setSearchTerm("");
    setSelectedBusiness("all");
    setSelectedStatus("all");
    setSelectedProduct("all");
    setPeriod("this_month");
    setStartDate(dates.start);
    setEndDate(dates.end);
    setAppliedFilters({
      businessId: "all",
      status: "all",
      product: "all",
      period: "this_month",
      startDate: dates.start,
      endDate: dates.end,
    });
  };

  // Filter cards by search
  const filteredReports = useMemo(() => {
    if (!reportCards || reportCards.length === 0) return [];
    if (!searchTerm.trim()) return reportCards;

    const query = searchTerm.toLowerCase();
    return reportCards.filter((rep) => {
      const matchesTitle = rep.title.toLowerCase().includes(query);
      const matchesDesc = rep.description.toLowerCase().includes(query);
      const matchesBadge = rep.badge.toLowerCase().includes(query);
      const matchesCategory = rep.category.toLowerCase().includes(query);
      return matchesTitle || matchesDesc || matchesBadge || matchesCategory;
    });
  }, [reportCards, searchTerm]);

  const currentBusinessName = useMemo(() => {
    if (appliedFilters.businessId === "all") return "Consolidated (All Businesses)";
    const found = businessesList.find((b) => b.id === appliedFilters.businessId);
    return found ? `${found.name} (${found.code})` : "Selected Business";
  }, [appliedFilters.businessId, businessesList]);

  const handleExportPdf = async () => {
    if (!reportsResponse) return;
    try {
      setIsExporting(true);
      exportReportsOverviewPdf(reportsResponse, {
        businessName: currentBusinessName,
        periodLabel: appliedFilters.period,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportsResponse) return;
    try {
      setIsExporting(true);
      exportReportsOverviewExcel(reportsResponse, {
        businessName: currentBusinessName,
        periodLabel: appliedFilters.period,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-14 print:p-0 print:space-y-4">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Reports"
          subtitle="Generate Business, Trading, Financial And Investor Reports."
        />
      </FadeUp>

      {/* 5 Summary KPI Cards */}
      <FadeUp delay={0.1}>
        <ReportsKpiCards kpis={kpis} />
      </FadeUp>

      {/* Filters (Search & Select Dropdowns) */}
      <FadeUp delay={0.15}>
        <ReportsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBusiness={selectedBusiness}
          onBusinessChange={handleBusinessChange}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          selectedProduct={selectedProduct}
          onProductChange={handleProductChange}
          businesses={businessesList}
          productTypes={productTypesList}
        />
      </FadeUp>

      {/* Period & Export Action Control Bar */}
      <FadeUp delay={0.2}>
        <ReportsPeriodBar
          period={period}
          onPeriodChange={handlePeriodChange}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          endDate={endDate}
          onEndDateChange={handleEndDateChange}
          onApply={handleApply}
          onReset={handleResetFilters}
          onExportPdf={handleExportPdf}
          onExportExcel={handleExportExcel}
          onPrintStatement={handlePrintStatement}
          isExporting={isExporting}
        />
      </FadeUp>

      {/* Quick Desk Navigation Tabs & Panel Content */}
      <FadeUp delay={0.25}>
        <div className="space-y-3">
          <QuickDeskTabs
            tabs={mockQuickDeskTabs}
            activeTabId={activeQuickTab}
            onTabChange={setActiveQuickTab}
          />
          <QuickDeskContent
            activeTabId={activeQuickTab}
            data={reportsResponse?.quickDesk}
            isLoading={isLoading && !reportsResponse}
          />
        </div>
      </FadeUp>

      {/* Institutional Report Center Grid */}
      <FadeUp delay={0.3}>
        <InstitutionalReportGrid
          reports={filteredReports}
          onSelectReport={setActiveDetailReport}
        />
      </FadeUp>

      {/* Report Detail Modal */}
      <ReportDetailModal
        isOpen={activeDetailReport !== null}
        onClose={() => setActiveDetailReport(null)}
        reportKey={activeDetailReport}
        businessId={appliedFilters.businessId}
        period={appliedFilters.period}
        startDate={appliedFilters.startDate}
        endDate={appliedFilters.endDate}
        status={appliedFilters.status}
        product={appliedFilters.product}
      />
    </div>
  );
}
