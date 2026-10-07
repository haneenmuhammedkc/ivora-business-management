"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  BusinessKpiCards,
  BusinessFilters,
  BusinessTableView,
  BusinessCardsView,
} from "@/components/admin/businesses";
import { BusinessEntity, BusinessesSummaryKPIs } from "@/types/business";

export default function BusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Fetch businesses from real backend API
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setIsLoading(true);
        setApiError(null);
        const res = await fetch("/api/businesses", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (isMounted) {
          if (res.ok && data.success && Array.isArray(data.businesses)) {
            setBusinesses(data.businesses);
          } else {
            setApiError(data.message || data.error || "Failed to load businesses.");
          }
        }
      } catch (err) {
        console.error("Failed to fetch businesses:", err);
        if (isMounted) {
          setApiError("A network error occurred while loading businesses.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBusinesses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute summary KPIs dynamically
  const kpis: BusinessesSummaryKPIs = useMemo(() => {
    const total = businesses.length;
    const active = businesses.filter((b) => b.status === "ACTIVE").length;
    const uniquePartners = new Set(
      businesses
        .map((b) => b.partnerName || (b.partnersSummary !== "No partner" ? b.partnersSummary : ""))
        .filter((name) => name && name !== "Admin" && name !== "No partner")
    );
    const combinedInvestment = businesses.reduce(
      (acc, b) => acc + (b.investmentAED || 0),
      0
    );
    const combinedNetProfit = businesses.reduce(
      (acc, b) => acc + (b.netProfitAED || 0),
      0
    );

    return {
      totalBusinesses: total,
      activeBusinesses: active,
      totalPartners: uniquePartners.size,
      combinedInvestmentAED: combinedInvestment,
      combinedNetProfitAED: combinedNetProfit,
    };
  }, [businesses]);

  // Dynamic business filter options
  const businessFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "All Businesses" },
      ...businesses.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    ];
  }, [businesses]);

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesSubtitle = (b.subtitle || "").toLowerCase().includes(query);
        const partnerDisplay = b.partnerName || b.partnersSummary || "";
        const matchesPartners = partnerDisplay.toLowerCase().includes(query);
        const matchesCode = (b.code || "").toLowerCase().includes(query);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Businesses"
          subtitle="All Active Business Partnerships And Trading Workspaces."
        />
      </FadeUp>

      {/* Error state */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <span className="font-bold">Error:</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* 5 Top KPI Cards */}
      <FadeUp delay={0.1}>
        <BusinessKpiCards kpis={kpis} />
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
          businessOptions={businessFilterOptions}
        />
      </FadeUp>

      {/* Business Data View (Table or Workspace Cards) */}
      <FadeUp delay={0.2}>
        {isLoading ? (
          <div className="w-full rounded-xl border border-gray-200/90 bg-white p-12 text-center text-xs text-gray-500 shadow-2xs">
            Loading businesses from database...
          </div>
        ) : viewMode === "table" ? (
          <BusinessTableView
            businesses={filteredBusinesses}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenWorkspace={(b) => router.push(`/businesses/${b.id}`)}
          />
        ) : (
          <BusinessCardsView
            businesses={filteredBusinesses}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenWorkspace={(b) => router.push(`/businesses/${b.id}`)}
          />
        )}
      </FadeUp>
    </div>
  );
}
