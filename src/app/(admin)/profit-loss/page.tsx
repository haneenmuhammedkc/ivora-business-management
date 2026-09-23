"use client";

import React, { useState, useMemo } from "react";
import { FadeUp } from "@/components/ui/motion";
import {
  ProfitLossHeaderBar,
  ProfitLossKpiCards,
  ProfitLossFilters,
  BusinessProfitabilityTable,
  AuditedPLStatement,
  TradingCyclePLTable,
  CapitalWaterfallPanel,
  InvestorAllocationsPanel,
  ExpenseImpactPanel,
  AuditedCrossLinksPanel,
  mockProfitLossKPIs,
  mockBusinessProfitabilityList,
  mockTradingCyclePLList,
  mockProfitLossStatement,
} from "@/components/admin/profit-loss";

export default function ProfitLossPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return mockBusinessProfitabilityList.filter((b) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (!b.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (selectedBusiness !== "all") {
        if (!b.isConsolidated && !b.name.includes(selectedBusiness)) {
          return false;
        }
      }
      return true;
    });
  }, [searchTerm, selectedBusiness]);

  return (
    <div className="space-y-6 pb-14">
      {/* Top Period & Export Header Bar */}
      <FadeUp delay={0.05}>
        <ProfitLossHeaderBar />
      </FadeUp>

      {/* 5 KPI Metric Cards */}
      <FadeUp delay={0.1}>
        <ProfitLossKpiCards kpis={mockProfitLossKPIs} />
      </FadeUp>

      {/* Filter Bar */}
      <FadeUp delay={0.15}>
        <ProfitLossFilters
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

      {/* Main 2-Column Ledger & Waterfall Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Statement & Tables) */}
        <div className="lg:col-span-8 space-y-6">
          <FadeUp delay={0.2}>
            <BusinessProfitabilityTable businesses={filteredBusinesses} />
          </FadeUp>

          <FadeUp delay={0.25}>
            <AuditedPLStatement statement={mockProfitLossStatement} />
          </FadeUp>

          <FadeUp delay={0.3}>
            <TradingCyclePLTable cycles={mockTradingCyclePLList} />
          </FadeUp>
        </div>

        {/* Right Column (Waterfall, Allocations, Impact & Cross-Links) */}
        <div className="lg:col-span-4 space-y-6">
          <FadeUp delay={0.22}>
            <CapitalWaterfallPanel />
          </FadeUp>

          <FadeUp delay={0.27}>
            <InvestorAllocationsPanel />
          </FadeUp>

          <FadeUp delay={0.32}>
            <ExpenseImpactPanel />
          </FadeUp>

          <FadeUp delay={0.37}>
            <AuditedCrossLinksPanel />
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
