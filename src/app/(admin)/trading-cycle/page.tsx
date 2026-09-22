"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  TradingCycleKpiCards,
  TradingCycleFilters,
  TradingCycleTableView,
  TradingCycleDetailsPanel,
  mockTradingCycleKPIs,
  mockTradingCycleList,
} from "@/components/trading-cycle";
import { TradingCycleRecord } from "@/types/trading-cycle";

export default function TradingCyclePage() {
  const [cycles, setCycles] = useState<TradingCycleRecord[]>(mockTradingCycleList);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("TR-0248");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  // Filtered cycles
  const filteredCycles = useMemo(() => {
    return cycles.filter((c) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(query);
        const matchesBusiness = c.business.toLowerCase().includes(query);
        const matchesPurchase = c.purchaseId.toLowerCase().includes(query);
        const matchesSale = c.saleId.toLowerCase().includes(query);
        const matchesCommodity = c.commodity.toLowerCase().includes(query);
        if (
          !matchesId &&
          !matchesBusiness &&
          !matchesPurchase &&
          !matchesSale &&
          !matchesCommodity
        ) {
          return false;
        }
      }

      // Business filter
      if (selectedBusiness !== "all" && c.business !== selectedBusiness) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && c.status !== selectedStatus) {
        return false;
      }

      // Product filter
      if (selectedProduct !== "all" && c.commodity !== selectedProduct) {
        return false;
      }

      return true;
    });
  }, [cycles, searchTerm, selectedBusiness, selectedStatus, selectedProduct]);

  // Active selected cycle for details panel
  const activeCycle = useMemo(() => {
    return (
      cycles.find((c) => c.id === selectedCycleId) ||
      filteredCycles[0] ||
      cycles[0]
    );
  }, [cycles, selectedCycleId, filteredCycles]);

  // Selection handlers
  const handleSelectCycle = (cycle: TradingCycleRecord) => {
    setSelectedCycleId(cycle.id);
  };

  const handleToggleSelect = (id: string) => {
    setCycles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = () => {
    const allSelected = filteredCycles.length > 0 && filteredCycles.every((c) => c.selected);
    const filteredIds = new Set(filteredCycles.map((c) => c.id));
    setCycles((prev) =>
      prev.map((c) =>
        filteredIds.has(c.id) ? { ...c, selected: !allSelected } : c
      )
    );
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Trading Cycle"
          subtitle="Track Complete Dubai-To-India Trading Lifecycles, Realization, And Multi-Entity Partner Profit Settlements."
        />
      </FadeUp>

      {/* KPI Cards */}
      <FadeUp delay={0.1}>
        <TradingCycleKpiCards kpis={mockTradingCycleKPIs} />
      </FadeUp>

      {/* Filters */}
      <FadeUp delay={0.15}>
        <TradingCycleFilters
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

      {/* Trading Cycle Register Table */}
      <FadeUp delay={0.2}>
        <TradingCycleTableView
          cycles={filteredCycles}
          selectedCycleId={selectedCycleId}
          onSelectCycle={handleSelectCycle}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
        />
      </FadeUp>

      {/* Selected Cycle Details Panel */}
      {activeCycle && (
        <FadeUp delay={0.25}>
          <TradingCycleDetailsPanel
            cycle={activeCycle}
            onClose={() => setSelectedCycleId("")}
          />
        </FadeUp>
      )}
    </div>
  );
}
