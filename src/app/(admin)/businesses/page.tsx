"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  BusinessKpiCards,
  BusinessFilters,
  BusinessTableView,
  BusinessCardsView,
  CreateBusinessModal,
  mockBusinessesKPIs,
  mockBusinessesList,
} from "@/components/admin/businesses";
import { BusinessEntity } from "@/types/business";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessEntity[]>(mockBusinessesList);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesSubtitle = b.subtitle.toLowerCase().includes(query);
        const matchesPartners = b.partnersSummary.toLowerCase().includes(query);
        const matchesCode = b.code.toLowerCase().includes(query);
        if (!matchesName && !matchesSubtitle && !matchesPartners && !matchesCode) {
          return false;
        }
      }

      // Business filter
      if (selectedBusiness !== "all" && b.id !== selectedBusiness) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false;
      }

      // Product filter
      if (selectedProduct !== "all" && b.productType !== selectedProduct) {
        return false;
      }

      return true;
    });
  }, [businesses, searchTerm, selectedBusiness, selectedStatus, selectedProduct]);

  const handleCreateBusiness = (newBusiness: BusinessEntity) => {
    setBusinesses((prev) => [newBusiness, ...prev]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Businesses"
          subtitle="All Active Business Partnerships And Trading Workspaces."
        />
      </FadeUp>

      {/* 5 Top KPI Cards */}
      <FadeUp delay={0.1}>
        <BusinessKpiCards kpis={mockBusinessesKPIs} />
      </FadeUp>

      {/* Filter Controls Row */}
      <FadeUp delay={0.15}>
        <BusinessFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          onCreateBusinessClick={() => setIsCreateModalOpen(true)}
        />
      </FadeUp>

      {/* Business Data View (Table or Workspace Cards) */}
      <FadeUp delay={0.2}>
        {viewMode === "table" ? (
          <BusinessTableView
            businesses={filteredBusinesses}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        ) : (
          <BusinessCardsView
            businesses={filteredBusinesses}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}
      </FadeUp>

      {/* Create Business Modal */}
      <CreateBusinessModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateBusiness={handleCreateBusiness}
      />
    </div>
  );
}
