"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  InvestorKpiCards,
  InvestorFilters,
  InvestorTableView,
  InvestorDetailsPanel,
  mockInvestorsKPIs,
  mockInvestorsList,
} from "@/components/investors";
import { InvestorRecord } from "@/types/investors";

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<InvestorRecord[]>(mockInvestorsList);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("INV-002");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  // Filtered investors
  const filteredInvestors = useMemo(() => {
    return investors.filter((inv) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = inv.id.toLowerCase().includes(query);
        const matchesName = inv.name.toLowerCase().includes(query);
        const matchesSubtitle = inv.emailOrSubtitle.toLowerCase().includes(query);
        const matchesBusiness = inv.business.toLowerCase().includes(query);
        const matchesEntity = inv.businessEntity.toLowerCase().includes(query);
        if (
          !matchesId &&
          !matchesName &&
          !matchesSubtitle &&
          !matchesBusiness &&
          !matchesEntity
        ) {
          return false;
        }
      }

      // Business filter
      if (selectedBusiness !== "all" && inv.business !== selectedBusiness) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && inv.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [investors, searchTerm, selectedBusiness, selectedStatus]);

  // Active selected investor for details panel
  const activeInvestor = useMemo(() => {
    return (
      investors.find((inv) => inv.id === selectedInvestorId) ||
      filteredInvestors[0] ||
      investors[0]
    );
  }, [investors, selectedInvestorId, filteredInvestors]);

  // Selection handlers
  const handleSelectInvestor = (investor: InvestorRecord) => {
    setSelectedInvestorId(investor.id);
  };

  const handleToggleSelect = (id: string) => {
    setInvestors((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, selected: !inv.selected } : inv
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = filteredInvestors.length > 0 && filteredInvestors.every((inv) => inv.selected);
    const filteredIds = new Set(filteredInvestors.map((inv) => inv.id));
    setInvestors((prev) =>
      prev.map((inv) =>
        filteredIds.has(inv.id) ? { ...inv, selected: !allSelected } : inv
      )
    );
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Investors"
          subtitle="Track Investor Capital, Profit Allocation And Settlement Across Trading Businesses."
        />
      </FadeUp>

      {/* KPI Cards */}
      <FadeUp delay={0.1}>
        <InvestorKpiCards kpis={mockInvestorsKPIs} />
      </FadeUp>

      {/* Filters and Actions */}
      <FadeUp delay={0.15}>
        <InvestorFilters
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

      {/* Investor Register Table */}
      <FadeUp delay={0.2}>
        <InvestorTableView
          investors={filteredInvestors}
          selectedInvestorId={selectedInvestorId}
          onSelectInvestor={handleSelectInvestor}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onExportSelected={() => {}}
          onBatchNotice={() => {}}
        />
      </FadeUp>

      {/* Selected Investor Details Panel */}
      {activeInvestor && (
        <FadeUp delay={0.25}>
          <InvestorDetailsPanel
            investor={activeInvestor}
            onClose={() => setSelectedInvestorId("")}
          />
        </FadeUp>
      )}
    </div>
  );
}
