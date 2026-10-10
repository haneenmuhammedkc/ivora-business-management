"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { Select } from "@/components/ui/select";
import { FadeUp, StaggerItem } from "@/components/ui/motion";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import {
  BusinessPerformance,
  TradingPerformance,
  InvestorOverview,
} from "@/components/admin/dashboard";
import { DashboardResponseData, DashboardRange } from "@/types/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedPartner, setSelectedPartner] = useState("all");
  const [selectedRange, setSelectedRange] = useState<DashboardRange>("30d");

  const isAdmin = user?.role === "ADMIN";

  // Construct dynamic Dashboard API endpoint
  const queryParams = new URLSearchParams();
  if (selectedPartner && selectedPartner !== "all" && isAdmin) {
    queryParams.set("partnerId", selectedPartner);
  }
  if (selectedRange) {
    queryParams.set("range", selectedRange);
  }

  const dashboardApiUrl = `/api/dashboard${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  // Fetch live Dashboard data backed by SWR cache
  const {
    data: dashboardData,
    error,
    isLoading,
  } = useCachedFetch<DashboardResponseData>(dashboardApiUrl);

  // Dynamic time-based greeting and localized date
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const currentDateSubtitle = useMemo(() => {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }, []);

  // Partner options for the selector
  const partners = dashboardData?.partners;
  const partnerOptions = useMemo(() => {
    const defaultOpt = [{ value: "all", label: "All Partners" }];
    if (!partners) return defaultOpt;
    return [
      ...defaultOpt,
      ...partners.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    ];
  }, [partners]);

  // Derive dynamic KPI cards from authoritative response
  const kpis = dashboardData?.kpis;
  const partnerScopeName = dashboardData?.scope?.partnerName;
  const dashboardKpiCards = useMemo(() => {
    if (!kpis) return [];

    const isFiltered = selectedPartner !== "all";
    const scopeLabel = isFiltered
      ? partnerScopeName || "Selected partner"
      : "Across all authorized businesses";

    return [
      {
        id: "total-investment",
        label: "TOTAL INVESTMENT",
        currency: "AED",
        value: kpis.totalInvestmentAED.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        description: scopeLabel,
      },
      {
        id: "purchase-cost",
        label: "PURCHASE COST",
        currency: "AED",
        value: kpis.purchaseCostAED.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        description: "Cumulative inventory purchases",
      },
      {
        id: "total-expenses",
        label: "TOTAL EXPENSES",
        currency: "AED",
        value: kpis.totalExpensesAED.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        description: "Cleared operating overheads",
      },
      {
        id: "total-sales",
        label: "TOTAL SALES",
        currency: "AED",
        value: kpis.totalSalesAED.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        description: "Recognized sales revenue",
      },
      {
        id: "net-profit",
        label: "NET PROFIT",
        currency: "AED",
        value: kpis.netProfitAED.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        description: `Margin: ${kpis.netMarginPercent.toFixed(2)}%`,
        variant: "highlight" as const,
      },
      {
        id: "profit-allocated",
        label: "PROFIT ALLOCATED",
        currency: "AED",
        value: kpis.profitAllocatedAED.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        description: "Allocated profit entitlement",
      },
    ];
  }, [kpis, selectedPartner, partnerScopeName]);

  return (
    <div className="space-y-7 pb-10">
      {/* 1. Dashboard Header */}
      <FadeUp delay={0} duration={0.3}>
        <PageHeader
          title={greeting}
          subtitle={currentDateSubtitle}
          actions={
            isAdmin ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  PARTNER
                </span>
                <div className="relative inline-flex items-center">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-black pointer-events-none z-10" />
                  <Select
                    options={partnerOptions}
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                    className="w-48 pl-6 text-xs font-semibold"
                  />
                </div>
              </div>
            ) : undefined
          }
        />
      </FadeUp>

      {/* Error state */}
      {error && (
        <FadeUp delay={0.05}>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            Unable to load dashboard data. Please check your network connection
            or account permissions.
          </div>
        </FadeUp>
      )}

      {/* Loading Skeleton */}
      {isLoading && !dashboardData && (
        <div className="space-y-7 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-gray-100" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-64 rounded-xl bg-gray-100" />
            <div className="lg:col-span-4 h-64 rounded-xl bg-gray-100" />
          </div>
        </div>
      )}

      {/* Loaded Live Content */}
      {dashboardData && (
        <>
          {/* 2. KPI Cards (Staggered Entrance) */}
          <StatCardGrid>
            {dashboardKpiCards.map((kpi) => (
              <StaggerItem key={kpi.id}>
                <StatCard
                  label={kpi.label}
                  currency={kpi.currency}
                  value={kpi.value}
                  description={kpi.description}
                  variant={kpi.variant}
                />
              </StaggerItem>
            ))}
          </StatCardGrid>

          {/* 3. Business Performance Section (Latest 3 Created Businesses) */}
          <FadeUp delay={0.12} duration={0.35}>
            <BusinessPerformance
              records={dashboardData.businessPerformance || []}
            />
          </FadeUp>

          {/* 4. Bottom Grid: Trading Performance & Investor Overview */}
          <FadeUp delay={0.24} duration={0.35}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Trading Performance Card (Aggregated across scoped businesses) */}
              <div className="lg:col-span-8">
                <TradingPerformance
                  data={dashboardData.tradingPerformance?.points || []}
                  range={selectedRange}
                  onRangeChange={setSelectedRange}
                />
              </div>

              {/* Investor Overview Card (External investors in scoped businesses) */}
              <div className="lg:col-span-4">
                <InvestorOverview overview={dashboardData.investorOverview} />
              </div>
            </div>
          </FadeUp>
        </>
      )}
    </div>
  );
}
