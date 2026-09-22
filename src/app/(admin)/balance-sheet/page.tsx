"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  BalanceSheetKpiCards,
  BalanceSheetPeriodBar,
  BalanceSheetFilters,
  BalanceSheetStatement,
  BusinessPositionTable,
  CompositionAnalyticsPanels,
  mockBalanceSheetKPIs,
  mockBalanceSheetStatement,
  mockBusinessPositionsList,
  mockAssetCompositionLegend,
  mockCapitalLiabilitiesLegend,
} from "@/components/balance-sheet";

export default function BalanceSheetPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return mockBusinessPositionsList.filter((b) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesBusiness = b.business.toLowerCase().includes(query);
        const matchesParticipants = b.entityParticipants.toLowerCase().includes(query);
        if (!matchesBusiness && !matchesParticipants) {
          return false;
        }
      }
      if (selectedBusiness !== "all") {
        if (!b.isConsolidated && !b.business.includes(selectedBusiness)) {
          return false;
        }
      }
      return true;
    });
  }, [searchTerm, selectedBusiness]);

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Balance Sheet"
          subtitle="Point-In-Time Statement Of Financial Position (Assets = Liabilities + Equity) Across Trading Businesses."
        />
      </FadeUp>

      {/* Top Period & Export Control Bar */}
      <FadeUp delay={0.08}>
        <BalanceSheetPeriodBar />
      </FadeUp>

      {/* 4 Summary KPI Metric Cards */}
      <FadeUp delay={0.12}>
        <BalanceSheetKpiCards kpis={mockBalanceSheetKPIs} />
      </FadeUp>

      {/* Filter Bar */}
      <FadeUp delay={0.16}>
        <BalanceSheetFilters
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

      {/* 2-Column Statement of Financial Position (Assets vs Liabilities & Equity) */}
      <FadeUp delay={0.2}>
        <BalanceSheetStatement statement={mockBalanceSheetStatement} />
      </FadeUp>

      {/* Business Financial Position Comparison Table */}
      <FadeUp delay={0.24}>
        <BusinessPositionTable businesses={filteredBusinesses} />
      </FadeUp>

      {/* Bottom Composition Analytics Breakdown Panels */}
      <FadeUp delay={0.28}>
        <CompositionAnalyticsPanels
          assetComposition={mockAssetCompositionLegend}
          capitalLiabilitiesComposition={mockCapitalLiabilitiesLegend}
        />
      </FadeUp>
    </div>
  );
}
