"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  PurchaseKpiCards,
  PurchaseFilters,
  PurchaseTableView,
  mockPurchaseKPIs,
  mockPurchasesList,
} from "@/components/admin/purchase";
import { PurchaseRecord } from "@/types/purchase";

export default function PurchasePage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(mockPurchasesList);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = p.id.toLowerCase().includes(query);
        const matchesBusiness = p.business.toLowerCase().includes(query);
        const matchesEntities = p.businessEntities.toLowerCase().includes(query);
        const matchesProduct = p.product.toLowerCase().includes(query);
        const matchesVault = p.locationVault.toLowerCase().includes(query);
        if (
          !matchesId &&
          !matchesBusiness &&
          !matchesEntities &&
          !matchesProduct &&
          !matchesVault
        ) {
          return false;
        }
      }

      // Business filter
      if (selectedBusiness !== "all" && p.business !== selectedBusiness) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && p.status !== selectedStatus) {
        return false;
      }

      // Product filter
      if (selectedProduct !== "all" && p.product !== selectedProduct) {
        return false;
      }

      return true;
    });
  }, [purchases, searchTerm, selectedBusiness, selectedStatus, selectedProduct]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAll = () => {
    const allSelected = purchases.every((p) => p.selected);
    setPurchases((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const handleMarkAsCleared = () => {
    setPurchases((prev) =>
      prev.map((p) => (p.selected ? { ...p, status: "CLEARED" } : p))
    );
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Purchase management"
          subtitle="Manage Dubai Purchases, Quantities, Costs And Associated Trading Expenses."
        />
      </FadeUp>

      {/* 3 Top KPI Cards */}
      <FadeUp delay={0.1}>
        <PurchaseKpiCards kpis={mockPurchaseKPIs} />
      </FadeUp>

      {/* Filter Controls Row */}
      <FadeUp delay={0.15}>
        <PurchaseFilters
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

      {/* Purchases Table Container */}
      <FadeUp delay={0.2}>
        <PurchaseTableView
          purchases={filteredPurchases}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onMarkAsCleared={handleMarkAsCleared}
          onExportSelected={() => {}}
        />
      </FadeUp>
    </div>
  );
}
