"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  SalesKpiCards,
  SalesFilters,
  SalesTableView,
  mockSalesKPIs,
  mockSalesList,
} from "@/components/admin/sales";
import { SaleRecord } from "@/types/sales";

export default function SalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>(mockSalesList);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = s.id.toLowerCase().includes(query);
        const matchesBusiness = s.business.toLowerCase().includes(query);
        const matchesCommodity = s.commodity.toLowerCase().includes(query);
        const matchesCycle = s.cycle.toLowerCase().includes(query);
        const matchesDesk = s.locationDesk.toLowerCase().includes(query);
        if (
          !matchesId &&
          !matchesBusiness &&
          !matchesCommodity &&
          !matchesCycle &&
          !matchesDesk
        ) {
          return false;
        }
      }

      // Business filter
      if (selectedBusiness !== "all" && s.business !== selectedBusiness) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && s.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [sales, searchTerm, selectedBusiness, selectedStatus]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleSelectAll = () => {
    const allSelected = filteredSales.length > 0 && filteredSales.every((s) => s.selected);
    const filteredIds = new Set(filteredSales.map((s) => s.id));
    setSales((prev) =>
      prev.map((s) =>
        filteredIds.has(s.id) ? { ...s, selected: !allSelected } : s
      )
    );
  };

  const handleMarkAsSettled = () => {
    setSales((prev) =>
      prev.map((s) => (s.selected ? { ...s, status: "CLEARED" } : s))
    );
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Sales"
          subtitle="Manage India Sales, Realization Values, Settlements And Trading Profitability."
        />
      </FadeUp>

      {/* KPI Cards */}
      <FadeUp delay={0.1}>
        <SalesKpiCards kpis={mockSalesKPIs} />
      </FadeUp>

      {/* Filters and Actions */}
      <FadeUp delay={0.15}>
        <SalesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </FadeUp>

      {/* Realized Sales Register Table */}
      <FadeUp delay={0.2}>
        <SalesTableView
          sales={filteredSales}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onMarkAsSettled={handleMarkAsSettled}
          onExportSelected={() => {}}
        />
      </FadeUp>
    </div>
  );
}
