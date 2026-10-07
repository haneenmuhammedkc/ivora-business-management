"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  InvestorKpiCards,
  InvestorFilters,
  InvestorTableView,
} from "@/components/admin/investors";
import { BusinessInvestorRow, InvestorSummaryKPIs } from "@/types/investors";

const defaultKPIs: InvestorSummaryKPIs = {
  totalInvestors: 0,
  totalInvestmentAED: 0,
  profitPaid: 0,
  netRealizedProfitAED: 0,
};

export default function InvestorsPage() {
  const [businesses, setBusinesses] = useState<BusinessInvestorRow[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<InvestorSummaryKPIs>(defaultKPIs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load business-centric investor records
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/investors");
        const json = await res.json().catch(() => ({}));

        if (isMounted) {
          if (res.ok && json.success && Array.isArray(json.businesses)) {
            setBusinesses(json.businesses);
            if (json.kpis) {
              setKpis(json.kpis);
            }
          } else {
            setError(json.message || json.error || "Failed to load businesses");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load businesses");
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

  // Filtered businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesCode = b.code.toLowerCase().includes(query);
        const matchesPartner = b.partnerName.toLowerCase().includes(query);
        const matchesType = b.businessType.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesPartner && !matchesType) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false;
      }

      // Product filter
      if (selectedProduct !== "all") {
        const prod = selectedProduct.toLowerCase();
        if (!b.businessType.toLowerCase().includes(prod)) {
          return false;
        }
      }

      return true;
    });
  }, [businesses, searchTerm, selectedStatus, selectedProduct]);

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Investors"
          subtitle="Track Investor Capital, Partner Equity, And Treasury Allocation Across Trading Businesses."
        />
      </FadeUp>

      {/* KPI Cards */}
      <FadeUp delay={0.1}>
        <InvestorKpiCards kpis={kpis} />
      </FadeUp>

      {/* Filters and Actions */}
      <FadeUp delay={0.15}>
        <InvestorFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          selectedBusinessId={selectedBusinessId}
        />
      </FadeUp>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Business-centric Table (One Business = One Row) */}
      <FadeUp delay={0.2}>
        <InvestorTableView
          businesses={filteredBusinesses}
          selectedBusinessId={selectedBusinessId}
          onSelectBusiness={(b) => setSelectedBusinessId(b.id)}
          isLoading={isLoading}
        />
      </FadeUp>
    </div>
  );
}
