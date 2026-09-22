"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  ReportsKpiCards,
  ReportsFilters,
  ReportsPeriodBar,
  QuickDeskTabs,
  InstitutionalReportGrid,
  mockReportsKPIs,
  mockQuickDeskTabs,
  mockReportCards,
} from "@/components/reports";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [activeQuickTab, setActiveQuickTab] = useState("monthly");

  // Filtered reports
  const filteredReports = useMemo(() => {
    return mockReportCards.filter((rep) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = rep.title.toLowerCase().includes(query);
        const matchesDesc = rep.description.toLowerCase().includes(query);
        const matchesBadge = rep.badge.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesBadge) {
          return false;
        }
      }
      return true;
    });
  }, [searchTerm]);

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Reports"
          subtitle="Generate Business, Trading, Financial And Investor Reports."
        />
      </FadeUp>

      {/* 5 Summary KPI Cards */}
      <FadeUp delay={0.1}>
        <ReportsKpiCards kpis={mockReportsKPIs} />
      </FadeUp>

      {/* Filters (Search & Select Dropdowns) */}
      <FadeUp delay={0.15}>
        <ReportsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
        />
      </FadeUp>

      {/* Period & Export Action Control Bar */}
      <FadeUp delay={0.2}>
        <ReportsPeriodBar />
      </FadeUp>

      {/* Quick Desk Navigation Tabs */}
      <FadeUp delay={0.25}>
        <QuickDeskTabs
          tabs={mockQuickDeskTabs}
          activeTabId={activeQuickTab}
          onTabChange={setActiveQuickTab}
        />
      </FadeUp>

      {/* Institutional Report Center Grid */}
      <FadeUp delay={0.3}>
        <InstitutionalReportGrid reports={filteredReports} />
      </FadeUp>
    </div>
  );
}
